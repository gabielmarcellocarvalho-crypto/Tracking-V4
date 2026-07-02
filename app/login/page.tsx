'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { signIn, resetPassword, user, loading } = useAuth()
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetMode, setResetMode] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/clientes')
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      router.replace('/clientes')
    } catch {
      setError('E-mail ou senha incorretos. Verifique e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch {
      setError('Não foi possível enviar o e-mail. Verifique o endereço informado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[400px] rounded-[16px] p-8 fade-in"
        style={{ background: 'var(--bg-side)', border: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/v4-logo.png"
            alt="V4 Company"
            style={{
              width: 72, height: 72, borderRadius: 16, marginBottom: 14,
              boxShadow: '0 8px 28px rgba(200,16,46,.45)',
              objectFit: 'cover',
            }}
          />
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            TRACKING V4
          </h1>
          <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-3)' }}>
            Carvalho &amp; Co — Gestão de Tráfego
          </p>
        </div>

        {/* Reset sent */}
        {resetSent ? (
          <div className="text-center">
            <p className="text-[14px] mb-2" style={{ color: 'var(--green)' }}>
              E-mail enviado com sucesso!
            </p>
            <p className="text-[12.5px] mb-6" style={{ color: 'var(--text-3)' }}>
              Verifique sua caixa de entrada para redefinir a senha.
            </p>
            <button
              onClick={() => { setResetMode(false); setResetSent(false) }}
              className="text-[13px] font-medium"
              style={{ color: 'var(--accent)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}><polyline points="15 18 9 12 15 6" /></svg>
                Voltar ao login
              </span>
            </button>
          </div>
        ) : resetMode ? (
          /* Reset form */
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <p className="text-[13px] text-center mb-1" style={{ color: 'var(--text-2)' }}>
              Informe seu e-mail para receber o link de redefinição.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-[11px] rounded-[8px] text-[14px] outline-none transition-all duration-[180ms]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,16,46,.15)' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {error && <p className="text-[12.5px]" style={{ color: 'var(--red)' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-[12px] rounded-[8px] font-semibold text-[14px] text-white transition-all duration-[180ms] cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--acc-h)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
            >
              {submitting ? 'Enviando...' : 'Enviar link'}
            </button>

            <button
              type="button"
              onClick={() => setResetMode(false)}
              className="text-[12.5px] text-center cursor-pointer"
              style={{ color: 'var(--text-3)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}><polyline points="15 18 9 12 15 6" /></svg>
                Voltar ao login
              </span>
            </button>
          </form>
        ) : (
          /* Login form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* E-mail */}
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-[11px] rounded-[8px] text-[14px] outline-none transition-all duration-[180ms]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,16,46,.15)' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-[11px] pr-12 rounded-[8px] text-[14px] outline-none transition-all duration-[180ms]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,16,46,.15)' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12.5px] px-3 py-2 rounded-[6px]"
                style={{ color: 'var(--red)', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-[12px] rounded-[8px] font-semibold text-[14px] text-white transition-all duration-[180ms] cursor-pointer disabled:opacity-60 mt-1"
              style={{ background: 'var(--red)', boxShadow: '0 4px 14px rgba(200,16,46,.35)' }}
              onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = 'var(--acc-h)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-[12.5px] text-center cursor-pointer mt-1 transition-colors duration-[180ms]"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)' }}
            >
              Esqueci minha senha
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
