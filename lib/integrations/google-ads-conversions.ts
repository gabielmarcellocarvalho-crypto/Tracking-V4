// ─── GOOGLE ADS — ENHANCED CONVERSIONS (envio real) ──────────────────────────
// Sobe conversões via uploadClickConversions, usando as credenciais
// compartilhadas da MCC (mesmo padrão do Meta CAPI — ver meta-capi.ts).
// Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks

import { obterAccessToken } from './google-ads-insights'
import type { CredenciaisMcc } from './google-mcc'

const API_VERSION = 'v21'

export interface EnvioResultadoGoogle {
  ok: boolean
  erro?: string
}

// Google exige "yyyy-MM-dd HH:mm:ss+HH:mm" (espaço em vez de "T", offset
// explícito) — ISO8601 puro é rejeitado. Usa UTC (+00:00) sempre, não
// depende do timezone do runtime.
function formatarDataHoraGoogle(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} `
    + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`
}

/** Envia uma conversão já montada (ver montarPayloadGoogleEnhanced em lib/tracking/conversoes.ts). */
export async function enviarConversaoGoogle(
  cred: CredenciaisMcc,
  customerId: string,
  conversionActionId: string,
  payload: Record<string, unknown>,
): Promise<EnvioResultadoGoogle> {
  const custId = customerId.replace(/-/g, '')
  const gclid = payload.gclid as string | null | undefined
  const wbraid = payload.wbraid as string | null | undefined
  const gbraid = payload.gbraid as string | null | undefined
  const identificadoresBrutos = (payload.user_identifiers as Record<string, string>[] | undefined) ?? []

  const userIdentifiers: Record<string, string>[] = []
  for (const u of identificadoresBrutos) {
    if (u.hashed_email) userIdentifiers.push({ hashedEmail: u.hashed_email, userIdentifierSource: 'FIRST_PARTY' })
    else if (u.hashed_phone_number) userIdentifiers.push({ hashedPhoneNumber: u.hashed_phone_number, userIdentifierSource: 'FIRST_PARTY' })
  }

  if (!gclid && !wbraid && !gbraid && userIdentifiers.length === 0) {
    return { ok: false, erro: 'sem gclid/wbraid/gbraid nem e-mail/telefone — nada pra enviar' }
  }

  const conversion: Record<string, unknown> = {
    conversionAction: `customers/${custId}/conversionActions/${conversionActionId}`,
    conversionDateTime: formatarDataHoraGoogle(payload.conversion_date_time as string),
    conversionValue: payload.conversion_value ?? 0,
    currencyCode: payload.currency_code ?? 'BRL',
  }
  if (gclid) conversion.gclid = gclid
  else if (wbraid) conversion.wbraid = wbraid
  else if (gbraid) conversion.gbraid = gbraid
  if (userIdentifiers.length) conversion.userIdentifiers = userIdentifiers

  try {
    const accessToken = await obterAccessToken(cred.clientId, cred.clientSecret, cred.refreshToken)
    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${custId}:uploadClickConversions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': cred.developerToken,
          'login-customer-id': cred.mccId.replace(/-/g, ''),
        },
        body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
      },
    )
    const json = await res.json()
    if (!res.ok || json.error) {
      return { ok: false, erro: json.error?.message ?? `erro ${res.status} ao subir conversão` }
    }
    if (json.partialFailureError) {
      return { ok: false, erro: json.partialFailureError.message ?? 'falha parcial ao subir conversão' }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'falha ao subir conversão pro Google Ads' }
  }
}
