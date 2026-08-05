// ─── META ADS INSIGHTS (server-only) ─────────────────────────────────────────
// Busca gasto + funil diário de uma conta de anúncios via Marketing API. Nunca
// importar em código client — usa o token resolvido (próprio do cliente ou
// compartilhado da BM), que não deve circular no browser.

const GRAPH_VERSION = 'v21.0'

// Meta retorna o mesmo evento sob vários action_types (ex: add_to_cart,
// onsite_web_add_to_cart, omni_add_to_cart...) — pega só UM rótulo canônico
// por estágio pra não inflar o número somando duplicatas do mesmo evento.
const ACTION_SESSAO = 'landing_page_view'
const ACTION_ADD_TO_CART = 'add_to_cart'
const ACTION_CHECKOUT = 'initiate_checkout'
const ACTION_PURCHASE = 'purchase'

export interface GastoDiario {
  data: string // YYYY-MM-DD
  spend: number
  reach: number
  impressions: number
  clicks: number
  sessoes: number
  addToCart: number
  checkout: number
  purchase: number
  faturamento: number
}

export class MetaAdsInsightsError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function valorDaAcao(acoes: { action_type: string; value: string }[] | undefined, tipo: string): number {
  return Number(acoes?.find((a) => a.action_type === tipo)?.value ?? 0)
}

/** Busca gasto + funil (sessões/cart/checkout/purchase) diário de uma conta de anúncios no período informado. */
export async function buscarGastoMetaAds(
  adAccountId: string,
  accessToken: string,
  start: Date,
  end: Date,
): Promise<GastoDiario[]> {
  const contaId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`

  const params = new URLSearchParams({
    fields: 'spend,reach,impressions,clicks,actions,action_values',
    time_range: JSON.stringify({ since: toYMD(start), until: toYMD(end) }),
    time_increment: '1',
    access_token: accessToken,
    limit: '500',
  })

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${contaId}/insights?${params.toString()}`
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Erro ${res.status} ao consultar a Marketing API`
    throw new MetaAdsInsightsError(msg, res.status || 502)
  }

  const linhas = (json.data ?? []) as {
    date_start: string
    spend?: string
    reach?: string
    impressions?: string
    clicks?: string
    actions?: { action_type: string; value: string }[]
    action_values?: { action_type: string; value: string }[]
  }[]

  return linhas.map((l) => ({
    data: l.date_start,
    spend: Number(l.spend ?? 0),
    reach: Number(l.reach ?? 0),
    impressions: Number(l.impressions ?? 0),
    clicks: Number(l.clicks ?? 0),
    sessoes: valorDaAcao(l.actions, ACTION_SESSAO),
    addToCart: valorDaAcao(l.actions, ACTION_ADD_TO_CART),
    checkout: valorDaAcao(l.actions, ACTION_CHECKOUT),
    purchase: valorDaAcao(l.actions, ACTION_PURCHASE),
    faturamento: valorDaAcao(l.action_values, ACTION_PURCHASE),
  }))
}
