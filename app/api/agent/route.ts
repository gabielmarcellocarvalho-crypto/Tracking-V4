// ─── AGENTE IA — POST /api/agent ─────────────────────────────────────────────
// Analisa os dados do cliente (eventos, identidades, UTMs, conversões) com a
// Claude API. Requer ANTHROPIC_API_KEY no .env.local.
//
// Body: { clienteId, pergunta?, acao?: 'analise-geral'|'auditar-utms'|'cross-check'|'sugerir-dashboard' }

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  agregarSaudeEventos, agregarVolume7Dias, agregarPorOrigem, agregarPaginas,
  agregarPerformance, gerarAlertas,
} from '@/lib/data/agregacoes'
import { validateUTM } from '@/lib/utm/engine'
import type { Partner, Evento, Identidade, Conversao } from '@/lib/types'

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é o Agente de Tracking da plataforma Tracking V4 (V4 Company — unidade Carvalho & Co), assistente do gestor de tráfego Gabriel.

Seu papel: analisar os dados primários de tracking de cada cliente (eventos do site, jornadas unificadas, UTMs, fila de conversões CAPI/Enhanced) e produzir análises acionáveis de mídia paga.

Contexto técnico que você domina:
- A plataforma captura eventos direto do site do cliente (page_view, lead, checkout, compra) com sinais de atribuição: fbp/fbc (Meta), gclid/wbraid/gbraid (Google), ga_client_id (GA4), cookie próprio _v4id (13 meses) e IP/user-agent.
- A resolução de identidade unifica o usuário além das janelas de atribuição (Meta 7d, Google 90d) — a plataforma enxerga conversões que Meta/Google "esqueceram".
- Padrão de UTM V4 (cumulativo): utm_campaign = office_região_funil_objetivo_cliente_tipo_detalhe; utm_term herda a campanha + posicionamento_segmentação; utm_content herda o conjunto + formato_detalhe. UTMs fora do padrão quebram a análise por nível.
- Os dados primários servem para corrigir a % de erro das plataformas e alimentar Meta CAPI / Google Enhanced Conversions com match quality alto (email/telefone hasheados + click ids).

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

async function montarContexto(clienteId: string): Promise<string | null> {
  const clienteSnap = await getDoc(doc(db, 'partners', clienteId))
  if (!clienteSnap.exists()) return null
  const cliente = clienteSnap.data() as Partner

  const [eventosSnap, identidadesSnap, conversoesSnap] = await Promise.all([
    getDocs(query(collection(db, 'partners', clienteId, 'eventos'), orderBy('ts', 'desc'), limit(1500))),
    getDocs(query(collection(db, 'partners', clienteId, 'identidades'), orderBy('atualizadoEm', 'desc'), limit(300))),
    getDocs(query(collection(db, 'partners', clienteId, 'conversoes'), orderBy('ts', 'desc'), limit(300))),
  ])

  const eventos = eventosSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento)
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
    alertasAutomaticos: alertas,
  }, null, 1)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, configurado: false, erro: 'ANTHROPIC_API_KEY não configurada no .env.local' },
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

  const contexto = await montarContexto(clienteId)
  if (!contexto) {
    return NextResponse.json({ ok: false, erro: 'cliente não encontrado (clientes demo não têm dados reais)' }, { status: 404 })
  }

  const instrucao = acao ? ACOES[acao] ?? pergunta : pergunta

  const client = new Anthropic({ apiKey })
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        {
          role: 'user',
          content: `Dados do cliente (JSON):\n\`\`\`json\n${contexto}\n\`\`\`\n\nSolicitação: ${instrucao}`,
        },
      ],
    })

    const texto = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return NextResponse.json({
      ok: true,
      resposta: texto,
      uso: { entrada: response.usage.input_tokens, saida: response.usage.output_tokens },
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ ok: false, configurado: false, erro: 'ANTHROPIC_API_KEY inválida' }, { status: 503 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ ok: false, erro: 'Limite de requisições da Claude API atingido — tente em instantes' }, { status: 429 })
    }
    console.error('[agent] erro:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao consultar o agente' }, { status: 500 })
  }
}
