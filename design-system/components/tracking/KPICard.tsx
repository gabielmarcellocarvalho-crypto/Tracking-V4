'use client'

export interface KPICardProps {
  label: string
  value: string
  trendLabel: string
  direction: 'up' | 'down'
  accentColor: string
  icon: string
}

export default function KPICard({
  label,
  value,
  trendLabel,
  direction,
  accentColor,
  icon,
}: KPICardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[12px] p-[18px] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)] group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = accentColor
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 12px 30px rgba(0,0,0,.4)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Top accent bar */}
      <span
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[12px]"
        style={{ background: accentColor }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-[14px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[--text-3]">
          {label}
        </span>
        <span
          className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[14px]"
          style={{ background: 'rgba(255,255,255,.04)' }}
        >
          {icon}
        </span>
      </div>

      {/* Value */}
      <p
        className="text-[26px] font-bold tracking-[-0.5px] mb-[7px] text-[--text-1]"
        style={{ letterSpacing: '-0.5px' }}
      >
        {value}
      </p>

      {/* Trend */}
      <p
        className="text-[11.5px] font-[500]"
        style={{ color: direction === 'up' ? 'var(--green)' : 'var(--red)' }}
      >
        {trendLabel}
      </p>
    </div>
  )
}
