'use client'

import type { Lead, LeadSource, LeadEvent } from '@/lib/mock-data'

// ─── Badge configs ────────────────────────────────────────────────────────────
const sourceBadge: Record<LeadSource, { bg: string; color: string; label: string }> = {
  'Meta Ads':   { bg: 'rgba(59,130,246,.1)',  color: '#3B82F6', label: 'Meta Ads' },
  'Google Ads': { bg: 'rgba(249,115,22,.1)',  color: '#F97316', label: 'Google Ads' },
  'GA4':        { bg: 'rgba(227,116,0,.1)',   color: '#E37400', label: 'GA4' },
  'Orgânico':   { bg: 'rgba(139,92,246,.1)',  color: '#8B5CF6', label: 'Orgânico' },
}

const eventBadge: Record<LeadEvent, { bg: string; color: string }> = {
  'Compra':    { bg: 'rgba(16,185,129,.1)',  color: '#10B981' },
  'Checkout':  { bg: 'rgba(249,115,22,.1)',  color: '#F97316' },
  'Lead':      { bg: 'rgba(59,130,246,.1)',  color: '#3B82F6' },
  'Page View': { bg: 'rgba(139,92,246,.1)',  color: '#8B5CF6' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-[500]"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" className="w-[11px] h-[11px]">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" className="w-[11px] h-[11px]">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

// ─── LeadsTable ───────────────────────────────────────────────────────────────
export interface LeadsTableProps {
  leads: Lead[]
  onViewJourney?: (lead: Lead) => void
}

export default function LeadsTable({ leads, onViewJourney }: LeadsTableProps) {
  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Table header */}
      <div
        className="flex items-center justify-between px-[18px] py-[14px]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="text-[14px] font-semibold text-[--text-1]">Leads Recentes</h3>
          <p className="text-[11.5px] text-[--text-3] mt-[2px]">
            Usuários com dados de tracking completos
          </p>
        </div>

        <div className="flex gap-[7px]">
          <button
            className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[6px] text-[11.5px] text-[--text-2] cursor-pointer transition-all duration-[180ms] hover:-translate-y-[1px]"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F97316'
              e.currentTarget.style.color = '#F97316'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-2)'
            }}
          >
            <FilterIcon /> Filtrar
          </button>
          <button
            className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[6px] text-[11.5px] text-[--text-2] cursor-pointer transition-all duration-[180ms] hover:-translate-y-[1px]"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F97316'
              e.currentTarget.style.color = '#F97316'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-2)'
            }}
          >
            <DownloadIcon /> Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: 'rgba(0,0,0,.15)' }}>
            {['Lead', 'Origem', 'Campanha', 'Evento', 'Data', ''].map((h) => (
              <th
                key={h}
                className="px-[18px] py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[.07em] text-[--text-3]"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => {
            const src = sourceBadge[lead.source]
            const evt = eventBadge[lead.event]
            const isLast = i === leads.length - 1

            return (
              <tr
                key={lead.id}
                className="group transition-colors duration-[180ms]"
                style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-sub)' }}
                onMouseEnter={(e) => {
                  const tds = e.currentTarget.querySelectorAll('td')
                  tds.forEach((td) => {
                    ;(td as HTMLElement).style.background = 'rgba(255,255,255,.02)'
                    ;(td as HTMLElement).style.color = 'var(--text-1)'
                  })
                }}
                onMouseLeave={(e) => {
                  const tds = e.currentTarget.querySelectorAll('td')
                  tds.forEach((td) => {
                    ;(td as HTMLElement).style.background = 'transparent'
                    ;(td as HTMLElement).style.color = 'var(--text-2)'
                  })
                }}
              >
                {/* Lead */}
                <td className="px-[18px] py-[12px]" style={{ color: 'var(--text-2)' }}>
                  <p className="text-[13px] font-[500] text-[--text-1]">{lead.name}</p>
                  <p className="text-[11px] text-[--text-3] mt-[2px]">{lead.email}</p>
                </td>

                {/* Source */}
                <td className="px-[18px] py-[12px]">
                  <Badge label={src.label} bg={src.bg} color={src.color} />
                </td>

                {/* Campaign */}
                <td
                  className="px-[18px] py-[12px] text-[12px]"
                  style={{ fontFamily: 'monospace', color: 'var(--text-3)' }}
                >
                  {lead.campaign}
                </td>

                {/* Event */}
                <td className="px-[18px] py-[12px]">
                  <Badge label={lead.event} bg={evt.bg} color={evt.color} />
                </td>

                {/* Date */}
                <td className="px-[18px] py-[12px] text-[12px]" style={{ color: 'var(--text-2)' }}>
                  {lead.date}
                </td>

                {/* Action */}
                <td className="px-[18px] py-[12px]">
                  <button
                    onClick={() => onViewJourney?.(lead)}
                    className="px-[11px] py-[5px] rounded-[6px] text-[11.5px] font-[500] cursor-pointer transition-all duration-[180ms] font-[inherit]"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-2)',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget
                      el.style.borderColor = '#F97316'
                      el.style.background = 'rgba(249,115,22,.08)'
                      el.style.color = '#F97316'
                      el.style.transform = 'translateY(-1px)'
                      el.style.boxShadow = '0 3px 10px rgba(249,115,22,.15)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget
                      el.style.borderColor = 'var(--border)'
                      el.style.background = 'transparent'
                      el.style.color = 'var(--text-2)'
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    Ver jornada
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
