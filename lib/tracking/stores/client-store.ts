// ─── STORE DE INGESTÃO — SDK CLIENT ──────────────────────────────────────────
// Usado por /api/track (ingestão via snippet v4track.js, sem sessão de
// usuário — mesma exposição pública que já existia antes da extração).

import {
  addDoc, collection, doc, getDocs, query, where, limit,
  setDoc, deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Identidade, Evento, Conversao } from '@/lib/types'
import type { IngestStore } from '@/lib/tracking/store-types'

export function createClientIngestStore(clienteId: string): IngestStore {
  return {
    identity: {
      async buscarPor(campo, valor) {
        if (!valor) return null
        const q = query(
          collection(db, 'clientes', clienteId, 'identidades'),
          where(campo, 'array-contains', valor),
          limit(1),
        )
        const snap = await getDocs(q)
        if (snap.empty) return null
        const d = snap.docs[0]
        return { ...(d.data() as Identidade), id: d.id }
      },
      async salvar(id, payload) {
        await setDoc(doc(db, 'clientes', clienteId, 'identidades', id), payload)
      },
      async apagar(id) {
        await deleteDoc(doc(db, 'clientes', clienteId, 'identidades', id))
      },
    },
    async gravarEvento(evento: Evento) {
      const limpo = JSON.parse(JSON.stringify(evento))
      const ref = await addDoc(collection(db, 'clientes', clienteId, 'eventos'), limpo)
      return ref.id
    },
    async gravarConversao(conversao: Omit<Conversao, 'id'>) {
      const limpo = JSON.parse(JSON.stringify(conversao))
      const ref = await addDoc(collection(db, 'clientes', clienteId, 'conversoes'), limpo)
      return ref.id
    },
  }
}
