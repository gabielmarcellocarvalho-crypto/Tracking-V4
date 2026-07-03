// ─── META OAUTH — LADO CLIENTE ───────────────────────────────────────────────
// Monta a URL de login e abre o popup. Não tem acesso a META_APP_SECRET
// (fica só no servidor) — seguro pra importar em componentes 'use client'.

export const META_GRAPH_VERSION = 'v21.0'
// App criado só com o caso de uso "Login do Facebook" — ads_read/ads_management/
// business_management exigem App Review (permissões avançadas). Por enquanto só
// email/public_profile (padrão, liberado sem revisão); métricas ficam para depois.
export const META_SCOPES = ['email', 'public_profile']

export function getMetaRedirectUri(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/meta/callback`
}

export function iniciarLoginMeta() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  if (!appId) {
    alert('NEXT_PUBLIC_META_APP_ID não configurado no .env.local')
    return
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getMetaRedirectUri(),
    state: `meta_connect_${Date.now()}`,
    scope: META_SCOPES.join(','),
    response_type: 'code',
  })

  const url = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`

  const width = 600
  const height = 700
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2
  window.open(url, 'Meta Login', `width=${width},height=${height},top=${top},left=${left}`)
}
