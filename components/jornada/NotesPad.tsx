'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Note {
  id: string
  texto: string
  autor: string
  timestamp: string // ISO string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1)  return 'agora mesmo'
  if (m < 60) return `há ${m} min`
  if (h < 24) return `há ${h}h`
  return `há ${d}d`
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AUTOR_DEFAULT = 'Gabriel'

interface Props {
  storageKey: string  // e.g. `notes-${clienteId}-${usuarioId}`
}

export default function NotesPad({ storageKey }: Props) {
  const [notes, setNotes]         = useState<Note[]>([])
  const [text, setText]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [focused, setFocused]     = useState(false)
  const textareaRef               = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage on mount / key change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setNotes(stored ? JSON.parse(stored) : [])
    } catch { setNotes([]) }
    setText('')
  }, [storageKey])

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '36px'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [])

  useEffect(() => { adjustHeight() }, [text, adjustHeight])

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const next: Note[] = [
      { id: Date.now().toString(), texto: trimmed, autor: AUTOR_DEFAULT, timestamp: new Date().toISOString() },
      ...notes,
    ]
    setNotes(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
    setText('')
    setSaving(true)
    setSaved(false)
    setTimeout(() => { setSaving(false); setSaved(true) }, 300)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = (id: string) => {
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const remaining = 280 - text.length
  const overLimit = remaining < 0

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--br)', background: 'var(--bg-c)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--br)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
            Notas do Squad
          </span>
        </div>
        {notes.length > 0 && (
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(200,16,46,.1)', color: '#C8102E', fontWeight: 700 }}>
            {notes.length}
          </span>
        )}
      </div>

      {/* Notes list */}
      <AnimatePresence initial={false}>
        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--br)',
              display: 'flex', gap: 9, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #C8102E, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff',
              }}>
                {initials(note.autor)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>{note.autor}</span>
                  <span style={{ fontSize: 10, color: 'var(--t3)' }}>{relativeTime(note.timestamp)}</span>
                </div>
                <p style={{
                  fontSize: 12, color: 'var(--t1)', lineHeight: 1.5,
                  wordBreak: 'break-word', margin: 0,
                }}>
                  {note.texto}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(note.id)}
                title="Excluir nota"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--t3)', padding: 2, borderRadius: 4,
                  display: 'flex', alignItems: 'center',
                  flexShrink: 0, transition: 'color .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {notes.length === 0 && (
        <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
          Nenhuma nota ainda. Adicione uma observação abaixo.
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '10px 12px',
        background: focused ? 'rgba(200,16,46,.03)' : 'transparent',
        transition: 'background .18s',
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          border: `1px solid ${focused ? 'rgba(200,16,46,.4)' : 'var(--br)'}`,
          borderRadius: 10, padding: '8px 10px',
          background: 'var(--bg-s)',
          transition: 'border-color .18s, box-shadow .18s',
          boxShadow: focused ? '0 0 0 2px rgba(200,16,46,.08)' : 'none',
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={'Adicione uma nota... (Enter para salvar, Shift+Enter para nova linha)'}
            maxLength={300}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', overflow: 'hidden',
              fontSize: 12, color: 'var(--t1)', lineHeight: 1.5,
              height: 36, minHeight: 36, maxHeight: 120,
              fontFamily: 'inherit',
            }}
          />

          <motion.button
            onClick={handleSave}
            disabled={!text.trim() || overLimit}
            animate={{ scale: text.trim() && !overLimit ? 1 : 0.85, opacity: text.trim() && !overLimit ? 1 : 0.3 }}
            transition={{ duration: 0.15 }}
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: saved ? 'rgba(16,185,129,.15)' : 'rgba(200,16,46,.15)',
              border: `1px solid ${saved ? 'rgba(16,185,129,.3)' : 'rgba(200,16,46,.3)'}`,
              cursor: text.trim() && !overLimit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: saved ? '#10B981' : '#C8102E',
              transition: 'background .15s, border-color .15s, color .15s',
            }}
            title="Salvar nota (Enter)"
          >
            {saved ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Footer: char count + hint */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, paddingLeft: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>
            Shift+Enter para nova linha
          </span>
          <span style={{ fontSize: 10, color: overLimit ? '#EF4444' : 'var(--t3)', fontWeight: overLimit ? 700 : 400 }}>
            {remaining < 50 && `${remaining} restantes`}
          </span>
        </div>
      </div>
    </div>
  )
}
