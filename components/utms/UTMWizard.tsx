'use client'

// ─── UTM WIZARD — gerador guiado pelo padrão V4 ──────────────────────────────
// Monta os 3 níveis cumulativos (Campanha → Conjunto → Anúncio) com os
// vocabulários oficiais das planilhas V4 e salva no Firestore do cliente.

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  OFFICES, REGIOES, FUNIS, OBJETIVOS, TIPOS_POR_CANAL,
  SEGMENTACOES, POSICIONAMENTOS, FORMATOS, SOURCES_OTHER, TIPOS_PECA_OTHER,
  type TaxItem,
} from '@/lib/utm/taxonomy'
import { buildUTM, montarUrl, slugify, validateUTM, META_DINAMICO } from '@/lib/utm/engine'
import { salvarUTM } from '@/lib/data/colecoes'
import type { UTMCanal } from '@/lib/types'
import { parseUTM } from '@/lib/utm/engine'

const CANAL_INFO: Record<UTMCanal, { label: string; color: string }> = {
  meta:     { label: 'Meta Ads',        color: '#1877F2' },
  google:   { label: 'Google Ads',      color: '#4285F4' },
  linkedin: { label: 'LinkedIn Ads',    color: '#0A66C2' },
  other:    { label: 'Others Channels', color: '#8B5CF6' },
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12,
  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-1)',
  outline: 'none',
}

function Select({ value, onChange, items, permitirVazio }: {
  value: string; onChange: (v: string) => void; items: TaxItem[]; permitirVazio?: boolean
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
      {permitirVazio && <option value="">—</option>}
      {items.map((i) => (
        <option key={i.valor} value={i.valor}>{i.label} · {i.valor}</option>
      ))}
    </select>
  )
}

function NivelPreview({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: cor, width: 76, flexShrink: 0 }}>
        {titulo}
      </span>
      <code style={{
        flex: 1, fontSize: 10.5, fontFamily: 'monospace', color: 'var(--t2)',
        padding: '6px 8px', borderRadius: 6, background: 'var(--bg-base)',
        border: '1px solid var(--border)', wordBreak: 'break-all',
      }}>
        {valor || '—'}
      </code>
      <button
        onClick={() => { navigator.clipboard.writeText(valor); setCopiado(true); setTimeout(() => setCopiado(false), 1200) }}
        style={{
          fontSize: 10, padding: '5px 9px', borderRadius: 6, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${copiado ? '#10B981' : 'var(--border)'}`,
          color: copiado ? '#10B981' : 'var(--t3)', flexShrink: 0,
        }}
      >{copiado ? '✓' : 'Copiar'}</button>
    </div>
  )
}

export default function UTMWizard({ canal, clienteId, clienteNome, isDemo, onClose }: {
  canal: UTMCanal
  clienteId: string
  clienteNome?: string
  isDemo?: boolean
  onClose: () => void
}) {
  const info = CANAL_INFO[canal]

  // ── Estado dos campos ──────────────────────────────────────────────────────
  const [urlBase, setUrlBase]       = useState('')
  const [office, setOffice]         = useState('v4-ate')
  const [regiao, setRegiao]         = useState('br')
  const [funil, setFunil]           = useState('perf')
  const [objetivo, setObjetivo]     = useState('ved')
  const [clienteSlug, setClienteSlug] = useState(slugify(clienteNome ?? clienteId))
  const [tipo, setTipo]             = useState(TIPOS_POR_CANAL[canal][0].valor)
  const [detCampanha, setDetCampanha] = useState('')
  const [posicionamento, setPosicionamento] = useState('all')
  const [segmentacao, setSegmentacao]       = useState('abrt')
  const [detConjunto, setDetConjunto]       = useState('')
  const [formato, setFormato]       = useState(canal === 'google' ? 'srch-ad' : 'linkad')
  const [detAnuncio, setDetAnuncio] = useState('')
  const [sourceOther, setSourceOther] = useState('whatsapp')
  const [tipoPeca, setTipoPeca]     = useState('hiperlink')
  const [modoDinamico, setModoDinamico] = useState(false)
  const [salvando, setSalvando]     = useState(false)
  const [salvo, setSalvo]           = useState(false)
  const [copiadoUrl, setCopiadoUrl] = useState(false)

  // ── Build ao vivo ──────────────────────────────────────────────────────────
  const utm = useMemo(() => buildUTM({
    canal,
    office, regiao, funil, objetivo,
    cliente: clienteSlug || clienteId,
    tipo: canal === 'other' ? tipoPeca : tipo,
    detalheCampanha: detCampanha,
    posicionamento, segmentacao,
    detalheConjunto: detConjunto,
    formato,
    detalheAnuncio: detAnuncio,
    source: canal === 'other' ? sourceOther : undefined,
  }), [canal, office, regiao, funil, objetivo, clienteSlug, clienteId, tipo, tipoPeca,
       detCampanha, posicionamento, segmentacao, detConjunto, formato, detAnuncio, sourceOther])

  const urlFinal = montarUrl(urlBase, utm)
  const validacao = useMemo(() => validateUTM(utm), [utm])

  const handleSalvar = async () => {
    if (isDemo) return
    setSalvando(true)
    try {
      await salvarUTM(clienteId, {
        canal,
        source: utm.source, medium: utm.medium,
        campaign: utm.campaign, term: utm.term, content: utm.content,
        componentes: parseUTM(utm),
        urlBase: urlBase || undefined,
        urlTagueada: urlFinal || undefined,
        validacao: { padraoV4: validacao.padraoV4, erros: validacao.erros },
        criadoEm: Date.now(),
      })
      setSalvo(true)
      setTimeout(() => { setSalvo(false); onClose() }, 900)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto',
            borderRadius: 14, padding: 24, background: 'var(--bg-c)', border: '1px solid var(--br)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Gerador de UTM</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                background: info.color + '18', color: info.color, border: `1px solid ${info.color}30`,
              }}>{info.label}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 16px' }}>
            Padrão V4 — nomenclatura cumulativa: Campanha → Conjunto → Anúncio
          </p>

          {/* Meta dinâmico */}
          {canal === 'meta' && (
            <div style={{
              padding: '10px 14px', borderRadius: 9, marginBottom: 16,
              background: modoDinamico ? 'rgba(24,119,242,.07)' : 'var(--bg-base)',
              border: `1px solid ${modoDinamico ? 'rgba(24,119,242,.35)' : 'var(--border)'}`,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--t1)', fontWeight: 600 }}>
                <input type="checkbox" checked={modoDinamico} onChange={(e) => setModoDinamico(e.target.checked)} />
                Usar parâmetros dinâmicos do Meta ({'{{campaign.name}}'})
              </label>
              {modoDinamico && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 8px' }}>
                    Cole no campo <b>“Parâmetros de URL”</b> do anúncio. Os nomes de campanha/conjunto/anúncio no
                    Gerenciador devem seguir o padrão V4 (use o construtor abaixo para nomeá-los).
                  </p>
                  <NivelPreview titulo="String" valor={META_DINAMICO} cor="#1877F2" />
                </div>
              )}
            </div>
          )}

          {/* Campos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Campo label="URL de destino">
              <input value={urlBase} onChange={(e) => setUrlBase(e.target.value)} placeholder="https://site do cliente…" style={inputStyle} />
            </Campo>
            <Campo label="Office / Squad"><Select value={office} onChange={setOffice} items={OFFICES} /></Campo>
            <Campo label="País / Praça"><Select value={regiao} onChange={setRegiao} items={REGIOES} /></Campo>
            <Campo label="Etapa de funil"><Select value={funil} onChange={setFunil} items={FUNIS} /></Campo>
            <Campo label="Objetivo"><Select value={objetivo} onChange={setObjetivo} items={OBJETIVOS} /></Campo>
            <Campo label="Cliente (slug)">
              <input value={clienteSlug} onChange={(e) => setClienteSlug(slugify(e.target.value))} style={inputStyle} />
            </Campo>
            {canal !== 'other' ? (
              <Campo label="Tipo de campanha"><Select value={tipo} onChange={setTipo} items={TIPOS_POR_CANAL[canal]} /></Campo>
            ) : (
              <>
                <Campo label="Source"><Select value={sourceOther} onChange={setSourceOther} items={SOURCES_OTHER} /></Campo>
                <Campo label="Tipo de peça"><Select value={tipoPeca} onChange={setTipoPeca} items={TIPOS_PECA_OTHER} /></Campo>
              </>
            )}
            <Campo label="Detalhe da campanha (livre)">
              <input value={detCampanha} onChange={(e) => setDetCampanha(e.target.value)} placeholder="ex: catalogo-br, 1401…" style={inputStyle} />
            </Campo>
            <Campo label="Posicionamento"><Select value={posicionamento} onChange={setPosicionamento} items={POSICIONAMENTOS} /></Campo>
            <Campo label="Segmentação"><Select value={segmentacao} onChange={setSegmentacao} items={SEGMENTACOES} /></Campo>
            <Campo label="Detalhe do conjunto (livre)">
              <input value={detConjunto} onChange={(e) => setDetConjunto(e.target.value)} placeholder="ex: pub-quente…" style={inputStyle} />
            </Campo>
            <Campo label="Formato do anúncio"><Select value={formato} onChange={setFormato} items={FORMATOS} /></Campo>
            <Campo label="Detalhe do anúncio (livre)">
              <input value={detAnuncio} onChange={(e) => setDetAnuncio(e.target.value)} placeholder="ex: ad001-catalogo…" style={inputStyle} />
            </Campo>
          </div>

          {/* Preview */}
          <div style={{
            marginTop: 18, padding: 14, borderRadius: 10,
            background: 'rgba(0,0,0,.25)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
                Preview — 3 níveis cumulativos
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                background: validacao.padraoV4 ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                color: validacao.padraoV4 ? '#10B981' : '#F59E0B',
              }}>
                {validacao.padraoV4 ? '✓ Padrão V4' : `Conformidade ${validacao.score}%`}
              </span>
            </div>
            <NivelPreview titulo="Campanha" valor={utm.campaign} cor="#3B82F6" />
            <NivelPreview titulo="Conjunto" valor={utm.term} cor="#F59E0B" />
            <NivelPreview titulo="Anúncio" valor={utm.content} cor="#10B981" />
            {urlFinal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--red)', width: 76, flexShrink: 0 }}>
                  URL final
                </span>
                <code style={{
                  flex: 1, fontSize: 10.5, fontFamily: 'monospace', color: 'var(--t2)',
                  padding: '6px 8px', borderRadius: 6, background: 'var(--bg-base)',
                  border: '1px solid var(--border)', wordBreak: 'break-all', maxHeight: 64, overflowY: 'auto',
                }}>{urlFinal}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(urlFinal); setCopiadoUrl(true); setTimeout(() => setCopiadoUrl(false), 1200) }}
                  style={{
                    fontSize: 10, padding: '5px 9px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${copiadoUrl ? '#10B981' : 'var(--border)'}`,
                    color: copiadoUrl ? '#10B981' : 'var(--t3)', flexShrink: 0,
                  }}
                >{copiadoUrl ? '✓' : 'Copiar'}</button>
              </div>
            )}
            {validacao.erros.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                {validacao.erros.map((e) => (
                  <li key={e} style={{ fontSize: 10.5, color: '#F59E0B' }}>{e}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end', alignItems: 'center' }}>
            {isDemo && (
              <span style={{ fontSize: 11, color: 'var(--t3)', marginRight: 'auto' }}>
                Cliente demo — crie um cliente real para salvar UTMs
              </span>
            )}
            <button onClick={onClose} style={{
              padding: '9px 16px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--t2)',
            }}>Fechar</button>
            <button onClick={handleSalvar} disabled={salvando || isDemo} style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              cursor: isDemo ? 'not-allowed' : 'pointer',
              background: salvo ? '#10B981' : 'var(--red)', border: 'none', color: '#fff',
              opacity: salvando || isDemo ? 0.6 : 1,
            }}>{salvo ? 'Salvo ✓' : salvando ? 'Salvando…' : 'Salvar UTM'}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
