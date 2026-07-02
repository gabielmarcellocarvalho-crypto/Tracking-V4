'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  label: string
  value: string
  sub?: string
  trend?: string
  trendUp?: boolean
  color?: string
  icon: React.ReactNode
  delta?: string
  caption?: string
}

function TrendIcon({ up }: { up: boolean }) {
  return up ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

export default function PerfMetricCard({
  label, value, sub, trend, trendUp = true, color = '#C8102E', icon, caption,
}: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-c)',
        border: `1px solid ${hovered ? color + '55' : 'var(--br)'}`,
        borderRadius: 12, padding: '14px 16px',
        position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? `0 0 0 1px ${color}18, 0 8px 24px rgba(0,0,0,.4)` : 'none',
        transition: 'border-color .18s, box-shadow .18s',
        cursor: 'default',
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />

      {/* Corner glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 70, height: 70,
        borderRadius: '50%', background: color,
        opacity: hovered ? 0.06 : 0.03,
        transition: 'opacity .2s', pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.08em', color: 'var(--t3)',
        }}>
          {label}
        </span>
        <span style={{ color, opacity: hovered ? 1 : 0.7, transition: 'opacity .18s', flexShrink: 0 }}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div style={{
        fontSize: 26, fontWeight: 700, color: 'var(--t1)',
        letterSpacing: '-.5px', lineHeight: 1, marginBottom: 2,
      }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 6 }}>{sub}</div>
      )}

      {/* Trend row */}
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
          fontSize: 11, fontWeight: 500,
          color: trendUp ? '#10B981' : '#EF4444',
        }}>
          <TrendIcon up={trendUp} />
          <span>{trend}</span>
        </div>
      )}

      {/* Hover tooltip detail */}
      <AnimatePresence>
        {hovered && caption && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', bottom: 8, right: 10,
              fontSize: 10, color: 'var(--t3)',
              background: 'var(--bg-s)', padding: '2px 7px',
              borderRadius: 20, border: '1px solid var(--br)',
            }}
          >
            {caption}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom baseline bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, ${color}40, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity .2s',
      }} />
    </motion.div>
  )
}
