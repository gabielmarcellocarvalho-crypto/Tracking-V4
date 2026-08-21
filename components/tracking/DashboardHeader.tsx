'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClienteTipo } from '@/lib/demo-data'
import { useDateRange } from '@/lib/date-range-context'
import { useEventos, useInsights, useKpiStatus } from '@/lib/data/colecoes'
import { gerarAlertas } from '@/lib/data/agregacoes'
import { formatarKpi } from '@/lib/data/kpis'
import type { KpiViolacao } from '@/lib/types'
import DateRangePicker from './DateRangePicker'
import Markdown from './Markdown'

const CANAL_LABEL: Record<string, string> = { geral: 'Geral', meta: 'Meta', google: 'Google' }

const tipoConfig: Record<ClienteTipo, { label: string; bg: string; color: string }> = {
  ecommerce:      { label: 'E-COMMERCE',   bg: 'rgba(200,16,46,.1)',  color: '#C8102E' },
  'inside-sales': { label: 'INSIDE SALES', bg: 'rgba(59,130,246,.1)', color: '#3B82F6' },
}

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[15px] h-[15px]">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

export interface DashboardHeaderProps {
  clienteName: string
  clienteTipo?: ClienteTipo
  /** Omitido (ou undefined) para clientes demo — sem isso o sino não busca nada. */
  clienteId?: string
}

export default function DashboardHeader({ clienteName, clienteTipo, clienteId }: DashboardHeaderProps) {
  // Sem tipo ainda (cliente real carregando via Firestore) — não inventa um
  // default, senão pisca "INSIDE SALES" pra clientes ecommerce por 1-2s até
  // o dado real chegar (bug real que o Gabriel pegou testando ao vivo).
  const tipo = clienteTipo ? tipoConfig[clienteTipo] : undefined
  const { range: dateRange, setRange: setDateRange } = useDateRange()

  // gerarAlertas só olha os últimos 7 dias (mesmo default de agregarSaudeEventos
  // sem período) — bounding aqui evita puxar histórico inteiro só pro sino.
  // `Date.now()` direto no corpo do componente virava um valor novo a cada
  // render, o que (achado ao vivo, gerando 700+ chamadas/5min e estourando
  // a cota do Firestore) fazia useEventos refazer o fetch em loop — useMemo
  // com [] mantém o mesmo valor durante toda a vida do componente.
  const desdeSino = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, [])
  const { eventos } = useEventos(clienteId, { desde: desdeSino, limite: 20000 })
  const { insights } = useInsights(clienteId)
  const { status: kpiStatus } = useKpiStatus(clienteId)
  const alertas = useMemo(() => gerarAlertas(eventos, clienteTipo), [eventos, clienteTipo])
  const kpiViolacoes = useMemo(() => {
    if (!kpiStatus) return [] as (KpiViolacao & { canal: string })[]
    const canais: (keyof typeof CANAL_LABEL)[] = ['geral', 'meta', 'google']
    return canais.flatMap((c) => (kpiStatus[c as 'geral' | 'meta' | 'google'] ?? []).map((v) => ({ ...v, canal: c })))
  }, [kpiStatus])

  const [notifAberta, setNotifAberta] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notifAberta) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifAberta(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifAberta])

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '6px 14px', background: 'var(--bg-c)', border: '1px solid var(--br)',
    borderRadius: 8, cursor: 'pointer', transition: 'all .18s',
  }

  return (
    <header style={{
      position: 'sticky', top: 0,
      background: 'var(--bg-s)', borderBottom: '1px solid var(--br)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
      zIndex: 40, minHeight: 60, overflow: 'visible',
    }}>
      {/* Left — client breadcrumb + name */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>
          Clientes / {clienteName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>
            Dashboard — {clienteName}
          </span>
          {tipo && (
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.06em', padding: '2px 7px', borderRadius: 4, background: tipo.bg, color: tipo.color }}>
              {tipo.label}
            </span>
          )}
        </div>
      </div>

      {/* Date range picker (replaces old period dropdown) */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* Bell — alertas automáticos + insights salvos deste cliente */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          title="Notificações"
          onClick={() => setNotifAberta((v) => !v)}
          style={{
            ...btnBase, padding: 0, width: 36, height: 36, justifyContent: 'center',
            position: 'relative',
            color: notifAberta ? 'var(--red)' : 'var(--t2)',
            borderColor: notifAberta ? 'var(--red)' : 'var(--br)',
          }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.color = 'var(--red)'; el.style.boxShadow = '0 0 0 3px var(--red-gl),0 4px 12px rgba(200,16,46,.2)'; el.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = notifAberta ? 'var(--red)' : 'var(--br)'; el.style.color = notifAberta ? 'var(--red)' : 'var(--t2)'; el.style.boxShadow = 'none'; el.style.transform = 'none' }}
        >
          <BellIcon />
          {(alertas.length + kpiViolacoes.length) > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 999, background: 'var(--red)', color: '#fff', fontSize: 9.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              boxShadow: '0 0 0 2px var(--bg-s)',
            }}>
              {alertas.length + kpiViolacoes.length}
            </span>
          )}
        </button>

        {notifAberta && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, maxHeight: 460,
            background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12,
            zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,.65)',
            overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 10px' }}>
                Alertas automáticos
              </p>
              {alertas.length === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nenhum alerta — tudo saudável ou sem dados suficientes.</p>
              )}
              {alertas.map((a) => (
                <div key={a.tipo} style={{
                  padding: '10px 12px', borderRadius: 9, marginBottom: 8,
                  background: a.severidade === 'critico' ? 'rgba(239,68,68,.07)' : 'rgba(245,158,11,.06)',
                  border: `1px solid ${a.severidade === 'critico' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.25)'}`,
                }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: a.severidade === 'critico' ? '#EF4444' : '#F59E0B', margin: 0 }}>{a.titulo}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.5 }}>{a.corpo}</p>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 10px' }}>
                Metas de KPI (Gestor de Mídia)
              </p>
              {kpiViolacoes.length === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nenhuma meta configurada fora do aceitável.</p>
              )}
              {kpiViolacoes.map((v) => (
                <div key={`${v.canal}-${v.key}`} style={{
                  padding: '10px 12px', borderRadius: 9, marginBottom: 8,
                  background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.3)',
                }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#EF4444', margin: 0 }}>
                    {v.label} <span style={{ color: 'var(--t3)', fontWeight: 600 }}>· {CANAL_LABEL[v.canal]}</span>
                  </p>
                  <p style={{ fontSize: 10.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Atual {formatarKpi(v.valorAtual, v.formato)} — meta {v.direcao === 'min' ? 'mínima' : 'máxima'} {formatarKpi(v.meta, v.formato)}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 10px' }}>
                Insights salvos
              </p>
              {insights.length === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>As ações rápidas do Agente IA ficam salvas aqui.</p>
              )}
              {insights.slice(0, 10).map((ins) => (
                <details key={ins.id} style={{
                  padding: '10px 12px', borderRadius: 9, marginBottom: 8,
                  background: 'var(--bg-base)', border: '1px solid var(--br)',
                }}>
                  <summary style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t1)', cursor: 'pointer' }}>
                    {ins.titulo}
                    <span style={{ fontSize: 9.5, color: 'var(--t3)', marginLeft: 6 }}>
                      {new Date(ins.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </summary>
                  <div style={{ marginTop: 8 }}><Markdown texto={ins.corpo} /></div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <button
        style={{ ...btnBase, fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}
        onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.color = 'var(--red)'; el.style.transform = 'translateY(-1px)' }}
        onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.color = 'var(--t2)'; el.style.transform = 'none' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[13px] h-[13px]">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exportar
      </button>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--red), var(--purple))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
      }}>G</div>
    </header>
  )
}
