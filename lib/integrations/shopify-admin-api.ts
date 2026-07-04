// ─── SHOPIFY ADMIN API — GraphQL customerJourneySummary ──────────────────────
// Fallback de atribuição pro webhook de pedido: a Shopify descontinuou os
// cookies (_landing_page/_orig_referrer) que alimentavam landing_site/
// referring_site no payload do webhook (set/2025, prazo final dez/2025 —
// https://shopify.dev/changelog/trackingconsent-landingpage-origreferrer-cookies-will-no-longer-be-set).
// O substituto oficial é consultar customerJourneySummary via Admin API,
// que exige um Admin API access token com escopo read_orders (criado em
// Shopify Admin → Configurações → Apps e canais de vendas → Desenvolver apps
// → Criar um app → Configurar Admin API → escopo read_orders → Instalar app
// → Revelar token de acesso à API).

const SHOPIFY_API_VERSION = '2025-01'

export interface ShopifyVisita {
  landingPage?: string
  referrerUrl?: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

/** Busca a última sessão do cliente antes da compra (origem real, sem depender de cookie). */
export async function buscarJornadaPedido(
  shopDomain: string,
  adminApiToken: string,
  orderId: string | number,
): Promise<ShopifyVisita | null> {
  const query = `
    query PedidoJornada($id: ID!) {
      order(id: $id) {
        customerJourneySummary {
          ready
          lastVisit {
            landingPage
            referrerUrl
            utmParameters { source medium campaign term content }
          }
        }
      }
    }
  `

  try {
    const res = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminApiToken,
      },
      body: JSON.stringify({ query, variables: { id: `gid://shopify/Order/${orderId}` } }),
    })
    if (!res.ok) {
      console.error('[shopify-admin-api] HTTP', res.status, await res.text().catch(() => ''))
      return null
    }
    const json = await res.json()
    if (json.errors) {
      console.error('[shopify-admin-api] erros GraphQL:', JSON.stringify(json.errors))
      return null
    }
    const visita = json?.data?.order?.customerJourneySummary?.lastVisit
    if (!visita) return null

    const utmParams = visita.utmParameters
    return {
      landingPage: visita.landingPage ?? undefined,
      referrerUrl: visita.referrerUrl ?? undefined,
      utm: utmParams
        ? {
            source: utmParams.source ?? undefined,
            medium: utmParams.medium ?? undefined,
            campaign: utmParams.campaign ?? undefined,
            term: utmParams.term ?? undefined,
            content: utmParams.content ?? undefined,
          }
        : undefined,
    }
  } catch (err) {
    console.error('[shopify-admin-api] falha na consulta:', err)
    return null
  }
}
