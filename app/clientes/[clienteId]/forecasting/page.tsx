'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import { salvarForecastingCenarios } from '@/lib/data/partners'
import { usePlanoMidia, usePlanoMidiaConfig } from '@/lib/data/colecoes'
import { useDocumento } from '@/lib/data/firestore-hooks'
import { useMetaAdsGasto } from '@/lib/data/meta-ads-metrics'
import { useGoogleAdsGasto } from '@/lib/data/google-ads-metrics'
import { funilDoTipo } from '@/components/midia/growthPackColunas'
import { rotulosFunilPlanoMidia, formatarValorPlanoMidia } from '@/components/midia/planoMidiaColunas'
import {
  agregarForecastingMes, somarRealizadoMes, CENARIOS_PADRAO, type CenarioNome, type ForecastingTotaisMes,
} from '@/lib/data/forecasting-calc'
import type { ForecastingCenarios, PlanoMidiaConfigMes, PlanoMidiaItem } from '@/lib/types'

const FATOR_PADRAO = 0.8718

function labelMes(mes: string) {
  const [ano, m] = mes.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[Number(m) - 1]}/${ano.slice(2)}`
}

const CORES: Record<'realizado' | CenarioNome, string> = {
  realizado: '#10B981', pessimista: '#EF4444', realista: '#6366F1', otimista: '#F59E0B',
}
const LABELS: Record<'realizado' | CenarioNome, string> = {
  realizado: 'Realizado', pessimista: 'Pessimista', realista: 'Realista', otimista: 'Otimista',
}

const tt = {
  contentStyle: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 11, color: '#f0f0f0' },
  labelStyle: { color: '#777' },
  cursor: { fill: 'rgba(255,255,255,.03)' },
}
const ax = { tick: { fill: '#555', fontSize: 10 }, axisLine: false as const, tickLine: false as const }

function Card({ titulo, valor, cor, sub }: { titulo: string; valor: string; cor?: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 6 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: cor ?? 'var(--t1)' }}>{valor}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function PainelCenarios({ clienteId, cenarios }: { clienteId: string; cenarios: ForecastingCenarios }) {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(cenarios)
  const [salvando, setSalvando] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: 70, padding: '5px 8px', borderRadius: 6, fontSize: 12,
    background: 'var(--bg-base)', border: '1px solid var(--br)', color: 'var(--t1)', textAlign: 'right',
  }

  const campo = (label: string, cenario: 'pessimista' | 'otimista', chave: 'deltaCtr' | 'deltaConversao') => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number" step="1" style={inputStyle}
          value={Math.round(form[cenario][chave] * 100)}
          onChange={(e) => setForm((f) => ({ ...f, [cenario]: { ...f[cenario], [chave]: Number(e.target.value) / 100 } }))}
        />
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>%</span>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setAberto((a) => !a)}
        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>Configurar cenários</span>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{aberto ? '▲' : '▼'}</span>
      </button>
      {aberto && (
        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0, lineHeight: 1.5 }}>
            % de variação sobre o Plano de Mídia cadastrado (que é o cenário Realista). CTR afeta cliques; conversão afeta leads/vendas e a projeção de faturamento.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: CORES.pessimista, textTransform: 'uppercase' }}>Pessimista</span>
              {campo('CTR', 'pessimista', 'deltaCtr')}
              {campo('Conversão', 'pessimista', 'deltaConversao')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: CORES.otimista, textTransform: 'uppercase' }}>Otimista</span>
              {campo('CTR', 'otimista', 'deltaCtr')}
              {campo('Conversão', 'otimista', 'deltaConversao')}
            </div>
          </div>
          <button
            onClick={async () => { setSalvando(true); await salvarForecastingCenarios(clienteId, form); setSalvando(false) }}
            disabled={salvando}
            style={{ alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}
          >
            {salvando ? 'Salvando…' : 'Salvar cenários'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ForecastingPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const usarDemo = isDemo

  const { itens } = usePlanoMidia(usarDemo ? undefined : clienteId)
  const { config } = usePlanoMidiaConfig(usarDemo ? undefined : clienteId)
  const { data: cenariosSalvos } = useDocumento<ForecastingCenarios>(
    usarDemo ? [] : ['partners', clienteId, 'forecasting_config', 'main'],
  )
  const cenarios = cenariosSalvos ?? CENARIOS_PADRAO

  const meses = useMemo(() => [...new Set(itens.map((i) => i.mes))].sort(), [itens])
  const configPorMes = useMemo(() => new Map(config.map((c) => [c.mes, c])), [config])

  const periodoRealizado = useMemo(() => {
    if (meses.length === 0) return null
    const inicio = new Date(`${meses[0]}-01T00:00:00`)
    const fim = new Date()
    return { start: inicio, end: fim, label: 'Forecasting' }
  }, [meses])

  const { gasto: metaGasto } = useMetaAdsGasto(usarDemo || !periodoRealizado ? undefined : clienteId, periodoRealizado ?? { start: new Date(), end: new Date(), label: '' })
  const { gasto: googleGasto } = useGoogleAdsGasto(usarDemo || !periodoRealizado ? undefined : clienteId, periodoRealizado ?? { start: new Date(), end: new Date(), label: '' })

  const funil = funilDoTipo(cliente?.tipo ?? 'ecommerce')
  const rotulos = rotulosFunilPlanoMidia(funil)
  const mesAtual = new Date().toISOString().slice(0, 7)

  const porMes = useMemo(() => {
    const itensPorMes = new Map<string, PlanoMidiaItem[]>()
    for (const item of itens) {
      const lista = itensPorMes.get(item.mes) ?? []
      lista.push(item)
      itensPorMes.set(item.mes, lista)
    }
    return meses.map((mes) => {
      const itensDoMes = itensPorMes.get(mes) ?? []
      const cfg: PlanoMidiaConfigMes | undefined = configPorMes.get(mes)
      const cenariosDoMes = agregarForecastingMes(
        itensDoMes,
        cfg ?? { mes, orcamentoTotal: 0, ticketMedio: 0, fatorPosImposto: FATOR_PADRAO },
        cenarios,
      )
      const realMeta = somarRealizadoMes(metaGasto?.porData, mes)
      const realGoogle = somarRealizadoMes(googleGasto?.porData, mes)
      const passado = mes < mesAtual || (mes === mesAtual)
      return {
        mes,
        cenarios: cenariosDoMes,
        realizado: passado ? { investimento: realMeta.investimento + realGoogle.investimento, faturamento: realMeta.faturamento + realGoogle.faturamento } : null,
      }
    })
  }, [meses, itens, configPorMes, cenarios, metaGasto, googleGasto, mesAtual])

  const totais = useMemo(() => {
    const somar = (cenario: CenarioNome): ForecastingTotaisMes => {
      const linhas = porMes.map((m) => m.cenarios[cenario])
      const orcamento = linhas.reduce((s, l) => s + l.orcamento, 0)
      const faturamentoProjetado = linhas.reduce((s, l) => s + l.faturamentoProjetado, 0)
      return {
        orcamento,
        impressoes: linhas.reduce((s, l) => s + l.impressoes, 0),
        cliques: linhas.reduce((s, l) => s + l.cliques, 0),
        estagio1: linhas.reduce((s, l) => s + l.estagio1, 0),
        estagio2: linhas.reduce((s, l) => s + l.estagio2, 0),
        estagio3: linhas.reduce((s, l) => s + l.estagio3, 0),
        estagio4: linhas.some((l) => l.estagio4 !== undefined) ? linhas.reduce((s, l) => s + (l.estagio4 ?? 0), 0) : undefined,
        faturamentoProjetado,
        ctrMedio: 0,
        roas: orcamento > 0 ? faturamentoProjetado / orcamento : 0,
      }
    }
    const realizado = porMes.reduce((acc, m) => ({
      investimento: acc.investimento + (m.realizado?.investimento ?? 0),
      faturamento: acc.faturamento + (m.realizado?.faturamento ?? 0),
    }), { investimento: 0, faturamento: 0 })
    return { realizado, pessimista: somar('pessimista'), realista: somar('realista'), otimista: somar('otimista') }
  }, [porMes])

  const dadosGrafico = porMes.map((m) => ({
    mes: labelMes(m.mes),
    Realizado: m.realizado ? Math.round(m.realizado.faturamento) : undefined,
    Pessimista: Math.round(m.cenarios.pessimista.faturamentoProjetado),
    Realista: Math.round(m.cenarios.realista.faturamentoProjetado),
    Otimista: Math.round(m.cenarios.otimista.faturamentoProjetado),
  }))

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} clienteId={usarDemo ? undefined : clienteId} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Forecasting</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Realizado vs. cenários projetados a partir do Plano de Mídia
          </p>
        </div>

        {usarDemo ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 14, background: 'var(--bg-c)', border: '1px solid var(--br)', color: 'var(--t3)', fontSize: 12.5 }}>
            Cliente demo — Forecasting disponível só pra clientes reais.
          </div>
        ) : meses.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 14, background: 'var(--bg-c)', border: '1px solid var(--br)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>Nenhum Plano de Mídia cadastrado ainda</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
              O Forecasting usa o Plano de Mídia (Gestor de Mídia) como base do cenário Realista — cadastre pelo menos um mês lá pra ver as projeções aqui.
            </p>
            <Link href={`/clientes/${clienteId}/midia`} style={{ marginTop: 4, padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'var(--red)', color: '#fff', textDecoration: 'none' }}>
              Ir para Plano de Mídia
            </Link>
          </div>
        ) : (
          <>
            <PainelCenarios clienteId={clienteId} cenarios={cenarios} />

            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: 10 }}>
                Dash Geral · {meses.length} {meses.length === 1 ? 'mês' : 'meses'} planejados
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <Card titulo="Realizado" valor={formatarValorPlanoMidia(totais.realizado.faturamento, 'moeda')} cor={CORES.realizado} sub={`Investimento: ${formatarValorPlanoMidia(totais.realizado.investimento, 'moeda')}`} />
                <Card titulo="Pessimista" valor={formatarValorPlanoMidia(totais.pessimista.faturamentoProjetado, 'moeda')} cor={CORES.pessimista} sub={`ROAS ${totais.pessimista.roas.toFixed(2)}`} />
                <Card titulo="Realista" valor={formatarValorPlanoMidia(totais.realista.faturamentoProjetado, 'moeda')} cor={CORES.realista} sub={`ROAS ${totais.realista.roas.toFixed(2)}`} />
                <Card titulo="Otimista" valor={formatarValorPlanoMidia(totais.otimista.faturamentoProjetado, 'moeda')} cor={CORES.otimista} sub={`ROAS ${totais.otimista.roas.toFixed(2)}`} />
              </div>
            </div>

            <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 14 }}>
                Faturamento por mês
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="mes" {...ax} />
                  <YAxis {...ax} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipagem do Formatter do Recharts não aceita number | undefined de forma prática; mesmo padrão já usado em tracking/page.tsx */}
                  <Tooltip {...tt} formatter={(v: any) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#666', paddingTop: 8 }} />
                  <Line type="monotone" dataKey="Realizado" stroke={CORES.realizado} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Pessimista" stroke={CORES.pessimista} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="Realista" stroke={CORES.realista} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Otimista" stroke={CORES.otimista} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>
                Funil por cenário (soma do período) · {rotulos.estagio1} → {rotulos.estagio2} → {rotulos.estagio3}{rotulos.estagio4 ? ` → ${rotulos.estagio4}` : ''}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Cenário', 'Orçamento', 'Cliques', rotulos.estagio1, rotulos.estagio2, rotulos.estagio3, rotulos.estagio4, 'Faturamento', 'ROAS']
                        .filter(Boolean).map((h) => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Cenário' ? 'left' : 'right', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['pessimista', 'realista', 'otimista'] as CenarioNome[]).map((c) => {
                      const t = totais[c]
                      return (
                        <tr key={c}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: CORES[c] }}>{LABELS[c]}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.orcamento, 'moeda')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.cliques, 'numero')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.estagio1, 'numero')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.estagio2, 'numero')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.estagio3, 'numero')}</td>
                          {rotulos.estagio4 && <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{formatarValorPlanoMidia(t.estagio4, 'numero')}</td>}
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>{formatarValorPlanoMidia(t.faturamentoProjetado, 'moeda')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--t2)' }}>{t.roas.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}
