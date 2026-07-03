'use client'

import { use, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import EventHealthCard from '@/components/tracking/EventHealthCard'
import { useCliente } from '@/lib/data/clientes'
import { useEventos } from '@/lib/data/colecoes'
import {
  agregarSaudeEventos, agregarVolume7Dias, agregarPorOrigem, agregarPaginas, agregarLogs,
} from '@/lib/data/agregacoes'
import {
  eventHealthData, eventVolumeData, eventBySource, pageHeatData, eventLogs,
} from '@/lib/demo-data-tracking'
import type { EventHealth, EventLogItem, PageHeatEntry } from '@/lib/demo-data-tracking'

// ── Shared tooltip style ──────────────────────────────────────────────────────
const tt = {
  contentStyle: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 11, color: '#f0f0f0' },
  labelStyle:   { color: '#777' },
  cursor:       { fill: 'rgba(255,255,255,.03)' },
}
const ax = { tick: { fill: '#555', fontSize: 10 }, axisLine: false as const, tickLine: false as const }

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, sub, children, full }: { title: string; sub?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12,
      padding: '16px 18px', gridColumn: full ? '1 / -1' : undefined,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

// ── Source origin badge ───────────────────────────────────────────────────────
function OrigemBadge({ origem }: { origem: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Meta Ads':   { bg: 'rgba(24,119,242,.12)',  color: '#1877F2' },
    'Google Ads': { bg: 'rgba(66,133,244,.12)',  color: '#4285F4' },
    'Orgânico':   { bg: 'rgba(16,185,129,.12)',  color: '#10B981' },
    'Direto':     { bg: 'rgba(107,114,128,.12)', color: '#9CA3AF' },
    'Email':      { bg: 'rgba(245,158,11,.12)',  color: '#F59E0B' },
  }
  const c = cfg[origem] ?? cfg['Direto']
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5,
      background: c.bg, color: c.color,
      fontSize: 10.5, fontWeight: 600,
    }}>
      {origem}
    </span>
  )
}

// ── Overall health summary ────────────────────────────────────────────────────
function HealthSummary({ saude }: { saude: EventHealth[] }) {
  const online  = saude.filter(e => e.status === 'online').length
  const warning = saude.filter(e => e.status === 'warning').length
  const offline = saude.filter(e => e.status === 'offline').length
  const total   = saude.length

  const overall: EventHealth['status'] = offline > 0 ? 'offline' : warning > 0 ? 'warning' : 'online'
  const cfgs = { online: { color: '#10B981', label: 'Tracking saudável' }, warning: { color: '#F59E0B', label: 'Atenção necessária' }, offline: { color: '#EF4444', label: 'Evento parado' } }
  const cfg = cfgs[overall]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', borderRadius: 10,
      background: cfg.color + '0f', border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
        {online}/{total} eventos ativos {warning > 0 && `· ${warning} alertas`} {offline > 0 && `· ${offline} parados`}
      </span>
    </div>
  )
}

// ── Drill-down event table ────────────────────────────────────────────────────
function EventLogTable({ eventId, logs }: { eventId: string; logs: Record<string, EventLogItem[]> }) {
  const rows = logs[eventId] ?? []
  const hasProduct = rows.some(r => r.produto)
  const hasValor   = rows.some(r => r.valor)

  if (rows.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
        Nenhum evento registrado nas últimas 24h
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          {['Horário', 'Origem', 'Página', hasProduct && 'Produto', hasValor && 'Valor', 'Dispositivo']
            .filter(Boolean).map((h) => (
              <th key={h as string} style={{
                padding: '7px 14px', textAlign: 'left',
                fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '.06em', color: 'var(--t3)',
                borderBottom: '1px solid var(--br)',
              }}>
                {h}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <motion.tr
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--br)' : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-s)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: 'var(--t3)', fontSize: 11 }}>{r.hora}</td>
            <td style={{ padding: '9px 14px' }}><OrigemBadge origem={r.origem} /></td>
            <td style={{ padding: '9px 14px', color: 'var(--t2)', fontFamily: 'monospace', fontSize: 10.5 }}>{r.pagina}</td>
            {hasProduct && <td style={{ padding: '9px 14px', color: 'var(--t1)', fontWeight: 500 }}>{r.produto ?? '—'}</td>}
            {hasValor   && <td style={{ padding: '9px 14px', color: '#10B981', fontWeight: 700 }}>{r.valor ?? '—'}</td>}
            <td style={{ padding: '9px 14px', color: 'var(--t3)', fontSize: 11 }}>{r.dispositivo}</td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrackingPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { eventos } = useEventos(isDemo ? undefined : clienteId)

  const usarDemo = isDemo

  // Dados reais agregados dos eventos do Firestore — ou demo quando vazio
  const dados = useMemo(() => {
    if (usarDemo) {
      return {
        saude: eventHealthData,
        volume: eventVolumeData,
        porOrigem: eventBySource,
        paginas: pageHeatData as PageHeatEntry[],
        logs: eventLogs,
      }
    }
    return {
      saude: agregarSaudeEventos(eventos),
      volume: agregarVolume7Dias(eventos),
      porOrigem: agregarPorOrigem(eventos),
      paginas: agregarPaginas(eventos),
      logs: agregarLogs(eventos),
    }
  }, [usarDemo, eventos])

  const [selectedEventId, setSelectedEventId] = useState<string>('lead')
  const selectedEvent = dados.saude.find(e => e.id === selectedEventId)

  return (
    <>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page title + health summary ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Eventos & Tracking</h2>
            <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
              Saúde do tracking · O que está disparando no site{usarDemo ? ' · dados demo' : ' · dados reais'}
            </p>
          </div>
          <HealthSummary saude={dados.saude} />
        </div>

        {/* ── Section 1: Saúde dos Eventos ── */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: 10 }}>
            Saúde dos Eventos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {dados.saude.map(e => (
              <EventHealthCard
                key={e.id}
                {...e}
                selected={selectedEventId === e.id}
                onClick={() => setSelectedEventId(e.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Section 2: Volume overview ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Volume por dia */}
          <Card title="Volume de eventos · últimos 7 dias" sub="Cada linha representa um tipo de evento">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={dados.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="dia" {...ax} />
                <YAxis {...ax} />
                <Tooltip {...tt} formatter={(v: any, n: any) => [v.toLocaleString('pt-BR'), n]} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#666', paddingTop: 8 }} />
                <Line type="monotone" dataKey="page_view" name="Page View" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="lead"      name="Lead"      stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="checkout"  name="Checkout"  stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="compra"    name="Compra"    stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Por fonte */}
          <Card title="Origem do tráfego" sub="% de eventos por canal">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={dados.porOrigem} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={3} startAngle={90} endAngle={450}>
                    {dados.porOrigem.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v: any, n: any) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {dados.porOrigem.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--t2)' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{s.value}%</span>
                    <div style={{ width: 50, height: 4, borderRadius: 2, background: 'var(--bg-s)', overflow: 'hidden' }}>
                      <div style={{ width: `${s.value}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Section 3: Drill-down ── */}
        <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>

          {/* Tab header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
                Detalhamento por evento
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                Clique em um evento acima ou selecione abaixo
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {dados.saude.map(e => {
                const active = selectedEventId === e.id
                const scfg = { online: '#10B981', warning: '#F59E0B', offline: '#EF4444' }
                return (
                  <button key={e.id} onClick={() => setSelectedEventId(e.id)} style={{
                    padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 11.5, fontWeight: active ? 700 : 500,
                    background: active ? e.color + '18' : 'transparent',
                    border: `1px solid ${active ? e.color + '60' : 'var(--br)'}`,
                    color: active ? e.color : 'var(--t2)',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: scfg[e.status] }} />
                    {e.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected event detail header */}
          {selectedEvent && (
            <div style={{
              padding: '10px 18px', borderBottom: '1px solid var(--br)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: selectedEvent.color + '08',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={selectedEvent.color} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                <path d={selectedEvent.icon} />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: selectedEvent.color }}>{selectedEvent.label}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                {selectedEvent.countToday.toLocaleString('pt-BR')} eventos hoje
              </span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>· Último: {selectedEvent.lastFired}</span>
              {selectedEvent.alert && (
                <>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>·</span>
                  <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>⚠ {selectedEvent.alert}</span>
                </>
              )}
            </div>
          )}

          {/* Table */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedEventId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <EventLogTable eventId={selectedEventId} logs={dados.logs} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Section 4: Page Heatmap ── */}
        <Card title="Páginas com mais eventos" sub="Ranking por volume de eventos rastreados">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dados.paginas.map((p, i) => (
              <motion.div
                key={p.page}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span style={{ fontSize: 10, color: 'var(--t3)', width: 16, textAlign: 'right', fontWeight: 700 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--t2)', fontFamily: 'monospace', width: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.page}
                </span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-s)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, #6366F1, #8B5CF6)`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t1)', width: 52, textAlign: 'right' }}>
                  {p.events.toLocaleString('pt-BR')}
                </span>
                {p.leads > 0 && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: 'rgba(139,92,246,.1)', color: '#8B5CF6', fontWeight: 600 }}>
                    {p.leads} leads
                  </span>
                )}
                {p.compras > 0 && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: 'rgba(16,185,129,.1)', color: '#10B981', fontWeight: 600 }}>
                    {p.compras} compras
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </Card>

      </main>
    </>
  )
}
