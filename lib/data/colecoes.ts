'use client'

// ─── HOOKS POR SUBCOLEÇÃO + escritas ─────────────────────────────────────────

import {
  addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useSubcolecao } from './firestore-hooks'
import type {
  Evento, Identidade, UTMRegistro, Conversao, Integration, IntegrationPlataforma, Insight,
  PlanoMidiaItem, PlanoMidiaConfigMes, KpiMetasDoc, KpiMetaConfig, KpiStatusDoc, KpiViolacao,
  GoogleAdsCampanha,
} from '@/lib/types'
import type { GrowthPackCanal } from './agregacoes'

// ── Eventos ───────────────────────────────────────────────────────────────────
// Filtra pelo corte de dados (partners/{id}.dadosIgnoradosAte) e por
// visitantes marcados "desconsiderar" (identidadesDesconsideradas) —
// centralizado aqui pra nenhum consumidor (Growth Pack, Performance, Agente
// IA, alertas) precisar lembrar de aplicar esses filtros na mão.
function useFiltrosEventos(clienteId: string | undefined) {
  const [corte, setCorte] = useState<number | null>(null)
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!clienteId) { setCorte(null); setExcluidos(new Set()); return }
    const unsub = onSnapshot(
      doc(db, 'partners', clienteId),
      (snap) => {
        setCorte(snap.data()?.dadosIgnoradosAte ?? null)
        setExcluidos(new Set((snap.data()?.identidadesDesconsideradas as string[] | undefined) ?? []))
      },
      () => { setCorte(null); setExcluidos(new Set()) },
    )
    return unsub
  }, [clienteId])
  return { corte, excluidos }
}

// `desde` limita a query no próprio servidor (where ts >= desde) — sem isso,
// um cliente de alto volume estoura o `limite` antes de alcançar o período
// que a tela pediu, e o filtro de data (30/90 dias etc.) fica silenciosamente
// truncado no mesmo teto de "hoje" (bug real, achado testando Hanoi Editora).
//
// Busca via /api/eventos (servidor, firebase-admin) em vez de onSnapshot
// direto do navegador — achado ao vivo (2026-08, testando com o Gabriel):
// em algumas máquinas/redes, o canal de tempo real do Firestore no
// navegador entra em loop de reconexão e nunca entrega o primeiro
// snapshot, mesmo com dado real existindo (confirmado: um listener em
// tempo real via admin SDK, fora do navegador, conecta normal na mesma
// máquina). Uma chamada HTTP simples não sofre desse problema. Perde a
// atualização instantânea de antes — reforçado com um poll leve.
const POLL_MS = 30_000

export function useEventos(clienteId: string | undefined, opts?: { limite?: number; desde?: number }) {
  const [docs, setDocs] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const limite = opts?.limite ?? 2000
  const desde = opts?.desde

  const buscar = useCallback(async (cancelRef: { cancelado: boolean }) => {
    if (!clienteId) { setDocs([]); setLoading(false); return }
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return
      const qs = new URLSearchParams({ limite: String(limite) })
      if (desde !== undefined) qs.set('desde', String(desde))
      const res = await fetch(`/api/eventos/${clienteId}?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const json = await res.json()
      if (cancelRef.cancelado) return
      setDocs(json.ok ? (json.eventos as Evento[]) : [])
    } catch {
      if (!cancelRef.cancelado) setDocs([])
    } finally {
      if (!cancelRef.cancelado) setLoading(false)
    }
  }, [clienteId, limite, desde])

  useEffect(() => {
    const cancelRef = { cancelado: false }
    setLoading(true)
    buscar(cancelRef)
    const intervalo = setInterval(() => buscar(cancelRef), POLL_MS)
    return () => { cancelRef.cancelado = true; clearInterval(intervalo) }
  }, [buscar])

  const { corte, excluidos } = useFiltrosEventos(clienteId)
  const eventos = useMemo(
    () => docs.filter((e) => (!corte || e.ts > corte) && !excluidos.has(e.visitorId)),
    [docs, corte, excluidos],
  )
  const isDemo = !loading && eventos.length === 0
  return { eventos, loading, isDemo }
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
    ativo: utm.ativo ?? true,
    criadoEmServer: serverTimestamp(),
  })
}

/** Liga/desliga uma UTM sem apagar — Detectadas usa isso pra saber quais UTMs em campo estão em uso. */
export async function alternarAtivaUTM(clienteId: string, utmId: string, ativo: boolean) {
  await updateDoc(doc(db, 'partners', clienteId, 'utms', utmId), { ativo })
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

// ── Metas de KPI (Gestor de Mídia) — doc único partners/{id}/kpi_metas/config ──
export function useKpiMetas(clienteId: string | undefined) {
  const [metas, setMetas] = useState<KpiMetasDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clienteId) { setMetas(null); setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'partners', clienteId, 'kpi_metas', 'config'),
      (snap) => { setMetas(snap.exists() ? (snap.data() as KpiMetasDoc) : null); setLoading(false) },
      () => { setMetas(null); setLoading(false) },
    )
    return unsub
  }, [clienteId])

  return { metas, loading }
}

export async function salvarKpiMetas(clienteId: string, canal: GrowthPackCanal, metas: Record<string, KpiMetaConfig>) {
  await setDoc(doc(db, 'partners', clienteId, 'kpi_metas', 'config'), { [canal]: metas, atualizadoEm: Date.now() }, { merge: true })
}

// ── Status de KPI (Gestor de Mídia) — doc único partners/{id}/kpi_status/atual ─
// Só é ESCRITO quando o gestor abre a aba "Metas & Alertas" (não em toda
// página) — o sino de notificações só lê este doc.
export function useKpiStatus(clienteId: string | undefined) {
  const [status, setStatus] = useState<KpiStatusDoc | null>(null)

  useEffect(() => {
    if (!clienteId) { setStatus(null); return }
    const unsub = onSnapshot(
      doc(db, 'partners', clienteId, 'kpi_status', 'atual'),
      (snap) => setStatus(snap.exists() ? (snap.data() as KpiStatusDoc) : null),
      () => setStatus(null),
    )
    return unsub
  }, [clienteId])

  return { status }
}

export async function salvarKpiStatus(
  clienteId: string,
  dados: { geral: KpiViolacao[]; meta: KpiViolacao[]; google: KpiViolacao[]; periodoLabel: string },
) {
  await setDoc(doc(db, 'partners', clienteId, 'kpi_status', 'atual'), { ...dados, atualizadoEm: Date.now() }, { merge: true })
}

// ── Campanhas de Google Ads (Gestor de Mídia) — partners/{id}/google_ads_campanhas ─
export function useGoogleAdsCampanhas(clienteId: string | undefined) {
  const { docs, loading } = useSubcolecao<GoogleAdsCampanha & { id: string }>(clienteId, 'google_ads_campanhas')
  return { campanhas: docs, loading }
}

export async function salvarGoogleAdsCampanha(clienteId: string, campanha: GoogleAdsCampanha & { id?: string }) {
  const { id, ...dados } = campanha
  const ref = id
    ? doc(db, 'partners', clienteId, 'google_ads_campanhas', id)
    : doc(collection(db, 'partners', clienteId, 'google_ads_campanhas'))
  await setDoc(ref, { ...dados, atualizadoEm: Date.now() }, { merge: true })
  return ref.id
}

export async function excluirGoogleAdsCampanha(clienteId: string, campanhaId: string) {
  await deleteDoc(doc(db, 'partners', clienteId, 'google_ads_campanhas', campanhaId))
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
