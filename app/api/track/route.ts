// ─── ENDPOINT DE INGESTÃO — POST /api/track ──────────────────────────────────
// Recebe eventos do snippet v4track.js (site do cliente) ou de webhooks/n8n.
// Valida clienteId + trackingKey, decompõe UTMs (padrão V4), detecta origem,
// resolve a identidade unificada e enfileira conversões CAPI/Enhanced.
//
// Body esperado (JSON):
// {
//   clienteId, key, tipo,                       ← obrigatórios
//   url, pagina, titulo, referrer,
//   utm: { source, medium, campaign, term, content },
//   ids: { v4id, fbp, fbc, gclid, wbraid, gbraid, gaClientId, gaSessionId },
//   dados: { email, telefone, nome },
//   valor, produto, ts
// }

import { NextRequest, NextResponse } from 'next/server'
import { addDoc, collection, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { parseUTM, detectOrigem } from '@/lib/utm/engine'
import { resolverIdentidade } from '@/lib/tracking/identity'
import { montarConversoes, sha256, normalizarTelefone } from '@/lib/tracking/conversoes'
import { enviarConversaoParaMeta } from '@/lib/integrations/meta-send'
import type { Evento, EventoTipo, Cliente } from '@/lib/types'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

const TIPOS_VALIDOS: EventoTipo[] = ['page_view', 'lead', 'checkout', 'compra', 'custom']

function detectarDispositivo(ua?: string): Evento['dispositivo'] {
  if (!ua) return 'outro'
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400, headers: CORS })
  }

  const { clienteId, key, tipo } = body
  if (!clienteId || !tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json(
      { ok: false, erro: 'clienteId e tipo (page_view|lead|checkout|compra|custom) são obrigatórios' },
      { status: 400, headers: CORS },
    )
  }

  // ── Autenticação do cliente ────────────────────────────────────────────────
  let cliente: Cliente
  try {
    const clienteSnap = await getDoc(doc(db, 'clientes', clienteId))
    if (!clienteSnap.exists()) {
      return NextResponse.json({ ok: false, erro: 'cliente não encontrado' }, { status: 404, headers: CORS })
    }
    cliente = clienteSnap.data() as Cliente
  } catch (err) {
    const permissao = err instanceof Error && err.message.includes('permission')
    console.error('[track] erro ao ler cliente:', err)
    return NextResponse.json(
      {
        ok: false,
        erro: permissao
          ? 'Firestore negou o acesso — publique o arquivo firestore.rules no console do Firebase'
          : 'falha ao consultar o cliente',
      },
      { status: 503, headers: CORS },
    )
  }
  if (cliente.trackingKey && cliente.trackingKey !== key) {
    return NextResponse.json({ ok: false, erro: 'trackingKey inválida' }, { status: 401, headers: CORS })
  }

  // ── Contexto da requisição ─────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || undefined
  const userAgent = body.userAgent || req.headers.get('user-agent') || undefined
  const geo = {
    ip,
    cidade: body.geo?.cidade || decodeHeader(req.headers.get('x-vercel-ip-city')),
    estado: body.geo?.estado || req.headers.get('x-vercel-ip-country-region') || undefined,
    pais:   body.geo?.pais || req.headers.get('x-vercel-ip-country') || undefined,
  }

  const utm = body.utm && Object.values(body.utm).some(Boolean) ? body.utm : undefined
  const ids = body.ids ?? {}
  const dados = body.dados && Object.values(body.dados).some(Boolean)
    ? {
        ...body.dados,
        emailHash: body.dados.email ? sha256(body.dados.email) : undefined,
        telefoneHash: body.dados.telefone ? sha256(normalizarTelefone(body.dados.telefone)) : undefined,
      }
    : undefined

  const evento: Evento = {
    tipo,
    ts: typeof body.ts === 'number' ? body.ts : Date.now(),
    url: body.url,
    pagina: body.pagina ?? tentarPathname(body.url),
    titulo: body.titulo,
    referrer: body.referrer,
    utm,
    utmParsed: utm ? parseUTM(utm) : undefined,
    ids,
    dados,
    geo,
    userAgent,
    dispositivo: detectarDispositivo(userAgent),
    valor: typeof body.valor === 'number' ? body.valor : undefined,
    produto: body.produto,
    transactionId: body.transactionId,
    origem: detectOrigem(utm, ids, body.referrer),
    visitorId: '', // preenchido após a resolução
  }

  try {
    // Resolução de identidade (cria/atualiza/funde perfis)
    evento.visitorId = await resolverIdentidade(clienteId, evento)

    // Grava o evento (sem undefined — Firestore rejeita)
    const limpo = JSON.parse(JSON.stringify(evento))
    const ref = await addDoc(collection(db, 'clientes', clienteId, 'eventos'), limpo)

    // Enfileira conversões (CAPI / Enhanced) para lead/checkout/compra
    const conversoes = montarConversoes(evento, ref.id)
    for (const conv of conversoes) {
      const convRef = await addDoc(
        collection(db, 'clientes', clienteId, 'conversoes'),
        JSON.parse(JSON.stringify(conv)),
      )
      // Envio server-side imediato (Meta CAPI) — se não houver token/pixel
      // configurados ainda, a conversão fica como "aguardando-conexao" e é
      // reprocessada depois pelo cron de reenvio.
      if (conv.plataforma === 'meta-capi') {
        try {
          await enviarConversaoParaMeta(clienteId, convRef.id)
        } catch (err) {
          console.error('[track] falha no envio imediato ao Meta CAPI:', err)
        }
      }
    }

    return NextResponse.json(
      { ok: true, eventoId: ref.id, visitorId: evento.visitorId, conversoesEnfileiradas: conversoes.length },
      { headers: CORS },
    )
  } catch (err) {
    console.error('[track] erro ao gravar evento:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao gravar evento' }, { status: 500, headers: CORS })
  }
}

function tentarPathname(url?: string): string | undefined {
  if (!url) return undefined
  try { return new URL(url).pathname } catch { return undefined }
}

function decodeHeader(v: string | null): string | undefined {
  if (!v) return undefined
  try { return decodeURIComponent(v) } catch { return v }
}
