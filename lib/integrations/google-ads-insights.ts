// ─── GOOGLE ADS INSIGHTS (server-only) ────────────────────────────────────────
// Busca gasto + funil diário de uma conta do Google Ads via Google Ads API,
// usando as credenciais compartilhadas da MCC (OAuth refresh token + developer
// token + login-customer-id). Nunca importar em código client.

// v17 foi descontinuada pelo Google — confirmado por teste direto contra a
// API em 2026-08: v20 responde com erro de versão, v21 funciona. Ajustar
// aqui quando o Google sunset essa também (checar em developers.google.com).
const API_VERSION = 'v21'

export interface GastoDiarioGoogle {
  data: string // YYYY-MM-DD
  spend: number
  impressions: number
  clicks: number
  addToCart: number
  checkout: number
  purchase: number
  faturamento: number
}

export class GoogleAdsInsightsError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

interface CredenciaisGoogle {
  mccId: string
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
}

async function obterAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const json = await res.json()
  if (!res.ok || !json.access_token) {
    throw new GoogleAdsInsightsError(json.error_description ?? 'falha ao renovar access token do Google Ads', res.status || 502)
  }
  return json.access_token as string
}

async function buscarGoogleAds(query: string, customerId: string, accessToken: string, creds: CredenciaisGoogle) {
  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': creds.developerToken,
      'login-customer-id': creds.mccId,
    },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Erro ${res.status} ao consultar a Google Ads API`
    throw new GoogleAdsInsightsError(msg, res.status || 502)
  }
  return json
}

/** Busca gasto/impressões/cliques + funil (cart/checkout/purchase) diário de uma conta do Google Ads no período informado. */
export async function buscarGastoGoogleAds(
  customerId: string,
  mccId: string,
  developerToken: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  start: Date,
  end: Date,
): Promise<GastoDiarioGoogle[]> {
  const creds: CredenciaisGoogle = {
    mccId: mccId.replace(/-/g, ''),
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
  }
  const custId = customerId.replace(/-/g, '')
  const accessToken = await obterAccessToken(clientId, clientSecret, refreshToken)
  const desde = toYMD(start), ate = toYMD(end)

  const porData = new Map<string, GastoDiarioGoogle>()
  const linha = (data: string) => {
    let l = porData.get(data)
    if (!l) {
      l = { data, spend: 0, impressions: 0, clicks: 0, addToCart: 0, checkout: 0, purchase: 0, faturamento: 0 }
      porData.set(data, l)
    }
    return l
  }

  // 1) Custo/impressões/cliques — nível conta, um valor por dia
  const custoJson = await buscarGoogleAds(
    `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks
     FROM customer WHERE segments.date BETWEEN '${desde}' AND '${ate}'`,
    custId, accessToken, creds,
  )
  for (const r of (custoJson.results ?? []) as { segments?: { date?: string }; metrics?: { costMicros?: string; impressions?: string; clicks?: string } }[]) {
    const data = r.segments?.date
    if (!data) continue
    const l = linha(data)
    l.spend = Number(r.metrics?.costMicros ?? 0) / 1_000_000
    l.impressions = Number(r.metrics?.impressions ?? 0)
    l.clicks = Number(r.metrics?.clicks ?? 0)
  }

  // 2) Conversões por categoria — captura ADD_TO_CART/BEGIN_CHECKOUT/PURCHASE.
  // `all_conversions` é fracionário (modelo de atribuição do Google) — soma
  // normalmente, mas exibir arredondado no front.
  const convJson = await buscarGoogleAds(
    `SELECT segments.date, segments.conversion_action_category, metrics.all_conversions, metrics.all_conversions_value
     FROM customer WHERE segments.date BETWEEN '${desde}' AND '${ate}' AND metrics.all_conversions > 0`,
    custId, accessToken, creds,
  )
  for (const r of (convJson.results ?? []) as {
    segments?: { date?: string; conversionActionCategory?: string }
    metrics?: { allConversions?: number; allConversionsValue?: number }
  }[]) {
    const data = r.segments?.date
    const categoria = r.segments?.conversionActionCategory
    if (!data || !categoria) continue
    const l = linha(data)
    const qtd = r.metrics?.allConversions ?? 0
    const valor = r.metrics?.allConversionsValue ?? 0
    if (categoria === 'ADD_TO_CART') l.addToCart += qtd
    else if (categoria === 'BEGIN_CHECKOUT') l.checkout += qtd
    else if (categoria === 'PURCHASE') { l.purchase += qtd; l.faturamento += valor }
  }

  return [...porData.values()].sort((a, b) => a.data.localeCompare(b.data))
}
