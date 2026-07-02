// ─── META OAUTH — TROCA DE TOKEN (server-only) ───────────────────────────────
// Usa META_APP_SECRET — nunca importar este arquivo em código 'use client'.

const GRAPH_VERSION = 'v21.0'

export interface TokenMetaLongo {
  accessToken: string
  /** epoch ms */
  expiraEm: number
}

export async function trocarCodePorTokenLongo(
  code: string,
  redirectUri: string,
): Promise<TokenMetaLongo> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('NEXT_PUBLIC_META_APP_ID / META_APP_SECRET não configurados no .env.local')
  }

  const tokenUrl = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`

  // 1) code → token curto
  const curtoRes = await fetch(`${tokenUrl}?${new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })}`)
  const curtoJson = await curtoRes.json()
  if (!curtoRes.ok || !curtoJson.access_token) {
    throw new Error(curtoJson?.error?.message ?? 'falha ao trocar code por token curto')
  }

  // 2) token curto → token longo (~60 dias)
  const longoRes = await fetch(`${tokenUrl}?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: curtoJson.access_token,
  })}`)
  const longoJson = await longoRes.json()
  if (!longoRes.ok || !longoJson.access_token) {
    throw new Error(longoJson?.error?.message ?? 'falha ao trocar token curto por token longo')
  }

  const expiresInSec = typeof longoJson.expires_in === 'number' ? longoJson.expires_in : 60 * 24 * 60 * 60
  return {
    accessToken: longoJson.access_token,
    expiraEm: Date.now() + expiresInSec * 1000,
  }
}
