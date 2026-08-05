'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ClienteTipo } from '@/lib/demo-data'
import { useDateRange } from '@/lib/date-range-context'
import { useEventos, useGrowthPack, salvarGrowthPackMes } from '@/lib/data/colecoes'
import { useMetaAdsGasto } from '@/lib/data/meta-ads-metrics'
import { useGoogleAdsGasto } from '@/lib/data/google-ads-metrics'
import { agregarGrowthPackAno, agregarGrowthPackTotalAno, type GrowthPackCanal } from '@/lib/data/agregacoes'
import { colunasDoFunil, formatarValor, funilDoTipo } from './growthPackColunas'

const CANAIS: { key: GrowthPackCanal; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'meta',  label: 'Meta' },
  { key: 'google', label: 'Google' },
]

const COR_KPI = ['#E50914', '#10B981', '#3B82F6', '#8B5CF6']

// Seta de variação (SVG, não emoji) — verde subindo / vermelho descendo.
function SetaVariacao({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>—</span>
  if (!isFinite(pct)) return <span style={{ fontSize: 10.5, fontWeight: 700, color: '#10B981' }}>novo</span>
  const subindo = pct >= 0
  const cor = pct === 0 ? 'var(--t3)' : subindo ? '#10B981' : '#EF4444'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: cor }}>
      {pct !== 0 && (
        <svg viewBox="0 0 10 10" width={8} height={8} style={{ transform: subindo ? 'none' : 'rotate(180deg)' }}>
          <path d="M5 1 L9 8 L1 8 Z" fill="currentColor" />
        </svg>
      )}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

function calcularVariacao(atual: number, anterior: number | undefined): number | null {
  if (anterior === undefined) return null
  if (anterior === 0) return atual === 0 ? null : Infinity
  return ((atual - anterior) / anterior) * 100
}

interface Props {
  clienteId: string
  clienteTipo?: ClienteTipo
  isDemo: boolean
}

function EditarMesModal({
  clienteId, mes, label, colunas, projetadoAtual, manualAtual, onClose,
}: {
  clienteId: string
  mes: string
  label: string
  colunas: ReturnType<typeof colunasDoFunil>
  projetadoAtual: Record<string, number>
  manualAtual: Record<string, number>
  onClose: () => void
}) {
  const [projetado, setProjetado] = useState<Record<string, string>>(
    Object.fromEntries(colunas.map((c) => [c.key, projetadoAtual[c.key] != null ? String(projetadoAtual[c.key]) : ''])),
  )
  const colunasManuais = colunas.filter((c) => c.fonte === 'manual')
  const [manual, setManual] = useState<Record<string, string>>(
    Object.fromEntries(colunasManuais.map((c) => [c.key, manualAtual[c.key] != null ? String(manualAtual[c.key]) : ''])),
  )
  const [salvando, setSalvando] = useState(false)

  const toNum = (v: Record<string, string>) =>
    Object.fromEntries(Object.entries(v).map(([k, s]) => [k, Number(s.replace(',', '.')) || 0]))

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await salvarGrowthPackMes(clienteId, mes, { projetado: toNum(projetado), manual: toNum(manual) })
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--t1)', outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxHeight: '85vh', overflowY: 'auto', borderRadius: 14,
          background: 'var(--bg-c)', border: '1px solid var(--br)', padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{label} — metas e manuais</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 8px' }}>
          Metas do mês (Projetado)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {colunas.map((c) => (
            <div key={c.key}>
              <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{c.label}</label>
              <input
                inputMode="decimal"
                value={projetado[c.key]}
                onChange={(e) => setProjetado((p) => ({ ...p, [c.key]: e.target.value }))}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {colunasManuais.length > 0 && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 8px' }}>
              Preenchimento manual (sem rastreio automático ainda)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {colunasManuais.map((c) => (
                <div key={c.key}>
                  <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{c.label}</label>
                  <input
                    inputMode="decimal"
                    value={manual[c.key]}
                    onChange={(e) => setManual((p) => ({ ...p, [c.key]: e.target.value }))}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--red)', border: 'none', color: '#fff', cursor: salvando ? 'default' : 'pointer',
            opacity: salvando ? 0.6 : 1,
          }}
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export default function VisaoGeralGrowthPack({ clienteId, clienteTipo, isDemo }: Props) {
  const { range: periodoUniversal } = useDateRange()
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [canal, setCanal] = useState<GrowthPackCanal>('geral')
  const [editando, setEditando] = useState<{ mes: string; label: string } | null>(null)

  // O período universal (topo de Performance/Eventos) também filtra o
  // Growth Pack — ao trocar o período, pula pro ano correspondente pra não
  // mostrar um ano em branco enquanto o filtro aponta pra outro.
  useEffect(() => { setAno(periodoUniversal.end.getFullYear()) }, [periodoUniversal])

  const { eventos } = useEventos(isDemo ? undefined : clienteId)
  const { meses: mesesSalvos } = useGrowthPack(isDemo ? undefined : clienteId)

  const periodoAno = useMemo(() => ({
    start: new Date(ano, 0, 1),
    end: new Date(ano, 11, 31),
    label: String(ano),
  }), [ano])
  const { gasto: metaGasto, loading: loadingMeta, ultimaAtualizacao: ultimaMeta, refetch: refetchMeta } =
    useMetaAdsGasto(isDemo ? undefined : clienteId, periodoAno)
  const { gasto: googleGasto, loading: loadingGoogle, ultimaAtualizacao: ultimaGoogle, refetch: refetchGoogle } =
    useGoogleAdsGasto(isDemo ? undefined : clienteId, periodoAno)

  const carregandoAds = loadingMeta || loadingGoogle
  const ultimaAtualizacaoAds = [ultimaMeta, ultimaGoogle].filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  const atualizarMetricas = () => { refetchMeta(); refetchGoogle() }

  const funil = funilDoTipo(clienteTipo ?? 'ecommerce')
  const colunas = colunasDoFunil(funil)

  const linhas = useMemo(
    () => agregarGrowthPackAno(eventos, ano, funil, canal, metaGasto?.porData, googleGasto?.porData, periodoUniversal),
    [eventos, ano, funil, canal, metaGasto, googleGasto, periodoUniversal],
  )

  const mesPorId = useMemo(() => new Map(mesesSalvos.map((m) => [m.mes, m])), [mesesSalvos])

  // Totais do ano por coluna — soma direta, exceto ROAS (recalculado a
  // partir dos totais de faturamento/investimento, já que média de razões
  // não faz sentido matemático).
  // Total do ano: colunas automáticas vêm de UMA agregação anual (não da
  // soma das 12 linhas mensais) — somar 12 "maiores valores" mensais já
  // deduplicados pode passar do total anual de qualquer canal isolado
  // (ex: Meta ganha em Jan, Google ganha em Fev, a soma dos dois vencedores
  // mensais supera o total anual de cada um sozinho). Só colunas manuais
  // (sem dedup, cada mês é um valor independente digitado) somam por mês.
  const totalAnoAuto = useMemo(
    () => agregarGrowthPackTotalAno(eventos, ano, funil, canal, metaGasto?.porData, googleGasto?.porData, periodoUniversal),
    [eventos, ano, funil, canal, metaGasto, googleGasto, periodoUniversal],
  )
  const totais = useMemo(() => {
    const t: Record<string, number> = {}
    for (const c of colunas) {
      if (c.fonte === 'manual') {
        t[c.key] = linhas.reduce((s, linha) => s + (mesPorId.get(linha.mes)?.manual?.[c.key] ?? 0), 0)
      } else {
        t[c.key] = totalAnoAuto[c.key] ?? 0
      }
    }
    return t
  }, [linhas, colunas, mesPorId, totalAnoAuto])

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'right', fontSize: '9.5px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)',
    borderBottom: '1px solid var(--br)', whiteSpace: 'nowrap',
    position: 'sticky', top: 0, background: 'var(--bg-c)', zIndex: 1,
  }
  const tdStyle: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'right', fontSize: 12.5, color: 'var(--t2)',
    borderBottom: '1px solid var(--br)', fontVariantNumeric: 'tabular-nums',
  }

  const kpisResumo = [
    { label: `Investimento (${periodoUniversal.label})`, valor: formatarValor(totais.investimento, 'moeda') },
    { label: `Faturamento (${periodoUniversal.label})`,  valor: formatarValor(totais.faturamento, 'moeda') },
    { label: 'ROAS médio',         valor: (totais.roas ?? 0).toFixed(2) },
    { label: colunas.some((c) => c.key === 'purchase') ? `Purchase (${periodoUniversal.label})` : `Vendas (${periodoUniversal.label})`,
      valor: formatarValor(totais[colunas.some((c) => c.key === 'purchase') ? 'purchase' : 'vendas'], 'numero') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDemo && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 12.5, color: 'var(--t2)' }}>
          Cliente demo — Growth Pack disponível só pra clientes reais.
        </div>
      )}

      {/* Toolbar: ano + canal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setAno((a) => a - 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--br)', background: 'var(--bg-c)', color: 'var(--t2)', cursor: 'pointer' }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', width: 48, textAlign: 'center' }}>{ano}</span>
          <button onClick={() => setAno((a) => a + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--br)', background: 'var(--bg-c)', color: 'var(--t2)', cursor: 'pointer' }}>›</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
            {carregandoAds ? 'atualizando…' : ultimaAtualizacaoAds
              ? `Ads atualizado às ${ultimaAtualizacaoAds.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'sem conexão de Ads'}
          </span>
          {!isDemo && (
            <button
              onClick={atualizarMetricas}
              disabled={carregandoAds}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'var(--bg-c)', border: '1px solid var(--br)', color: 'var(--t2)',
                cursor: carregandoAds ? 'default' : 'pointer', opacity: carregandoAds ? 0.6 : 1,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}
                style={{ animation: carregandoAds ? 'gpSpin 1s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Atualizar métricas
            </button>
          )}

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
      </div>
      <style>{`@keyframes gpSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Resumo do ano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {kpisResumo.map((k, i) => (
          <div key={k.label} style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'var(--bg-c)', border: '1px solid var(--br)',
            borderTop: `3px solid ${COR_KPI[i % COR_KPI.length]}`,
          }}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)' }}>
              {k.label}
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--t1)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>
              {k.valor}
            </div>
          </div>
        ))}
      </div>

      {canal === 'google' && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.3)', fontSize: 12, color: 'var(--t2)' }}>
          &ldquo;Alcance&rdquo; do Google usa impressões (não é a mesma métrica de alcance único do Meta) — a Google Ads API exige um relatório separado pra alcance de verdade, ainda não construído.
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'auto', maxHeight: 560 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>Mês</th>
              {colunas.map((c) => (
                <th key={c.key} style={thStyle}>
                  {c.label}{c.fonte === 'manual' && <span title="Preenchimento manual" style={{ color: '#F59E0B' }}> ✎</span>}
                </th>
              ))}
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {/* Linha de total do ano — sempre no topo, sem variação/meta */}
            <tr style={{ background: 'rgba(200,16,46,.06)' }}>
              <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, color: 'var(--t1)', borderBottom: '1px solid var(--br)' }}>
                Total ({periodoUniversal.label})
              </td>
              {colunas.map((c) => (
                <td key={c.key} style={{ ...tdStyle, fontWeight: 700, color: 'var(--t1)' }}>
                  {formatarValor(totais[c.key], c.formato)}
                </td>
              ))}
              <td style={tdStyle}></td>
            </tr>

            {linhas.map((linha, i) => {
              const salvo = mesPorId.get(linha.mes)
              const manual = salvo?.manual ?? {}
              const projetado = salvo?.projetado ?? {}
              const anterior = i > 0 ? linhas[i - 1] : null
              const anteriorSalvo = anterior ? mesPorId.get(anterior.mes) : null

              return (
                <tr
                  key={linha.mes}
                  style={{ transition: 'background .12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-s)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: 'var(--t1)' }}>
                    {linha.label}
                    {linha.estimativaAds && (
                      <span
                        title="Add to Cart/Checkout/Purchase/Faturamento deste mês vieram de estimativa do Meta ou Google (maior valor entre as fontes) — não é o mesmo que evento próprio rastreado no site."
                        style={{ marginLeft: 6, fontSize: 10, color: '#F59E0B', cursor: 'help' }}
                      >
                        ⚠
                      </span>
                    )}
                  </td>
                  {colunas.map((c) => {
                    const valor = c.fonte === 'manual' ? (manual[c.key] ?? 0) : linha.realizado[c.key]
                    const meta = projetado[c.key]
                    const valorAnterior = anterior
                      ? (c.fonte === 'manual' ? (anteriorSalvo?.manual?.[c.key] ?? 0) : anterior.realizado[c.key])
                      : undefined
                    const variacao = c.key === 'roas' ? null : calcularVariacao(valor, valorAnterior)
                    return (
                      <td key={c.key} style={tdStyle}>
                        <div>{formatarValor(valor, c.formato)}</div>
                        <div style={{ marginTop: 2, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <SetaVariacao pct={variacao} />
                        </div>
                        {!!meta && (
                          <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 1 }}>
                            meta {formatarValor(meta, c.formato)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => setEditando({ mes: linha.mes, label: `${linha.label} de ${ano}` })}
                      title="Editar metas e manuais"
                      style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13 }}
                    >
                      ✎
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarMesModal
          clienteId={clienteId}
          mes={editando.mes}
          label={editando.label}
          colunas={colunas}
          projetadoAtual={mesPorId.get(editando.mes)?.projetado ?? {}}
          manualAtual={mesPorId.get(editando.mes)?.manual ?? {}}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  )
}
