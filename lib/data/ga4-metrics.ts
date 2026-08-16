'use client'

// ─── PAGE VIEWS REAIS DO GA4 (por cliente + período) ─────────────────────────
// Chama /api/ga4/insights/{clienteId}, que lê a service account de Conexões e
// busca screenPageViews diário na Data API. GA4 prevalece sobre o snippet
// quando conectado (ver agregarSaudeEventos/agregarVolume7Dias).

import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import type { DateRange } from '@/components/tracking/DateRangePicker'

export interface GA4SessoesDia {
  data: string
  sessions: number
  engagedSessions: number
  totalUsers: number
  screenPageViews: number
}

export interface GA4SessoesPorCanal {
  canal: string
  sessions: number
}

export interface GA4Dados {
  porData: Map<string, number> // 'YYYY-MM-DD' → screenPageViews (usado pela tela de Eventos)
  sessoesPorDia: GA4SessoesDia[]
  sessoesPorCanal: GA4SessoesPorCanal[]
}

interface RespostaApi {
  ok: boolean
  configurado?: boolean
  pageViewsPorDia?: { data: string; screenPageViews: number }[]
  sessoesPorDia?: GA4SessoesDia[]
  sessoesPorCanal?: GA4SessoesPorCanal[]
  erro?: string
}

function toYMD(d: Date) { return d.toISOString().slice(0, 10) }

export function useGA4Dados(clienteId: string | undefined, periodo: DateRange) {
  const [dados, setDados] = useState<GA4Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!clienteId) { setDados(null); setErro(null); return }
    let cancelado = false

    const buscar = async () => {
      setLoading(true)
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) return
        const qs = new URLSearchParams({ start: toYMD(periodo.start), end: toYMD(periodo.end) })
        const res = await fetch(`/api/ga4/insights/${clienteId}?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const json: RespostaApi = await res.json()
        if (cancelado) return

        if (!json.ok) {
          setDados(null)
          setErro(json.configurado ? (json.erro ?? 'falha ao buscar page views do GA4') : null)
          return
        }
        const porData = new Map<string, number>()
        for (const l of json.pageViewsPorDia ?? []) porData.set(l.data, l.screenPageViews)
        setDados({ porData, sessoesPorDia: json.sessoesPorDia ?? [], sessoesPorCanal: json.sessoesPorCanal ?? [] })
        setErro(null)
        setUltimaAtualizacao(new Date())
      } catch {
        if (!cancelado) { setDados(null); setErro('falha de rede ao buscar page views do GA4') }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    buscar()
    return () => { cancelado = true }
    // periodo.start/end são objetos Date novos a cada render do contexto de
    // período -- usar o objeto direto no dependency array reexecutava o
    // efeito (e rebuscava) em loop infinito, mesmo com a mesma data
    // selecionada. getTime() vira um número primitivo estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, periodo.start.getTime(), periodo.end.getTime(), versao])

  const refetch = useCallback(() => setVersao((v) => v + 1), [])

  return { dados, erro, loading, ultimaAtualizacao, refetch }
}
