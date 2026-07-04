// ─── WEBHOOK SHOPIFY — POST /api/webhooks/shopify/{clienteId} ───────────────
// Recebe o webhook "orders/create" da loja Shopify de um cliente e injeta o
// pedido como evento de compra no mesmo pipeline usado pelo /api/track
// (identidade → evento → conversões → envio Meta CAPI), via firebase-admin
// (não há sessão de usuário nem trackingKey aqui — a autenticação é a
// assinatura HMAC que a Shopify envia em todo webhook).
//
// Configuração no cliente: Shopify Admin → Configurações → Notificações →
// Webhooks → Criar webhook (evento "Criação de pedido", formato JSON), colar
// esta URL e copiar o "Signing secret" pro campo webhookSecret na aba
// Conexões da plataforma.
//
// Atribuição (Meta/Google) sem precisar do snippet no site: preferimos
// consultar customerJourneySummary via Admin API (buscarJornadaPedido) — é o
// caminho oficial atual, com UTM estruturado, e não depende de cookie. Se o
// cliente não tiver o Admin API Token configurado (campo adminApiToken em
// Conexões) ou a consulta falhar, cai pro `landing_site`/`referring_site` do
// próprio payload do webhook (legado, pode vir vazio — a Shopify descontinuou
// os cookies que alimentavam esses campos em set/2025). Sem nenhum sinal em
// nenhuma das duas fontes, a origem cai em 'shopify' (pedido validado, mas
// sem atribuição).
//
// Limitações da v1 (documentadas, não resolvidas aqui):
// - fbc é sintetizado a partir do fbclid da URL (sem cookie real do pixel) —
//   funciona pro match do CAPI, mas não é o fbc "oficial" do navegador.
// - Pedido com múltiplos itens vira um único `produto` (o primeiro item).

import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { sha256, normalizarTelefone } from '@/lib/tracking/conversoes'
import { ingerirEvento } from '@/lib/tracking/ingest'
import { createAdminIngestStore } from '@/lib/tracking/stores/admin-store'
import { parseUTM, detectOrigem } from '@/lib/utm/engine'
import { buscarJornadaPedido } from '@/lib/integrations/shopify-admin-api'
import type { Integration, Evento, EventoIds, UTMSet, Origem } from '@/lib/types'

interface ShopifyOrderPayload {
  id?: number | string
  order_number?: number | string
  name?: string
  email?: string
  phone?: string
  total_price?: string
  currency?: string
  created_at?: string
  customer?: { first_name?: string; last_name?: string; phone?: string }
  line_items?: { title?: string }[]
  /** Primeira página acessada na sessão do checkout — legado, pode vir vazio (ver nota acima) */
  landing_site?: string
  referring_site?: string
  client_details?: { browser_ip?: string; user_agent?: string }
}

/** Extrai gclid/wbraid/gbraid/fbclid da URL de destino do anúncio + monta UTM/origem. */
function construirAtribuicao(landingPage?: string, referrerUrl?: string, utmEstruturado?: UTMSet): {
  utm?: UTMSet
  ids: EventoIds
  origem: Origem
} {
  let params: URLSearchParams | undefined
  try {
    params = landingPage ? new URL(landingPage, 'https://shopify-landing.internal').searchParams : undefined
  } catch {
    params = undefined
  }

  // UTM estruturado (vindo do customerJourneySummary) tem prioridade sobre o
  // parse manual da query string do landing_site legado.
  const utm: UTMSet | undefined = utmEstruturado?.source || utmEstruturado?.medium || utmEstruturado?.campaign
    ? utmEstruturado
    : params && (params.get('utm_source') || params.get('utm_medium') || params.get('utm_campaign'))
      ? {
          source: params.get('utm_source') ?? undefined,
          medium: params.get('utm_medium') ?? undefined,
          campaign: params.get('utm_campaign') ?? undefined,
          term: params.get('utm_term') ?? undefined,
          content: params.get('utm_content') ?? undefined,
        }
      : undefined

  const fbclid = params?.get('fbclid') ?? undefined
  const ids: EventoIds = {
    gclid: params?.get('gclid') ?? undefined,
    wbraid: params?.get('wbraid') ?? undefined,
    gbraid: params?.get('gbraid') ?? undefined,
    // Formato sintético que o Meta aceita (fb.1.<epoch_ms>.<fbclid>) — sem
    // cookie real, mas dá pro CAPI casar o clique mesmo sem o pixel no site.
    fbc: fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined,
  }

  const detectada = detectOrigem(utm, ids, referrerUrl)
  // Sem nenhum sinal (UTM/click-id/referrer conhecido), 'shopify' é mais
  // informativo que 'direto' — deixa claro que o pedido é validado, só sem atribuição.
  const origem: Origem = detectada === 'direto' ? 'shopify' : detectada

  return { utm, ids, origem }
}

function verificarHmac(rawBody: string, headerHmac: string | null, secret: string): boolean {
  if (!headerHmac) return false
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  let recebido: Buffer
  try {
    recebido = Buffer.from(headerHmac, 'base64')
  } catch {
    return false
  }
  return recebido.length === digest.length && timingSafeEqual(recebido, digest)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params

  // Lê o corpo cru ANTES de qualquer parse — a HMAC é calculada sobre os
  // bytes exatos que a Shopify enviou.
  const rawBody = await req.text()

  let conexao: Integration | undefined
  try {
    const snap = await getDbAdmin()
      .collection('partners').doc(clienteId)
      .collection('integrations').doc('shopify')
      .get()
    if (snap.exists) conexao = snap.data() as Integration
  } catch (err) {
    console.error('[webhooks/shopify] erro ao ler conexão:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao consultar conexão' }, { status: 500 })
  }

  const webhookSecret = conexao?.campos?.webhookSecret
  if (!conexao || conexao.status !== 'configurado' || !webhookSecret) {
    return NextResponse.json({ ok: false, erro: 'conexão Shopify não configurada' }, { status: 404 })
  }

  const assinatura = req.headers.get('x-shopify-hmac-sha256')
  if (!verificarHmac(rawBody, assinatura, webhookSecret)) {
    return NextResponse.json({ ok: false, erro: 'assinatura inválida' }, { status: 401 })
  }

  let payload: ShopifyOrderPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  const email = payload.email
  const telefone = payload.phone ?? payload.customer?.phone
  const nome = [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ') || undefined
  const transactionId = String(payload.id ?? payload.order_number ?? payload.name ?? '')

  // Preferência: Admin API (customerJourneySummary, estruturado) > landing_site
  // legado do próprio payload do webhook (ver comentário no topo do arquivo).
  let landingPage = payload.landing_site
  let referrerUrl = payload.referring_site
  let utmEstruturado: UTMSet | undefined

  const { shopDomain, adminApiToken } = conexao.campos ?? {}
  if (shopDomain && adminApiToken && payload.id) {
    const visita = await buscarJornadaPedido(shopDomain, adminApiToken, payload.id)
    if (visita) {
      landingPage = visita.landingPage ?? landingPage
      referrerUrl = visita.referrerUrl ?? referrerUrl
      utmEstruturado = visita.utm
    }
  }

  const { utm, ids, origem } = construirAtribuicao(landingPage, referrerUrl, utmEstruturado)

  const evento: Evento = {
    tipo: 'compra',
    ts: payload.created_at ? new Date(payload.created_at).getTime() : Date.now(),
    valor: payload.total_price ? Number(payload.total_price) : undefined,
    produto: payload.line_items?.[0]?.title,
    transactionId: transactionId || undefined,
    utm,
    utmParsed: utm ? parseUTM(utm) : undefined,
    dados: (email || telefone || nome)
      ? {
          email,
          telefone,
          nome,
          emailHash: email ? sha256(email) : undefined,
          telefoneHash: telefone ? sha256(normalizarTelefone(telefone)) : undefined,
        }
      : undefined,
    ids,
    geo: payload.client_details?.browser_ip ? { ip: payload.client_details.browser_ip } : undefined,
    userAgent: payload.client_details?.user_agent,
    origem,
    visitorId: '',
  }

  try {
    const store = createAdminIngestStore(clienteId)
    const resultado = await ingerirEvento(store, clienteId, evento)
    return NextResponse.json({ ok: true, ...resultado })
  } catch (err) {
    console.error('[webhooks/shopify] erro ao processar pedido:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao processar pedido' }, { status: 500 })
  }
}
