// ─── AGENTE IA — POST /api/agent ─────────────────────────────────────────────
// Analisa os dados do cliente (eventos, identidades, UTMs, conversões) com a
// Groq API (endpoint compatível com OpenAI). Requer GROQ_API_KEY no .env.local.
//
// Body: { clienteId, pergunta?, acao?: 'analise-geral'|'auditar-utms'|'cross-check'|'sugerir-dashboard' }

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import {
  agregarSaudeEventos, agregarVolume7Dias, agregarPorOrigem, agregarPaginas,
  agregarPerformance, gerarAlertas,
} from '@/lib/data/agregacoes'
import { validateUTM } from '@/lib/utm/engine'
import { buscarGastoMetaAds } from '@/lib/integrations/meta-ads-insights'
import { buscarGastoGoogleAds } from '@/lib/integrations/google-ads-insights'
import type { Partner, Evento, Identidade, Conversao } from '@/lib/types'

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é o Agente de Tracking da plataforma Tracking V4 (V4 Company — unidade Carvalho & Co), assistente do gestor de tráfego Gabriel.

Seu papel: analisar os dados primários de tracking de cada cliente (eventos do site, jornadas unificadas, UTMs, fila de conversões CAPI/Enhanced) e produzir análises acionáveis de mídia paga.

Contexto técnico que você domina:
- A plataforma captura eventos direto do site do cliente (page_view, lead, checkout, compra) com sinais de atribuição: fbp/fbc (Meta), gclid/wbraid/gbraid (Google), ga_client_id (GA4), cookie próprio _v4id (13 meses) e IP/user-agent.
- A resolução de identidade unifica o usuário além das janelas de atribuição (Meta 7d, Google 90d) — a plataforma enxerga conversões que Meta/Google "esqueceram".
- Padrão de UTM V4 (cumulativo): utm_campaign = office_região_funil_objetivo_cliente_tipo_detalhe; utm_term herda a campanha + posicionamento_segmentação; utm_content herda o conjunto + formato_detalhe. UTMs fora do padrão quebram a análise por nível.
- Os dados primários servem para corrigir a % de erro das plataformas e alimentar Meta CAPI / Google Enhanced Conversions com match quality alto (email/telefone hasheados + click ids).
- O campo "midiaPaga" do contexto vem direto da Meta Marketing API / Google Ads API (gasto, funil, ROAS dos últimos 30 dias) — é a fonte mais confiável de investimento e resultado de mídia paga, mesmo quando o site ainda não manda eventos próprios. "kpis"/"funil" fora desse campo vêm do tracking do site (eventos) e podem estar zerados se o snippet ainda não foi instalado — nesse caso, use "midiaPaga" como base da análise em vez de dizer que não há dados.

Regras de resposta:
- Responda em português brasileiro, direto e prático, como um analista sênior falando com gestor de tráfego.
- Use os números do contexto — nunca invente métricas. Se um dado não existe no contexto, diga que ainda não há dados suficientes.
- Formate em markdown enxuto: títulos curtos, bullets, negrito nos números-chave.
- Sempre feche com "Próximas ações" — 2 a 4 recomendações concretas e priorizadas.`

const ACOES: Record<string, string> = {
  'analise-geral': 'Faça uma análise geral da operação deste cliente: volume e saúde dos eventos, funil, origens de tráfego, receita e jornadas. Destaque o que está bom, o que está ruim e o que merece investigação.',
  'auditar-utms': 'Audite as UTMs deste cliente contra o padrão V4. Aponte campanhas fora do padrão, o impacto disso na análise por nível (campanha/conjunto/anúncio) e como corrigir.',
  'cross-check': 'Faça o cross-check de atribuição: compare o que os dados primários mostram (jornadas, janelas expiradas, conversões fora da janela Meta de 7 dias) com o que Meta/Google devem estar reportando. Estime onde as plataformas estão subatribuindo.',
  'sugerir-dashboard': 'Com base no tipo deste cliente e nos dados disponíveis, sugira a configuração ideal de dashboard: quais KPIs acompanhar diariamente, quais blocos montar no template personalizado e quais metas definir.',
}

// Busca gasto+funil real do Meta Ads pra esse cliente, se estiver conectado
// (Conexões → "Meta Ads (Métricas)"). Nunca deixa o agente inteiro falhar por
// causa disso — sem conexão ou erro na API vira `null` no contexto.
async function buscarMidiaPagaMeta(clienteId: string, start: Date, end: Date) {
  const db = getDbAdmin()
  const integSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('meta-ads').get()
  const campos = (integSnap.data()?.campos ?? {}) as Record<string, string>
  const adAccountId = campos.adAccountId?.trim()
  if (!adAccountId) return null

  const accessToken = campos.accessToken?.trim() || process.env.META_BM_SYSTEM_USER_TOKEN
  if (!accessToken) return null

  try {
    const dias = await buscarGastoMetaAds(adAccountId, accessToken, start, end)
    const t = dias.reduce((acc, d) => ({
      spend: acc.spend + d.spend, reach: acc.reach + d.reach, impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks, sessoes: acc.sessoes + d.sessoes, addToCart: acc.addToCart + d.addToCart,
      checkout: acc.checkout + d.checkout, purchase: acc.purchase + d.purchase, faturamento: acc.faturamento + d.faturamento,
    }), { spend: 0, reach: 0, impressions: 0, clicks: 0, sessoes: 0, addToCart: 0, checkout: 0, purchase: 0, faturamento: 0 })
    return { ...t, roas: t.spend > 0 ? Number((t.faturamento / t.spend).toFixed(2)) : 0 }
  } catch (err) {
    console.error('[agent] falha ao buscar Meta Ads:', err)
    return null
  }
}

// Idem para o Google Ads, usando as credenciais compartilhadas da MCC.
async function buscarMidiaPagaGoogle(clienteId: string, start: Date, end: Date) {
  const db = getDbAdmin()
  const integSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('google-ads').get()
  const campos = (integSnap.data()?.campos ?? {}) as Record<string, string>
  const customerId = campos.customerId?.trim()
  if (!customerId) return null

  const mccId = process.env.GADS_MCC_ID
  const developerToken = process.env.GADS_DEVELOPER_TOKEN
  const clientId = process.env.GADS_OAUTH_CLIENT_ID
  const clientSecret = process.env.GADS_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GADS_REFRESH_TOKEN
  if (!mccId || !developerToken || !clientId || !clientSecret || !refreshToken) return null

  try {
    const dias = await buscarGastoGoogleAds(customerId, mccId, developerToken, clientId, clientSecret, refreshToken, start, end)
    const t = dias.reduce((acc, d) => ({
      spend: acc.spend + d.spend, impressions: acc.impressions + d.impressions, clicks: acc.clicks + d.clicks,
      addToCart: acc.addToCart + d.addToCart, checkout: acc.checkout + d.checkout,
      purchase: acc.purchase + d.purchase, faturamento: acc.faturamento + d.faturamento,
    }), { spend: 0, impressions: 0, clicks: 0, addToCart: 0, checkout: 0, purchase: 0, faturamento: 0 })
    return { ...t, roas: t.spend > 0 ? Number((t.faturamento / t.spend).toFixed(2)) : 0 }
  } catch (err) {
    console.error('[agent] falha ao buscar Google Ads:', err)
    return null
  }
}

async function montarContexto(clienteId: string): Promise<string | null> {
  const db = getDbAdmin()
  const clienteSnap = await db.collection('partners').doc(clienteId).get()
  if (!clienteSnap.exists) return null
  const cliente = clienteSnap.data() as Partner

  const fimPeriodo = new Date()
  const inicioPeriodo = new Date(fimPeriodo)
  inicioPeriodo.setDate(inicioPeriodo.getDate() - 29)

  const [eventosSnap, identidadesSnap, conversoesSnap, metaAds, googleAds] = await Promise.all([
    db.collection('partners').doc(clienteId).collection('eventos').orderBy('ts', 'desc').limit(1500).get(),
    db.collection('partners').doc(clienteId).collection('identidades').orderBy('atualizadoEm', 'desc').limit(300).get(),
    db.collection('partners').doc(clienteId).collection('conversoes').orderBy('ts', 'desc').limit(300).get(),
    buscarMidiaPagaMeta(clienteId, inicioPeriodo, fimPeriodo),
    buscarMidiaPagaGoogle(clienteId, inicioPeriodo, fimPeriodo),
  ])

  // Mesmo corte de dados aplicado em useEventos (client) — eventos anteriores
  // a um reset de plataforma (ex: Shopify → loja integrada) não devem
  // contaminar a análise do agente.
  const corte = cliente.dadosIgnoradosAte ?? 0
  const eventos = eventosSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento).filter((e) => e.ts > corte)
  const identidades = identidadesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Identidade)
  const conversoes = conversoesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversao)

  const perf = agregarPerformance(eventos, 30)
  const saude = agregarSaudeEventos(eventos)
  const alertas = gerarAlertas(eventos)

  // UTMs detectadas nos eventos + conformidade
  const utmsUnicas = new Map<string, { count: number; padraoV4: boolean; erros: string[] }>()
  for (const e of eventos) {
    if (!e.utm?.campaign) continue
    const chave = e.utm.campaign
    const atual = utmsUnicas.get(chave)
    if (atual) atual.count++
    else {
      const v = validateUTM(e.utm)
      utmsUnicas.set(chave, { count: 1, padraoV4: v.padraoV4, erros: v.erros })
    }
  }

  const porStatus = { visitante: 0, lead: 0, checkout: 0, cliente: 0 }
  let foraDaJanelaMeta = 0
  for (const i of identidades) {
    porStatus[i.status] = (porStatus[i.status] ?? 0) + 1
    if (i.atribuicao?.foraDaJanelaMeta) foraDaJanelaMeta++
  }

  const matchMedio = conversoes.length
    ? (conversoes.reduce((s, c) => s + c.matchQuality, 0) / conversoes.length).toFixed(1)
    : 'n/d'

  return JSON.stringify({
    cliente: { nome: cliente.nome, segmento: cliente.segmento, tipo: cliente.tipo },
    periodo: 'últimos 30 dias',
    totalEventosAnalisados: eventos.length,
    kpis: perf.kpis,
    funil: perf.funil,
    origens: perf.canais,
    serieDiaria7d: agregarVolume7Dias(eventos),
    saudeEventos: saude.map((s) => ({ evento: s.label, status: s.status, ultimoDisparo: s.lastFired, hoje: s.countToday, semana: s.countWeek })),
    paginasQuentes: agregarPaginas(eventos).slice(0, 6),
    topProdutos: perf.topProdutos,
    jornadas: {
      total: identidades.length,
      porStatus,
      conversoesForaDaJanelaMeta7d: foraDaJanelaMeta,
    },
    utms: {
      campanhasUnicasDetectadas: utmsUnicas.size,
      foraDoPadraoV4: [...utmsUnicas.entries()].filter(([, v]) => !v.padraoV4)
        .map(([campanha, v]) => ({ campanha, eventos: v.count, erros: v.erros.slice(0, 3) })).slice(0, 15),
    },
    conversoes: {
      naFila: conversoes.length,
      matchQualityMedio0a10: matchMedio,
      porStatus: conversoes.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1
        return acc
      }, {}),
    },
    // Métricas puxadas direto das plataformas de anúncio (Meta Marketing API /
    // Google Ads API), independente do que o site já rastreou sozinho — `null`
    // quando a conexão em Conexões não existe ou a chamada à API falhou.
    midiaPaga: {
      meta: metaAds,
      google: googleAds,
    },
    alertasAutomaticos: alertas,
  }, null, 1)
}

const GROQ_MODEL = 'openai/gpt-oss-120b'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, configurado: false, erro: 'GROQ_API_KEY não configurada no .env.local' },
      { status: 503 },
    )
  }

  let body: { clienteId?: string; pergunta?: string; acao?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  const { clienteId, pergunta, acao } = body
  if (!clienteId || (!pergunta && !acao)) {
    return NextResponse.json({ ok: false, erro: 'clienteId e (pergunta ou acao) são obrigatórios' }, { status: 400 })
  }

  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }
  if (!(await ehMembroDoPartner(email, clienteId))) {
    return NextResponse.json({ ok: false, erro: 'sem permissão para ver este cliente' }, { status: 403 })
  }

  const contexto = await montarContexto(clienteId)
  if (!contexto) {
    return NextResponse.json({ ok: false, erro: 'cliente não encontrado (clientes demo não têm dados reais)' }, { status: 404 })
  }

  const instrucao = acao ? ACOES[acao] ?? pergunta : pergunta

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        // O tier gratuito da Groq pro gpt-oss-120b limita a 8000 tokens/min
        // (prompt + max_completion_tokens contam juntos pra essa reserva) —
        // 8192 sozinho já estourava o limite mesmo com prompt pequeno.
        max_completion_tokens: 3000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Dados do cliente (JSON):\n\`\`\`json\n${contexto}\n\`\`\`\n\nSolicitação: ${instrucao}` },
        ],
      }),
    })

    if (!groqRes.ok) {
      if (groqRes.status === 401 || groqRes.status === 403) {
        return NextResponse.json({ ok: false, configurado: false, erro: 'GROQ_API_KEY inválida' }, { status: 503 })
      }
      if (groqRes.status === 429) {
        return NextResponse.json({ ok: false, erro: 'Limite de requisições da Groq API atingido — tente em instantes' }, { status: 429 })
      }
      const corpoErro = await groqRes.text().catch(() => '')
      console.error('[agent] erro Groq:', groqRes.status, corpoErro)
      return NextResponse.json({ ok: false, erro: 'falha ao consultar o agente' }, { status: 500 })
    }

    const data = await groqRes.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const texto = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({
      ok: true,
      resposta: texto,
      uso: {
        entrada: data.usage?.prompt_tokens ?? 0,
        saida: data.usage?.completion_tokens ?? 0,
      },
    })
  } catch (err) {
    console.error('[agent] erro:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao consultar o agente' }, { status: 500 })
  }
}
