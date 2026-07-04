'use client'

// ─── CLIENTES (partners/{id} no Firestore) + fallback demo ───────────────────
// Vocabulário da UI/rotas continua "cliente" — só o container no Firestore e
// os tipos internos usam "Partner" (nome herdado do schema definido pra essa
// coleção). Ver migração clientes→partners.

import { useEffect, useMemo, useState } from 'react'
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import type { Partner, PartnerTipo, EcommercePlataforma } from '@/lib/types'
import { clientesData as clientesDemo } from '@/lib/demo-data'
import { slugify } from '@/lib/utm/engine'

function gerarTrackingKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return 'v4tk_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Lista clientes reais do Firestore; se não houver nenhum, mostra os demo. */
export function useClientes() {
  const [reais, setReais]     = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'partners'),
      (snap) => {
        setReais(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Partner))
        setLoading(false)
      },
      () => { setReais([]); setLoading(false) },
    )
    return unsub
  }, [])

  const clientes = useMemo<Partner[]>(() => {
    // Assim que existir pelo menos um cliente real, os cards de demonstração
    // somem da lista — só voltam a aparecer se a base ficar vazia de novo.
    if (reais.length > 0) return reais
    return clientesDemo.map((c) => ({ ...c, demo: true }) as Partner)
  }, [reais])

  return { clientes, reais, loading }
}

/** Um cliente específico (real ou demo). */
export function useCliente(clienteId: string | undefined) {
  const [real, setReal]       = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clienteId) { setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'partners', clienteId),
      (snap) => {
        setReal(snap.exists() ? ({ id: snap.id, ...snap.data() } as Partner) : null)
        setLoading(false)
      },
      () => { setReal(null); setLoading(false) },
    )
    return unsub
  }, [clienteId])

  const demo = clientesDemo.find((c) => c.id === clienteId)
  const cliente: Partner | null = real ?? (demo ? ({ ...demo, demo: true } as Partner) : null)
  return { cliente, loading, isDemo: !real && !!demo }
}

export async function criarCliente(input: {
  nome: string
  segmento: string
  tipo: PartnerTipo
  ecommercePlataforma?: EcommercePlataforma
}): Promise<Partner> {
  const id = slugify(input.nome)
  const donoEmail = auth.currentUser?.email?.toLowerCase()
  const cliente: Partner = {
    id,
    nome: input.nome.trim(),
    segmento: input.segmento.trim(),
    tipo: input.tipo,
    status: 'ativo',
    trackingKey: gerarTrackingKey(),
    ...(input.tipo === 'ecommerce' && input.ecommercePlataforma ? { ecommercePlataforma: input.ecommercePlataforma } : {}),
    // Dono do token Meta usado no envio CAPI deste cliente — o gestor que o criou.
    ...(donoEmail ? { donoEmail } : {}),
    criadoEm: Date.now(),
  }
  await setDoc(doc(db, 'partners', id), { ...cliente, criadoEmServer: serverTimestamp() })

  // Garante que quem criou o cliente já é admin do partner (controle de acesso).
  if (donoEmail) {
    await setDoc(doc(db, 'partners', id, 'members', donoEmail), {
      email: donoEmail,
      role: 'admin',
      addedAt: Date.now(),
    })
  }

  return cliente
}

/**
 * Remove o cliente por completo (doc raiz + todas as subcoleções) via
 * /api/clientes/{id} — um deleteDoc() direto no client SDK não apaga
 * subcoleções e deixaria eventos/identidades/conversões órfãos.
 */
export async function excluirCliente(clienteId: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken()
  if (!idToken) throw new Error('sessão inválida — faça login novamente')

  const res = await fetch(`/api/clientes/${clienteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) {
    throw new Error(json.erro ?? 'falha ao remover cliente')
  }
}
