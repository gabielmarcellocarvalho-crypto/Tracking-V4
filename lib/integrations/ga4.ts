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

export interface GA4SessoesDia {
  data: string // YYYY-MM-DD
  sessions: number
  engagedSessions: number
  totalUsers: number
  screenPageViews: number
}

export interface GA4SessoesPorCanal {
  canal: string // valor de sessionDefaultChannelGroup (Organic Search, Paid Search, Direct, ...)
  sessions: number
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

export interface GA4Row {
  dimensionValues?: { value?: string }[]
  metricValues?: { value?: string }[]
}

/** POST runReport cru — valida credenciais, autentica e devolve as rows já checadas de erro. */
async function chamarRunReport(cred: GA4Credenciais, body: Record<string, unknown>): Promise<GA4Row[]> {
  if (!cred.propertyId) throw new GA4InsightsError('Property ID é obrigatório', 400)
  if (!cred.serviceAccountJson) {
    throw new GA4InsightsError('Service account pendente — cole o JSON na página de Conexões', 400)
  }

  const accessToken = await obterAccessTokenGA4(cred.serviceAccountJson)
  const propertyId = cred.propertyId.trim().replace(/^properties\//, '')

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Erro ${res.status} ao consultar a GA4 Data API`
    throw new GA4InsightsError(msg, res.status || 502)
  }
  return (json.rows ?? []) as GA4Row[]
}

/** GA4 retorna a dimensão "date" como YYYYMMDD sem separador. */
function formatarDataGA4(raw: string): string {
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
}

/** Busca screenPageViews por dia de uma property GA4 no período informado. */
export async function buscarPageViewsGA4(cred: GA4Credenciais, start: Date, end: Date): Promise<GA4PageViewsDiario[]> {
  const rows = await chamarRunReport(cred, {
    dateRanges: [{ startDate: toYMD(start), endDate: toYMD(end) }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
  })
  return rows
    .map((r) => ({
      data: formatarDataGA4(r.dimensionValues?.[0]?.value ?? ''),
      screenPageViews: Number(r.metricValues?.[0]?.value ?? 0),
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

/** Reduz as rows cruas do runReport (date + sessionDefaultChannelGroup) em porDia/porCanal — puro, sem I/O, testável isolado. */
export function agregarLinhasSessoesGA4(rows: GA4Row[]): { porDia: GA4SessoesDia[]; porCanal: GA4SessoesPorCanal[] } {
  const porDiaMap = new Map<string, GA4SessoesDia>()
  const porCanalMap = new Map<string, number>()

  for (const r of rows) {
    const data = formatarDataGA4(r.dimensionValues?.[0]?.value ?? '')
    const canal = r.dimensionValues?.[1]?.value ?? 'Unassigned'
    const sessions = Number(r.metricValues?.[0]?.value ?? 0)
    const engagedSessions = Number(r.metricValues?.[1]?.value ?? 0)
    const totalUsers = Number(r.metricValues?.[2]?.value ?? 0)
    const screenPageViews = Number(r.metricValues?.[3]?.value ?? 0)

    const dia = porDiaMap.get(data) ?? { data, sessions: 0, engagedSessions: 0, totalUsers: 0, screenPageViews: 0 }
    dia.sessions += sessions
    dia.engagedSessions += engagedSessions
    dia.totalUsers += totalUsers
    dia.screenPageViews += screenPageViews
    porDiaMap.set(data, dia)

    porCanalMap.set(canal, (porCanalMap.get(canal) ?? 0) + sessions)
  }

  return {
    porDia: [...porDiaMap.values()].sort((a, b) => a.data.localeCompare(b.data)),
    porCanal: [...porCanalMap.entries()].map(([canal, sessions]) => ({ canal, sessions })).sort((a, b) => b.sessions - a.sessions),
  }
}

/**
 * Busca sessões/usuários/engajamento por dia + quebra por canal
 * (sessionDefaultChannelGroup: Organic Search, Paid Search, Direct, Organic
 * Social, Referral, Email, Unassigned...) no período — tráfego nativo do
 * GA4, sem misturar com gasto de mídia paga (ver Performance → aba GA4).
 */
export async function buscarSessoesGA4(
  cred: GA4Credenciais, start: Date, end: Date,
): Promise<{ porDia: GA4SessoesDia[]; porCanal: GA4SessoesPorCanal[] }> {
  const rows = await chamarRunReport(cred, {
    dateRanges: [{ startDate: toYMD(start), endDate: toYMD(end) }],
    dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' }, { name: 'engagedSessions' },
      { name: 'totalUsers' }, { name: 'screenPageViews' },
    ],
  })
  return agregarLinhasSessoesGA4(rows)
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
