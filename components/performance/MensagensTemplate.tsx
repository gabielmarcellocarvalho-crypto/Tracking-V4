'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import PerfMetricCard from './PerfMetricCard'
import { perfMsgData } from '@/lib/demo-data-performance'

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

const STATUS_MSG: Record<string, { label: string; color: string; bg: string }> = {
  'converteu':    { label: 'Converteu',    color: '#10B981', bg: 'rgba(16,185,129,.1)'  },
  'em contato':   { label: 'Em contato',   color: '#3B82F6', bg: 'rgba(59,130,246,.1)'  },
  'sem resposta': { label: 'Sem resposta', color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
}

export default function MensagensTemplate({ dados, real }: { dados?: typeof perfMsgData; real?: boolean } = {}) {
  const { kpis, diario, funil, canais, recentes } = dados ?? perfMsgData

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <PerfMetricCard label="Investimento"        value={`R$${kpis.investimento.toLocaleString('pt-BR')}`} trend={real ? undefined : "↑ +12,4% vs mês ant."} trendUp color="#C8102E" icon={<Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />
        <PerfMetricCard label="Contatos Iniciados"  value={kpis.totalContatos.toLocaleString('pt-BR')}      trend={real ? undefined : "↑ +14,2% vs mês ant."} trendUp color="#25D366" icon={<Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
        <PerfMetricCard label="Custo por Mensagem"  value={`R$${kpis.cpm.toFixed(2)}`}                     trend={real ? undefined : "↓ -R$1,80 vs mês ant."} trendUp color="#F59E0B" icon={<Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
        <PerfMetricCard label="Taxa de Resposta"    value={`${kpis.taxaResposta}%`}                         trend={real ? undefined : "↑ +4% vs mês ant."}    trendUp color="#3B82F6" icon={<Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />} />
        <PerfMetricCard label="Conversões WhatsApp"  value={kpis.conversoes.toString()}                     trend={real ? undefined : "↑ +22 vs mês ant."}    trendUp color="#25D366" icon={<Ico d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />} />
        <PerfMetricCard label="CPA via Mensagens"   value={`R$${kpis.cpa}`}                                trend={real ? undefined : "↓ -R$18 vs mês ant."}  trendUp color="#F59E0B" icon={<Ico d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" />} />
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <ChartCard title="Contatos por dia">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} />
              <Tooltip {...tt} formatter={(v: any) => [v, 'Contatos']} />
              <Bar dataKey="contatos" fill="#25D366" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Custo por mensagem ao longo do tempo">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={diario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} domain={[19, 26]} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...tt} formatter={(v: any) => [`R$${v.toFixed(2)}`, 'CPM']} />
              <Line type="monotone" dataKey="cpm" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Funil */}
        <ChartCard title="Funil: Anúncio → Mensagem → Lead → Comprou">
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

        {/* Canais */}
        <ChartCard title="Origem dos contatos por canal">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={canais} dataKey="value" innerRadius={32} outerRadius={52} paddingAngle={3} startAngle={90} endAngle={450}>
                  {canais.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v: any, n: any) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canais.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{c.value}%</span>
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
            Contatos recentes
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
              const cfg = STATUS_MSG[r.status] ?? STATUS_MSG['em contato']
              return (
                <tr key={i} style={{ borderBottom: i < recentes.length - 1 ? '1px solid var(--br)' : 'none', transition: 'background .12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-s)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '11px 18px', fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>{r.nome}</td>
                  <td style={{ padding: '11px 18px', fontSize: 11 }}>
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
