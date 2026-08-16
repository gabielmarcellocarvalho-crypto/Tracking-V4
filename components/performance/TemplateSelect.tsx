'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type TemplateId = 'ecommerce' | 'leads' | 'mensagens' | 'personalizado'

const OPTIONS: { id: TemplateId; label: string; desc: string; icon: string }[] = [
  { id: 'ecommerce',    label: 'E-commerce',    desc: 'Receita, ROAS, compras',   icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0' },
  { id: 'leads',        label: 'Leads',          desc: 'CPL, qualificação, CPA',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'mensagens',    label: 'Mensagens',      desc: 'WhatsApp, contatos, CPM', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'personalizado', label: 'Personalizado', desc: 'Monte seu dashboard',     icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
]

interface Props {
  value: TemplateId
  onChange: (val: TemplateId) => void
  /** Quais templates fazem sentido pro tipo do cliente atual — sem isso, mostra os 4. */
  permitidos?: TemplateId[]
}

export default function TemplateSelect({ value, onChange, permitidos }: Props) {
  const options = permitidos ? OPTIONS.filter((o) => permitidos.includes(o.id)) : OPTIONS
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(() => options.findIndex(o => o.id === value))
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync selectedIndex when value prop changes
  useEffect(() => {
    const idx = options.findIndex(o => o.id === value)
    setSelectedIndex(idx)
  }, [value, options])

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx)
    onChange(options[idx].id)
    setIsOpen(false)
  }

  const current = options[selectedIndex] ?? options[0]

  return (
    <div ref={containerRef} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
          background: isOpen ? 'var(--bg-c)' : 'var(--bg-s)',
          border: `1px solid ${isOpen ? 'var(--red)' : 'var(--br)'}`,
          color: 'var(--t1)', minWidth: 210,
          transition: 'all .18s',
          outline: 'none',
        }}
      >
        {/* Icon */}
        <span style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'rgba(200,16,46,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
            <path d={current.icon} />
          </svg>
        </span>

        {/* Slot machine text */}
        <div style={{ flex: 1, height: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            // Cada linha tem 20px + 4px de gap — desloca por linha em px fixo.
            // Um % aqui é relativo à altura TOTAL da pilha (todas as opções),
            // não de uma linha só: com uma lista filtrada (ex: só 2 opções pra
            // cliente e-commerce), -100% empurrava o dobro do necessário e
            // o texto selecionado saía inteiro da área visível (ficava em
            // branco) — bug real visto com "Personalizado" pra cliente e-commerce.
            transform: `translateY(${selectedIndex * -24}px)`,
            transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
          }}>
            {options.map((opt) => (
              <div key={opt.id} style={{ height: 20, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Caret */}
        <motion.svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" width={14} height={14}
          style={{ color: 'var(--t3)', flexShrink: 0 }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--bg-c)', border: '1px solid var(--br)',
              borderRadius: 12, overflow: 'hidden', zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,.45)',
              transformOrigin: 'top center',
            }}
          >
            {options.map((opt, i) => {
              const active = opt.id === value
              return (
                <motion.button
                  key={opt.id}
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.14, delay: i * 0.04 }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(200,16,46,.08)' : 'transparent',
                    border: 'none',
                    borderBottom: i < options.length - 1 ? '1px solid var(--br)' : 'none',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: active ? 'rgba(200,16,46,.15)' : 'rgba(255,255,255,.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .12s',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none"
                      stroke={active ? '#C8102E' : 'var(--t3)'}
                      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      width={14} height={14}>
                      <path d={opt.icon} />
                    </svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#C8102E' : 'var(--t1)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{opt.desc}</div>
                  </div>
                  {active && (
                    <motion.svg
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round" width={14} height={14}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
