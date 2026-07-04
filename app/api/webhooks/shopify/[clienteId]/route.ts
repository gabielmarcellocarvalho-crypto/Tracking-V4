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
// Limitações da v1 (documentadas, não resolvidas aqui):
// - Sem fbp/fbc/gclid nesses eventos (webhook server-to-server, sem cookies
//   do navegador) — a identidade ainda casa por email/telefone se a pessoa
//   já tinha uma jornada iniciada pelo snippet.
// - Pedido com múltiplos itens vira um único `produto` (o primeiro item).

import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { sha256, normalizarTelefone } from '@/lib/tracking/conversoes'
import { ingerirEvento } from '@/lib/tracking/ingest'
import { createAdminIngestStore } from '@/lib/tracking/stores/admin-store'
import type { Integration, Evento } from '@/lib/types'

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

  const evento: Evento = {
    tipo: 'compra',
    ts: payload.created_at ? new Date(payload.created_at).getTime() : Date.now(),
    valor: payload.total_price ? Number(payload.total_price) : undefined,
    produto: payload.line_items?.[0]?.title,
    transactionId: transactionId || undefined,
    dados: (email || telefone || nome)
      ? {
          email,
          telefone,
          nome,
          emailHash: email ? sha256(email) : undefined,
          telefoneHash: telefone ? sha256(normalizarTelefone(telefone)) : undefined,
        }
      : undefined,
    ids: {},
    // Server-to-server: não passa por detectOrigem (sem utm/referrer/click-id
    // reais) — 'direto' seria enganoso, então marca explicitamente a origem.
    origem: 'shopify',
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
