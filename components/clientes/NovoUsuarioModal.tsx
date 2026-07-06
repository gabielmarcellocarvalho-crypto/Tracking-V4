'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '@/lib/firebase'
import type { Partner, MemberRole } from '@/lib/types'

interface ResultadoCriacao {
  jaExistia: boolean
  passwordResetLink?: string
  clientesConcedidos: number
}

export default function NovoUsuarioModal({ clientes, onClose }: {
  clientes: Partner[]
  onClose: () => void
}) {
  const [email, setEmail]       = useState('')
  const [nome, setNome]         = useState('')
  const [role, setRole]         = useState<MemberRole>('viewer')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null)
  const [copiado, setCopiado]   = useState(false)

  const toggleCliente = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCriar = async () => {
    if (!email.trim() || !email.includes('@')) { setErro('Informe um e-mail válido'); return }
    if (selecionados.size === 0) { setErro('Selecione pelo menos um cliente'); return }

    setSalvando(true)
    setErro('')
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('sessão inválida — faça login novamente')

      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          email: email.trim(),
          nome: nome.trim() || undefined,
          clienteIds: Array.from(selecionados),
          role,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.erro ?? 'falha ao criar usuário')

      setResultado({ jaExistia: json.jaExistia, passwordResetLink: json.passwordResetLink, clientesConcedidos: json.clientesConcedidos })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falha ao criar usuário')
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
            width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', borderRadius: 14, padding: 24,
            background: 'var(--bg-c)', border: '1px solid var(--br)',
          }}
        >
          {!resultado ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Novo usuário</h3>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 18px' }}>
                Cria a conta no Firebase Auth e já concede acesso aos clientes escolhidos. Só você (superadmin) vê essa opção.
              </p>

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gestor@v4company.com" style={inputStyle} />

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', margin: '14px 0 6px' }}>Nome (opcional)</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" style={inputStyle} />

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', margin: '14px 0 6px' }}>Nível de acesso</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { id: 'admin' as const, label: 'Admin', desc: 'Lê e edita tudo nos clientes selecionados', color: '#EF4444' },
                  { id: 'viewer' as const, label: 'Visualizador', desc: 'Só lê — não edita conexões nem apaga nada', color: '#3B82F6' },
                ]).map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)} style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: role === r.id ? r.color + '14' : 'var(--bg-base)',
                    border: `1px solid ${role === r.id ? r.color + '60' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: role === r.id ? r.color : 'var(--t1)' }}>{r.label}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', margin: '14px 0 6px' }}>
                Clientes que vai acessar ({selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''})
              </label>
              <div style={{
                maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
                border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: 'var(--bg-base)',
              }}>
                {clientes.length === 0 && (
                  <p style={{ fontSize: 11.5, color: 'var(--t3)', padding: 6 }}>Nenhum cliente cadastrado ainda.</p>
                )}
                {clientes.map((c) => {
                  const ativo = selecionados.has(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCliente(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: ativo ? 'rgba(200,16,46,.1)' : 'transparent',
                        border: `1px solid ${ativo ? 'rgba(200,16,46,.35)' : 'transparent'}`,
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${ativo ? 'var(--red)' : 'var(--border)'}`,
                        background: ativo ? 'var(--red)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ativo && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={10} height={10}><polyline points="20 6 9 17 4 12" /></svg>}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>{c.nome}</span>
                    </button>
                  )
                })}
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
                }}>{salvando ? 'Criando…' : 'Criar usuário'}</button>
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
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                    {resultado.jaExistia ? 'Acesso concedido' : 'Usuário criado'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>
                    {resultado.jaExistia
                      ? `Esse e-mail já tinha conta — só adicionei acesso a ${resultado.clientesConcedidos} cliente(s)`
                      : `Acesso concedido a ${resultado.clientesConcedidos} cliente(s)`}
                  </p>
                </div>
              </div>

              {resultado.passwordResetLink && (
                <>
                  <p style={{ fontSize: 11.5, color: 'var(--t2)', margin: '0 0 6px' }}>
                    Manda esse link pro usuário — ele define a própria senha (não temos envio de e-mail automático ainda):
                  </p>
                  <div style={{
                    padding: 12, borderRadius: 8, background: 'var(--bg-base)',
                    border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 10.5,
                    color: 'var(--t2)', wordBreak: 'break-all', lineHeight: 1.6,
                  }}>
                    {resultado.passwordResetLink}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {resultado.passwordResetLink && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultado.passwordResetLink!)
                      setCopiado(true)
                      setTimeout(() => setCopiado(false), 1500)
                    }}
                    style={{
                      padding: '9px 16px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                      background: 'transparent', border: `1px solid ${copiado ? '#10B981' : 'var(--border)'}`,
                      color: copiado ? '#10B981' : 'var(--t2)',
                    }}>{copiado ? 'Copiado ✓' : 'Copiar link'}</button>
                )}
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
