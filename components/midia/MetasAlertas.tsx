'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ClienteTipo } from '@/lib/demo-data'
import { useDateRange } from '@/lib/date-range-context'
import { useMetaAdsGasto } from '@/lib/data/meta-ads-metrics'
import { useGoogleAdsGasto } from '@/lib/data/google-ads-metrics'
import { useKpiMetas, salvarKpiMetas, salvarKpiStatus } from '@/lib/data/colecoes'
import type { GrowthPackCanal } from '@/lib/data/agregacoes'
import { kpisDoTipo, calcularKpisEcommerce, calcularKpisLeads, formatarKpi } from '@/lib/data/kpis'
import type { KpiMetaConfig, KpiViolacao } from '@/lib/types'

const CANAIS: { key: GrowthPackCanal; label: string }[] = [
  { key: 'geral',  label: 'Geral' },
  { key: 'meta',   label: 'Meta' },
  { key: 'google', label: 'Google' },
]

interface Props {
  clienteId: string
  clienteTipo?: ClienteTipo
  isDemo: boolean
}

export default function MetasAlertas({ clienteId, clienteTipo, isDemo }: Props) {
  const { range: periodo } = useDateRange()
  const [canal, setCanal] = useState<GrowthPackCanal>('geral')

  const { gasto: metaGasto, loading: loadingMeta } = useMetaAdsGasto(isDemo ? undefined : clienteId, periodo)
  const { gasto: googleGasto, loading: loadingGoogle } = useGoogleAdsGasto(isDemo ? undefined : clienteId, periodo)
  const { metas: metasSalvas } = useKpiMetas(isDemo ? undefined : clienteId)

  const catalogo = kpisDoTipo(clienteTipo)
  const ehEcommerce = clienteTipo === 'ecommerce' || !clienteTipo

  // Insumos (spend/impressões/cliques/funil) por canal, a partir dos totais
  // reais de Ads no período universal selecionado. 'geral' soma Meta + Google
  // — impressão e clique são sempre aditivos entre plataformas (sem risco de
  // dupla contagem, diferente de conversão).
  const insumosPorCanal = useMemo(() => {
    const m = metaGasto?.total
    const g = googleGasto?.total
    const somar = (campo: 'spend' | 'impressions' | 'clicks' | 'addToCart' | 'checkout' | 'purchase' | 'faturamento') =>
      (m?.[campo] ?? 0) + (g?.[campo] ?? 0)
    return {
      geral: {
        investimento: somar('spend'), impressoes: somar('impressions'), cliques: somar('clicks'),
        addToCart: somar('addToCart'), checkout: somar('checkout'), purchase: somar('purchase'), faturamento: somar('faturamento'),
      },
      meta: {
        investimento: m?.spend ?? 0, impressoes: m?.impressions ?? 0, cliques: m?.clicks ?? 0,
        addToCart: m?.addToCart ?? 0, checkout: m?.checkout ?? 0, purchase: m?.purchase ?? 0, faturamento: m?.faturamento ?? 0,
      },
      google: {
        investimento: g?.spend ?? 0, impressoes: g?.impressions ?? 0, cliques: g?.clicks ?? 0,
        addToCart: g?.addToCart ?? 0, checkout: g?.checkout ?? 0, purchase: g?.purchase ?? 0, faturamento: g?.faturamento ?? 0,
      },
    }
  }, [metaGasto, googleGasto])

  const kpisPorCanal = useMemo(() => {
    const calc = ehEcommerce ? calcularKpisEcommerce : calcularKpisLeads
    return { geral: calc(insumosPorCanal.geral), meta: calc(insumosPorCanal.meta), google: calc(insumosPorCanal.google) }
  }, [insumosPorCanal, ehEcommerce])

  // Único ponto que ESCREVE o status pro sino — recalcula os 3 canais de uma
  // vez sempre que os dados de Ads ou as metas salvas mudam, pra não deixar o
  // sino desatualizado enquanto o gestor está com esta aba aberta.
  useEffect(() => {
    if (isDemo || !metasSalvas) return
    const violacoesDoCanal = (c: GrowthPackCanal): KpiViolacao[] => {
      const metasCanal = metasSalvas[c] ?? {}
      const valores = kpisPorCanal[c]
      const violacoes: KpiViolacao[] = []
      for (const kpi of catalogo) {
        const cfg = metasCanal[kpi.key]
        if (!cfg?.ativo) continue
        const atual = valores[kpi.key] ?? 0
        const violou = kpi.direcao === 'min' ? atual < cfg.valor : atual > cfg.valor
        if (violou) violacoes.push({ key: kpi.key, label: kpi.label, valorAtual: atual, meta: cfg.valor, direcao: kpi.direcao, formato: kpi.formato })
      }
      return violacoes
    }
    salvarKpiStatus(clienteId, {
      geral: violacoesDoCanal('geral'), meta: violacoesDoCanal('meta'), google: violacoesDoCanal('google'),
      periodoLabel: periodo.label,
    }).catch(() => {})
  }, [clienteId, isDemo, metasSalvas, kpisPorCanal, catalogo, periodo.label])

  // Edição local do canal exibido — sincroniza com o que está salvo ao trocar
  // de canal, sem sobrescrever digitação em andamento por outros motivos.
  const [edicao, setEdicao] = useState<Record<string, KpiMetaConfig>>({})
  useEffect(() => {
    const base: Record<string, KpiMetaConfig> = {}
    for (const kpi of catalogo) base[kpi.key] = metasSalvas?.[canal]?.[kpi.key] ?? { ativo: false, valor: 0 }
    setEdicao(base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, metasSalvas])

  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const salvar = async () => {
    setSalvando(true)
    try {
      await salvarKpiMetas(clienteId, canal, edicao)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } finally {
      setSalvando(false)
    }
  }

  const carregando = loadingMeta || loadingGoogle
  const valoresCanal = kpisPorCanal[canal]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDemo && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 12.5, color: 'var(--t2)' }}>
          Cliente demo — metas de KPI disponíveis só pra clientes reais.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
          Valores calculados no período <strong style={{ color: 'var(--t2)' }}>{periodo.label}</strong> — quando uma métrica monitorada sair do aceitável, ela aparece no sino de notificações.
        </p>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, background: 'var(--bg-c)', border: '1px solid var(--br)' }}>
          {CANAIS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCanal(c.key)}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: canal === c.key ? 'var(--red)' : 'transparent',
                color: canal === c.key ? '#fff' : 'var(--t2)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['KPI', 'Direção', `Valor atual (${carregando ? '…' : periodo.label})`, 'Monitorar', 'Valor aceitável'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: i === 0 ? 'left' : 'center', fontSize: '9.5px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', borderBottom: '1px solid var(--br)', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalogo.map((kpi) => {
              const cfg = edicao[kpi.key] ?? { ativo: false, valor: 0 }
              const atual = valoresCanal[kpi.key] ?? 0
              const emViolacao = cfg.ativo && (kpi.direcao === 'min' ? atual < cfg.valor : atual > cfg.valor)
              return (
                <tr key={kpi.key} style={{ background: emViolacao ? 'rgba(239,68,68,.05)' : 'transparent' }}>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: 'var(--t1)', fontWeight: 600, borderBottom: '1px solid var(--br)' }}>
                    {kpi.label}
                    {emViolacao && (
                      <span title="Fora da meta configurada" style={{ marginLeft: 6, color: '#EF4444' }}>●</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', borderBottom: '1px solid var(--br)' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: kpi.direcao === 'min' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)',
                      color: kpi.direcao === 'min' ? '#EF4444' : '#F59E0B',
                    }}>
                      {kpi.direcao === 'min' ? 'mín.' : 'máx.'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 12.5, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--br)' }}>
                    {carregando ? '…' : formatarKpi(atual, kpi.formato)}
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', borderBottom: '1px solid var(--br)' }}>
                    <button
                      onClick={() => setEdicao((e) => ({ ...e, [kpi.key]: { ...cfg, ativo: !cfg.ativo } }))}
                      style={{
                        width: 36, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
                        background: cfg.ativo ? 'var(--red)' : 'var(--bg-base)', transition: 'background .15s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2, left: cfg.ativo ? 18 : 2, width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left .15s',
                      }} />
                    </button>
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', borderBottom: '1px solid var(--br)' }}>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!cfg.ativo}
                      value={cfg.valor || ''}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, [kpi.key]: { ...cfg, valor: Number(e.target.value) } }))}
                      placeholder="0"
                      style={{
                        width: 90, padding: '5px 8px', borderRadius: 6, fontSize: 12, textAlign: 'center',
                        background: cfg.ativo ? 'var(--bg-base)' : 'transparent', border: '1px solid var(--br)',
                        color: 'var(--t1)', opacity: cfg.ativo ? 1 : 0.4,
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
        {salvo && <span style={{ fontSize: 11.5, color: '#10B981' }}>Metas salvas.</span>}
        <button
          onClick={salvar}
          disabled={salvando || isDemo}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: salvando || isDemo ? 'not-allowed' : 'pointer',
            background: 'var(--red)', border: 'none', color: '#fff', opacity: salvando || isDemo ? 0.6 : 1,
          }}
        >
          {salvando ? 'Salvando…' : `Salvar metas — ${CANAIS.find((c) => c.key === canal)?.label}`}
        </button>
      </div>
    </div>
  )
}
