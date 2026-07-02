// ─── META CONVERSIONS API (CAPI) ─────────────────────────────────────────────
// Cliente pronto — funciona assim que houver Pixel ID + Access Token na página
// de Conexões. Endpoint REST oficial:
//   POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token=...
// Os payloads já saem prontos da fila (clientes/{id}/conversoes, plataforma
// meta-capi) — montados em lib/tracking/conversoes.ts.

export interface MetaCAPICredenciais {
  pixelId: string
  accessToken: string
  /** test_event_code do Gerenciador de Eventos (opcional, para validar) */
  testEventCode?: string
}

export interface EnvioResultado {
  ok: boolean
  eventsReceived?: number
  erro?: string
}

const GRAPH_VERSION = 'v21.0'

export async function enviarConversaoMeta(
  cred: MetaCAPICredenciais,
  payloads: Record<string, unknown>[],
): Promise<EnvioResultado> {
  if (!cred.pixelId || !cred.accessToken) {
    return { ok: false, erro: 'Pixel ID e Access Token são obrigatórios' }
  }

  const body: Record<string, unknown> = { data: payloads }
  if (cred.testEventCode) body.test_event_code = cred.testEventCode

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${cred.pixelId}/events?access_token=${encodeURIComponent(cred.accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    const json = await res.json()
    if (!res.ok) {
      return { ok: false, erro: json?.error?.message ?? `HTTP ${res.status}` }
    }
    return { ok: true, eventsReceived: json.events_received }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha de rede' }
  }
}

export async function testarConexaoMeta(cred: MetaCAPICredenciais): Promise<EnvioResultado> {
  // Envia um evento de teste PageView (só aparece no Test Events se houver testEventCode)
  return enviarConversaoMeta(cred, [{
    event_name: 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: { client_user_agent: 'tracking-v4-test' },
  }])
}
