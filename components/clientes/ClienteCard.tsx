'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { excluirCliente } from '@/lib/data/partners'
import type { Partner, PartnerTipo, PartnerStatus } from '@/lib/types'

const tipoConfig: Record<PartnerTipo, { label: string; bg: string; color: string }> = {
  ecommerce: { label: 'E-COMMERCE', bg: 'rgba(200,16,46,.1)',  color: '#C8102E' },
  leads:     { label: 'LEADS',      bg: 'rgba(59,130,246,.1)', color: '#3B82F6' },
  mensagens: { label: 'MENSAGENS',  bg: 'rgba(245,158,11,.1)', color: '#F59E0B' },
}

const statusConfig: Record<PartnerStatus, { label: string; bg: string; color: string; dot: string }> = {
  ativo:   { label: 'ATIVO',   bg: 'rgba(16,185,129,.1)', color: '#10B981', dot: '#10B981' },
  inativo: { label: 'INATIVO', bg: 'rgba(74,94,120,.12)', color: '#4A5E78', dot: '#4A5E78' },
}

// Segment icon as small SVG (no emojis)
function SegIcon({ seg }: { seg: string }) {
  const paths: Record<string, string> = {
    'Finanças':     'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    'E-commerce':   'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    'Academia':     'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
    'Consultoria':  'M18 20V10M12 20V4M6 20v-6',
    'Tecnologia':   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    'Saúde':        'M22 12h-4l-3 9L9 3l-3 9H2',
    'Moda':         'M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z',
    'Imobiliário':  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  }
  const d = paths[seg] ?? 'M3 7h18M3 12h18M3 17h18'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d={d} />
    </svg>
  )
}

function fmt(n?: number) {
  if (n === undefined) return '0'
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n)
}

export default function ClienteCard({ cliente, index = 0 }: { cliente: Partner; index?: number }) {
  const router       = useRouter()
  const shouldReduce = useReducedMotion()
  const tipo   = tipoConfig[cliente.tipo]
  const status = statusConfig[cliente.status]

  const [confirmando, setConfirmando] = useState(false)
  const [removendo, setRemovendo]     = useState(false)
  const [erro, setErro]               = useState('')

  const handleRemover = async () => {
    setRemovendo(true)
    setErro('')
    try {
      await excluirCliente(cliente.id)
      // onSnapshot da lista atualiza sozinho e o card some — nada a fazer aqui.
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falha ao remover cliente')
      setRemovendo(false)
    }
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: index * 0.06 }}
      whileHover={shouldReduce ? {} : { y: -5, transition: { type: 'spring', stiffness: 380, damping: 22 } }}
      style={{
        background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'default',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--red)'; el.style.boxShadow = '0 0 0 1px rgba(200,16,46,.25), 0 16px 40px rgba(0,0,0,.5)' }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--br)'; el.style.boxShadow = 'none' }}
    >
      {/* Ambient glow top-left */}
      <div style={{
        position: 'absolute', top: -20, left: -20, width: 80, height: 80,
        borderRadius: '50%', background: tipo.color, filter: 'blur(30px)', opacity: 0.06, pointerEvents: 'none',
      }} />

      {/* Top row: icon + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(255,255,255,.04)',
          border: '1px solid var(--br)', color: 'var(--t2)',
        }}>
          <SegIcon seg={cliente.segmento} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cliente.demo && (
            <span style={{
              padding: '4px 9px', borderRadius: 20, fontSize: '10.5px', fontWeight: 700,
              background: 'rgba(139,92,246,.12)', color: '#8B5CF6',
            }}>
              DEMO
            </span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px',
            borderRadius: 20, fontSize: '10.5px', fontWeight: 700,
            background: status.bg, color: status.color,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
            {status.label}
          </span>
          {!cliente.demo && !confirmando && (
            <button
              onClick={() => setConfirmando(true)}
              title="Remover cliente"
              aria-label="Remover cliente"
              style={{
                width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid var(--br)', color: 'var(--t3)', cursor: 'pointer',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.1)'; e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--br)'; e.currentTarget.style.color = 'var(--t3)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Name + tipo */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 7 }}>{cliente.nome}</div>
        <span style={{
          fontSize: '10.5px', fontWeight: 700, letterSpacing: '.04em',
          padding: '3px 8px', borderRadius: 5, background: tipo.bg, color: tipo.color,
        }}>{tipo.label}</span>
      </div>

      {/* Events */}
      <p style={{ fontSize: '12.5px', color: 'var(--t3)', flex: 1 }}>
        <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{fmt(cliente.eventos)}</span> eventos rastreados
      </p>

      {/* CTA — vira confirmação de remoção quando acionado */}
      {confirmando ? (
        <div>
          <p style={{ fontSize: 11.5, color: '#EF4444', fontWeight: 600, margin: '0 0 8px' }}>
            Remover {cliente.nome}? Apaga todos os dados (eventos, conversões, conexões) — não dá pra desfazer.
          </p>
          {erro && <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 8px' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setConfirmando(false)}
              disabled={removendo}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--t2)',
              }}
            >Cancelar</button>
            <button
              onClick={handleRemover}
              disabled={removendo}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                background: '#EF4444', border: 'none', color: '#fff', opacity: removendo ? 0.6 : 1,
              }}
            >{removendo ? 'Removendo…' : 'Confirmar'}</button>
          </div>
        </div>
      ) : (
        <motion.button
          onClick={() => router.push(`/clientes/${cliente.id}/tracking`)}
          whileHover={shouldReduce ? {} : { scale: 1.02 }}
          whileTap={shouldReduce ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
            background: 'var(--red)', border: 'none',
            boxShadow: '0 3px 10px rgba(200,16,46,.3)',
          }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = 'var(--red-h)'; el.style.boxShadow = '0 6px 20px rgba(200,16,46,.45)' }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = 'var(--red)'; el.style.boxShadow = '0 3px 10px rgba(200,16,46,.3)' }}
        >
          Ver Dashboard
        </motion.button>
      )}
    </motion.div>
  )
}
