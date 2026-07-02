'use client'

// ─── HOOKS POR SUBCOLEÇÃO + escritas ─────────────────────────────────────────

import {
  addDoc, collection, doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSubcolecao } from './firestore-hooks'
import type {
  Evento, Identidade, UTMRegistro, Conversao, Conexao, ConexaoPlataforma, Insight,
} from '@/lib/types'

// ── Eventos ───────────────────────────────────────────────────────────────────
export function useEventos(clienteId: string | undefined, limite = 2000) {
  const { docs, loading, isDemo } = useSubcolecao<Evento>(clienteId, 'eventos', {
    ordenarPor: 'ts', desc: true, limite,
  })
  return { eventos: docs, loading, isDemo }
}

// ── Identidades (jornadas) ────────────────────────────────────────────────────
export function useIdentidades(clienteId: string | undefined, limite = 500) {
  const { docs, loading, isDemo } = useSubcolecao<Identidade>(clienteId, 'identidades', {
    ordenarPor: 'atualizadoEm', desc: true, limite,
  })
  return { identidades: docs, loading, isDemo }
}

// ── UTMs geradas ──────────────────────────────────────────────────────────────
export function useUTMs(clienteId: string | undefined) {
  const { docs, loading, isDemo } = useSubcolecao<UTMRegistro>(clienteId, 'utms', {
    ordenarPor: 'criadoEm', desc: true, limite: 500,
  })
  return { utms: docs, loading, isDemo }
}

export async function salvarUTM(clienteId: string, utm: Omit<UTMRegistro, 'id'>) {
  await addDoc(collection(db, 'clientes', clienteId, 'utms'), {
    ...utm,
    criadoEmServer: serverTimestamp(),
  })
}

// ── Conversões ────────────────────────────────────────────────────────────────
export function useConversoes(clienteId: string | undefined) {
  const { docs, loading, isDemo } = useSubcolecao<Conversao>(clienteId, 'conversoes', {
    ordenarPor: 'ts', desc: true, limite: 500,
  })
  return { conversoes: docs, loading, isDemo }
}

// ── Conexões ──────────────────────────────────────────────────────────────────
export function useConexoes(clienteId: string | undefined) {
  const { docs, loading } = useSubcolecao<Conexao & { id: string }>(clienteId, 'conexoes')
  return { conexoes: docs, loading }
}

export async function salvarConexao(
  clienteId: string,
  plataforma: ConexaoPlataforma,
  campos: Record<string, string>,
) {
  const preenchida = Object.values(campos).some((v) => v?.trim())
  const conexao: Conexao = {
    plataforma,
    status: preenchida ? 'configurado' : 'desconectado',
    campos,
    atualizadoEm: Date.now(),
  }
  await setDoc(doc(db, 'clientes', clienteId, 'conexoes', plataforma), conexao)
}

// ── Insights ──────────────────────────────────────────────────────────────────
export function useInsights(clienteId: string | undefined) {
  const { docs, loading, isDemo } = useSubcolecao<Insight>(clienteId, 'insights', {
    ordenarPor: 'criadoEm', desc: true, limite: 100,
  })
  return { insights: docs, loading, isDemo }
}

export async function salvarInsight(clienteId: string, insight: Omit<Insight, 'id'>) {
  await addDoc(collection(db, 'clientes', clienteId, 'insights'), insight)
}
