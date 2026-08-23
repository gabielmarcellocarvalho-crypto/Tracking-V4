'use client'

// ─── HOOKS POR SUBCOLEÇÃO + escritas ─────────────────────────────────────────

import {
  addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
// máquina). Uma chamada HTTP simples não sofre desse problema.
//
// SEM polling em intervalo fixo (removido em 2026-08, orçamento do
// Firestore é 50 mil leituras/dia pro projeto INTEIRO, com vários clientes
// conectados ao mesmo tempo). Um poll a cada 5min, por aba aberta, é o que
// já causou dois incidentes de estouro de cota antes (onSnapshot→poll
// primeiro, depois um bug de loop) — em vez de só espaçar mais o intervalo,
// a decisão agora é: busca só quando precisa (ao montar/trocar de
// cliente/filtro, e ao reabrir o foco na aba depois de ficar em segundo
// plano). Sem timer nenhum rodando em background.

// Arredonda pro bucket de 5 min mais próximo — protege contra o caller
// passar `Date.now() - X` direto no corpo do render (ex: DashboardHeader
// fazia isso pro "últimos 7 dias" do sino de alertas). Sem isso, `desde`
// é um número levemente diferente a cada render, `buscar` (useCallback)
// vira uma função nova a cada render, e o efeito refaz o fetch em loop —
// achado ao vivo: isso sozinho gerou 700+ chamadas em 5 minutos e estourou
// a cota de leitura do Firestore (RESOURCE_EXHAUSTED), horas depois do
// fix anterior de polling. Arredondar aqui protege QUALQUER caller atual
// ou futuro que cometa o mesmo erro, não só o que já foi corrigido.
const BUCKET_MS = 5 * 60_000

// Teto absoluto de documentos por chamada, não importa o que o caller peça —
// protege o orçamento de 50 mil leituras/dia do projeto contra qualquer
// cliente de alto volume (atual ou futuro) sozinho consumindo o dia inteiro
// numa única página. Espelha o teto do servidor (LIMITE_MAXIMO em
// app/api/eventos/[clienteId]/route.ts) — os dois precisam ficar em sincronia.
const MAX_LIMITE = 5000

// Refetch ao voltar o foco na aba não repete se já buscou há pouco tempo —
// protege contra alt-tab repetido gerando chamada atrás de chamada.
const REFETCH_MIN_INTERVALO_MS = 60_000

// Cache curto em memória (por aba, morre no F5) compartilhado entre TODOS os
// useEventos da página — navegar entre Eventos→Performance→Jornada do MESMO
// cliente, com o mesmo filtro de data, cai na mesma chave e reaproveita a
// última busca em vez de ler o Firestore de novo. Achado com o Gabriel: 10
// clientes × algumas idas e vindas por dia sem isso passava fácil dos 50 mil
// de orçamento diário, mesmo sem nenhum bug de loop — é só navegação normal
// em escala. TTL curto (2min) pra não deixar o dado velho demais.
const CACHE_TTL_MS = 2 * 60_000
const cacheEventos = new Map<string, { docs: Evento[]; ts: number }>()

export function useEventos(clienteId: string | undefined, opts?: { limite?: number; desde?: number }) {
  const [docs, setDocs] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const limite = Math.min(opts?.limite ?? 2000, MAX_LIMITE)
  const desde = opts?.desde !== undefined ? Math.floor(opts.desde / BUCKET_MS) * BUCKET_MS : undefined
  const ultimaBuscaRef = useRef(0)

  const buscar = useCallback(async (cancelRef: { cancelado: boolean }) => {
    if (!clienteId) { setDocs([]); setLoading(false); return }
    const chaveCache = `${clienteId}:${limite}:${desde ?? ''}`
    const emCache = cacheEventos.get(chaveCache)
    if (emCache && Date.now() - emCache.ts < CACHE_TTL_MS) {
      setDocs(emCache.docs)
      setLoading(false)
      return
    }
    try {
      ultimaBuscaRef.current = Date.now()
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return
      const qs = new URLSearchParams({ limite: String(limite) })
      if (desde !== undefined) qs.set('desde', String(desde))
      const res = await fetch(`/api/eventos/${clienteId}?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const json = await res.json()
      if (cancelRef.cancelado) return
      const eventos = json.ok ? (json.eventos as Evento[]) : []
      setDocs(eventos)
      if (json.ok) cacheEventos.set(chaveCache, { docs: eventos, ts: Date.now() })
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
    // Sem polling em intervalo fixo — só busca de novo quando a aba volta a
    // ficar visível (e só se a última busca já não foi há menos de 1min).
    const aoFocar = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaBuscaRef.current > REFETCH_MIN_INTERVALO_MS) {
        buscar(cancelRef)
      }
    }
    document.addEventListener('visibilitychange', aoFocar)
    return () => {
      cancelRef.cancelado = true
      document.removeEventListener('visibilitychange', aoFocar)
    }
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
