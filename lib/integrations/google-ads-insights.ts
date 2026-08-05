// ─── GOOGLE ADS INSIGHTS (server-only) ────────────────────────────────────────
// Busca gasto diário de uma conta do Google Ads via Google Ads API, usando as
// credenciais compartilhadas da MCC (OAuth refresh token + developer token +
// login-customer-id). Nunca importar em código client.

// v17 foi descontinuada pelo Google — confirmado por teste direto contra a
// API em 2026-08: v20 responde com erro de versão, v21 funciona. Ajustar
// aqui quando o Google sunset essa também (checar em developers.google.com).
const API_VERSION = 'v21'

export interface GastoDiarioGoogle {
  data: string // YYYY-MM-DD
  spend: number
  impressions: number
  clicks: number
}

export class GoogleAdsInsightsError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
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

/** Busca gasto/impressões/cliques diários de uma conta do Google Ads no período informado. */
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
  const accessToken = await obterAccessToken(clientId, clientSecret, refreshToken)
  const custId = customerId.replace(/-/g, '')
  const loginCustomerId = mccId.replace(/-/g, '')

  const query = `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks
    FROM customer
    WHERE segments.date BETWEEN '${toYMD(start)}' AND '${toYMD(end)}'`

  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${custId}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': loginCustomerId,
    },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Erro ${res.status} ao consultar a Google Ads API`
    throw new GoogleAdsInsightsError(msg, res.status || 502)
  }

  const linhas = (json.results ?? []) as {
    segments?: { date?: string }
    metrics?: { costMicros?: string; impressions?: string; clicks?: string }
  }[]

  return linhas.map((l) => ({
    data: l.segments?.date ?? '',
    spend: Number(l.metrics?.costMicros ?? 0) / 1_000_000,
    impressions: Number(l.metrics?.impressions ?? 0),
    clicks: Number(l.metrics?.clicks ?? 0),
  }))
}
