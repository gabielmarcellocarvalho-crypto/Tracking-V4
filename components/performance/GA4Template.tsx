'use client'

import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { GA4Dados } from '@/lib/data/ga4-metrics'
import PerfMetricCard from './PerfMetricCard'

const tt = {
  contentStyle: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 11, color: '#f0f0f0' },
  labelStyle: { color: '#777' },
  cursor: { fill: 'rgba(255,255,255,.03)' },
}
const ax = { tick: { fill: '#555', fontSize: 10 }, axisLine: false, tickLine: false }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d={d} />
    </svg>
  )
}

// Cores por canal do GA4 (sessionDefaultChannelGroup) — mesma paleta usada
// em "Origem do tráfego" (Tracking/Eventos), estendida pros canais que só o
// GA4 reporta (Organic Social, Referral, Email, Unassigned).
const COR_CANAL: Record<string, string> = {
  'Organic Search': '#10B981',
  'Paid Search': '#4285F4',
  'Paid Social': '#1877F2',
  'Organic Social': '#8B5CF6',
  Direct: '#6B7280',
  Referral: '#F59E0B',
  Email: '#EC4899',
  Display: '#06B6D4',
  Unassigned: '#374151',
}
function corDoCanal(canal: string) {
  return COR_CANAL[canal] ?? '#9CA3AF'
}

function fmtDia(data: string) {
  const [, m, d] = data.split('-')
  return `${d}/${m}`
}

export default function GA4Template({ dados }: { dados?: GA4Dados; real?: boolean } = {}) {
  const sessoesPorDia = dados?.sessoesPorDia ?? []
  const sessoesPorCanal = dados?.sessoesPorCanal ?? []

  const totalSessoes = sessoesPorDia.reduce((s, d) => s + d.sessions, 0)
  const totalUsuarios = sessoesPorDia.reduce((s, d) => s + d.totalUsers, 0)
  const totalPageViews = sessoesPorDia.reduce((s, d) => s + d.screenPageViews, 0)
  const totalEngajadas = sessoesPorDia.reduce((s, d) => s + d.engagedSessions, 0)
  const taxaEngajamento = totalSessoes > 0 ? (totalEngajadas / totalSessoes) * 100 : 0

  const totalCanais = sessoesPorCanal.reduce((s, c) => s + c.sessions, 0) || 1
  const pizza = sessoesPorCanal.map((c) => ({
    name: c.canal, value: Math.round((c.sessions / totalCanais) * 100), sessions: c.sessions, color: corDoCanal(c.canal),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <PerfMetricCard label="Sessões" value={totalSessoes.toLocaleString('pt-BR')} color="#4285F4" icon={<Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
        <PerfMetricCard label="Usuários" value={totalUsuarios.toLocaleString('pt-BR')} color="#8B5CF6" icon={<Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />} />
        <PerfMetricCard label="Page Views" value={totalPageViews.toLocaleString('pt-BR')} color="#10B981" icon={<Ico d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />} />
        <PerfMetricCard label="Taxa de Engajamento" value={`${taxaEngajamento.toFixed(1)}%`} sub={`${totalEngajadas.toLocaleString('pt-BR')} sessões engajadas`} color="#F59E0B" icon={<Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        <ChartCard title="Sessões por dia (GA4)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sessoesPorDia.map((d) => ({ dia: fmtDia(d.data), sessions: d.sessions }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} />
              <Tooltip {...tt} formatter={(v) => [Number(v).toLocaleString('pt-BR'), 'Sessões']} />
              <Line type="monotone" dataKey="sessions" stroke="#4285F4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sessões por canal (GA4)">
          {pizza.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, fontSize: 12, color: 'var(--t3)' }}>
              Sem dado no período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pizza} dataKey="value" innerRadius={34} outerRadius={56} paddingAngle={3} startAngle={90} endAngle={450}>
                    {pizza.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v, _n, item) => [`${v}% · ${(item.payload.sessions as number).toLocaleString('pt-BR')} sessões`, item.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 90, overflowY: 'auto' }}>
                {pizza.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 10.5, color: 'var(--t2)' }}>{c.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t1)' }}>{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
