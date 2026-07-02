'use client'

import { useState } from 'react'

type Canal = 'meta' | 'google' | 'linkedin' | 'other'

const SOURCES_OTHER = ['whatsapp', 'email', 'eventos', 'portal', 'folheteria', 'sms', 'interno', 'zendesk']
const TIPOS_GOOGLE  = ['search', 'max', 'google-shop', 'display', 'discovery'] as const
const TIPOS_LINKEDIN = ['in-leadad', 'in-post', 'in-video'] as const

const RULES: Record<Canal, string[]> = {
  meta: [
    'Sempre minúsculas — ex: verao-2025',
    'Palavras separadas por hífen — nunca espaço',
    'Sem caracteres especiais: ã, ç, é, @, #...',
    'Versões com sufixo: -v1, -v2',
  ],
  google: [
    'Sempre minúsculas — ex: verao-2025',
    'Palavras separadas por hífen — nunca espaço',
    'gclid: capturado automaticamente pelo Google — não remover',
    'Versões com sufixo: -v1, -v2',
  ],
  linkedin: [
    'Sempre minúsculas — ex: verao-2025',
    'Palavras separadas por hífen — nunca espaço',
    'Sem caracteres especiais: ã, ç, é, @, #...',
    'Versões com sufixo: -v1, -v2',
  ],
  other: [
    'Sempre minúsculas — ex: verao-2025',
    'Palavras separadas por hífen — nunca espaço',
    'Sem caracteres especiais: ã, ç, é, @, #...',
    'Versões com sufixo: -v1, -v2',
  ],
}

const CANAL_LABELS: Record<Canal, string> = {
  meta: 'Meta Ads · source: meta · medium: paid · Campanha → Conjunto → Anúncio',
  google: 'Google Ads · source: google · medium: paid · Campanha → Conjunto → Anúncio',
  linkedin: 'LinkedIn Ads · source: linkedin · medium: paid · Campanha → Conjunto → Anúncio',
  other: 'Others Channels · hierarquia: Campanha → Conjunto → Anúncio',
}

function colorizeUrl(url: string) {
  const idx = url.indexOf('?')
  if (idx === -1) return <span style={{ color: 'var(--text-1)' }}>{url}</span>
  const base   = url.slice(0, idx)
  const params = url.slice(idx + 1).split('&')
  return (
    <>
      <span style={{ color: 'var(--text-1)' }}>{base}?</span>
      {params.map((p, i) => {
        const [k, v] = p.split('=')
        return (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--text-3)' }}>&amp;</span>}
            <span style={{ color: '#10B981' }}>{k}</span>
            <span style={{ color: 'var(--text-3)' }}>=</span>
            <span style={{ color: '#F59E0B' }}>{v}</span>
          </span>
        )
      })}
    </>
  )
}

export interface UTMModalProps {
  canal: Canal
  onClose: () => void
  onSave?: (utm: Record<string, string>) => void
}

export default function UTMModal({ canal, onClose, onSave }: UTMModalProps) {
  const [base, setCampo]      = useState('')
  const [campaign, setCampaign] = useState('')
  const [term, setTerm]       = useState('')
  const [content, setContent] = useState('')
  const [source, setSource]   = useState(canal === 'meta' ? 'meta' : canal === 'google' ? 'google' : canal === 'linkedin' ? 'linkedin' : 'whatsapp')
  const [tipoPeca, setTipoPeca] = useState('hiperlink')
  const [tipoGoogle, setTipoGoogle]     = useState('search')
  const [tipoLinkedin, setTipoLinkedin] = useState('in-leadad')
  const [copied, setCopied]   = useState(false)

  const medium = canal === 'other' ? 'organic' : 'paid'

  const buildUrl = () => {
    if (!base) return ''
    const b = base.endsWith('/') ? base : base + '/'
    const params = new URLSearchParams()
    if (campaign) params.set('utm_campaign', campaign)
    if (canal !== 'other') {
      if (term)    params.set('utm_term', term)
      if (content) params.set('utm_content', content)
    }
    params.set('utm_source', source)
    params.set('utm_medium', medium)
    if (canal === 'other' && tipoPeca) params.set('utm_term', tipoPeca)
    const qs = params.toString()
    return qs ? `${b}?${qs}` : b
  }

  const generatedUrl = buildUrl()

  const handleCopy = () => {
    if (!generatedUrl) return
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onSave?.({ campaign, term, content, source, medium })
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
  }

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent)'
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(249,115,22,.12)'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.boxShadow   = 'none'
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[600px] rounded-[16px] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'var(--bg-side)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,.6)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <h2 className="text-[16px] font-bold text-[--text-1]">Gerar UTM</h2>
            <p className="text-[11.5px] text-[--text-3] mt-[3px]">{CANAL_LABELS[canal]}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-[6px] flex items-center justify-center cursor-pointer transition-colors duration-[180ms] hover:bg-[--bg-card] text-[--text-3] hover:text-[--text-1]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          {/* Rules */}
          <div className="rounded-[10px] p-4" style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)' }}>
            <p className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wide mb-2">Regras de nomenclatura</p>
            <ul className="flex flex-col gap-1">
              {RULES[canal].map((r) => (
                <li key={r} className="text-[12px] flex gap-2" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: '#3B82F6' }}>·</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-3">
            {/* URL Base */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>URL Base do Site</label>
              <input value={base} onChange={(e) => setCampo(e.target.value)} placeholder="https://exemplo.com.br/" className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms]" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </div>

            {/* Tipo (Google / LinkedIn) */}
            {canal === 'google' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Tipo de Campanha</label>
                <select value={tipoGoogle} onChange={(e) => setTipoGoogle(e.target.value)} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms] cursor-pointer" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                  {TIPOS_GOOGLE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            {canal === 'linkedin' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Tipo</label>
                <select value={tipoLinkedin} onChange={(e) => setTipoLinkedin(e.target.value)} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms] cursor-pointer" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                  {TIPOS_LINKEDIN.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {/* Campaign */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                Campanha <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(utm_campaign)</span>
              </label>
              <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="v4-ate_sp_perf_ved_[cliente]_link_[detalhe]" className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms]" style={{ ...inputStyle, fontFamily: 'monospace' }} onFocus={inputFocus} onBlur={inputBlur} />
            </div>

            {canal !== 'other' && (
              <>
                {/* Term */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    Conjunto <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(utm_term)</span>
                  </label>
                  <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`${campaign || '[utm_campaign]'}_all_int_[segmento]`} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms]" style={{ ...inputStyle, fontFamily: 'monospace' }} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    Anúncio <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(utm_content)</span>
                  </label>
                  <input value={content} onChange={(e) => setContent(e.target.value)} placeholder={`${term || '[utm_term]'}_linkad_[codigo-ad]`} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms]" style={{ ...inputStyle, fontFamily: 'monospace' }} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
              </>
            )}

            {/* Source row */}
            <div className="grid grid-cols-2 gap-3">
              {canal === 'other' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Source</label>
                  <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms] cursor-pointer" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                    {SOURCES_OTHER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Source</label>
                  <input value={source} readOnly className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Medium</label>
                <input value={medium} readOnly className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            {canal === 'other' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Tipo de Peça</label>
                <select value={tipoPeca} onChange={(e) => setTipoPeca(e.target.value)} className="w-full px-3 py-[9px] rounded-[8px] text-[13px] outline-none transition-all duration-[180ms] cursor-pointer" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                  {['qr-code', 'hiperlink', 'post-blog', 'banner-iab', 'button-learn-more', 'popup'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Generated URL */}
          {generatedUrl && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>URL Gerada</label>
              <div
                className="rounded-[8px] p-3 text-[11.5px] break-all"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', fontFamily: 'monospace', lineHeight: 1.7 }}
              >
                {colorizeUrl(generatedUrl)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-[10px] rounded-[8px] text-[13px] font-[500] cursor-pointer transition-all duration-[180ms]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--text-3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Cancelar
          </button>
          <button onClick={handleCopy} disabled={!generatedUrl}
            className="flex-1 py-[10px] rounded-[8px] text-[13px] font-semibold text-white cursor-pointer transition-all duration-[180ms] disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={(e) => { if (generatedUrl) e.currentTarget.style.background = 'var(--acc-h)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            {copied ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}><polyline points="20 6 9 17 4 12" /></svg>
                Copiado!
              </span>
            ) : 'Copiar URL'}
          </button>
        </div>
      </div>
    </div>
  )
}
