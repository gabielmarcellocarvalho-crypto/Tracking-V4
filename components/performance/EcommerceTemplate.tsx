'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import PerfMetricCard from './PerfMetricCard'
import { perfEcData } from '@/lib/demo-data-performance'

const tt = {
  contentStyle: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 11, color: '#f0f0f0' },
  labelStyle:   { color: '#777' },
  cursor:       { fill: 'rgba(255,255,255,.03)' },
}
const ax = { tick: { fill: '#555', fontSize: 10 }, axisLine: false, tickLine: false }

function ChartCard({ title, children, col2 }: { title: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12,
      padding: '16px 18px', gridColumn: col2 ? '1 / -1' : undefined,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 14 }}>
        {title}
      </div>
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

export default function EcommerceTemplate({ dados, real }: { dados?: typeof perfEcData; real?: boolean } = {}) {
  const { kpis, diario, funil, canais, topProdutos, recentes } = dados ?? perfEcData
  const maxProd = Math.max(...topProdutos.map((p) => p.vendas))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <PerfMetricCard label="Investimento"     value={`R$${kpis.investimento.toLocaleString('pt-BR')}`} trend={real ? undefined : "↑ +12,4% vs mês ant."} trendUp color="#C8102E" icon={<Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />
        <PerfMetricCard label="Receita Atribuída" value={`R$${kpis.receita.toLocaleString('pt-BR')}`}    trend={real ? undefined : "↑ +28,1% vs mês ant."} trendUp color="#10B981" icon={<Ico d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />} />
        <PerfMetricCard label="ROAS Geral"        value={`${kpis.roas}x`}                                trend={real ? undefined : "↑ +0,7x vs mês ant."}  trendUp color="#3B82F6" icon={<Ico d="M18 20V10M12 20V4M6 20v-6" />} />
        <PerfMetricCard label="Ticket Médio"      value={`R$${kpis.ticketMedio}`}                        trend={real ? undefined : "↑ +4,2% vs mês ant."}  trendUp color="#8B5CF6" icon={<Ico d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />} />
        <PerfMetricCard label="Total de Compras"  value={kpis.totalCompras.toString()}                   trend={real ? undefined : "↑ +6,8% vs mês ant."}  trendUp color="#F59E0B" icon={<Ico d="M5 12h14M12 5l7 7-7 7" />} />
        <PerfMetricCard label="Abandono de Carrinho" value={`${kpis.taxaAbandono}%`} sub="Checkout vs Compra" trend={real ? undefined : "↓ -3% vs mês ant."} trendUp={false} color="#EF4444" icon={<Ico d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />} />
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <ChartCard title="Receita vs Investimento por dia">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diario} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tt} formatter={(v: any, n: any) => [`R$${v.toLocaleString('pt-BR')}`, n === 'receita' ? 'Receita' : 'Investimento']} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#777', paddingTop: 8 }} />
              <Bar dataKey="receita"      name="Receita"      fill="#10B981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="investimento" name="Investimento" fill="#C8102E" radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ROAS ao longo do tempo">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={diario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="dia" {...ax} />
              <YAxis {...ax} domain={[4, 5.5]} tickFormatter={(v) => `${v}x`} />
              <Tooltip {...tt} formatter={(v: any) => [`${v}x`, 'ROAS']} />
              <Line type="monotone" dataKey="roas" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Funnel */}
        <ChartCard title="Funil de conversão">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {funil.map((step, i) => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{step.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{step.count.toLocaleString('pt-BR')} · {step.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-s)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 4, transition: 'width .8s ease' }} />
                </div>
                {i < funil.length - 1 && (
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, textAlign: 'right' }}>
                    ↓ {((funil[i + 1].count / step.count) * 100).toFixed(1)}% passaram
                  </div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Pie - Canais */}
        <ChartCard title="Vendas por canal">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={canais} dataKey="value" innerRadius={32} outerRadius={52} paddingAngle={3} startAngle={90} endAngle={450}>
                  {canais.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v: any, n: any) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {canais.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--t2)' }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Top Produtos */}
        <ChartCard title="Top produtos vendidos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topProdutos.map((p, i) => (
              <div key={p.nome}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--t3)', width: 14 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{p.nome}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', flexShrink: 0, marginLeft: 4 }}>
                    R${p.receita.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-s)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.vendas / maxProd) * 100}%`, background: 'linear-gradient(90deg, #C8102E, #ef4444)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--br)' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
            Compradores recentes
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nome', 'Origem', 'Campanha', 'Valor', 'Data'].map((h) => (
                <th key={h} style={{ padding: '8px 18px', textAlign: 'left', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentes.map((r, i) => (
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
                <td style={{ padding: '11px 18px', fontSize: 12, fontWeight: 700, color: '#10B981' }}>R${r.valor.toFixed(2)}</td>
                <td style={{ padding: '11px 18px', fontSize: 11, color: 'var(--t3)' }}>{r.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
