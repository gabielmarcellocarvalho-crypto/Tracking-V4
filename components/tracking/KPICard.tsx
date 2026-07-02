'use client'

import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

export interface KPICardProps {
  label: string
  value: string
  trendLabel: string
  direction: 'up' | 'down'
  accentColor: string
  svgPath: string
  index?: number
}

// Extracts the leading numeric part of a value string like "R$94.200" → 94200
function parseNumeric(v: string): number | null {
  const n = parseFloat(v.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'))
  return isNaN(n) ? null : n
}

function AnimatedValue({ value }: { value: string }) {
  const shouldReduce = useReducedMotion()
  const numericVal = parseNumeric(value)
  const motionVal  = useMotionValue(0)
  const ref        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldReduce || numericVal === null) return
    const ctrl = animate(motionVal, numericVal, { duration: 1.4, ease: [0.22, 1, 0.36, 1] })
    const unsub = motionVal.on('change', (v) => {
      if (!ref.current) return
      const rendered = value.replace(
        /[\d.]+(?:[,.][\d]+)*/,
        String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      )
      ref.current.textContent = rendered
    })
    return () => { ctrl.stop(); unsub() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      style={{
        fontSize: 26, fontWeight: 700, color: 'var(--t1)',
        letterSpacing: '-.5px', lineHeight: 1,
      }}
    >
      {value}
    </div>
  )
}

export default function KPICard({ label, value, trendLabel, direction, accentColor, svgPath, index = 0 }: KPICardProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: index * 0.08 }}
      whileHover={shouldReduce ? {} : { y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      style={{
        background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12,
        padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = accentColor; el.style.boxShadow = `0 0 0 1px ${accentColor}22, 0 12px 32px rgba(0,0,0,.5)` }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.boxShadow = 'none' }}
    >
      {/* Top accent bar — animates width in */}
      <motion.div
        initial={shouldReduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: accentColor, transformOrigin: 'left',
        }}
      />

      {/* Icon */}
      <motion.div
        initial={shouldReduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.08 + 0.1 }}
        style={{
          width: 32, height: 32, borderRadius: 8, marginBottom: 10,
          background: 'rgba(255,255,255,.04)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
          <path d={svgPath} />
        </svg>
      </motion.div>

      <motion.div
        initial={shouldReduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.15 }}
        style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 4 }}
      >
        {label}
      </motion.div>

      <AnimatedValue value={value} />

      <motion.div
        initial={shouldReduce ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 + 0.5 }}
        style={{ fontSize: '11.5px', marginTop: 6, color: direction === 'up' ? 'var(--green)' : 'var(--red)' }}
      >
        {trendLabel}
      </motion.div>
    </motion.div>
  )
}
