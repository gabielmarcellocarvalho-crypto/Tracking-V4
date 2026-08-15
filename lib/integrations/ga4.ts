// ─── GA4 — DATA API (server-only) ────────────────────────────────────────────
// Busca screenPageViews diário via Analytics Data API, usando a service
// account do cliente (Conexões → GA4). Nunca importar em código client — a
// service account fica em texto no doc de integração, só o servidor lê.
// Docs: https://developers.google.com/analytics/devguides/reporting/data/v1

import { JWT } from 'google-auth-library'

export interface GA4Credenciais {
  propertyId: string
  /** JSON da service account (colado inteiro) */
  serviceAccountJson?: string
  measurementId?: string
  /** api_secret do Measurement Protocol (para enviar eventos ao GA4) */
  apiSecret?: string
}

export interface GA4Resultado {
  ok: boolean
  erro?: string
}

export interface GA4PageViewsDiario {
  data: string // YYYY-MM-DD
  screenPageViews: number
}

export class GA4InsightsError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function obterAccessTokenGA4(serviceAccountJson: string): Promise<string> {
  let sa: { client_email?: string; private_key?: string }
  try {
    sa = JSON.parse(serviceAccountJson)
  } catch {
    throw new GA4InsightsError('JSON da service account inválido — cole o arquivo inteiro gerado pelo Google Cloud', 400)
  }
  if (!sa.client_email || !sa.private_key) {
    throw new GA4InsightsError('JSON da service account sem client_email/private_key', 400)
  }

  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  try {
    const { token } = await client.getAccessToken()
    if (!token) throw new GA4InsightsError('falha ao gerar access token da service account do GA4', 502)
    return token
  } catch (err) {
    if (err instanceof GA4InsightsError) throw err
    throw new GA4InsightsError(
      err instanceof Error ? err.message : 'falha ao autenticar a service account do GA4',
      502,
    )
  }
}

/** Busca screenPageViews por dia de uma property GA4 no período informado. */
export async function buscarPageViewsGA4(cred: GA4Credenciais, start: Date, end: Date): Promise<GA4PageViewsDiario[]> {
  if (!cred.propertyId) throw new GA4InsightsError('Property ID é obrigatório', 400)
  if (!cred.serviceAccountJson) {
    throw new GA4InsightsError('Service account pendente — cole o JSON na página de Conexões', 400)
  }

  const accessToken = await obterAccessTokenGA4(cred.serviceAccountJson)
  const propertyId = cred.propertyId.trim().replace(/^properties\//, '')

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      dateRanges: [{ startDate: toYMD(start), endDate: toYMD(end) }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
    }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Erro ${res.status} ao consultar a GA4 Data API`
    throw new GA4InsightsError(msg, res.status || 502)
  }

  const rows = (json.rows ?? []) as { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[]
  return rows
    .map((r) => {
      // GA4 retorna a dimensão "date" como YYYYMMDD sem separador
      const raw = r.dimensionValues?.[0]?.value ?? ''
      const data = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
      return { data, screenPageViews: Number(r.metricValues?.[0]?.value ?? 0) }
    })
    .sort((a, b) => a.data.localeCompare(b.data))
}

export async function testarConexaoGA4(cred: GA4Credenciais): Promise<GA4Resultado> {
  if (!cred.propertyId) return { ok: false, erro: 'Preencha o Property ID' }
  if (!cred.serviceAccountJson) return { ok: false, erro: 'Cole o JSON da service account' }
  try {
    await buscarPageViewsGA4(cred, new Date(), new Date())
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      erro: err instanceof Error ? err.message : 'falha ao testar conexão com o GA4',
    }
  }
}
