'use client'

import { use, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import { useEventos, useInsights, salvarInsight } from '@/lib/data/colecoes'
import { gerarAlertas } from '@/lib/data/agregacoes'

interface Mensagem {
  papel: 'usuario' | 'agente' | 'erro'
  texto: string
}

const ACOES = [
  { id: 'analise-geral',     label: 'Análise geral',          desc: 'Visão completa da operação',            color: '#C8102E' },
  { id: 'auditar-utms',      label: 'Auditar UTMs',           desc: 'Conformidade com o padrão V4',          color: '#3B82F6' },
  { id: 'cross-check',       label: 'Cross-check atribuição', desc: 'Dados próprios vs Meta/Google',         color: '#F59E0B' },
  { id: 'sugerir-dashboard', label: 'Sugerir dashboard',      desc: 'KPIs ideais para este cliente',         color: '#8B5CF6' },
]

// Renderizador markdown minimalista (títulos, negrito, bullets)
function Markdown({ texto }: { texto: string }) {
  const linhas = texto.split('\n')
  const render = (s: string) => {
    const partes = s.split(/(\*\*[^*]+\*\*)/g)
    return partes.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--t1)' }}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {linhas.map((l, i) => {
        if (l.startsWith('### ')) return <h4 key={i} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', margin: '8px 0 0' }}>{l.slice(4)}</h4>
        if (l.startsWith('## '))  return <h3 key={i} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(3)}</h3>
        if (l.startsWith('# '))   return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(2)}</h3>
        if (/^\s*[-•*] /.test(l)) return (
          <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
            <span style={{ color: 'var(--red)', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{render(l.replace(/^\s*[-•*] /, ''))}</span>
          </div>
        )
        if (!l.trim()) return null
        return <p key={i} style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, margin: 0 }}>{render(l)}</p>
      })}
    </div>
  )
}

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

export default function AgentePage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { eventos } = useEventos(isDemo ? undefined : clienteId)
  const { insights } = useInsights(isDemo ? undefined : clienteId)

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [pergunta, setPergunta]   = useState('')
  const [carregando, setCarregando] = useState(false)
  const [semKey, setSemKey]       = useState(false)
  const [inputFocado, setInputFocado] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const alertas = useMemo(() => gerarAlertas(eventos), [eventos])

  const consultar = async (payload: { pergunta?: string; acao?: string }, rotulo: string) => {
    if (carregando) return
    setMensagens((m) => [...m, { papel: 'usuario', texto: rotulo }])
    setCarregando(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, ...payload }),
      })
      const data = await res.json()
      if (data.configurado === false) {
        setSemKey(true)
        setMensagens((m) => [...m, { papel: 'erro', texto: 'ANTHROPIC_API_KEY não configurada.' }])
      } else if (data.ok) {
        setMensagens((m) => [...m, { papel: 'agente', texto: data.resposta }])
        // Persiste ações rápidas como insight do cliente
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
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-hidden flex" style={{ background: 'var(--bg-base)' }}>
        {/* Coluna principal — chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Blobs ambiente — puramente decorativo, atrás de tudo */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div className="animate-pulse" style={{ position: 'absolute', top: -60, left: '8%', width: 300, height: 300, borderRadius: '50%', background: 'var(--red)', opacity: 0.06, filter: 'blur(100px)' }} />
            <div className="animate-pulse" style={{ position: 'absolute', bottom: -80, right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'var(--purple)', opacity: 0.06, filter: 'blur(110px)', animationDelay: '0.7s' }} />
          </div>

          {/* Header */}
          <div style={{ padding: '18px 24px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--red), var(--purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
                  <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
                  <circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
                </svg>
              </span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Agente IA</h2>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '1px 0 0' }}>
                  Analisa os dados primários do cliente — eventos, jornadas, UTMs e conversões
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
              {ACOES.map((a) => (
                <motion.button
                  key={a.id}
                  disabled={carregando || isDemo}
                  onClick={() => consultar({ acao: a.id }, a.label)}
                  whileHover={carregando || isDemo ? undefined : { y: -2, borderColor: a.color + '70' }}
                  whileTap={carregando || isDemo ? undefined : { scale: 0.97 }}
                  style={{
                    textAlign: 'left', padding: '11px 13px', borderRadius: 10,
                    cursor: carregando || isDemo ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-c)', border: '1px solid var(--br)',
                    opacity: carregando || isDemo ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: a.color }}>{a.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{a.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
            {isDemo && (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 12.5, color: 'var(--t2)' }}>
                Cliente demo — o agente analisa apenas dados reais. Crie um cliente e instale o snippet para usar.
              </div>
            )}
            {semKey && (
              <div style={{ padding: '16px 18px', borderRadius: 10, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.3)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', margin: 0 }}>Configure a API key do agente</p>
                <p style={{ fontSize: 12, color: 'var(--t2)', margin: '6px 0 0', lineHeight: 1.6 }}>
                  1. Crie uma key em <span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>console.anthropic.com</span><br />
                  2. Adicione no <span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>.env.local</span>: <span style={{ fontFamily: 'monospace', color: '#10B981' }}>ANTHROPIC_API_KEY=sk-ant-…</span><br />
                  3. Reinicie o servidor (<span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>npm run dev</span>)
                </p>
              </div>
            )}
            {mensagens.length === 0 && !isDemo && !semKey && (
              <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>
                Escolha uma ação rápida acima ou faça uma pergunta sobre os dados deste cliente.
              </div>
            )}
            <AnimatePresence>
              {mensagens.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  style={{
                    alignSelf: m.papel === 'usuario' ? 'flex-end' : 'flex-start',
                    maxWidth: m.papel === 'usuario' ? '70%' : '92%',
                    padding: '12px 15px', borderRadius: 12,
                    background: m.papel === 'usuario' ? 'rgba(200,16,46,.12)'
                      : m.papel === 'erro' ? 'rgba(239,68,68,.08)'
                      : 'var(--bg-c)',
                    border: `1px solid ${m.papel === 'usuario' ? 'rgba(200,16,46,.3)' : m.papel === 'erro' ? 'rgba(239,68,68,.3)' : 'var(--br)'}`,
                  }}
                >
                  {m.papel === 'agente'
                    ? <Markdown texto={m.texto} />
                    : <p style={{ fontSize: 12.5, color: m.papel === 'erro' ? '#EF4444' : 'var(--t1)', margin: 0 }}>{m.texto}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {carregando && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px', borderRadius: 999, fontSize: 12, color: 'var(--t3)',
                    background: 'var(--bg-c)', border: '1px solid var(--br)',
                  }}
                >
                  <motion.span
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  Analisando os dados
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input — caixa única "glass", inspirada na referência (chat IA.png) */}
          <div style={{ padding: '14px 24px 20px', position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{
                borderColor: inputFocado ? 'rgba(200,16,46,.4)' : 'var(--br)',
                boxShadow: inputFocado ? '0 0 0 3px rgba(200,16,46,.14)' : '0 0 0 0px rgba(200,16,46,0)',
              }}
              transition={{ duration: 0.18 }}
              style={{
                borderRadius: 16, border: '1px solid var(--br)', background: 'var(--bg-c)',
                backdropFilter: 'blur(20px)', boxShadow: '0 8px 30px rgba(0,0,0,.12)', overflow: 'hidden',
              }}
            >
              <textarea
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarPergunta() } }}
                onFocus={() => setInputFocado(true)}
                onBlur={() => setInputFocado(false)}
                disabled={carregando || isDemo}
                rows={1}
                placeholder={isDemo ? 'Disponível apenas para clientes reais' : 'Pergunte sobre os dados deste cliente…'}
                style={{
                  width: '100%', minHeight: 52, maxHeight: 160, padding: '15px 18px', fontSize: 13.5,
                  background: 'transparent', border: 'none', color: 'var(--t1)', outline: 'none',
                  resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, display: 'block',
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = '52px'
                  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
                }}
              />
              <div style={{
                padding: '10px 14px', borderTop: '1px solid var(--br)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                  Enter envia · Shift+Enter quebra linha
                </span>
                <motion.button
                  onClick={enviarPergunta}
                  disabled={carregando || isDemo || !pergunta.trim()}
                  whileHover={carregando || isDemo || !pergunta.trim() ? undefined : { scale: 1.03 }}
                  whileTap={carregando || isDemo || !pergunta.trim() ? undefined : { scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                    background: pergunta.trim() ? 'var(--red)' : 'var(--bg-base)',
                    border: pergunta.trim() ? 'none' : '1px solid var(--br)',
                    color: pergunta.trim() ? '#fff' : 'var(--t3)',
                    cursor: carregando || isDemo ? 'not-allowed' : 'pointer',
                    opacity: carregando || isDemo ? 0.5 : 1,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Enviar
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Coluna lateral — alertas + insights salvos */}
        <aside style={{ width: 290, flexShrink: 0, borderLeft: '1px solid var(--br)', overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 10px' }}>
              Alertas automáticos
            </p>
            {alertas.length === 0 && (
              <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nenhum alerta — tudo saudável ou sem dados suficientes.</p>
            )}
            {alertas.map((a) => (
              <div key={a.tipo} style={{
                padding: '10px 12px', borderRadius: 9, marginBottom: 8,
                background: a.severidade === 'critico' ? 'rgba(239,68,68,.07)' : 'rgba(245,158,11,.06)',
                border: `1px solid ${a.severidade === 'critico' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.25)'}`,
              }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: a.severidade === 'critico' ? '#EF4444' : '#F59E0B', margin: 0 }}>{a.titulo}</p>
                <p style={{ fontSize: 10.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.5 }}>{a.corpo}</p>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '0 0 10px' }}>
              Insights salvos
            </p>
            {insights.length === 0 && (
              <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>As ações rápidas ficam salvas aqui.</p>
            )}
            {insights.slice(0, 10).map((ins) => (
              <details key={ins.id} style={{
                padding: '10px 12px', borderRadius: 9, marginBottom: 8,
                background: 'var(--bg-c)', border: '1px solid var(--br)',
              }}>
                <summary style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t1)', cursor: 'pointer' }}>
                  {ins.titulo}
                  <span style={{ fontSize: 9.5, color: 'var(--t3)', marginLeft: 6 }}>
                    {new Date(ins.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </summary>
                <div style={{ marginTop: 8 }}><Markdown texto={ins.corpo} /></div>
              </details>
            ))}
          </div>
        </aside>
      </main>
    </>
  )
}
