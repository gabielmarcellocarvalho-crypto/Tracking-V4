'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from './Markdown'
import { auth } from '@/lib/firebase'
import { useCliente } from '@/lib/data/partners'
import { salvarInsight } from '@/lib/data/colecoes'

interface Mensagem {
  papel: 'usuario' | 'agente' | 'erro'
  texto: string
}

const ACOES = [
  { id: 'analise-geral',     label: 'Análise geral',    color: '#C8102E' },
  { id: 'auditar-utms',      label: 'Auditar UTMs',     color: '#3B82F6' },
  { id: 'cross-check',       label: 'Cross-check',      color: '#F59E0B' },
  { id: 'sugerir-dashboard', label: 'Sugerir dashboard', color: '#8B5CF6' },
]

// Três pontinhos pulsando em loop — usado no indicador "Analisando os dados".
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 2 }}>
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', margin: '0 2px', boxShadow: '0 0 5px var(--red)' }}
          initial={{ opacity: 0.3, scale: 0.85 }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

const SparkleIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
    <circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
  </svg>
)

export default function AgenteBubble({ clienteId }: { clienteId?: string }) {
  const { isDemo } = useCliente(clienteId)

  const [aberto, setAberto]       = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [pergunta, setPergunta]   = useState('')
  const [carregando, setCarregando] = useState(false)
  const [semKey, setSemKey]       = useState(false)
  const [inputFocado, setInputFocado] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!clienteId) return null

  const consultar = async (payload: { pergunta?: string; acao?: string }, rotulo: string) => {
    if (carregando) return
    setMensagens((m) => [...m, { papel: 'usuario', texto: rotulo }])
    setCarregando(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ clienteId, ...payload }),
      })
      const data = await res.json()
      if (data.configurado === false) {
        setSemKey(true)
        setMensagens((m) => [...m, { papel: 'erro', texto: 'GROQ_API_KEY não configurada.' }])
      } else if (data.ok) {
        setMensagens((m) => [...m, { papel: 'agente', texto: data.resposta }])
        if (payload.acao) {
          salvarInsight(clienteId, {
            tipo: payload.acao,
            titulo: rotulo,
            corpo: data.resposta,
            severidade: 'info',
            origem: 'agente',
            criadoEm: Date.now(),
          }).catch(() => {})
        }
      } else {
        setMensagens((m) => [...m, { papel: 'erro', texto: data.erro ?? 'Erro desconhecido' }])
      }
    } catch {
      setMensagens((m) => [...m, { papel: 'erro', texto: 'Falha de rede ao consultar o agente' }])
    } finally {
      setCarregando(false)
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 100)
    }
  }

  const enviarPergunta = () => {
    const p = pergunta.trim()
    if (!p) return
    setPergunta('')
    consultar({ pergunta: p }, p)
  }

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 300 }}>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', bottom: 76, right: 0,
              width: 'min(440px, calc(100vw - 48px))', height: 'min(640px, calc(100vh - 120px))',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              borderRadius: 18, border: '1px solid var(--br)',
              background: 'var(--bg-c)', boxShadow: '0 24px 64px -12px rgba(0,0,0,.6)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 12px', borderBottom: '1px solid var(--br)', flexShrink: 0 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--red), var(--purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SparkleIcon size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Agente IA</h3>
                <p style={{ fontSize: 10, color: 'var(--t3)', margin: '1px 0 0' }}>Mesmo contexto em Tracking e Gestor de Mídia</p>
              </div>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Ações rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, padding: '10px 12px 0', flexShrink: 0 }}>
              {ACOES.map((a) => (
                <button
                  key={a.id}
                  disabled={carregando || isDemo}
                  onClick={() => consultar({ acao: a.id }, a.label)}
                  style={{
                    textAlign: 'left', padding: '7px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: 600,
                    cursor: carregando || isDemo ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-base)', border: '1px solid var(--br)', color: a.color,
                    opacity: carregando || isDemo ? 0.5 : 1,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isDemo && (
                <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 11, color: 'var(--t2)' }}>
                  Cliente demo — o agente analisa apenas dados reais.
                </div>
              )}
              {semKey && (
                <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.3)', fontSize: 11, color: 'var(--t2)' }}>
                  GROQ_API_KEY não configurada no .env.local.
                </div>
              )}
              {mensagens.length === 0 && !isDemo && !semKey && (
                <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 11.5 }}>
                  Escolha uma ação rápida ou faça uma pergunta sobre os dados deste cliente.
                </div>
              )}
              <AnimatePresence>
                {mensagens.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    style={{
                      alignSelf: m.papel === 'usuario' ? 'flex-end' : 'flex-start',
                      maxWidth: '92%',
                      padding: '9px 12px', borderRadius: 11,
                      background: m.papel === 'usuario' ? 'rgba(200,16,46,.12)'
                        : m.papel === 'erro' ? 'rgba(239,68,68,.08)'
                        : 'var(--bg-base)',
                      border: `1px solid ${m.papel === 'usuario' ? 'rgba(200,16,46,.3)' : m.papel === 'erro' ? 'rgba(239,68,68,.3)' : 'var(--br)'}`,
                    }}
                  >
                    {m.papel === 'agente'
                      ? <Markdown texto={m.texto} />
                      : <p style={{ fontSize: 11.5, color: m.papel === 'erro' ? '#EF4444' : 'var(--t1)', margin: 0 }}>{m.texto}</p>}
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {carregando && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{
                      alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 11px', borderRadius: 999, fontSize: 10.5, color: 'var(--t3)',
                      background: 'var(--bg-base)', border: '1px solid var(--br)',
                    }}
                  >
                    <motion.span
                      style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    Analisando
                    <TypingDots />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div style={{ padding: 10, borderTop: '1px solid var(--br)', flexShrink: 0 }}>
              <motion.div
                animate={{
                  borderColor: inputFocado ? 'rgba(200,16,46,.45)' : 'var(--br)',
                }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: 14, border: '1px solid var(--br)', background: 'var(--bg-base)', overflow: 'hidden' }}
              >
                <textarea
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarPergunta() } }}
                  onFocus={() => setInputFocado(true)}
                  onBlur={() => setInputFocado(false)}
                  disabled={carregando || isDemo}
                  rows={1}
                  placeholder={isDemo ? 'Disponível apenas para clientes reais' : 'Pergunte algo…'}
                  style={{
                    width: '100%', minHeight: 40, maxHeight: 100, padding: '10px 12px 4px', fontSize: 12.5,
                    background: 'transparent', border: 'none', color: 'var(--t1)', outline: 'none',
                    resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, display: 'block',
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = '40px'
                    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
                  }}
                />
                <div style={{ padding: '4px 8px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={enviarPergunta}
                    disabled={carregando || isDemo || !pergunta.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: pergunta.trim() ? 'var(--red)' : 'var(--bg-c)',
                      border: pergunta.trim() ? 'none' : '1px solid var(--br)',
                      color: pergunta.trim() ? '#fff' : 'var(--t3)',
                      cursor: carregando || isDemo ? 'not-allowed' : 'pointer',
                      opacity: carregando || isDemo ? 0.5 : 1,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Enviar
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bolinha */}
      <motion.button
        onClick={() => setAberto((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Agente IA"
        title="Agente IA"
        style={{
          width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--red), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px -4px rgba(200,16,46,.55)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {aberto ? (
            <motion.svg
              key="close" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={23} height={23}
              initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }} transition={{ duration: 0.15 }}
            >
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.span key="sparkle" initial={{ opacity: 0, rotate: 45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -45 }} transition={{ duration: 0.15 }}>
              <SparkleIcon size={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
