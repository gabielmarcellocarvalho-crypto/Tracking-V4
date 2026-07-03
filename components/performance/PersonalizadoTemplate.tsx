'use client'

import { useState, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import PerfMetricCard from './PerfMetricCard'
import {
  AVAILABLE_BLOCKS, DEFAULT_PERSONALIZADO_BLOCKS,
  perfEcData, perfLeadsData, perfMsgData,
} from '@/lib/demo-data-performance'
import type { agregarPerformance } from '@/lib/data/agregacoes'

type PerformanceAggregate = ReturnType<typeof agregarPerformance>

const tt = {
  contentStyle: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 11, color: '#f0f0f0' },
  labelStyle: { color: '#777' },
  cursor: { fill: 'rgba(255,255,255,.03)' },
}
const ax = { tick: { fill: '#555', fontSize: 10 }, axisLine: false, tickLine: false }

function Ico({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d={d} />
    </svg>
  )
}

function ChartCard({ title, children, col2 }: { title: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px', gridColumn: col2 ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

// ── Estado vazio genérico (usado quando não há dado real ainda) ───────────────
function SemDados({ texto }: { texto: string }) {
  return <p style={{ fontSize: 11.5, color: 'var(--t3)', padding: '20px 0', textAlign: 'center' }}>{texto}</p>
}

// ── Block renderer ────────────────────────────────────────────────────────────
// `dados`/`real` só chegam preenchidos para clientes reais (ver PersonalizadoTemplate);
// nesse caso as métricas vêm de `agregarPerformance` — zero é honesto (aguardando
// conexão de ads ainda não é fabricado), e o que não tem equivalente real ainda
// (match rate CAPI/G.EC, metas, breakdown por campanha) mostra "—"/estado vazio
// em vez de inventar um número.
function renderBlock(blockId: string, dados: PerformanceAggregate | undefined, real: boolean) {
  const d = perfEcData
  const l = perfLeadsData
  const m = perfMsgData
  const p = dados

  if (real) {
    const k = p?.kpis
    const cardsReal: Record<string, React.ReactNode> = {
      'card-investimento':  <PerfMetricCard label="Investimento"       value={`R$${(k?.investimento ?? 0).toLocaleString('pt-BR')}`} color="#C8102E" icon={<Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />,
      'card-receita':       <PerfMetricCard label="Receita"            value={`R$${(k?.receita ?? 0).toLocaleString('pt-BR')}`}      color="#10B981" icon={<Ico d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />} />,
      'card-roas':          <PerfMetricCard label="ROAS"               value={`${k?.roas ?? 0}x`}                                     color="#3B82F6" icon={<Ico d="M18 20V10M12 20V4M6 20v-6" />} />,
      'card-cpl':           <PerfMetricCard label="CPL"                value={`R$${k?.cpl ?? 0}`}                                     color="#8B5CF6" icon={<Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />} />,
      'card-cpa':           <PerfMetricCard label="CPA"                value="—"                                                       color="#F59E0B" icon={<Ico d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" />} />,
      'card-ticket':        <PerfMetricCard label="Ticket Médio"       value={`R$${k?.ticketMedio ?? 0}`}                             color="#10B981" icon={<Ico d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />} />,
      'card-leads':         <PerfMetricCard label="Total de Leads"     value={(k?.totalLeads ?? 0).toLocaleString('pt-BR')}           color="#8B5CF6" icon={<Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8" />} />,
      'card-compras':       <PerfMetricCard label="Total de Compras"   value={(k?.totalCompras ?? 0).toLocaleString('pt-BR')}         color="#10B981" icon={<Ico d="M5 12h14M12 5l7 7-7 7" />} />,
      'card-conversao':     <PerfMetricCard label="Taxa de Conversão"  value={`${k?.taxaConversao ?? 0}%`}                            color="#3B82F6" icon={<Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />} />,
      'card-capi':          <PerfMetricCard label="Match Rate CAPI"    value="—"                                                       color="#C8102E" icon={<Ico d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />} />,
      'card-gec':           <PerfMetricCard label="Match Rate G. EC"   value="—"                                                       color="#4285F4" icon={<Ico d="M21.21 15.89A10 10 0 1 1 8 2.83" />} />,
      'card-eventos':       <PerfMetricCard label="Total Eventos"      value={(k?.totalEventos ?? 0).toLocaleString('pt-BR')}         color="#F59E0B" icon={<Ico d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />} />,
      'card-qualificados':  <PerfMetricCard label="Leads Qualificados" value="—"                                                       color="#8B5CF6" icon={<Ico d="M9 11l3 3L22 4" />} />,
      'card-abandono':      <PerfMetricCard label="Taxa de Abandono"   value={`${k?.taxaAbandono ?? 0}%`}                             color="#EF4444" icon={<Ico d="M3 3h2l.4 2M7 13h10l4-8H5.4" />} />,
      'card-cpm':           <PerfMetricCard label="Custo por Mensagem" value="—"                                                       color="#F59E0B" icon={<Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14" />} />,
      'card-contatos':      <PerfMetricCard label="Total de Contatos"  value={(k?.totalLeads ?? 0).toLocaleString('pt-BR')}           color="#25D366" icon={<Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14" />} />,
    }
    if (cardsReal[blockId]) return cardsReal[blockId]
  } else {
    const cardsDemo: Record<string, React.ReactNode> = {
      'card-investimento':  <PerfMetricCard label="Investimento"       value="R$18.420"  trend="↑ +12,4%"  trendUp color="#C8102E" icon={<Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />,
      'card-receita':       <PerfMetricCard label="Receita"            value="R$90.200"  trend="↑ +28,1%"  trendUp color="#10B981" icon={<Ico d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />} />,
      'card-roas':          <PerfMetricCard label="ROAS"               value="4,90x"     trend="↑ +0,7x"   trendUp color="#3B82F6" icon={<Ico d="M18 20V10M12 20V4M6 20v-6" />} />,
      'card-cpl':           <PerfMetricCard label="CPL"                value="R$14,30"   trend="↓ -R$1,20" trendUp color="#8B5CF6" icon={<Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />} />,
      'card-cpa':           <PerfMetricCard label="CPA"                value="R$148"     trend="↓ -R$12"   trendUp color="#F59E0B" icon={<Ico d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" />} />,
      'card-ticket':        <PerfMetricCard label="Ticket Médio"       value="R$234"     trend="↑ +4,2%"   trendUp color="#10B981" icon={<Ico d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />} />,
      'card-leads':         <PerfMetricCard label="Total de Leads"     value="1.289"     trend="↑ +8,3%"   trendUp color="#8B5CF6" icon={<Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8" />} />,
      'card-compras':       <PerfMetricCard label="Total de Compras"   value="385"       trend="↑ +6,8%"   trendUp color="#10B981" icon={<Ico d="M5 12h14M12 5l7 7-7 7" />} />,
      'card-conversao':     <PerfMetricCard label="Taxa de Conversão"  value="12,4%"     trend="↑ +1,2%"   trendUp color="#3B82F6" icon={<Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />} />,
      'card-capi':          <PerfMetricCard label="Match Rate CAPI"    value="84%"       trend="↑ +3%"     trendUp color="#C8102E" icon={<Ico d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />} />,
      'card-gec':           <PerfMetricCard label="Match Rate G. EC"   value="78%"       trend="↑ +2%"     trendUp color="#4285F4" icon={<Ico d="M21.21 15.89A10 10 0 1 1 8 2.83" />} />,
      'card-eventos':       <PerfMetricCard label="Total Eventos"      value="124.800"   trend="↑ +18,4%"  trendUp color="#F59E0B" icon={<Ico d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />} />,
      'card-qualificados':  <PerfMetricCard label="Leads Qualificados" value="780"       trend="↑ +9,1%"   trendUp color="#8B5CF6" icon={<Ico d="M9 11l3 3L22 4" />} />,
      'card-abandono':      <PerfMetricCard label="Taxa de Abandono"   value="68%"       trend="↓ -3%"     trendUp color="#EF4444" icon={<Ico d="M3 3h2l.4 2M7 13h10l4-8H5.4" />} />,
      'card-cpm':           <PerfMetricCard label="Custo por Mensagem" value="R$22,10"   trend="↓ -R$1,80" trendUp color="#F59E0B" icon={<Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14" />} />,
      'card-contatos':      <PerfMetricCard label="Total de Contatos"  value="835"       trend="↑ +14,2%"  trendUp color="#25D366" icon={<Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14" />} />,
    }
    if (cardsDemo[blockId]) return cardsDemo[blockId]
  }

  const diario = real ? (p?.diario ?? []) : null
  const funil  = real ? (p?.funil ?? [])  : null
  const canais = real ? (p?.canais ?? []) : null
  const recentesLeads   = real ? (p?.recentes ?? []).filter((r) => r.status === 'lead')   : null
  const recentesCompras = real ? (p?.recentes ?? []).filter((r) => r.status === 'vendeu') : null

  if (blockId === 'chart-bar') return (
    <ChartCard title="Receita vs Investimento">
      {real && diario!.length === 0 ? <SemDados texto="Sem eventos suficientes ainda" /> : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={real ? diario! : d.diario}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="dia" {...ax} />
            <YAxis {...ax} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tt} formatter={(v: any, n: any) => [`R$${v.toLocaleString('pt-BR')}`, n === 'receita' ? 'Receita' : 'Investimento']} />
            <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="investimento" name="Investimento" fill="#C8102E" radius={[3, 3, 0, 0]} opacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )

  if (blockId === 'chart-leads-dia') return (
    <ChartCard title="Leads por Dia">
      {real && diario!.length === 0 ? <SemDados texto="Sem eventos suficientes ainda" /> : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={real ? diario! : l.diario}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="dia" {...ax} />
            <YAxis {...ax} />
            <Tooltip {...tt} formatter={(v: any) => [v, 'Leads']} />
            <Bar dataKey="leads" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )

  if (blockId === 'chart-roas') return (
    <ChartCard title="ROAS ao Longo do Tempo">
      {real && diario!.length === 0 ? <SemDados texto="Sem eventos suficientes ainda" /> : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={real ? diario! : d.diario}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="dia" {...ax} />
            <YAxis {...ax} tickFormatter={(v) => `${v}x`} />
            <Tooltip {...tt} formatter={(v: any) => [`${v}x`, 'ROAS']} />
            <Line type="monotone" dataKey="roas" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )

  if (blockId === 'chart-cpl') return (
    <ChartCard title="CPL ao Longo do Tempo">
      {real && diario!.length === 0 ? <SemDados texto="Sem eventos suficientes ainda" /> : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={real ? diario! : l.diario}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="dia" {...ax} />
            <YAxis {...ax} tickFormatter={(v) => `R$${v}`} />
            <Tooltip {...tt} formatter={(v: any) => [`R$${v.toFixed(2)}`, 'CPL']} />
            <Line type="monotone" dataKey="cpl" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )

  if (blockId === 'chart-funil') return (
    <ChartCard title="Funil de Conversão">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(real ? funil! : d.funil).map((step) => (
          <div key={step.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{step.label}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{step.count.toLocaleString('pt-BR')} · {step.pct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-s)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )

  if (blockId === 'chart-canais') return (
    <ChartCard title="Origem por Canal">
      {real && canais!.length === 0 ? <SemDados texto="Sem eventos suficientes ainda" /> : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={real ? canais! : d.canais} dataKey="value" innerRadius={26} outerRadius={46} paddingAngle={3} startAngle={90} endAngle={450}>
                {(real ? canais! : d.canais).map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip {...tt} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(real ? canais! : d.canais).map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--t2)' }}>{c.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )

  if (blockId === 'chart-campanhas') return (
    <ChartCard title="Top Campanhas" col2>
      {real ? <SemDados texto="Sem dados de campanha suficientes ainda — aguardando conexão com as APIs de ads" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { nome: 'CAM_META_CONV_JUN', leads: 423, receita: 32100, cor: '#1877F2' },
            { nome: 'BRAND_SEARCH_JUN',  leads: 289, receita: 22800, cor: '#4285F4' },
            { nome: 'CAM_META_PROS_JUN', leads: 198, receita: 14200, cor: '#1877F2' },
            { nome: 'DISPLAY_RETAR_JUN', leads: 142, receita: 11400, cor: '#4285F4' },
            { nome: 'CAM_LOOK_JUN',      leads: 89,  receita: 6800,  cor: '#1877F2' },
          ].map((c) => (
            <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: 'var(--t2)', fontFamily: 'monospace' }}>{c.nome}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)', width: 60 }}>{c.leads} leads</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981', width: 80, textAlign: 'right' }}>R${c.receita.toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  )

  if (blockId === 'table-leads') return (
    <ChartCard title="Leads Recentes" col2>
      {real && recentesLeads!.length === 0 ? <SemDados texto="Nenhum lead recente ainda" /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Nome', 'Origem', 'Status', 'Data'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(real ? recentesLeads! : l.recentes).map((r, i, arr) => (
              <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--br)' : 'none' }}>
                <td style={{ padding: '9px 10px', fontSize: 11.5, color: 'var(--t1)' }}>{r.nome}</td>
                <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--t2)' }}>{r.origem}</td>
                <td style={{ padding: '9px 10px', fontSize: 10.5, fontWeight: 600, color: r.status === 'qualificado' ? '#10B981' : r.status === 'vendeu' ? '#C8102E' : 'var(--t3)' }}>{r.status}</td>
                <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--t3)' }}>{r.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ChartCard>
  )

  if (blockId === 'table-compras') return (
    <ChartCard title="Compras Recentes" col2>
      {real && recentesCompras!.length === 0 ? <SemDados texto="Nenhuma compra recente ainda" /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Nome', 'Origem', 'Valor', 'Data'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(real ? recentesCompras! : d.recentes).map((r, i, arr) => (
              <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--br)' : 'none' }}>
                <td style={{ padding: '9px 10px', fontSize: 11.5, color: 'var(--t1)' }}>{r.nome}</td>
                <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--t2)' }}>{r.origem}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 700, color: '#10B981' }}>R${(r.valor ?? 0).toFixed(2)}</td>
                <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--t3)' }}>{r.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ChartCard>
  )

  if (blockId === 'table-campanhas') return (
    <ChartCard title="Top Campanhas por Lead" col2>
      {real ? <SemDados texto="Sem dados de campanha suficientes ainda — aguardando conexão com as APIs de ads" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[{ nome: 'CAM_META_CONV_JUN', leads: 423, cpl: 'R$12,80' }, { nome: 'BRAND_SEARCH_JUN', leads: 289, cpl: 'R$15,40' }, { nome: 'CAM_META_PROS_JUN', leads: 198, cpl: 'R$13,20' }].map((c) => (
            <div key={c.nome} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--br)' }}>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--t2)', fontFamily: 'monospace' }}>{c.nome}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{c.leads} leads</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{c.cpl}</span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  )

  if (blockId === 'extra-meta-inv') return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 12 }}>Meta de Investimento</div>
      {real ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>R${(p?.kpis.investimento ?? 0).toLocaleString('pt-BR')}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Sem meta definida ainda</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>R$18.420</span>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>meta R$20.000</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-s)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '92%', background: 'linear-gradient(90deg, #C8102E, #ef4444)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>92% da meta atingida</div>
        </>
      )}
    </div>
  )

  if (blockId === 'extra-meta-leads') return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 12 }}>Meta de Leads</div>
      {real ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>{(p?.kpis.totalLeads ?? 0).toLocaleString('pt-BR')} leads</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Sem meta definida ainda</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>1.289 leads</span>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>meta 1.500</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-s)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '86%', background: 'linear-gradient(90deg, #8B5CF6, #a78bfa)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>86% da meta atingida</div>
        </>
      )}
    </div>
  )

  if (blockId === 'extra-saude') return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 12 }}>Saúde do Tracking</div>
      {real ? (
        <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>Verifique a aba Tracking para o status de saúde do rastreamento.</p>
      ) : [
        { label: 'Pixel Meta',      status: 'ok',      icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
        { label: 'Cookies fbp/fbc', status: 'ok',      icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
        { label: 'Meta CAPI',       status: 'warning', icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
        { label: 'Google EC',       status: 'ok',      icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
      ].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ color: item.status === 'ok' ? '#10B981' : '#F59E0B' }}>
            <Ico d={item.icon} size={13} />
          </span>
          <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: item.status === 'ok' ? '#10B981' : '#F59E0B', background: item.status === 'ok' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', padding: '2px 7px', borderRadius: 20 }}>
            {item.status === 'ok' ? 'OK' : 'Atenção'}
          </span>
        </div>
      ))}
    </div>
  )

  return null
}

// ── Block type helpers ────────────────────────────────────────────────────────
const isCard = (id: string) => id.startsWith('card-')
const isFullWidth = (id: string) =>
  id === 'chart-campanhas' || id === 'table-leads' || id === 'table-compras' || id === 'table-campanhas'

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  clienteId: string
  initialBlocks?: string[]
  dados?: PerformanceAggregate
  real?: boolean
}

export default function PersonalizadoTemplate({ clienteId, initialBlocks, dados, real }: Props) {
  const [blocks, setBlocks] = useState<string[]>(initialBlocks ?? DEFAULT_PERSONALIZADO_BLOCKS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dragNode = useRef<HTMLDivElement | null>(null)

  const cats = Array.from(new Set(AVAILABLE_BLOCKS.map((b) => b.cat)))

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clientes', clienteId, 'performance_config', 'main'),
        { template: 'personalizado', blocos_personalizados: blocks.map((id, i) => ({ id, posicao: i })) },
        { merge: true }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* Firestore não configurado ainda */ }
    finally { setSaving(false) }
  }

  const toggle = (id: string) => {
    setBlocks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  // HTML5 drag-and-drop reorder
  const onDragStart = (i: number) => setDragIdx(i)
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i) }
  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return
    const next = [...blocks]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setBlocks(next)
    setDragIdx(null)
    setDragOver(null)
  }

  // Separate blocks into cards (grid-auto) vs wider blocks
  const cardBlocks = blocks.filter((id) => isCard(id))
  const otherBlocks = blocks.filter((id) => !isCard(id))

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, border: '1px solid var(--br)', background: 'var(--bg-c)',
            color: 'var(--t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
          }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.color = 'var(--red)' }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.color = 'var(--t2)' }}
        >
          <Ico d="M12 5v14M5 12h14" size={13} />
          Adicionar bloco
        </button>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
          {blocks.length} bloco{blocks.length !== 1 ? 's' : ''} ativos · arraste para reordenar
        </span>
      </div>

      {/* ── Metric cards ── */}
      {cardBlocks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {cardBlocks.map((id, i) => {
            const globalIdx = blocks.indexOf(id)
            return (
              <div
                key={id}
                draggable
                onDragStart={() => onDragStart(globalIdx)}
                onDragOver={(e) => onDragOver(e, globalIdx)}
                onDrop={() => onDrop(globalIdx)}
                onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                style={{
                  opacity: dragIdx === globalIdx ? 0.4 : 1,
                  outline: dragOver === globalIdx ? '2px solid var(--red)' : 'none',
                  borderRadius: 12,
                  cursor: 'grab',
                  transition: 'opacity .15s, outline .1s',
                }}
              >
                {renderBlock(id, dados, !!real)}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Other blocks (charts, tables, extras) ── */}
      {otherBlocks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {otherBlocks.map((id) => {
            const globalIdx = blocks.indexOf(id)
            const full = isFullWidth(id)
            return (
              <div
                key={id}
                draggable
                onDragStart={() => onDragStart(globalIdx)}
                onDragOver={(e) => onDragOver(e, globalIdx)}
                onDrop={() => onDrop(globalIdx)}
                onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                style={{
                  gridColumn: full ? '1 / -1' : undefined,
                  opacity: dragIdx === globalIdx ? 0.4 : 1,
                  outline: dragOver === globalIdx ? '2px solid var(--red)' : 'none',
                  borderRadius: 12,
                  cursor: 'grab',
                  transition: 'opacity .15s, outline .1s',
                }}
              >
                {renderBlock(id, dados, !!real)}
              </div>
            )
          })}
        </div>
      )}

      {blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
          <Ico d="M12 5v14M5 12h14" size={28} />
          <p style={{ marginTop: 12, fontSize: 14 }}>Nenhum bloco adicionado ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Clique em "Adicionar bloco" para começar a montar seu dashboard</p>
        </div>
      )}

      {/* ── Save button ── */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 10,
            background: saved ? '#10B981' : 'var(--red)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            boxShadow: `0 8px 24px ${saved ? 'rgba(16,185,129,.4)' : 'rgba(200,16,46,.4)'}`,
            transition: 'background .3s, box-shadow .3s',
          }}
        >
          <Ico d={saved ? 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' : 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8'} size={14} />
          {saved ? 'Salvo!' : saving ? 'Salvando…' : 'Salvar layout'}
        </button>
      </div>

      {/* ── Block picker panel ── */}
      {panelOpen && (
        <>
          <div
            onClick={() => setPanelOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
            background: 'var(--bg-s)', borderLeft: '1px solid var(--br)',
            zIndex: 51, display: 'flex', flexDirection: 'column',
            animation: 'slideInRight .22s cubic-bezier(.22,1,.36,1)',
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Blocos disponíveis</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{blocks.length} selecionados</div>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Ico d="M18 6L6 18M6 6l12 12" size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              {cats.map((cat) => (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 8 }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {AVAILABLE_BLOCKS.filter((b) => b.cat === cat).map((b) => {
                      const active = blocks.includes(b.id)
                      return (
                        <button
                          key={b.id}
                          onClick={() => toggle(b.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                            borderRadius: 8, border: `1px solid ${active ? b.color + '44' : 'var(--br)'}`,
                            background: active ? b.color + '0d' : 'var(--bg-c)',
                            cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12, color: active ? 'var(--t1)' : 'var(--t2)', fontWeight: active ? 600 : 400 }}>{b.label}</span>
                          {active && (
                            <span style={{ fontSize: 10, color: b.color, fontWeight: 700 }}>✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--br)' }}>
              <button
                onClick={() => setPanelOpen(false)}
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Confirmar seleção
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
