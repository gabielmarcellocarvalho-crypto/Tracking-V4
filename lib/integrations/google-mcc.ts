// ─── CREDENCIAIS COMPARTILHADAS DAS MCCs DO GOOGLE ADS (server-only) ─────────
// Duas MCCs hoje: "1" = Unidade Carvalho & Co, "2" = Carvalho & Co. O cliente
// escolhe qual MCC na aba Conexões (campo `mcc` em integrations/google-ads e
// integrations/google) — usado tanto por Métricas (leitura de gasto) quanto
// por Enhanced Conversions (envio), mesmo padrão do token compartilhado da BM
// no Meta.

export type MccId = '1' | '2'

export const MCC_LABELS: Record<MccId, string> = {
  '1': 'Unidade Carvalho & Co',
  '2': 'Carvalho & Co',
}

export interface CredenciaisMcc {
  mccId: string
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
}

function ehMccId(v: string | undefined): v is MccId {
  return v === '1' || v === '2'
}

/** Lê `campos.mcc` de uma integração (google-ads ou google) e resolve as credenciais compartilhadas, ou null se não configurado/inválido. */
export function resolverCredenciaisMcc(mccCampo: string | undefined): CredenciaisMcc | null {
  const mcc: MccId = ehMccId(mccCampo) ? mccCampo : '1' // padrão "1" pra clientes antigos sem o campo ainda salvo
  const prefixo = `GADS_MCC${mcc}_`
  const mccId = process.env[`${prefixo}ID`]
  const developerToken = process.env[`${prefixo}DEVELOPER_TOKEN`]
  const clientId = process.env[`${prefixo}OAUTH_CLIENT_ID`]
  const clientSecret = process.env[`${prefixo}OAUTH_CLIENT_SECRET`]
  const refreshToken = process.env[`${prefixo}REFRESH_TOKEN`]
  if (!mccId || !developerToken || !clientId || !clientSecret || !refreshToken) return null
  return { mccId, developerToken, clientId, clientSecret, refreshToken }
}

export function mccConfigurada(mcc: MccId): boolean {
  const prefixo = `GADS_MCC${mcc}_`
  return !!(
    process.env[`${prefixo}ID`] && process.env[`${prefixo}DEVELOPER_TOKEN`] &&
    process.env[`${prefixo}OAUTH_CLIENT_ID`] && process.env[`${prefixo}OAUTH_CLIENT_SECRET`] &&
    process.env[`${prefixo}REFRESH_TOKEN`]
  )
}
