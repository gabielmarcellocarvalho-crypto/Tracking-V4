'use client'

// ─── GASTO REAL DO META ADS (por cliente + período) ──────────────────────────
// Chama /api/meta/ads-insights/{clienteId}, que resolve o token (próprio do
// cliente ou compartilhado da BM) e busca o gasto diário na Marketing API.

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import type { DateRange } from '@/components/tracking/DateRangePicker'

export interface MetricasAdsDia { spend: number; reach: number; clicks: number }

export interface GastoMetaAds {
  porData: Map<string, MetricasAdsDia> // 'YYYY-MM-DD' → métricas do dia
  total: MetricasAdsDia
}

interface RespostaApi {
  ok: boolean
  configurado?: boolean
  gastoPorDia?: { data: string; spend: number; reach: number; clicks: number }[]
  erro?: string
}

function toYMD(d: Date) { return d.toISOString().slice(0, 10) }

export function useMetaAdsGasto(clienteId: string | undefined, periodo: DateRange) {
  const [gasto, setGasto] = useState<GastoMetaAds | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clienteId) { setGasto(null); setErro(null); return }
    let cancelado = false

    const buscar = async () => {
      setLoading(true)
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) return
        const qs = new URLSearchParams({ start: toYMD(periodo.start), end: toYMD(periodo.end) })
        const res = await fetch(`/api/meta/ads-insights/${clienteId}?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const json: RespostaApi = await res.json()
        if (cancelado) return

        if (!json.ok) {
          setGasto(null)
          setErro(json.configurado ? (json.erro ?? 'falha ao buscar gasto do Meta Ads') : null)
          return
        }
        const porData = new Map<string, MetricasAdsDia>()
        const total: MetricasAdsDia = { spend: 0, reach: 0, clicks: 0 }
        for (const l of json.gastoPorDia ?? []) {
          const dia: MetricasAdsDia = { spend: l.spend, reach: l.reach, clicks: l.clicks }
          porData.set(l.data, dia)
          total.spend += dia.spend; total.reach += dia.reach; total.clicks += dia.clicks
        }
        setGasto({ porData, total })
        setErro(null)
      } catch {
        if (!cancelado) { setGasto(null); setErro('falha de rede ao buscar gasto do Meta Ads') }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [clienteId, periodo.start, periodo.end])

  return { gasto, erro, loading }
}
