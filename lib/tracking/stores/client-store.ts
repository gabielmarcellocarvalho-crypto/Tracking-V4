// ─── STORE DE INGESTÃO — SDK CLIENT ──────────────────────────────────────────
// Usado por /api/track (ingestão via snippet v4track.js, sem sessão de
// usuário — mesma exposição pública que já existia antes da extração).

import {
  addDoc, collection, doc, getDocs, query, where, limit,
  setDoc, deleteDoc, increment,
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
          collection(db, 'partners', clienteId, 'identidades'),
          where(campo, 'array-contains', valor),
          limit(1),
        )
        const snap = await getDocs(q)
        if (snap.empty) return null
        const d = snap.docs[0]
        return { ...(d.data() as Identidade), id: d.id }
      },
      async salvar(id, payload) {
        await setDoc(doc(db, 'partners', clienteId, 'identidades', id), payload)
      },
      async apagar(id) {
        await deleteDoc(doc(db, 'partners', clienteId, 'identidades', id))
      },
    },
    async gravarEvento(evento: Evento) {
      const limpo = JSON.parse(JSON.stringify(evento))
      const ref = await addDoc(collection(db, 'partners', clienteId, 'eventos'), limpo)
      return ref.id
    },
    async gravarConversao(conversao: Omit<Conversao, 'id'>) {
      const limpo = JSON.parse(JSON.stringify(conversao))
      const ref = await addDoc(collection(db, 'partners', clienteId, 'conversoes'), limpo)
      return ref.id
    },
    async incrementarStats(evento: Evento) {
      const dia = new Date(evento.ts).toISOString().slice(0, 10)
      const incremento: Record<string, unknown> = { [evento.tipo]: increment(1) }
      if (evento.tipo === 'compra' && evento.valor) incremento.receita = increment(evento.valor)
      await Promise.all([
        setDoc(doc(db, 'partners', clienteId, 'stats', dia), incremento, { merge: true }),
        setDoc(doc(db, 'partners', clienteId, 'stats', 'ultimo'), { [evento.tipo]: evento.ts }, { merge: true }),
      ])
    },
  }
}
