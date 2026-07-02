'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import type { Lead, LeadSource, LeadEvent } from '@/lib/demo-data'

const sourceBadge: Record<LeadSource, { bg: string; color: string; label: string }> = {
  'Meta Ads':   { bg: 'rgba(59,130,246,.1)',  color: '#3B82F6', label: 'Meta Ads' },
  'Google Ads': { bg: 'rgba(66,133,244,.1)',  color: '#4285F4', label: 'Google Ads' },
  'GA4':        { bg: 'rgba(227,116,0,.1)',   color: '#E37400', label: 'GA4' },
  'Orgânico':   { bg: 'rgba(139,92,246,.1)',  color: '#8B5CF6', label: 'Orgânico' },
}

const eventBadge: Record<LeadEvent, { bg: string; color: string }> = {
  'Compra':    { bg: 'rgba(16,185,129,.1)',  color: '#10B981' },
  'Checkout':  { bg: 'rgba(139,92,246,.1)',  color: '#8B5CF6' },
  'Lead':      { bg: 'rgba(59,130,246,.1)',  color: '#3B82F6' },
  'Page View': { bg: 'rgba(72,72,72,.2)',    color: '#909090' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: bg, color }}>
      {label}
    </span>
  )
}

export default function LeadsTable({ leads, onViewJourney }: { leads: Lead[]; onViewJourney?: (lead: Lead) => void }) {
  const router       = useRouter()
  const params       = useParams()
  const shouldReduce = useReducedMotion()
  const clienteId    = params?.clienteId as string | undefined

  const handleJourney = (lead: Lead) => {
    if (onViewJourney) { onViewJourney(lead); return }
    if (clienteId) router.push(`/clientes/${clienteId}/jornada?leadId=${lead.id}`)
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg-c)', border: '1px solid var(--br)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--br)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Leads Recentes</div>
          <div style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: 2 }}>Usuários com dados de tracking completos</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,.15)' }}>
            {['Lead', 'Origem', 'Campanha', 'Evento', 'Data', ''].map((h) => (
              <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', borderBottom: '1px solid var(--br)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => {
            const src = sourceBadge[lead.source]
            const evt = eventBadge[lead.event]
            return (
              <motion.tr
                key={lead.id}
                initial={shouldReduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.055 }}
                style={{ borderBottom: i === leads.length - 1 ? 'none' : '1px solid var(--br-s)' }}
                onMouseEnter={(e) => Array.from(e.currentTarget.querySelectorAll('td')).forEach((td) => { (td as HTMLElement).style.background = 'rgba(255,255,255,.02)' })}
                onMouseLeave={(e) => Array.from(e.currentTarget.querySelectorAll('td')).forEach((td) => { (td as HTMLElement).style.background = 'transparent' })}
              >
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{lead.email}</div>
                </td>
                <td style={{ padding: '12px 18px' }}><Badge label={src.label} bg={src.bg} color={src.color} /></td>
                <td style={{ padding: '12px 18px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--t3)' }}>{lead.campaign}</td>
                <td style={{ padding: '12px 18px' }}><Badge label={lead.event} bg={evt.bg} color={evt.color} /></td>
                <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--t2)' }}>{lead.date}</td>
                <td style={{ padding: '12px 18px' }}>
                  <button
                    onClick={() => handleJourney(lead)}
                    style={{ padding: '5px 11px', borderRadius: 6, fontSize: '11.5px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--br)', color: 'var(--t2)', transition: 'all .18s' }}
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.background = 'rgba(200,16,46,.08)'; el.style.color = 'var(--red)' }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.background = 'transparent'; el.style.color = 'var(--t2)' }}
                  >
                    Ver jornada
                  </button>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </motion.div>
  )
}
