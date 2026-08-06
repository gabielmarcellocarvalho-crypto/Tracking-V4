'use client'

// ─── HOOKS POR SUBCOLEÇÃO + escritas ─────────────────────────────────────────

import {
  addDoc, collection, deleteDoc, doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSubcolecao } from './firestore-hooks'
import type {
  Evento, Identidade, UTMRegistro, Conversao, Integration, IntegrationPlataforma, Insight,
  PlanoMidiaItem, PlanoMidiaConfigMes,
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
  await addDoc(collection(db, 'partners', clienteId, 'utms'), {
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

// ── Conexões (partners/{id}/integrations/{plataforma}) ────────────────────────
export function useConexoes(clienteId: string | undefined) {
  const { docs, loading } = useSubcolecao<Integration & { id: string }>(clienteId, 'integrations')
  return { conexoes: docs, loading }
}

export async function salvarConexao(
  clienteId: string,
  plataforma: IntegrationPlataforma,
  campos: Record<string, string>,
) {
  const preenchida = Object.values(campos).some((v) => v?.trim())
  const conexao: Integration = {
    plataforma,
    status: preenchida ? 'configurado' : 'desconectado',
    campos,
    atualizadoEm: Date.now(),
  }
  await setDoc(doc(db, 'partners', clienteId, 'integrations', plataforma), conexao)
}

// ── Plano de Mídia (Gestor de Mídia) — partners/{id}/plano_midia/{itemId} ──────
export function usePlanoMidia(clienteId: string | undefined) {
  const { docs, loading } = useSubcolecao<PlanoMidiaItem & { id: string }>(clienteId, 'plano_midia')
  return { itens: docs, loading }
}

export async function salvarPlanoMidiaItem(clienteId: string, item: PlanoMidiaItem & { id?: string }) {
  const { id, ...dados } = item
  // Firestore rejeita setDoc com qualquer campo `undefined` (erro silencioso
  // pra quem chama sem .catch) — remove essas chaves antes de gravar, em vez
  // de depender de todo caller nunca passar um campo opcional vazio.
  const limpo = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined))
  const ref = id
    ? doc(db, 'partners', clienteId, 'plano_midia', id)
    : doc(collection(db, 'partners', clienteId, 'plano_midia'))
  await setDoc(ref, { ...limpo, atualizadoEm: Date.now() }, { merge: true })
}

export async function excluirPlanoMidiaItem(clienteId: string, itemId: string) {
  await deleteDoc(doc(db, 'partners', clienteId, 'plano_midia', itemId))
}

// Config por mês — partners/{id}/plano_midia_config/{AAAA-MM}
export function usePlanoMidiaConfig(clienteId: string | undefined) {
  const { docs, loading } = useSubcolecao<PlanoMidiaConfigMes & { id: string }>(clienteId, 'plano_midia_config')
  return { config: docs, loading }
}

export async function salvarPlanoMidiaConfigMes(clienteId: string, mes: string, dados: Omit<PlanoMidiaConfigMes, 'mes'>) {
  await setDoc(doc(db, 'partners', clienteId, 'plano_midia_config', mes), { mes, ...dados }, { merge: true })
}

// ── Insights ──────────────────────────────────────────────────────────────────
export function useInsights(clienteId: string | undefined) {
  const { docs, loading, isDemo } = useSubcolecao<Insight>(clienteId, 'insights', {
    ordenarPor: 'criadoEm', desc: true, limite: 100,
  })
  return { insights: docs, loading, isDemo }
}

export async function salvarInsight(clienteId: string, insight: Omit<Insight, 'id'>) {
  await addDoc(collection(db, 'partners', clienteId, 'insights'), insight)
}
