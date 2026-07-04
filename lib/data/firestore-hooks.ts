'use client'

// ─── HOOKS GENÉRICOS FIRESTORE ────────────────────────────────────────────────
// Leitura em tempo real (onSnapshot) das subcoleções de um cliente.
// isDemo = coleção vazia → a tela usa o fallback de demonstração.

import { useEffect, useMemo, useState } from 'react'
import {
  collection, doc, onSnapshot, orderBy, query, limit as qLimit,
  type Query, type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SubcolecaoOpts {
  ordenarPor?: string
  desc?: boolean
  limite?: number
}

export function useSubcolecao<T>(
  clienteId: string | undefined,
  nome: string,
  opts?: SubcolecaoOpts,
) {
  const [docs, setDocs]       = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const ordenarPor = opts?.ordenarPor
  const desc       = opts?.desc ?? true
  const limite     = opts?.limite

  useEffect(() => {
    if (!clienteId) { setDocs([]); setLoading(false); return }
    setLoading(true)
    let q: Query<DocumentData> = collection(db, 'partners', clienteId, nome)
    if (ordenarPor) q = query(q, orderBy(ordenarPor, desc ? 'desc' : 'asc'))
    if (limite)     q = query(q, qLimit(limite))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
        setLoading(false)
      },
      () => { setDocs([]); setLoading(false) },
    )
    return unsub
  }, [clienteId, nome, ordenarPor, desc, limite])

  const isDemo = !loading && docs.length === 0
  return useMemo(() => ({ docs, loading, isDemo }), [docs, loading, isDemo])
}

export function useDocumento<T>(caminho: (string | undefined)[]) {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const chave = caminho.join('/')

  useEffect(() => {
    if (caminho.some((p) => !p)) { setData(null); setLoading(false); return }
    setLoading(true)
    const ref = doc(db, chave)
    const unsub = onSnapshot(
      ref,
      (snap) => { setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null); setLoading(false) },
      () => { setData(null); setLoading(false) },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  return { data, loading }
}
