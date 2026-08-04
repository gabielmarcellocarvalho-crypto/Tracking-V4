// ─── META ADS INSIGHTS (server-only) ─────────────────────────────────────────
// Busca gasto diário de uma conta de anúncios via Marketing API. Nunca
// importar em código client — usa o token resolvido (próprio do cliente ou
// compartilhado da BM), que não deve circular no browser.

const GRAPH_VERSION = 'v21.0'

export interface GastoDiario {
  data: string // YYYY-MM-DD
  spend: number
}

export class MetaAdsInsightsError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Busca o gasto diário (spend) de uma conta de anúncios no período informado. */
export async function buscarGastoMetaAds(
  adAccountId: string,
  accessToken: string,
  start: Date,
  end: Date,
): Promise<GastoDiario[]> {
  const contaId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`

  const params = new URLSearchParams({
    fields: 'spend',
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

  const linhas = (json.data ?? []) as { date_start: string; spend?: string }[]
  return linhas.map((l) => ({ data: l.date_start, spend: Number(l.spend ?? 0) }))
}
