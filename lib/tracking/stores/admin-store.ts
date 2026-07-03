// ─── STORE DE INGESTÃO — FIREBASE ADMIN ──────────────────────────────────────
// Usado por webhooks server-to-server (ex. Shopify) que não passam pelo
// snippet do site — não há sessão de usuário nem trackingKey, então a
// autenticação é feita antes (ex. HMAC do webhook) e a escrita usa a service
// account, ignorando firestore.rules.

import { getDbAdmin } from '@/lib/firebase-admin'
import type { Identidade, Evento, Conversao } from '@/lib/types'
import type { IngestStore } from '@/lib/tracking/store-types'

export function createAdminIngestStore(clienteId: string): IngestStore {
  const db = getDbAdmin()
  const clienteRef = db.collection('clientes').doc(clienteId)

  return {
    identity: {
      async buscarPor(campo, valor) {
        if (!valor) return null
        const snap = await clienteRef
          .collection('identidades')
          .where(campo, 'array-contains', valor)
          .limit(1)
          .get()
        if (snap.empty) return null
        const d = snap.docs[0]
        return { ...(d.data() as Identidade), id: d.id }
      },
      async salvar(id, payload) {
        await clienteRef.collection('identidades').doc(id).set(payload)
      },
      async apagar(id) {
        await clienteRef.collection('identidades').doc(id).delete()
      },
    },
    async gravarEvento(evento: Evento) {
      const limpo = JSON.parse(JSON.stringify(evento))
      const ref = await clienteRef.collection('eventos').add(limpo)
      return ref.id
    },
    async gravarConversao(conversao: Omit<Conversao, 'id'>) {
      const limpo = JSON.parse(JSON.stringify(conversao))
      const ref = await clienteRef.collection('conversoes').add(limpo)
      return ref.id
    },
  }
}
