'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import PerfMetricCard from './PerfMetricCard'
import { perfLeadsData } from '@/lib/demo-data-performance'

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

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  'qualificado':     { label: 'Qualificado',     color: '#10B981', bg: 'rgba(16,185,129,.1)'  },
  'lead':            { label: 'Lead',             color: '#3B82F6', bg: 'rgba(59,130,246,.1)'  },
  'nao-qualificado': { label: 'Não qualificado',  color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
  'vendeu':          { label: 'Converteu',        color: '#C8102E', bg: 'rgba(200,16,46,.1)'   },
}

export default function LeadsTemplate({ dados, real }: { dados?: typeof perfLeadsData; real?: boolean } = {}) {
  const { kpis, diario, funil, canais, qualChart, recentes } = dados ?? perfLeadsData

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <PerfMetricCard label="Investimento"      value={`R$${kpis.investimento.toLocaleString('pt-BR')}`} trend={real ? undefined : "↑ +12,4% vs mês ant."} trendUp color="#C8102E" icon={<Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />
        <PerfMetricCard label="Total de Leads"    value={kpis.totalLeads.toLocaleString('pt-BR')}          trend={real ? undefined : "↑ +8,3% vs mês ant."}  trendUp color="#8B5CF6" icon={<Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />} />
        <PerfMetricCard label="CPL (Custo por Lead)" value={`R$${kpis.cpl.toFixed(2)}`}                  trend={real ? undefined : "↓ -R$1,20 vs mês ant."} trendUp color="#3B82F6" icon={<Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
        <PerfMetricCard label="Taxa Lead → Venda" value={`${kpis.taxaConversao}%`} sub={`${Math.round(kpis.totalLeads * kpis.taxaConversao / 100)} vendas fechadas`} trend={real ? undefined : "↑ +1,2% vs mês ant."} trendUp color="#10B981" icon={<Ico d="M18 20V10M12 20V4M6 20v-6" />} />
        <PerfMetricCard label="Leads Qualificados" value={`${kpis.qualificados} / ${kpis.naoQualificados}`} sub="Qualif. / Não qualif." color="#F59E0B" icon={<Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />} />
        <PerfMetricCard label="CPA (Custo por Aq.)" value={`R$${kpis.cpa}`} trend={real ? undefined : "↓ -R$12 vs mês ant."} trendUp color="#F59E0B" icon={<Ico d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" />} />
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <ChartCard title="Leads por dia">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} />
              <Tooltip {...tt} formatter={(v: any) => [v, 'Leads']} />
              <Bar dataKey="leads" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CPL ao longo do tempo">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={diario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} domain={[13, 16]} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...tt} formatter={(v: any) => [`R$${v.toFixed(2)}`, 'CPL']} />
              <Line type="monotone" dataKey="cpl" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Funil */}
        <ChartCard title="Funil de conversão">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {funil.map((step, i) => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{step.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{step.count.toLocaleString('pt-BR')} · {step.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-s)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 4 }} />
                </div>
                {i < funil.length - 1 && (
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, textAlign: 'right' }}>
                    ↓ {((funil[i + 1].count / step.count) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Origem por canal */}
        <ChartCard title="Origem dos leads por canal">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={canais} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={3} startAngle={90} endAngle={450}>
                  {canais.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v: any, n: any) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {canais.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 10.5, color: 'var(--t2)' }}>{c.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Qualificados vs Não */}
        <ChartCard title="Leads qualif. vs não qualif.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={qualChart} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={3} startAngle={90} endAngle={450}>
                  {qualChart.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {qualChart.map((c) => (
                <div key={c.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.color, lineHeight: 1, paddingLeft: 14 }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--br)' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
            Leads recentes
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nome', 'Origem', 'Campanha', 'Status', 'Data'].map((h) => (
                <th key={h} style={{ padding: '8px 18px', textAlign: 'left', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentes.map((r, i) => {
              const cfg = STATUS_CFG[r.status] ?? STATUS_CFG['lead']
              return (
                <tr key={i} style={{ borderBottom: i < recentes.length - 1 ? '1px solid var(--br)' : 'none', transition: 'background .12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-s)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '11px 18px', fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>{r.nome}</td>
                  <td style={{ padding: '11px 18px', fontSize: 11, color: 'var(--t2)' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 5, background: r.origem === 'Meta Ads' ? 'rgba(24,119,242,.12)' : r.origem === 'Google Ads' ? 'rgba(66,133,244,.12)' : 'rgba(255,255,255,.06)', color: r.origem === 'Meta Ads' ? '#1877F2' : r.origem === 'Google Ads' ? '#4285F4' : 'var(--t3)', fontWeight: 600 }}>
                      {r.origem}
                    </span>
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace' }}>{r.campanha}</td>
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 11, color: 'var(--t3)' }}>{r.data}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
