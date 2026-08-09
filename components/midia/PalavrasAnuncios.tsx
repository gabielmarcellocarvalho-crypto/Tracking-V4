'use client'

import { useState } from 'react'
import { useGoogleAdsCampanhas, salvarGoogleAdsCampanha, excluirGoogleAdsCampanha } from '@/lib/data/colecoes'
import { gerarCsvGoogleAdsEditor, baixarCsv } from '@/lib/data/google-ads-export'
import { auth } from '@/lib/firebase'
import type { GoogleAdsCampanha, GoogleAdsGrupo, GoogleAdsPalavra, GoogleAdsSitelink, GoogleAdsSnippet, GoogleAdsMatchType } from '@/lib/types'

const SNIPPET_HEADERS = ['Marcas', 'Cursos', 'Destinos', 'Estilos', 'Modelos', 'Bairros', 'Catálogo de serviços', 'Tipos', 'Programas', 'Hotéis em destaque']

function novoGrupo(): GoogleAdsGrupo {
  return {
    id: crypto.randomUUID(), nome: '', maxCpc: 0,
    palavrasChave: [], negativas: [],
    headlines: Array(15).fill(''), descricoes: Array(4).fill(''),
    path1: '', path2: '', finalUrl: '',
  }
}

function campanhaVazia(): GoogleAdsCampanha {
  return { nome: '', orcamentoDiario: 0, status: 'Enabled', grupos: [novoGrupo()], sitelinks: [], callouts: [], snippets: [], telefone: '' }
}

// Componentes precisam ficar FORA de qualquer outro componente: definidos
// dentro do corpo de um componente pai, eles são recriados a cada re-render
// (nova identidade) e o React desmonta/remonta os inputs a cada tecla
// digitada, tirando o foco (bug já visto e corrigido em PlanoMidia.tsx).
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 9px', borderRadius: 6, fontSize: 12,
  background: 'var(--bg-base)', border: '1px solid var(--br)', color: 'var(--t1)', outline: 'none',
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} style={{ fontSize: 10.5, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{label}</button>
}

// ── Palavras-chave (positivas ou negativas) ────────────────────────────────
function PalavrasEditor({ titulo, itens, onChange }: { titulo: string; itens: GoogleAdsPalavra[]; onChange: (itens: GoogleAdsPalavra[]) => void }) {
  const add = () => onChange([...itens, { texto: '', tipo: 'Phrase' }])
  const upd = (i: number, patch: Partial<GoogleAdsPalavra>) => onChange(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const rem = (i: number) => onChange(itens.filter((_, idx) => idx !== i))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>{titulo}</span>
        <AddBtn onClick={add} label="+ adicionar" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
        {itens.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={it.texto} onChange={(e) => upd(i, { texto: e.target.value })} placeholder="palavra-chave" style={{ ...inputStyle, flex: 1 }} />
            <select value={it.tipo} onChange={(e) => upd(i, { tipo: e.target.value as GoogleAdsMatchType })} style={{ ...inputStyle, width: 92 }}>
              <option value="Broad">Ampla</option>
              <option value="Phrase">Frase</option>
              <option value="Exact">Exata</option>
            </select>
            {it.volumeBusca !== undefined && (
              <span style={{ fontSize: 9.5, color: 'var(--t3)', width: 52, textAlign: 'right', flexShrink: 0 }}>{it.volumeBusca}/mês</span>
            )}
            <button onClick={() => rem(i)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}><TrashIcon /></button>
          </div>
        ))}
        {itens.length === 0 && <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>Nenhuma ainda.</p>}
      </div>
    </div>
  )
}

// ── Títulos/descrições do RSA — sempre um número fixo de campos ────────────
function TextosLimitados({ titulo, itens, limite, onChange }: { titulo: string; itens: string[]; limite: number; onChange: (itens: string[]) => void }) {
  const upd = (i: number, v: string) => onChange(itens.map((it, idx) => (idx === i ? v.slice(0, limite) : it)))
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>{titulo}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {itens.map((texto, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <input
              value={texto} onChange={(e) => upd(i, e.target.value)} placeholder={`#${i + 1}`}
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <span style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 9.5, color: texto.length >= limite ? '#F59E0B' : 'var(--t3)', pointerEvents: 'none',
            }}>
              {texto.length}/{limite}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Um grupo de anúncios completo (accordion) ──────────────────────────────
function GrupoEditor({ grupo, onChange, onRemover }: { grupo: GoogleAdsGrupo; onChange: (g: GoogleAdsGrupo) => void; onRemover: () => void }) {
  const [aberto, setAberto] = useState(true)
  const set = <K extends keyof GoogleAdsGrupo>(k: K, v: GoogleAdsGrupo[K]) => onChange({ ...grupo, [k]: v })

  return (
    <div style={{ border: '1px solid var(--br)', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-base)', cursor: 'pointer' }}
        onClick={() => setAberto((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}
          style={{ transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <input
          value={grupo.nome} onChange={(e) => set('nome', e.target.value)} onClick={(e) => e.stopPropagation()}
          placeholder="Nome do grupo de anúncios"
          style={{ ...inputStyle, flex: 1, background: 'transparent', border: 'none', fontWeight: 600, fontSize: 12.5, padding: 0 }}
        />
        <span style={{ fontSize: 10.5, color: 'var(--t3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {grupo.palavrasChave.length} palavras · {grupo.headlines.filter((h) => h.trim()).length} títulos
        </span>
        <button onClick={(e) => { e.stopPropagation(); onRemover() }} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <TrashIcon />
        </button>
      </div>
      {aberto && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Max CPC (R$)">
              <input type="number" step="0.01" value={grupo.maxCpc || ''} onChange={(e) => set('maxCpc', Number(e.target.value))} style={inputStyle} />
            </Field>
            <Field label="Final URL">
              <input value={grupo.finalUrl} onChange={(e) => set('finalUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PalavrasEditor titulo="Palavras-chave" itens={grupo.palavrasChave} onChange={(v) => set('palavrasChave', v)} />
            <PalavrasEditor titulo="Negativas" itens={grupo.negativas} onChange={(v) => set('negativas', v)} />
          </div>
          <TextosLimitados titulo="Títulos (até 15, 30 caracteres)" itens={grupo.headlines} limite={30} onChange={(v) => set('headlines', v)} />
          <TextosLimitados titulo="Descrições (até 4, 90 caracteres)" itens={grupo.descricoes} limite={90} onChange={(v) => set('descricoes', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Path 1 (opcional)"><input value={grupo.path1} onChange={(e) => set('path1', e.target.value)} style={inputStyle} /></Field>
            <Field label="Path 2 (opcional)"><input value={grupo.path2} onChange={(e) => set('path2', e.target.value)} style={inputStyle} /></Field>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recursos da campanha ────────────────────────────────────────────────────
function SitelinksEditor({ itens, onChange }: { itens: GoogleAdsSitelink[]; onChange: (v: GoogleAdsSitelink[]) => void }) {
  const add = () => onChange([...itens, { texto: '', finalUrl: '', descricao1: '', descricao2: '' }])
  const upd = (i: number, patch: Partial<GoogleAdsSitelink>) => onChange(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const rem = (i: number) => onChange(itens.filter((_, idx) => idx !== i))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Sitelinks</span>
        <AddBtn onClick={add} label="+ adicionar" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {itens.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
            <input value={s.texto} onChange={(e) => upd(i, { texto: e.target.value })} placeholder="Texto do link" style={inputStyle} />
            <input value={s.finalUrl} onChange={(e) => upd(i, { finalUrl: e.target.value })} placeholder="Final URL" style={inputStyle} />
            <input value={s.descricao1 ?? ''} onChange={(e) => upd(i, { descricao1: e.target.value })} placeholder="Descrição 1" style={inputStyle} />
            <input value={s.descricao2 ?? ''} onChange={(e) => upd(i, { descricao2: e.target.value })} placeholder="Descrição 2" style={inputStyle} />
            <button onClick={() => rem(i)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
          </div>
        ))}
        {itens.length === 0 && <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>Nenhum ainda.</p>}
      </div>
    </div>
  )
}

function CalloutsEditor({ itens, onChange }: { itens: string[]; onChange: (v: string[]) => void }) {
  const add = () => onChange([...itens, ''])
  const upd = (i: number, v: string) => onChange(itens.map((it, idx) => (idx === i ? v : it)))
  const rem = (i: number) => onChange(itens.filter((_, idx) => idx !== i))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Frases de destaque (Callouts)</span>
        <AddBtn onClick={add} label="+ adicionar" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {itens.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input value={c} onChange={(e) => upd(i, e.target.value)} placeholder="Ex: Frete grátis" style={{ ...inputStyle, width: 160 }} />
            <button onClick={() => rem(i)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SnippetsEditor({ itens, onChange }: { itens: GoogleAdsSnippet[]; onChange: (v: GoogleAdsSnippet[]) => void }) {
  const add = () => onChange([...itens, { header: SNIPPET_HEADERS[0], valores: [''] }])
  const upd = (i: number, patch: Partial<GoogleAdsSnippet>) => onChange(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const rem = (i: number) => onChange(itens.filter((_, idx) => idx !== i))
  const updValor = (i: number, j: number, v: string) => upd(i, { valores: itens[i].valores.map((vv, jj) => (jj === j ? v : vv)) })
  const addValor = (i: number) => upd(i, { valores: [...itens[i].valores, ''] })
  const remValor = (i: number, j: number) => upd(i, { valores: itens[i].valores.filter((_, jj) => jj !== j) })
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Snippets estruturados</span>
        <AddBtn onClick={add} label="+ adicionar" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {itens.map((sn, i) => (
          <div key={i} style={{ border: '1px solid var(--br)', borderRadius: 8, padding: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={sn.header} onChange={(e) => upd(i, { header: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                {SNIPPET_HEADERS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <button onClick={() => rem(i)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {sn.valores.map((v, j) => (
                <div key={j} style={{ display: 'flex', gap: 4 }}>
                  <input value={v} onChange={(e) => updValor(i, j, e.target.value)} placeholder="valor" style={{ ...inputStyle, width: 110 }} />
                  <button onClick={() => remValor(i, j)} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              ))}
              <AddBtn onClick={() => addValor(i)} label="+ valor" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sugestões via IA (Groq) ─────────────────────────────────────────────────
interface Sugestao {
  palavrasChave: GoogleAdsPalavra[]
  negativas: string[]
  headlines: string[]
  descricoes: string[]
}

function SugestaoIA({ clienteId, onAplicar }: { clienteId: string; onAplicar: (s: Sugestao) => void }) {
  const [aberto, setAberto] = useState(false)
  const [briefing, setBriefing] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sugestao, setSugestao] = useState<Sugestao | null>(null)

  const gerar = async () => {
    if (!briefing.trim() || carregando) return
    setCarregando(true); setErro(null); setSugestao(null)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/google-ads-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ clienteId, briefing }),
      })
      const data = await res.json()
      if (!data.ok) { setErro(data.erro ?? 'falha ao gerar sugestões'); return }
      setSugestao(data.sugestao)
    } catch {
      setErro('falha de rede ao consultar a IA')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ border: '1px solid rgba(139,92,246,.3)', borderRadius: 10, background: 'rgba(139,92,246,.05)', overflow: 'hidden' }}>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: 'linear-gradient(135deg, var(--red), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
            <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
            <circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
          </svg>
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>Sugerir palavras-chave e anúncio com IA</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth={2} width={12} height={12} style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {aberto && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            value={briefing} onChange={(e) => setBriefing(e.target.value)}
            placeholder="Descreva o produto/serviço, objetivo da campanha, público e diferenciais. Ex: campanha de aquisição pra loja de suplementos, foco em whey protein e creatina, público treino de força, diferencial é frete grátis acima de R$150."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={gerar} disabled={carregando || !briefing.trim()}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: carregando ? 'default' : 'pointer',
                background: 'var(--red)', color: '#fff', opacity: carregando || !briefing.trim() ? 0.6 : 1,
              }}
            >
              {carregando ? 'Gerando…' : 'Gerar sugestões'}
            </button>
          </div>

          {erro && <p style={{ fontSize: 11.5, color: '#EF4444', margin: 0 }}>{erro}</p>}

          {sugestao && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--br)' }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Palavras-chave sugeridas</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {sugestao.palavrasChave.map((p, i) => (
                    <span key={i} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: 'var(--bg-c)', border: '1px solid var(--br)', color: 'var(--t2)' }}>
                      {p.texto} <span style={{ color: 'var(--t3)' }}>· {p.tipo}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Títulos ({sugestao.headlines.length})</span>
                <p style={{ fontSize: 11.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.6 }}>{sugestao.headlines.join(' · ')}</p>
              </div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Descrições ({sugestao.descricoes.length})</span>
                <p style={{ fontSize: 11.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.6 }}>{sugestao.descricoes.join(' · ')}</p>
              </div>
              <button
                onClick={() => { onAplicar(sugestao); setSugestao(null); setBriefing('') }}
                style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--red)', color: '#fff' }}
              >
                Adicionar como novo grupo de anúncios
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal de campanha ────────────────────────────────────────────────────────
function CampanhaFormModal({
  clienteId, campanha, onClose,
}: {
  clienteId: string
  campanha: GoogleAdsCampanha & { id?: string }
  onClose: () => void
}) {
  const [form, setForm] = useState(campanha)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const set = <K extends keyof GoogleAdsCampanha>(k: K, v: GoogleAdsCampanha[K]) => setForm((f) => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Dê um nome pra campanha antes de salvar.'); return }
    setSalvando(true); setErro(null)
    try {
      await salvarGoogleAdsCampanha(clienteId, form)
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falha ao salvar — tente de novo')
    } finally {
      setSalvando(false)
    }
  }

  const addGrupo = () => set('grupos', [...form.grupos, novoGrupo()])
  const updGrupo = (i: number, g: GoogleAdsGrupo) => set('grupos', form.grupos.map((gg, idx) => (idx === i ? g : gg)))
  const remGrupo = (i: number) => set('grupos', form.grupos.filter((_, idx) => idx !== i))

  const aplicarSugestao = (s: Sugestao) => {
    const grupo: GoogleAdsGrupo = {
      ...novoGrupo(),
      nome: form.nome ? `${form.nome} — IA` : 'Grupo sugerido pela IA',
      palavrasChave: s.palavrasChave,
      negativas: s.negativas.map((texto) => ({ texto, tipo: 'Phrase' as const })),
      headlines: [...s.headlines, ...Array(15).fill('')].slice(0, 15),
      descricoes: [...s.descricoes, ...Array(4).fill('')].slice(0, 4),
    }
    set('grupos', [...form.grupos, grupo])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{
        background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14, width: '100%', maxWidth: 800,
        maxHeight: '92vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{form.id ? 'Editar campanha' : 'Nova campanha'}</h3>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
          <Field label="Nome da campanha"><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} /></Field>
          <Field label="Orçamento diário (R$)">
            <input type="number" step="0.01" value={form.orcamentoDiario || ''} onChange={(e) => set('orcamentoDiario', Number(e.target.value))} style={inputStyle} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value as 'Enabled' | 'Paused')} style={inputStyle}>
              <option value="Enabled">Ativa</option>
              <option value="Paused">Pausada</option>
            </select>
          </Field>
        </div>

        <SugestaoIA clienteId={clienteId} onAplicar={aplicarSugestao} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Grupos de anúncio</span>
            <AddBtn onClick={addGrupo} label="+ novo grupo" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.grupos.map((g, i) => (
              <GrupoEditor key={g.id} grupo={g} onChange={(gg) => updGrupo(i, gg)} onRemover={() => remGrupo(i)} />
            ))}
            {form.grupos.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>Nenhum grupo ainda.</p>}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--br)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Recursos da campanha</span>
          <SitelinksEditor itens={form.sitelinks} onChange={(v) => set('sitelinks', v)} />
          <CalloutsEditor itens={form.callouts} onChange={(v) => set('callouts', v)} />
          <SnippetsEditor itens={form.snippets} onChange={(v) => set('snippets', v)} />
          <Field label="Telefone (opcional)"><input value={form.telefone ?? ''} onChange={(e) => set('telefone', e.target.value)} style={inputStyle} /></Field>
        </div>

        {erro && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', color: '#EF4444', fontSize: 12 }}>
            {erro}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--br)', background: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 12.5 }}>
            Cancelar
          </button>
          <button
            onClick={salvar} disabled={salvando}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--red)', color: '#fff', cursor: salvando ? 'default' : 'pointer', fontSize: 12.5, fontWeight: 600, opacity: salvando ? 0.6 : 1 }}
          >
            {salvando ? 'Salvando…' : 'Salvar campanha'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
interface Props {
  clienteId: string
  isDemo: boolean
}

export default function PalavrasAnuncios({ clienteId, isDemo }: Props) {
  const { campanhas } = useGoogleAdsCampanhas(isDemo ? undefined : clienteId)
  const [editando, setEditando] = useState<(GoogleAdsCampanha & { id?: string }) | null>(null)

  const abrirEdicao = (c: GoogleAdsCampanha & { id: string }) => setEditando({
    ...c,
    grupos: c.grupos.map((g) => ({
      ...g,
      headlines: [...g.headlines, ...Array(15).fill('')].slice(0, 15),
      descricoes: [...g.descricoes, ...Array(4).fill('')].slice(0, 4),
    })),
  })

  const exportar = (c: GoogleAdsCampanha) => {
    baixarCsv(`${(c.nome || 'campanha').replace(/[^a-z0-9-_]+/gi, '-')}-google-ads.csv`, gerarCsvGoogleAdsEditor(c))
  }

  const remover = async (id: string) => {
    if (!window.confirm('Excluir esta campanha? Essa ação não pode ser desfeita.')) return
    await excluirGoogleAdsCampanha(clienteId, id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDemo && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 12.5, color: 'var(--t2)' }}>
          Cliente demo — campanhas de Google Ads disponíveis só pra clientes reais.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, maxWidth: 560 }}>
          Monte a campanha (palavras-chave, anúncios responsivos e recursos) e exporte um CSV pronto pra importar no Google Ads Editor.
          Teste com um arquivo pequeno antes de confiar 100% no formato — a Google ajusta as colunas do bulk upload de vez em quando.
        </p>
        <button
          onClick={() => setEditando(campanhaVazia())}
          disabled={isDemo}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: 'none', cursor: isDemo ? 'not-allowed' : 'pointer',
            background: 'var(--red)', color: '#fff', opacity: isDemo ? 0.5 : 1, flexShrink: 0,
          }}
        >
          + Nova campanha
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
        {campanhas.map((c) => (
          <div key={c.id} style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{c.nome || 'Sem nome'}</p>
              <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '3px 0 0' }}>
                {c.grupos.length} grupo{c.grupos.length === 1 ? '' : 's'} · R$ {(c.orcamentoDiario || 0).toFixed(2)}/dia · {c.status === 'Enabled' ? 'Ativa' : 'Pausada'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => abrirEdicao(c)} style={{ flex: 1, padding: '6px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: '1px solid var(--br)', background: 'var(--bg-base)', color: 'var(--t2)', cursor: 'pointer' }}>
                Editar
              </button>
              <button onClick={() => exportar(c)} style={{ flex: 1, padding: '6px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: '1px solid var(--br)', background: 'var(--bg-base)', color: 'var(--t2)', cursor: 'pointer' }}>
                Exportar CSV
              </button>
              <button onClick={() => remover(c.id)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--br)', background: 'var(--bg-base)', color: 'var(--t3)', cursor: 'pointer' }}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
        {campanhas.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--t3)', gridColumn: '1 / -1' }}>Nenhuma campanha criada ainda.</p>
        )}
      </div>

      {editando && <CampanhaFormModal clienteId={clienteId} campanha={editando} onClose={() => setEditando(null)} />}
    </div>
  )
}
