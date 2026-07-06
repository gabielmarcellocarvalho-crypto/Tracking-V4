// ─── META OAUTH — LADO CLIENTE ───────────────────────────────────────────────
// Monta a URL de login e abre o popup. Não tem acesso a META_APP_SECRET
// (fica só no servidor) — seguro pra importar em componentes 'use client'.

export const META_GRAPH_VERSION = 'v21.0'
// App criado só com o caso de uso "Login do Facebook" — ads_read/ads_management/
// business_management exigem App Review (permissões avançadas). "email" também
// exige revisão nesta configuração do app (erro "Invalid Scopes: email"), então
// fica só public_profile (padrão, liberado sem revisão); métricas ficam para
// depois. O e-mail usado pra chavear users/{email} vem do Firebase Auth
// (idToken), nunca do Facebook — remover este escopo não afeta essa lógica.
export const META_SCOPES = ['public_profile']

export function getMetaRedirectUri(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/meta/callback`
}

/** Retorna a referência do popup (ou null se o navegador bloqueou) — quem
 * chama usa isso pra saber quando a janela fechou e mostrar feedback
 * enquanto o usuário confirma no Facebook, já que sem isso a aba original
 * parece "travada" sem nenhuma indicação do que está acontecendo. */
export function iniciarLoginMeta(): Window | null {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  if (!appId) {
    alert('NEXT_PUBLIC_META_APP_ID não configurado no .env.local')
    return null
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
  const popup = window.open(url, 'Meta Login', `width=${width},height=${height},top=${top},left=${left}`)

  if (!popup) {
    alert('O navegador bloqueou o pop-up de login do Facebook. Permita pop-ups para este site e clique em "Conectar com Facebook" de novo.')
    return null
  }
  return popup
}
