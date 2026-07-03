'use client'

import { use, useMemo, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import NotesPad from '@/components/jornada/NotesPad'

import { usuariosJornada, type EventoJornada, type UsuarioJornada } from '@/lib/demo-data'
import { useCliente } from '@/lib/data/clientes'
import { useEventos, useIdentidades } from '@/lib/data/colecoes'
import { identidadeParaUsuarioJornada } from '@/lib/data/agregacoes'

// ─── SVG icons por tipo de evento ─────────────────────────────────────────
function IcoEye({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IcoUser({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IcoCart({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
function IcoCheck({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

// ─── Event color/icon config ───────────────────────────────────────────────
const EVENTO_CONFIG = {
  page_view: { label: 'Visitou o site',       bg: 'rgba(59,130,246,.08)',  border: 'rgba(59,130,246,.25)',  dot: '#3B82F6', Icon: IcoEye   },
  lead:      { label: 'Preencheu formulário', bg: 'rgba(249,115,22,.08)',  border: 'rgba(249,115,22,.25)',  dot: '#F59E0B', Icon: IcoUser  },
  checkout:  { label: 'Iniciou checkout',     bg: 'rgba(139,92,246,.08)',  border: 'rgba(139,92,246,.25)',  dot: '#8B5CF6', Icon: IcoCart  },
  compra:    { label: 'Efetuou compra',       bg: 'rgba(16,185,129,.08)',  border: 'rgba(16,185,129,.25)',  dot: '#10B981', Icon: IcoCheck },
}

const STATUS_CONFIG = {
  converteu:             { label: 'Converteu',           bg: 'rgba(16,185,129,.1)',  color: '#10B981' },
  lead:                  { label: 'Lead (não converteu)', bg: 'rgba(59,130,246,.1)', color: '#3B82F6' },
  'checkout-abandonado': { label: 'Checkout abandonado', bg: 'rgba(249,115,22,.1)', color: '#F97316' },
}

// ─── Event card ────────────────────────────────────────────────────────────
function EventCard({ ev }: { ev: EventoJornada }) {
  const cfg = EVENTO_CONFIG[ev.tipo]

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <span
        className="absolute left-0 top-4 w-[10px] h-[10px] rounded-full border-2 shrink-0"
        style={{ background: cfg.dot, borderColor: 'var(--bg-base)', boxShadow: `0 0 8px ${cfg.dot}` }}
      />

      {/* Card */}
      <div
        className="rounded-[10px] p-4 mb-1"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <cfg.Icon color={cfg.dot} />
            <span className="text-[13px] font-semibold text-[--text-1]">{cfg.label}</span>
          </div>
          <span className="text-[11px] text-[--text-3]">
            {ev.plataforma && <span className="text-[--text-2] mr-1">{ev.plataforma} {ev.canal && `· ${ev.canal}`} ·</span>}
            {ev.data} · {ev.hora}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {ev.campanha  && <Detail label="Campanha" value={ev.campanha} mono />}
          {ev.conjunto  && <Detail label="Conjunto" value={ev.conjunto} mono />}
          {ev.anuncio   && <Detail label="Anúncio"  value={ev.anuncio}  mono />}
          {ev.pagina    && <Detail label="Página"   value={ev.pagina} />}
          {ev.tempoPagina && <Detail label="Tempo na página" value={ev.tempoPagina} />}
          {ev.produto   && <Detail label="Produto"  value={ev.produto} />}
          {ev.valor     && <Detail label="Valor"    value={`R$ ${ev.valor.toFixed(2)}`} />}
          {ev.email     && <Detail label="E-mail"   value={ev.email} />}
          {ev.telefone  && <Detail label="Telefone" value={ev.telefone} />}
          {ev.atribuicao && <Detail label="Atribuição" value={ev.atribuicao} />}
          {ev.fbp       && <Detail label="FBP"      value={ev.fbp} mono />}
          {ev.fbc       && <Detail label="FBC"      value={ev.fbc} mono />}
          {ev.gclid     && <Detail label="GCLID"    value={ev.gclid} mono />}
          {ev.janelaMeta !== undefined && (
            <span className="col-span-2 text-[11px] mt-1" style={{ color: '#10B981' }}>
              Janela Meta: 7d —{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              ativo
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={11} height={11}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-[1px]">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-[11.5px] truncate" style={{ color: 'var(--text-2)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

// ─── Cookie badge ──────────────────────────────────────────────────────────
function CookieBadge({ label, value }: { label: string; value?: string }) {
  const present = !!value
  return (
    <div className="flex items-center justify-between py-[7px]" style={{ borderBottom: '1px solid var(--border-sub)' }}>
      <span className="text-[12px] font-bold" style={{ color: 'var(--text-2)' }}>{label}</span>
      {present ? (
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#10B981' }}>
          <span className="w-[6px] h-[6px] rounded-full bg-[#10B981]" /> presente
        </span>
      ) : (
        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>— não presente</span>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function JornadaPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { identidades } = useIdentidades(isDemo ? undefined : clienteId)
  const { eventos } = useEventos(isDemo ? undefined : clienteId)
  const [busca, setBusca] = useState('')

  const usarDemo = isDemo

  // Jornadas reais (identidades unificadas + eventos) ou demo
  const usuarios = useMemo<UsuarioJornada[]>(() => {
    if (usarDemo) return usuariosJornada
    return identidades.map((i) => identidadeParaUsuarioJornada(i, eventos))
  }, [usarDemo, identidades, eventos])

  const filtrados = useMemo(() => {
    if (!busca.trim()) return usuarios
    const q = busca.toLowerCase()
    return usuarios.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      u.dados.telefone?.includes(q) ||
      u.id.toLowerCase().includes(q),
    )
  }, [usuarios, busca])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const usuario: UsuarioJornada | undefined =
    filtrados.find((u) => u.id === selectedId) ?? filtrados[0]

  if (!usuario) {
    return (
      <>
        <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)' }}>
          <h2 className="text-[18px] font-bold text-[--text-1]">Jornada do Usuário</h2>
          <p className="text-[12.5px] text-[--text-3] mt-4">
            Nenhuma jornada registrada ainda — instale o snippet v4track.js no site do cliente para começar a capturar.
          </p>
        </main>
      </>
    )
  }

  const status = STATUS_CONFIG[usuario.status]

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)' }}>
        {/* Section header */}
        <div className="mb-5">
          <h2 className="text-[18px] font-bold text-[--text-1]">Jornada do Usuário</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Linha do tempo completa por usuário — origem do primeiro clique até a conversão
            {usarDemo ? <span style={{ color: '#8B5CF6' }}> · dados demo</span> : <span style={{ color: '#10B981' }}> · {usuarios.length} jornadas reais</span>}
          </p>
        </div>

        {/* User selector row */}
        <div className="flex items-center gap-3 mb-6">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por e-mail, telefone ou id…"
            className="px-4 py-[9px] rounded-[8px] text-[12.5px] outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)', width: 240 }}
          />
          <div className="relative">
            <select
              value={usuario.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="appearance-none px-4 py-[9px] pr-9 rounded-[8px] text-[13px] font-[500] cursor-pointer outline-none transition-all duration-[180ms]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)', minWidth: 280 }}
            >
              {filtrados.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.emailMasked} — {STATUS_CONFIG[u.status].label}{u.valor ? ` · R$ ${u.valor.toFixed(2)}` : ''}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[13px] h-[13px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <span className="px-[9px] py-[4px] rounded-full text-[11px] font-bold" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
          {usuario.valor && (
            <span className="text-[13px] font-semibold" style={{ color: '#10B981' }}>
              R$ {usuario.valor.toFixed(2)}
            </span>
          )}
        </div>

        {/* Content: timeline + side panel */}
        <div className="flex gap-5 items-start">
          {/* Timeline */}
          <div className="flex-1 flex flex-col gap-0">
            <div className="relative" style={{ paddingLeft: 8 }}>
              {/* Vertical line */}
              <div
                className="absolute left-[4px] top-4 bottom-4 w-[1px]"
                style={{ background: 'var(--border)' }}
              />
              {usuario.eventos.map((ev) => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>

          {/* Side panel */}
          <div className="w-[280px] shrink-0 flex flex-col gap-4">
            {/* Cookies */}
            <div className="rounded-[12px] p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
                Cookies Coletados
              </p>
              <CookieBadge label="FBP"    value={usuario.cookies.fbp} />
              <CookieBadge label="FBC"    value={usuario.cookies.fbc} />
              <CookieBadge label="GCLID"  value={usuario.cookies.gclid} />
              <CookieBadge label="WBRAID" value={usuario.cookies.wbraid} />
              <CookieBadge label="GBRAID" value={usuario.cookies.gbraid} />
            </div>

            {/* Lead data */}
            <div className="rounded-[12px] p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
                Dados do Lead
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'E-mail',    value: usuario.dados.email },
                  { label: 'Telefone',  value: usuario.dados.telefone },
                  { label: 'Cidade',    value: usuario.dados.cidade && usuario.dados.estado ? `${usuario.dados.cidade}, ${usuario.dados.estado}` : undefined },
                  { label: 'IP',        value: usuario.dados.ip, mono: true },
                ].filter((f) => f.value).map(({ label, value, mono }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</p>
                    <p className="text-[12px] mt-[1px] truncate" style={{ color: 'var(--text-1)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution */}
            <div className="rounded-[12px] p-4" style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#10B981' }}>
                Atribuição Final
              </p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--text-1)' }}>{usuario.atribuicaoFinal.plataforma}</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>Janela: {usuario.atribuicaoFinal.janela}</p>
            </div>

            {/* Notes */}
            <NotesPad storageKey={`notes-${clienteId}-${usuario.id}`} />
          </div>
        </div>
      </main>
    </>
  )
}
