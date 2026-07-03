// ─── PIPELINE DE INGESTÃO COMPARTILHADO ──────────────────────────────────────
// Resolve identidade, grava o evento, enfileira conversões e dispara o envio
// imediato ao Meta CAPI — usado tanto por /api/track (snippet, SDK client)
// quanto por webhooks server-to-server (ex. Shopify, firebase-admin), via
// um IngestStore diferente para cada caso (lib/tracking/stores/*).

import { resolverIdentidade } from '@/lib/tracking/identity'
import { montarConversoes } from '@/lib/tracking/conversoes'
import { enviarConversaoParaMeta } from '@/lib/integrations/meta-send'
import type { Evento } from '@/lib/types'
import type { IngestStore } from '@/lib/tracking/store-types'

export interface ResultadoIngestao {
  eventoId: string
  visitorId: string
  conversoesEnfileiradas: number
}

export async function ingerirEvento(
  store: IngestStore,
  clienteId: string,
  evento: Evento,
): Promise<ResultadoIngestao> {
  evento.visitorId = await resolverIdentidade(store.identity, evento)
  const eventoId = await store.gravarEvento(evento)

  const conversoes = montarConversoes(evento, eventoId)
  for (const conv of conversoes) {
    const conversaoId = await store.gravarConversao(conv)
    // Envio server-side imediato (Meta CAPI) — se não houver token/pixel
    // configurados ainda, a conversão fica como "aguardando-conexao" e é
    // reprocessada depois pelo cron de reenvio.
    if (conv.plataforma === 'meta-capi') {
      try {
        await enviarConversaoParaMeta(clienteId, conversaoId)
      } catch (err) {
        console.error('[ingest] falha no envio imediato ao Meta CAPI:', err)
      }
    }
  }

  return { eventoId, visitorId: evento.visitorId, conversoesEnfileiradas: conversoes.length }
}
