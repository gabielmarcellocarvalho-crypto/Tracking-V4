'use client'

// ─── GASTO REAL DO GOOGLE ADS (por cliente + período) ────────────────────────
// Chama /api/google-ads/ads-insights/{clienteId}, que usa as credenciais
// compartilhadas da MCC (env) e busca o gasto diário na Google Ads API.

import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import type { DateRange } from '@/components/tracking/DateRangePicker'

export interface MetricasAdsDiaGoogle { spend: number; impressions: number; clicks: number }

export interface GastoGoogleAds {
  porData: Map<string, MetricasAdsDiaGoogle>
  total: MetricasAdsDiaGoogle
}

interface RespostaApi {
  ok: boolean
  configurado?: boolean
  gastoPorDia?: { data: string; spend: number; impressions: number; clicks: number }[]
  erro?: string
}

function toYMD(d: Date) { return d.toISOString().slice(0, 10) }

export function useGoogleAdsGasto(clienteId: string | undefined, periodo: DateRange) {
  const [gasto, setGasto] = useState<GastoGoogleAds | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!clienteId) { setGasto(null); setErro(null); return }
    let cancelado = false

    const buscar = async () => {
      setLoading(true)
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) return
        const qs = new URLSearchParams({ start: toYMD(periodo.start), end: toYMD(periodo.end) })
        const res = await fetch(`/api/google-ads/ads-insights/${clienteId}?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const json: RespostaApi = await res.json()
        if (cancelado) return

        if (!json.ok) {
          setGasto(null)
          setErro(json.configurado ? (json.erro ?? 'falha ao buscar gasto do Google Ads') : null)
          return
        }
        const porData = new Map<string, MetricasAdsDiaGoogle>()
        const total: MetricasAdsDiaGoogle = { spend: 0, impressions: 0, clicks: 0 }
        for (const l of json.gastoPorDia ?? []) {
          const dia: MetricasAdsDiaGoogle = { spend: l.spend, impressions: l.impressions, clicks: l.clicks }
          porData.set(l.data, dia)
          total.spend += dia.spend; total.impressions += dia.impressions; total.clicks += dia.clicks
        }
        setGasto({ porData, total })
        setErro(null)
        setUltimaAtualizacao(new Date())
      } catch {
        if (!cancelado) { setGasto(null); setErro('falha de rede ao buscar gasto do Google Ads') }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [clienteId, periodo.start, periodo.end, versao])

  const refetch = useCallback(() => setVersao((v) => v + 1), [])

  return { gasto, erro, loading, ultimaAtualizacao, refetch }
}
