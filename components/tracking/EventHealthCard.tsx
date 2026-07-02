'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { EventHealth } from '@/lib/demo-data-tracking'

const STATUS_CFG = {
  online:  { label: 'Ativo',   color: '#10B981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)' },
  warning: { label: 'Alerta',  color: '#F59E0B', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)'  },
  offline: { label: 'Parado',  color: '#EF4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.25)'  },
}

function PingDot({ status }: { status: EventHealth['status'] }) {
  const cfg = STATUS_CFG[status]
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
      {status !== 'offline' && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: cfg.color, opacity: 0.6,
          animation: 'ping 1.4s cubic-bezier(0,0,.2,1) infinite',
        }} />
      )}
      <span style={{
        position: 'relative', display: 'inline-flex',
        width: 10, height: 10, borderRadius: '50%',
        background: cfg.color,
      }} />
    </span>
  )
}

interface Props extends EventHealth {
  onClick?: () => void
  selected?: boolean
}

export default function EventHealthCard({
  label, description, status, lastFired, countToday, countWeek, alert, icon, color, onClick, selected,
}: Props) {
  const cfg = STATUS_CFG[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      style={{
        background: 'var(--bg-c)',
        border: `1px solid ${selected ? color + '70' : status === 'offline' ? cfg.border : 'var(--br)'}`,
        borderRadius: 12, padding: '14px 16px',
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? `0 0 0 1px ${color}25, 0 4px 20px rgba(0,0,0,.4)` : status === 'offline' ? '0 0 0 1px rgba(239,68,68,.1)' : 'none',
        transition: 'border-color .18s, box-shadow .18s',
      }}
    >
      {/* Top bar accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: cfg.color,
        opacity: status === 'offline' ? 1 : 0.7,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
              <path d={icon} />
            </svg>
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{description}</div>
          </div>
        </div>

        {/* Status pill with ping */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 20,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          fontSize: 10.5, fontWeight: 700, color: cfg.color,
        }}>
          <PingDot status={status} />
          {cfg.label}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: alert ? 10 : 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.5px', lineHeight: 1 }}>
            {countToday.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>hoje</div>
        </div>
        <div style={{ width: 1, background: 'var(--br)' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t2)', letterSpacing: '-.5px', lineHeight: 1 }}>
            {countWeek.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>7 dias</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10.5, color: 'var(--t3)', textAlign: 'right' }}>
            Último: <span style={{ color: status === 'offline' ? '#EF4444' : 'var(--t2)', fontWeight: 600 }}>
              {lastFired}
            </span>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 7, marginTop: 2,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              fontSize: 10.5, color: cfg.color, fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" width={11} height={11}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            {alert}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click hint */}
      {onClick && (
        <div style={{
          position: 'absolute', bottom: 8, right: 12,
          fontSize: 9.5, color: 'var(--t3)',
          opacity: 0.6,
        }}>
          Ver detalhes →
        </div>
      )}
    </motion.div>
  )
}
