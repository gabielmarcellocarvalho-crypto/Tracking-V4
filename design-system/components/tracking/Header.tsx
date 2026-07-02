'use client'

// ─── Header ───────────────────────────────────────────────────────────────────
// Regra: SEM links de navegação no header.
// Apenas: breadcrumb + título + seletor de cliente + notificação + avatar

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" className="w-[13px] h-[13px] text-[--text-3]">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export interface HeaderProps {
  clienteName?: string
  pageTitle?: string
}

export default function Header({
  clienteName = 'Klubi',
  pageTitle,
}: HeaderProps) {
  const title = pageTitle ?? `Dashboard — ${clienteName}`

  return (
    <header
      className="h-[60px] flex items-center justify-between px-6 shrink-0 sticky top-0 z-[100]"
      style={{
        background: 'var(--bg-side)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: breadcrumb + title */}
      <div className="flex flex-col gap-[1px]">
        <div className="flex items-center gap-[5px] text-[11px] text-[--text-3]">
          <span>Clientes</span>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-[--text-2]">{clienteName}</span>
        </div>
        <h1 className="text-[15px] font-semibold text-[--text-1]">{title}</h1>
      </div>

      {/* Right: client selector + actions */}
      <div className="flex items-center gap-[10px]">
        {/* Client selector */}
        <button
          className="flex items-center gap-[7px] px-[13px] py-[7px] rounded-[8px] text-[13px] font-[500] text-[--text-1] cursor-pointer transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)] hover:border-[#F97316]"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Pulse status dot */}
          <span
            className="pulse-dot w-[7px] h-[7px] rounded-full shrink-0"
            style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }}
          />
          {clienteName}
          <ChevronIcon />
        </button>

        {/* Notification button */}
        <button
          className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)] text-[--text-2] hover:text-[#F97316] hover:-translate-y-[2px]"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.borderColor = '#F97316'
            el.style.boxShadow = '0 4px 12px rgba(249,115,22,.2)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border)'
            el.style.boxShadow = 'none'
          }}
          title="Notificações"
        >
          <BellIcon />
        </button>

        {/* Avatar */}
        <button
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px] text-white cursor-pointer transition-transform duration-[180ms] hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #F97316, #8B5CF6)' }}
          title="Perfil"
        >
          G
        </button>
      </div>
    </header>
  )
}
