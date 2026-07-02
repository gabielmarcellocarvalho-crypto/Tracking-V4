// ─── GA4 — DATA API (stub) ───────────────────────────────────────────────────
// Leitura de métricas do GA4 (sessões, canais, conversões) para cruzar com os
// dados primários da plataforma. Exige service account com acesso à property.
//
// Quando as credenciais chegarem, implementar via:
//   POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
//   (Bearer token de service account — google-auth-library)
// Docs: https://developers.google.com/analytics/devguides/reporting/data/v1

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
  dados?: Record<string, unknown>
}

export async function lerRelatorioGA4(
  cred: GA4Credenciais,
  _config: { metricas: string[]; dimensoes: string[]; dias: number },
): Promise<GA4Resultado> {
  if (!cred.propertyId) return { ok: false, erro: 'Property ID é obrigatório' }
  if (!cred.serviceAccountJson) {
    return { ok: false, erro: 'Service account pendente — cole o JSON na página de Conexões' }
  }
  // TODO: implementar runReport quando a service account estiver configurada
  return { ok: false, erro: 'Leitura GA4 ainda não implementada' }
}

export async function testarConexaoGA4(cred: GA4Credenciais): Promise<GA4Resultado> {
  if (!cred.propertyId) return { ok: false, erro: 'Preencha o Property ID' }
  return { ok: true }
}
