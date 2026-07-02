'use client'

import { useState } from 'react'
import type { ClienteTipo } from '@/lib/demo-data'
import DateRangePicker, { type DateRange } from './DateRangePicker'

const tipoConfig: Record<ClienteTipo, { label: string; bg: string; color: string }> = {
  ecommerce: { label: 'E-COMMERCE', bg: 'rgba(200,16,46,.1)',  color: '#C8102E' },
  leads:     { label: 'LEADS',      bg: 'rgba(59,130,246,.1)', color: '#3B82F6' },
  mensagens: { label: 'MENSAGENS',  bg: 'rgba(245,158,11,.1)', color: '#F59E0B' },
}

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[15px] h-[15px]">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

export interface DashboardHeaderProps {
  clienteName: string
  clienteTipo?: ClienteTipo
}

export default function DashboardHeader({ clienteName, clienteTipo = 'leads' }: DashboardHeaderProps) {
  const tipo = tipoConfig[clienteTipo]

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end   = new Date(); end.setHours(0, 0, 0, 0)
    const start = addDays(end, -29)
    return { start, end, label: '30 dias' }
  })

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
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.06em', padding: '2px 7px', borderRadius: 4, background: tipo.bg, color: tipo.color }}>
            {tipo.label}
          </span>
        </div>
      </div>

      {/* Date range picker (replaces old period dropdown) */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* Bell */}
      <button
        title="Notificações"
        style={{ ...btnBase, padding: 0, width: 36, height: 36, justifyContent: 'center', color: 'var(--t2)' }}
        onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.color = 'var(--red)'; el.style.boxShadow = '0 0 0 3px var(--red-gl),0 4px 12px rgba(200,16,46,.2)'; el.style.transform = 'translateY(-1px)' }}
        onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.color = 'var(--t2)'; el.style.boxShadow = 'none'; el.style.transform = 'none' }}
      >
        <BellIcon />
      </button>

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
