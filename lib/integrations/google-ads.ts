// ─── GOOGLE ADS — ENHANCED CONVERSIONS (stub) ────────────────────────────────
// A API do Google Ads exige OAuth2 (client_id/client_secret/refresh_token) +
// developer token aprovado. Os payloads Enhanced Conversions já saem prontos
// da fila (clientes/{id}/conversoes, plataforma google-enhanced).
//
// Quando as credenciais chegarem, implementar via:
//   POST https://googleads.googleapis.com/v18/customers/{customerId}:uploadClickConversions
//   (google-ads-api ou REST com Bearer token OAuth)
// Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks

export interface GoogleAdsCredenciais {
  customerId: string       // sem hífens, ex: 1234567890
  developerToken: string
  oauthClientId?: string
  oauthClientSecret?: string
  refreshToken?: string
  conversionActionId?: string
}

export interface EnvioResultadoGoogle {
  ok: boolean
  erro?: string
}

export async function enviarConversaoGoogle(
  cred: GoogleAdsCredenciais,
  _payloads: Record<string, unknown>[],
): Promise<EnvioResultadoGoogle> {
  if (!cred.customerId || !cred.developerToken) {
    return { ok: false, erro: 'Customer ID e Developer Token são obrigatórios' }
  }
  if (!cred.refreshToken) {
    return { ok: false, erro: 'OAuth pendente — gere o refresh token para habilitar o envio' }
  }
  // TODO: implementar uploadClickConversions quando o OAuth estiver configurado
  return { ok: false, erro: 'Envio Google Ads ainda não implementado — payloads permanecem na fila' }
}

export async function testarConexaoGoogle(cred: GoogleAdsCredenciais): Promise<EnvioResultadoGoogle> {
  if (!cred.customerId || !cred.developerToken) {
    return { ok: false, erro: 'Preencha Customer ID e Developer Token' }
  }
  return { ok: true }
}
