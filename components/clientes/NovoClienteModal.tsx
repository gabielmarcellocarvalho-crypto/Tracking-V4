'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { criarCliente } from '@/lib/data/partners'
import type { Partner, PartnerTipo } from '@/lib/types'

const TIPOS: { id: PartnerTipo; label: string; desc: string; color: string }[] = [
  { id: 'ecommerce', label: 'E-commerce', desc: 'Receita · ROAS · Compras',      color: '#10B981' },
  { id: 'leads',     label: 'Leads',      desc: 'CPL · Qualificados · CPA',      color: '#8B5CF6' },
  { id: 'mensagens', label: 'Mensagens',  desc: 'WhatsApp · Contatos · CPM',     color: '#25D366' },
]

export default function NovoClienteModal({ onClose, onCriado }: {
  onClose: () => void
  onCriado?: (c: Partner) => void
}) {
  const [nome, setNome]         = useState('')
  const [segmento, setSegmento] = useState('')
  const [tipo, setTipo]         = useState<PartnerTipo>('ecommerce')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')
  const [criado, setCriado]     = useState<Partner | null>(null)
  const [copiado, setCopiado]   = useState(false)

  const handleCriar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do cliente'); return }
    setSalvando(true)
    setErro('')
    try {
      const c = await criarCliente({ nome, segmento: segmento || 'Geral', tipo })
      setCriado(c)
      onCriado?.(c)
    } catch (e) {
      console.error(e)
      setErro('Falha ao criar cliente — verifique a conexão com o Firebase')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-1)',
    outline: 'none',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480, borderRadius: 14, padding: 24,
            background: 'var(--bg-c)', border: '1px solid var(--br)',
          }}
        >
          {!criado ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Novo cliente</h3>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 18px' }}>
                Cria o cliente no Firestore e gera a tracking key para instalar o snippet no site.
              </p>

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Official Time" style={inputStyle} />

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', margin: '14px 0 6px' }}>Segmento</label>
              <input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: E-commerce, Saúde, Imobiliário..." style={inputStyle} />

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', margin: '14px 0 6px' }}>Tipo de operação</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {TIPOS.map((t) => (
                  <button key={t.id} onClick={() => setTipo(t.id)} style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: tipo === t.id ? t.color + '14' : 'var(--bg-base)',
                    border: `1px solid ${tipo === t.id ? t.color + '60' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: tipo === t.id ? t.color : 'var(--t1)' }}>{t.label}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {erro && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 12 }}>{erro}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{
                  padding: '9px 16px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--t2)',
                }}>Cancelar</button>
                <button onClick={handleCriar} disabled={salvando} style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: 'var(--red)', border: 'none', color: '#fff', opacity: salvando ? 0.6 : 1,
                }}>{salvando ? 'Criando…' : 'Criar cliente'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: '50%', background: 'rgba(16,185,129,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{criado.nome} criado</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>Instale o snippet no site para começar a receber eventos</p>
                </div>
              </div>

              <div style={{
                padding: 12, borderRadius: 8, background: 'var(--bg-base)',
                border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 10.5,
                color: 'var(--t2)', wordBreak: 'break-all', lineHeight: 1.6,
              }}>
                {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/v4track.js" data-cliente="${criado.id}" data-key="${criado.trackingKey}" defer></script>`}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="${window.location.origin}/v4track.js" data-cliente="${criado.id}" data-key="${criado.trackingKey}" defer></script>`)
                    setCopiado(true)
                    setTimeout(() => setCopiado(false), 1500)
                  }}
                  style={{
                    padding: '9px 16px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${copiado ? '#10B981' : 'var(--border)'}`,
                    color: copiado ? '#10B981' : 'var(--t2)',
                  }}>{copiado ? 'Copiado ✓' : 'Copiar snippet'}</button>
                <button onClick={onClose} style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: 'var(--red)', border: 'none', color: '#fff',
                }}>Concluir</button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
