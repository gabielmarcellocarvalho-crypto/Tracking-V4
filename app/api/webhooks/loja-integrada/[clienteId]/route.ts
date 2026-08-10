// ─── WEBHOOK LOJA INTEGRADA — POST /api/webhooks/loja-integrada/{clienteId} ──
// Recebe o webhook de "Pedido" da Loja Integrada e injeta como evento de
// compra no mesmo pipeline usado pelo /api/track e pelo webhook da Shopify
// (identidade → evento → conversões → envio Meta CAPI), via firebase-admin.
//
// Autenticação: diferente da Shopify (que assina o payload com HMAC), a
// documentação técnica da Loja Integrada fica atrás de um portal que não
// conseguimos ler por completo — não temos confirmação de que eles ofereçam
// assinatura de webhook. Por segurança, autenticamos com um token próprio da
// V4 embutido na URL (?token=...), gerado e salvo no campo "Token do Webhook"
// em Conexões — funciona independente do que a Loja Integrada suportar.
//
// Configuração no cliente: painel da loja → Webhooks → Criar → evento
// "Pedido" → colar a URL mostrada em Conexões (já vem com o token).
//
// ATENÇÃO — mapeamento de campos não 100% confirmado: a doc oficial da Loja
// Integrada (api-docs.lojaintegrada.com.br) é um portal renderizado via JS
// que não conseguimos raspar por completo. As chaves abaixo foram escolhidas
// com base nas convenções documentadas (chave_api/chave_aplicacao) e em
// padrões comuns de e-commerce brasileiro (Bling/Tray/Nuvemshop usam nomes
// parecidos), tentando várias variações plausíveis por campo. Depois do
// primeiro pedido de teste, confira os logs do Vercel (o payload bruto é
// sempre logado) e ajuste `extrairPedido` abaixo se algum campo não bater.
import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { sha256, normalizarTelefone } from '@/lib/tracking/conversoes'
import { ingerirEvento } from '@/lib/tracking/ingest'
import { createAdminIngestStore } from '@/lib/tracking/stores/admin-store'
import { parseUTM, detectOrigem } from '@/lib/utm/engine'
import type { Integration, Evento, EventoIds, UTMSet } from '@/lib/types'

/** Primeiro valor não-vazio entre várias chaves candidatas (tolerante a nomes diferentes). */
function pegar(obj: unknown, caminhos: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  for (const caminho of caminhos) {
    let atual: unknown = obj
    for (const parte of caminho.split('.')) {
      if (!atual || typeof atual !== 'object') { atual = undefined; break }
      atual = (atual as Record<string, unknown>)[parte]
    }
    if (atual !== undefined && atual !== null && atual !== '') return atual
  }
  return undefined
}

interface PedidoExtraido {
  id?: string
  valor?: number
  produto?: string
  email?: string
  telefone?: string
  nome?: string
  criadoEm?: number
  urlOrigem?: string
}

/** Payload da Loja Integrada pode vir como o pedido direto ou aninhado em `pedido`/`data`/`objeto`. */
function extrairPedido(payload: Record<string, unknown>): PedidoExtraido {
  const raiz = (pegar(payload, ['pedido', 'data', 'objeto']) as Record<string, unknown>) ?? payload

  const id = pegar(raiz, ['id', 'numero', 'numero_pedido', 'pedido_id'])
  const valor = pegar(raiz, ['valor_total', 'total', 'valorTotal', 'valor'])
  const cliente = pegar(raiz, ['cliente', 'comprador', 'customer']) as Record<string, unknown> | undefined
  const itens = pegar(raiz, ['itens', 'items', 'produtos']) as unknown[] | undefined
  const primeiroItem = Array.isArray(itens) ? (itens[0] as Record<string, unknown> | undefined) : undefined
  const produto = pegar(primeiroItem ?? {}, ['nome', 'produto.nome', 'titulo', 'title'])
  const dataCriacao = pegar(raiz, ['data_criacao', 'created_at', 'data', 'dataCriacao'])
  const urlOrigem = pegar(raiz, ['url_origem', 'landing_page', 'referrer', 'origem_url'])

  return {
    id: id !== undefined ? String(id) : undefined,
    valor: valor !== undefined ? Number(valor) : undefined,
    produto: typeof produto === 'string' ? produto : undefined,
    email: pegar(cliente ?? raiz, ['email']) as string | undefined,
    telefone: pegar(cliente ?? raiz, ['telefone', 'fone', 'celular', 'phone']) as string | undefined,
    nome: pegar(cliente ?? raiz, ['nome', 'name']) as string | undefined,
    criadoEm: typeof dataCriacao === 'string' ? new Date(dataCriacao).getTime() : undefined,
    urlOrigem: typeof urlOrigem === 'string' ? urlOrigem : undefined,
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params
  const token = req.nextUrl.searchParams.get('token')

  let conexao: Integration | undefined
  try {
    const snap = await getDbAdmin()
      .collection('partners').doc(clienteId)
      .collection('integrations').doc('loja-integrada')
      .get()
    if (snap.exists) conexao = snap.data() as Integration
  } catch (err) {
    console.error('[webhooks/loja-integrada] erro ao ler conexão:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao consultar conexão' }, { status: 500 })
  }

  const webhookToken = conexao?.campos?.webhookToken
  if (!conexao || conexao.status !== 'configurado' || !webhookToken) {
    return NextResponse.json({ ok: false, erro: 'conexão Loja Integrada não configurada' }, { status: 404 })
  }
  if (!token || token !== webhookToken) {
    return NextResponse.json({ ok: false, erro: 'token inválido' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  // Log do payload bruto — único jeito de confirmar/ajustar os nomes de
  // campo reais até termos acesso à doc completa da Loja Integrada.
  console.log('[webhooks/loja-integrada] payload recebido:', JSON.stringify(payload).slice(0, 4000))

  const pedido = extrairPedido(payload)

  let utm: UTMSet | undefined
  try {
    if (pedido.urlOrigem) {
      const params2 = new URL(pedido.urlOrigem, 'https://loja-integrada-landing.internal').searchParams
      if (params2.get('utm_source') || params2.get('utm_medium') || params2.get('utm_campaign')) {
        utm = {
          source: params2.get('utm_source') ?? undefined,
          medium: params2.get('utm_medium') ?? undefined,
          campaign: params2.get('utm_campaign') ?? undefined,
          term: params2.get('utm_term') ?? undefined,
          content: params2.get('utm_content') ?? undefined,
        }
      }
    }
  } catch {
    utm = undefined
  }

  const ids: EventoIds = {}
  const detectada = detectOrigem(utm, ids, pedido.urlOrigem)
  const origem = detectada === 'direto' ? 'loja-integrada' : detectada

  const evento: Evento = {
    tipo: 'compra',
    ts: pedido.criadoEm ?? Date.now(),
    valor: pedido.valor,
    produto: pedido.produto,
    transactionId: pedido.id,
    utm,
    utmParsed: utm ? parseUTM(utm) : undefined,
    dados: (pedido.email || pedido.telefone || pedido.nome)
      ? {
          email: pedido.email,
          telefone: pedido.telefone,
          nome: pedido.nome,
          emailHash: pedido.email ? sha256(pedido.email) : undefined,
          telefoneHash: pedido.telefone ? sha256(normalizarTelefone(pedido.telefone)) : undefined,
        }
      : undefined,
    ids,
    origem,
    visitorId: '',
  }

  try {
    const store = createAdminIngestStore(clienteId)
    const resultado = await ingerirEvento(store, clienteId, evento)
    return NextResponse.json({ ok: true, ...resultado })
  } catch (err) {
    console.error('[webhooks/loja-integrada] erro ao processar pedido:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao processar pedido' }, { status: 500 })
  }
}
