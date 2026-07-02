'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-[15px] h-[15px] shrink-0"
  >
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  clientes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  eventos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  jornada: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  utms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  conversoes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ga4: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] shrink-0">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] shrink-0 text-[--text-3]">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  ),
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItemProps {
  label: string
  href: string
  icon: ReactNode
  badge?: number
  active?: boolean
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ label, href, icon, badge, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={[
        'group flex items-center gap-[9px] rounded-[8px] mb-[1px]',
        'text-[13.5px] font-[450] cursor-pointer select-none',
        'transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)]',
        'relative',
        active
          ? 'bg-[rgba(249,115,22,0.12)] text-[#F97316] font-semibold pl-3 pr-3 py-2'
          : 'text-[--text-2] hover:bg-[--bg-card] hover:text-[--text-1] pl-3 pr-3 py-2 hover:pl-4',
      ].join(' ')}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] bg-[#F97316] rounded-r-[3px]" />
      )}
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-[rgba(249,115,22,0.15)] text-[#F97316] text-[10px] font-bold px-[7px] py-[2px] rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[9.5px] font-bold uppercase tracking-[0.09em] text-[--text-3] px-[8px] mb-[4px]">
      {children}
    </p>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export interface SidebarProps {
  clienteId?: string
}

export default function Sidebar({ clienteId }: SidebarProps) {
  const pathname = usePathname()
  const base = clienteId ? `/clientes/${clienteId}` : '/dashboard'

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-[200] flex flex-col"
      style={{
        width: 256,
        background: 'var(--bg-side)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-[10px] px-4 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-content-center font-extrabold text-[13px] text-white shrink-0"
          style={{
            background: '#F97316',
            boxShadow: '0 4px 14px rgba(249,115,22,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          V4
        </div>
        <div>
          <p className="text-[15px] font-bold text-[--text-1]">Tracking V4</p>
          <p className="text-[11px] text-[--text-3] mt-[1px]">Carvalho &amp; Co</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {/* Principal */}
        <div className="px-[10px] pt-[18px] pb-[4px]">
          <SectionLabel>Principal</SectionLabel>
          <NavItem label="Dashboard" href="/dashboard" icon={icons.dashboard} active={isActive('/dashboard') && !pathname.includes('/clientes')} />
          <NavItem label="Clientes" href="/clientes" icon={icons.clientes} badge={20} active={isActive('/clientes')} />
        </div>

        {/* Tracking */}
        <div className="px-[10px] pt-[18px] pb-[4px]">
          <SectionLabel>Tracking</SectionLabel>
          <NavItem label="Eventos" href={`${base}/eventos`} icon={icons.eventos} active={isActive(`${base}/eventos`)} />
          <NavItem label="Jornada do Usuário" href={`${base}/jornada`} icon={icons.jornada} active={isActive(`${base}/jornada`)} />
          <NavItem label="UTMs" href={`${base}/utms`} icon={icons.utms} active={isActive(`${base}/utms`)} />
          <NavItem label="Conversões" href={`${base}/conversoes`} icon={icons.conversoes} active={isActive(`${base}/conversoes`)} />
        </div>

        {/* Plataformas */}
        <div className="px-[10px] pt-[18px] pb-[4px]">
          <SectionLabel>Plataformas</SectionLabel>
          <NavItem label="Meta Ads" href={`${base}/meta`} icon={icons.meta} active={isActive(`${base}/meta`)} />
          <NavItem label="Google Ads" href={`${base}/google`} icon={icons.google} active={isActive(`${base}/google`)} />
          <NavItem label="GA4" href={`${base}/ga4`} icon={icons.ga4} active={isActive(`${base}/ga4`)} />
        </div>
      </nav>

      {/* User footer */}
      <div className="px-[10px] py-[12px]" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          className="w-full flex items-center gap-[10px] px-[12px] py-[9px] rounded-[8px] cursor-pointer transition-colors duration-[180ms] hover:bg-[--bg-card] text-left"
        >
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center font-bold text-[13px] text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #F97316, #8B5CF6)' }}
          >
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] text-[--text-1] truncate">Gabriel</p>
            <p className="text-[11px] text-[--text-3] mt-[1px] truncate">Gestor de Tráfego</p>
          </div>
          {icons.more}
        </button>
      </div>
    </aside>
  )
}
