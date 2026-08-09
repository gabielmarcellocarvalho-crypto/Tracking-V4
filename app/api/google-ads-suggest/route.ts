// ─── SUGESTÕES DE CAMPANHA GOOGLE ADS — POST /api/google-ads-suggest ─────────
// Sugere palavras-chave + títulos + descrições (Responsive Search Ad) via
// Groq API, a partir do segmento/nome do cliente e de um briefing curto do
// gestor. Requer GROQ_API_KEY no .env.local (mesma key do Agente IA).
//
// Body: { clienteId, briefing }

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import type { Partner } from '@/lib/types'

export const maxDuration = 30

const GROQ_MODEL = 'openai/gpt-oss-120b'

const SYSTEM_PROMPT = `Você é um especialista em Google Ads (Rede de Pesquisa) da V4 Company. Sua tarefa é sugerir, para uma campanha de Search, uma lista de palavras-chave e um anúncio responsivo de pesquisa (RSA).

Regras obrigatórias:
- Responda SOMENTE com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
{
  "palavrasChave": [{ "texto": "string", "tipo": "Broad" | "Phrase" | "Exact" }],
  "negativas": ["string"],
  "headlines": ["string"],
  "descricoes": ["string"]
}
- "palavrasChave": entre 10 e 20 sugestões, priorizando intenção de busca comercial/transacional. Varie o tipo de correspondência (misture Broad, Phrase e Exact).
- "negativas": 5 a 10 termos negativos óbvios pra evitar tráfego irrelevante (ex: "grátis", "curso", "vaga de emprego" quando fizer sentido pro segmento).
- "headlines": exatamente 15 títulos, cada um com NO MÁXIMO 30 caracteres (conte os caracteres antes de responder).
- "descricoes": exatamente 4 descrições, cada uma com NO MÁXIMO 90 caracteres.
- Nunca invente números, prêmios ou dados que o briefing não confirmou. Use gatilhos genéricos (urgência, benefício, prova social) só quando plausíveis pro segmento informado.
- Responda em português brasileiro.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, configurado: false, erro: 'GROQ_API_KEY não configurada no .env.local' }, { status: 503 })
  }

  let body: { clienteId?: string; briefing?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  const { clienteId, briefing } = body
  if (!clienteId || !briefing?.trim()) {
    return NextResponse.json({ ok: false, erro: 'clienteId e briefing são obrigatórios' }, { status: 400 })
  }

  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }
  if (!(await ehMembroDoPartner(email, clienteId))) {
    return NextResponse.json({ ok: false, erro: 'sem permissão para ver este cliente' }, { status: 403 })
  }

  const clienteSnap = await getDbAdmin().collection('partners').doc(clienteId).get()
  if (!clienteSnap.exists) {
    return NextResponse.json({ ok: false, erro: 'cliente não encontrado' }, { status: 404 })
  }
  const cliente = clienteSnap.data() as Partner

  const mensagemUsuario = `Cliente: ${cliente.nome}\nSegmento: ${cliente.segmento || 'não informado'}\n\nBriefing da campanha (objetivo, produto/serviço, público, diferenciais):\n${briefing.trim()}`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_completion_tokens: 3000,
        // gpt-oss-120b gasta boa parte do orçamento de tokens em raciocínio
        // interno (chain-of-thought) antes de responder — com o reasoning
        // padrão, isso estourava o limite antes de terminar o JSON (15
        // headlines + 4 descrições + palavras é uma saída grande). 'low'
        // deixa raciocínio mínimo e todo o orçamento pra resposta de verdade.
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: mensagemUsuario },
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
      console.error('[google-ads-suggest] erro Groq:', groqRes.status, corpoErro)
      return NextResponse.json({ ok: false, erro: 'falha ao consultar a IA' }, { status: 500 })
    }

    const data = await groqRes.json() as { choices?: { message?: { content?: string } }[] }
    const texto = data.choices?.[0]?.message?.content ?? '{}'

    let sugestao: {
      palavrasChave?: { texto: string; tipo: string }[]
      negativas?: string[]
      headlines?: string[]
      descricoes?: string[]
    }
    try {
      sugestao = JSON.parse(texto)
    } catch {
      console.error('[google-ads-suggest] resposta não é JSON válido:', texto)
      return NextResponse.json({ ok: false, erro: 'a IA retornou um formato inesperado — tente novamente' }, { status: 500 })
    }

    const tiposValidos = new Set(['Broad', 'Phrase', 'Exact'])
    return NextResponse.json({
      ok: true,
      sugestao: {
        palavrasChave: (sugestao.palavrasChave ?? [])
          .filter((p) => p?.texto?.trim())
          .map((p) => ({ texto: p.texto.trim(), tipo: tiposValidos.has(p.tipo) ? p.tipo : 'Phrase' })),
        negativas: (sugestao.negativas ?? []).filter((n) => n?.trim()).map((n) => n.trim()),
        headlines: (sugestao.headlines ?? []).filter((h) => h?.trim()).map((h) => h.trim().slice(0, 30)).slice(0, 15),
        descricoes: (sugestao.descricoes ?? []).filter((d) => d?.trim()).map((d) => d.trim().slice(0, 90)).slice(0, 4),
      },
    })
  } catch (err) {
    console.error('[google-ads-suggest] erro:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao consultar a IA' }, { status: 500 })
  }
}
