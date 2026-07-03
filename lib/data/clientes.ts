'use client'

// ─── CLIENTES — Firestore + fallback demo ────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import type { Cliente, ClienteTipo } from '@/lib/types'
import { clientesData as clientesDemo } from '@/lib/demo-data'
import { slugify } from '@/lib/utm/engine'

function gerarTrackingKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return 'v4tk_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Lista clientes reais do Firestore; se não houver nenhum, mostra os demo. */
export function useClientes() {
  const [reais, setReais]     = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'clientes'),
      (snap) => {
        setReais(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cliente))
        setLoading(false)
      },
      () => { setReais([]); setLoading(false) },
    )
    return unsub
  }, [])

  const clientes = useMemo<Cliente[]>(() => {
    // Assim que existir pelo menos um cliente real, os cards de demonstração
    // somem da lista — só voltam a aparecer se a base ficar vazia de novo.
    if (reais.length > 0) return reais
    return clientesDemo.map((c) => ({ ...c, demo: true }) as Cliente)
  }, [reais])

  return { clientes, reais, loading }
}

/** Um cliente específico (real ou demo). */
export function useCliente(clienteId: string | undefined) {
  const [real, setReal]       = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clienteId) { setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'clientes', clienteId),
      (snap) => {
        setReal(snap.exists() ? ({ id: snap.id, ...snap.data() } as Cliente) : null)
        setLoading(false)
      },
      () => { setReal(null); setLoading(false) },
    )
    return unsub
  }, [clienteId])

  const demo = clientesDemo.find((c) => c.id === clienteId)
  const cliente: Cliente | null = real ?? (demo ? ({ ...demo, demo: true } as Cliente) : null)
  return { cliente, loading, isDemo: !real && !!demo }
}

export async function criarCliente(input: {
  nome: string
  segmento: string
  tipo: ClienteTipo
}): Promise<Cliente> {
  const id = slugify(input.nome)
  const donoEmail = auth.currentUser?.email?.toLowerCase()
  const cliente: Cliente = {
    id,
    nome: input.nome.trim(),
    segmento: input.segmento.trim(),
    tipo: input.tipo,
    status: 'ativo',
    trackingKey: gerarTrackingKey(),
    // Dono do token Meta usado no envio CAPI deste cliente — o gestor que o criou.
    ...(donoEmail ? { donoEmail } : {}),
    criadoEm: Date.now(),
  }
  await setDoc(doc(db, 'clientes', id), { ...cliente, criadoEmServer: serverTimestamp() })
  return cliente
}

export async function excluirCliente(clienteId: string): Promise<void> {
  await deleteDoc(doc(db, 'clientes', clienteId))
}
