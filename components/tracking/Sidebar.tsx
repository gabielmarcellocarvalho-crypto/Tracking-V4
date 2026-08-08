'use client'

import Link from 'next/link'
import { useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const icons = {
  clientes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  performance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  tracking: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  jornada:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  utms:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  conversoes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  mapa:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  agente:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>,
  conexoes:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  midia:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  copies:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>,
  forecasting: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  meta:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  google:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ga4:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  logout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// Rotas que pertencem ao modo "Gestor de Mídia" — tudo que não estiver aqui
// (e não for /clientes) é considerado modo "Tracking".
const ROTAS_MIDIA = ['performance', 'midia', 'copies', 'forecasting']
// Rotas sem modo próprio (servem os dois) — a sidebar mantém o modo em que
// o usuário já estava em vez de cair pra Tracking por padrão.
const ROTAS_UNIVERSAIS = ['conexoes', 'agente']

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ label, href, icon, badge, active }: {
  label: string; href: string; icon: React.ReactNode; badge?: number; active?: boolean
}) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: active ? '8px 12px 8px 15px' : '8px 12px',
      fontSize: 13, cursor: 'pointer', userSelect: 'none',
      borderLeft: `2px solid ${active ? 'var(--red)' : 'transparent'}`,
      borderRadius: '0 6px 6px 0',
      marginRight: 8,
      background: active ? 'rgba(200,16,46,.1)' : 'transparent',
      color: active ? 'var(--red)' : 'var(--t2)',
      transition: 'all .18s cubic-bezier(.4,0,.2,1)',
    }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--bg-c)'
          el.style.color = 'var(--t1)'
          el.style.paddingLeft = '16px'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'transparent'
          el.style.color = 'var(--t2)'
          el.style.paddingLeft = '12px'
        }
      }}
    >
      <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: 'rgba(200,16,46,.15)', color: 'var(--red)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </Link>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ padding: '12px 16px 4px', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)' }}>
      {children}
    </p>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ clienteId }: { clienteId?: string }) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()

  const base = clienteId ? `/clientes/${clienteId}` : ''
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const segmentoAtual = clienteId ? pathname.slice(base.length + 1).split('/')[0] : ''
  const modoDaRota: 'tracking' | 'midia' | null = ROTAS_MIDIA.includes(segmentoAtual)
    ? 'midia'
    : ROTAS_UNIVERSAIS.includes(segmentoAtual) ? null : 'tracking'

  // Em rota universal (ex: Conexões), mantém o modo em que o usuário já
  // estava — sem isso, entrar em Conexões vindo do Gestor de Mídia trocava
  // a sidebar pra Tracking sem motivo.
  const [modoLembrado, setModoLembrado] = useState<'tracking' | 'midia'>('tracking')
  useLayoutEffect(() => {
    if (!clienteId) return
    const chave = `modo-sidebar-${clienteId}`
    if (modoDaRota) {
      sessionStorage.setItem(chave, modoDaRota)
      setModoLembrado(modoDaRota)
    } else {
      const salvo = sessionStorage.getItem(chave)
      if (salvo === 'tracking' || salvo === 'midia') setModoLembrado(salvo)
    }
  }, [clienteId, modoDaRota])

  const modo: 'tracking' | 'midia' = modoDaRota ?? modoLembrado

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'G'

  const handleSignOut = async () => { await signOut(); router.replace('/login') }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
      background: 'var(--bg-s)', borderRight: '1px solid var(--br)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--br)', flexShrink: 0 }}>
        <img
          src="/v4-logo.png"
          alt="V4 Company"
          style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 16px rgba(200,16,46,.45)' }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>Tracking V4</div>
          <div style={{ fontSize: '10.5px', color: 'var(--t3)', marginTop: 1 }}>Carvalho &amp; Co</div>
        </div>
      </div>

      {/* Clientes — volta pros cards de Clientes. Fica fora do fluxo de abas de
          propósito: não é uma seção do dashboard do cliente, é a saída dele. */}
      <Link href="/clientes" style={{
        display: 'flex', alignItems: 'center', gap: 8, margin: '12px 16px',
        padding: '8px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
        color: 'var(--t3)', border: '1px solid var(--br)', textDecoration: 'none',
        transition: 'all .15s', flexShrink: 0,
      }}
        onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = 'var(--red)'; el.style.borderColor = 'var(--red)' }}
        onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = 'var(--t3)'; el.style.borderColor = 'var(--br)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Clientes
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {clienteId && (<>
          {/* Sem seletor de modo aqui de propósito — a escolha entre Tracking
              e Gestor de Mídia acontece só na lista de Clientes (os dois
              botões do card). Dentro do cliente, a sidebar só mostra os itens
              do modo em que você já está (decidido pela rota atual). */}
          {modo === 'tracking' ? (
            <>
              <SectionLabel>Tracking</SectionLabel>
              <NavItem label="Eventos"    href={`${base}/tracking`}   icon={icons.tracking}   active={isActive(`${base}/tracking`)} />
              <NavItem label="UTMs"       href={`${base}/utms`}       icon={icons.utms}       active={isActive(`${base}/utms`)} />
              <NavItem label="Conversões" href={`${base}/conversoes`} icon={icons.conversoes} active={isActive(`${base}/conversoes`)} />
              <NavItem label="Leads"      href={`${base}/mapa`}       icon={icons.mapa}       active={isActive(`${base}/mapa`)} />
              <NavItem label="Jornada do Usuário" href={`${base}/jornada`} icon={icons.jornada} active={isActive(`${base}/jornada`)} />
            </>
          ) : (
            <>
              <SectionLabel>Gestor de Mídia</SectionLabel>
              <NavItem label="Performance"              href={`${base}/performance`} icon={icons.performance} active={isActive(`${base}/performance`)} />
              <NavItem label="Growthpack / Plano de Mídia" href={`${base}/midia`}     icon={icons.midia}       active={isActive(`${base}/midia`)} />
              <NavItem label="Copies"                   href={`${base}/copies`}      icon={icons.copies}      active={isActive(`${base}/copies`)} />
              <NavItem label="Forecasting"               href={`${base}/forecasting`} icon={icons.forecasting} active={isActive(`${base}/forecasting`)} />
            </>
          )}

          {/* Universal — vale tanto pro Tracking quanto pro Gestor de Mídia
              deste cliente (conexões de métricas/server-to-server + o mesmo
              Agente IA, com o mesmo contexto do cliente nos dois modos). */}
          <SectionLabel>Conexões</SectionLabel>
          <NavItem label="Conexões" href={`${base}/conexoes`} icon={icons.conexoes} active={isActive(`${base}/conexoes`)} />
          <NavItem label="Agente IA" href={`${base}/agente`} icon={icons.agente} active={isActive(`${base}/agente`)} />

          {/* Troca de modo — vai direto pro outro lado (Tracking ⇄ Gestor de
              Mídia) deste mesmo cliente, sem precisar voltar pra Clientes.
              Mesmo estilo do link "Clientes" (fora do fluxo de abas). */}
          <Link
            href={modo === 'tracking' ? `${base}/performance` : `${base}/tracking`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, margin: '12px 16px 4px',
              padding: '8px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              color: 'var(--t3)', border: '1px solid var(--br)', textDecoration: 'none',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = 'var(--red)'; el.style.borderColor = 'var(--red)' }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = 'var(--t3)'; el.style.borderColor = 'var(--br)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {modo === 'tracking' ? 'Ir para Gestor de Mídia' : 'Ir para Tracking'}
          </Link>
        </>)}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--br)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--red), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName ?? 'Gabriel'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--t3)', marginTop: 1 }}>Gestor de Tráfego</div>
        </div>
        <button onClick={handleSignOut} title="Sair"
          style={{ color: 'var(--t3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, transition: 'color .18s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--red)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}
        >{icons.logout}</button>
      </div>
    </aside>
  )
}
