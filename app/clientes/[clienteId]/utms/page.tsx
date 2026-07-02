'use client'

import { use, useMemo, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import UTMWizard from '@/components/utms/UTMWizard'
import { useCliente } from '@/lib/data/clientes'
import { useUTMs, useEventos } from '@/lib/data/colecoes'
import { validateUTM } from '@/lib/utm/engine'
import { utmMetaData, utmGoogleData, utmLinkedinData, utmOtherData } from '@/lib/demo-data'
import type { UTMCanal, UTMRegistro, UTMSet } from '@/lib/types'

type Aba = UTMCanal | 'detectadas'

const CANAL_TABS: { id: Aba; label: string }[] = [
  { id: 'meta',       label: 'Meta Ads' },
  { id: 'google',     label: 'Google Ads' },
  { id: 'linkedin',   label: 'LinkedIn Ads' },
  { id: 'other',      label: 'Others Channels' },
  { id: 'detectadas', label: '⚡ Detectadas' },
]

const RULES: Record<UTMCanal, { color: string; rules: string[] }> = {
  meta: {
    color: '59,130,246',
    rules: [
      'Meta Ads (Facebook / Instagram) — tagueamento manual ou dinâmico ({{campaign.name}})',
      'Hierarquia obrigatória: Campanha → Conjunto → Anúncio (utm_term e utm_content herdam o nível anterior)',
      'Campanha: [office]_[país]_[funil]_[objetivo]_[cliente]_[tipo]_[detalhe]',
      'Conjunto: [utm_campaign]_[posicionamento]_[segmentação]_[detalhe]',
      'Anúncio: [utm_term]_[formato]_[detalhe]',
      'utm_source: sempre meta · utm_medium: sempre paid',
    ],
  },
  google: {
    color: '234,88,12',
    rules: [
      'Google Ads — gclid capturado automaticamente · UTMs preenchidos manualmente',
      'Hierarquia obrigatória: Campanha → Conjunto → Anúncio (mesma estrutura cumulativa do Meta)',
      'gclid: Google captura via auto-tagging — não remover o parâmetro do site',
      'Tipos: search · max (PMax) · google-Shop (Shopping) · display · discovery',
      'utm_source: google · utm_medium: paid',
    ],
  },
  linkedin: {
    color: '10,102,194',
    rules: [
      'LinkedIn Ads — tagueamento manual',
      'Hierarquia obrigatória: Campanha → Conjunto → Anúncio',
      'Tipos: in-leadad (form nativo) · in-post (post impulsionado) · in-video (anúncio em vídeo)',
      'utm_source: linkedin · utm_medium: paid',
    ],
  },
  other: {
    color: '139,92,246',
    rules: [
      'Others Channels — WhatsApp, E-mail, Eventos offline, Portal, Referral, SMS',
      'Hierarquia: Campanha → Conjunto → Anúncio · mesmo padrão cumulativo',
      'Sources: whatsapp · email · eventos · portal · folheteria · sms · interno · zendesk',
      'Tipos de peça: qr-code · hiperlink · post-blog · banner-iab · button-learn-more · popup',
    ],
  },
}

function RulesCard({ canal }: { canal: UTMCanal }) {
  const { color, rules } = RULES[canal]
  return (
    <div className="rounded-[10px] p-4 mb-5" style={{ background: `rgba(${color},0.05)`, border: `1px solid rgba(${color},0.15)` }}>
      <ul className="flex flex-col gap-[5px]">
        {rules.map((r) => (
          <li key={r} className="text-[12px] flex gap-2" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: `rgb(${color})` }}>·</span> {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span className="px-[7px] py-[3px] rounded-[5px] text-[10.5px] font-bold uppercase tracking-wide" style={{ background: bg, color }}>{label}</span>
}

function PadraoBadge({ padraoV4, erros }: { padraoV4: boolean; erros?: string[] }) {
  return (
    <span
      title={erros?.join('\n')}
      className="px-[7px] py-[3px] rounded-[5px] text-[10px] font-bold whitespace-nowrap"
      style={{
        background: padraoV4 ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.12)',
        color: padraoV4 ? '#10B981' : '#F59E0B',
        cursor: erros?.length ? 'help' : 'default',
      }}
    >
      {padraoV4 ? '✓ V4' : '✗ fora do padrão'}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="px-[10px] py-[4px] rounded-[6px] text-[11px] font-[500] cursor-pointer transition-all duration-[180ms]"
      style={{ background: copied ? 'rgba(16,185,129,.1)' : 'var(--bg-base)', border: `1px solid ${copied ? '#10B981' : 'var(--border)'}`, color: copied ? '#10B981' : 'var(--text-3)' }}
    >
      {copied ? 'Copiado ✓' : 'Copiar'}
    </button>
  )
}

function MonoCell({ text }: { text?: string }) {
  if (!text) return <span className="text-[11.5px]" style={{ color: 'var(--text-3)' }}>—</span>
  return <span className="text-[11.5px] truncate max-w-[240px] block" style={{ fontFamily: 'monospace', color: 'var(--text-3)' }} title={text}>{text}</span>
}

const thBase = 'px-4 py-[9px] text-left text-[10px] font-bold uppercase tracking-[.07em] text-[--text-3]'
const tdBase = 'px-4 py-[11px] text-[12.5px] text-[--text-2]'

// demo fallback → shape UTMRegistro
function demoParaRegistros(canal: UTMCanal): UTMRegistro[] {
  const validar = (u: UTMSet) => {
    const v = validateUTM(u)
    return { padraoV4: v.padraoV4, erros: v.erros }
  }
  const mapear = (arr: { id: string; campaign: string; term?: string; content?: string; source: string; medium: string }[]): UTMRegistro[] =>
    arr.map((u) => ({
      id: 'demo-' + u.id,
      canal,
      source: u.source, medium: u.medium,
      campaign: u.campaign, term: u.term, content: u.content,
      validacao: validar(u),
      criadoEm: 0,
    }))
  if (canal === 'meta')     return mapear(utmMetaData)
  if (canal === 'google')   return mapear(utmGoogleData)
  if (canal === 'linkedin') return mapear(utmLinkedinData)
  return utmOtherData.map((u) => ({
    id: 'demo-' + u.id, canal, source: u.source, medium: u.medium,
    campaign: u.campaign, term: u.tipoPeca,
    validacao: validar({ campaign: u.campaign }),
    criadoEm: 0,
  }))
}

export default function UTMsPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { utms, isDemo: utmsVazias } = useUTMs(isDemo ? undefined : clienteId)
  const { eventos } = useEventos(isDemo ? undefined : clienteId)

  const [aba, setAba]       = useState<Aba>('meta')
  const [wizard, setWizard] = useState(false)

  // UTMs geradas do canal atual (Firestore ou demo)
  const registros = useMemo(() => {
    if (aba === 'detectadas') return []
    const canal = aba as UTMCanal
    const reais = utms.filter((u) => u.canal === canal)
    if (reais.length > 0) return reais
    return utmsVazias || isDemo ? demoParaRegistros(canal) : []
  }, [aba, utms, utmsVazias, isDemo])

  // UTMs detectadas nos eventos reais (agrupadas + validadas)
  const detectadas = useMemo(() => {
    const grupos = new Map<string, { utm: UTMSet; count: number; ultimo: number }>()
    for (const e of eventos) {
      if (!e.utm?.campaign) continue
      const chave = [e.utm.campaign, e.utm.term, e.utm.content].join('|')
      const g = grupos.get(chave)
      if (g) { g.count++; g.ultimo = Math.max(g.ultimo, e.ts) }
      else grupos.set(chave, { utm: e.utm, count: 1, ultimo: e.ts })
    }
    return [...grupos.values()]
      .sort((a, b) => b.count - a.count)
      .map((g) => ({ ...g, validacao: validateUTM(g.utm) }))
  }, [eventos])

  const mostrandoDemo = aba !== 'detectadas' && registros.some((r) => String(r.id).startsWith('demo-'))

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)' }}>
        {/* Section header */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[--text-1]">Gerenciador de UTMs</h2>
            <p className="text-[12.5px] text-[--text-3] mt-1">
              Padrão V4 — nomenclatura hierárquica cumulativa: Campanha → Conjunto → Anúncio
              {mostrandoDemo && <span style={{ color: '#8B5CF6' }}> · exibindo dados demo</span>}
            </p>
          </div>
          {aba !== 'detectadas' && (
            <button
              onClick={() => setWizard(true)}
              className="flex items-center gap-2 px-4 py-[8px] rounded-[8px] text-[12.5px] font-semibold text-white cursor-pointer transition-all duration-[180ms]"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--acc-h)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              + Gerar UTM
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-[2px] p-[3px] rounded-[10px] mb-6 w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {CANAL_TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setAba(id)}
              className="px-4 py-[7px] rounded-[7px] text-[12.5px] font-[500] cursor-pointer select-none transition-all duration-[180ms]"
              style={{ background: aba === id ? 'var(--accent)' : 'transparent', color: aba === id ? '#fff' : 'var(--text-3)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Canal tabs — tabela de UTMs geradas */}
        {aba !== 'detectadas' && (
          <div>
            <RulesCard canal={aba as UTMCanal} />
            <div className="rounded-[12px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead><tr style={{ background: 'rgba(0,0,0,.15)' }}>
                  {['Campanha (UTM_CAMPAIGN)', 'Conjunto (UTM_TERM)', 'Anúncio (UTM_CONTENT)', 'Source', 'Padrão', ''].map((h) => (
                    <th key={h} className={thBase} style={{ borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {registros.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-3)' }}>
                      Nenhuma UTM gerada neste canal ainda — clique em “+ Gerar UTM”.
                    </td></tr>
                  )}
                  {registros.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < registros.length - 1 ? '1px solid var(--border-sub)' : 'none' }}>
                      <td className={tdBase}><MonoCell text={u.campaign} /></td>
                      <td className={tdBase}><MonoCell text={u.term} /></td>
                      <td className={tdBase}><MonoCell text={u.content} /></td>
                      <td className={tdBase}><Badge label={u.source} bg="rgba(255,255,255,.05)" color="var(--text-2)" /></td>
                      <td className={tdBase}><PadraoBadge padraoV4={u.validacao.padraoV4} erros={u.validacao.erros} /></td>
                      <td className={tdBase}>
                        <CopyButton text={
                          u.urlTagueada ??
                          `?utm_medium=${u.medium}&utm_source=${u.source}&utm_campaign=${u.campaign}${u.term ? `&utm_term=${u.term}` : ''}${u.content ? `&utm_content=${u.content}` : ''}`
                        } />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detectadas — UTMs que chegaram nos eventos reais */}
        {aba === 'detectadas' && (
          <div>
            <div className="rounded-[10px] p-4 mb-5" style={{ background: 'rgba(200,16,46,.05)', border: '1px solid rgba(200,16,46,.15)' }}>
              <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--red)' }}>·</span> UTMs capturadas automaticamente nos eventos recebidos do site
                — auditadas contra o padrão V4. UTMs fora do padrão quebram a análise por nível (campanha/conjunto/anúncio).
              </p>
            </div>
            <div className="rounded-[12px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead><tr style={{ background: 'rgba(0,0,0,.15)' }}>
                  {['Campanha', 'Conjunto', 'Anúncio', 'Eventos', 'Último', 'Padrão'].map((h) => (
                    <th key={h} className={thBase} style={{ borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {detectadas.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-3)' }}>
                      {isDemo
                        ? 'Cliente demo — crie um cliente real e instale o snippet para detectar UTMs.'
                        : 'Nenhum evento com UTM recebido ainda. Instale o snippet v4track.js no site do cliente.'}
                    </td></tr>
                  )}
                  {detectadas.map((d, i) => (
                    <tr key={i} style={{ borderBottom: i < detectadas.length - 1 ? '1px solid var(--border-sub)' : 'none' }}>
                      <td className={tdBase}><MonoCell text={d.utm.campaign} /></td>
                      <td className={tdBase}><MonoCell text={d.utm.term} /></td>
                      <td className={tdBase}><MonoCell text={d.utm.content} /></td>
                      <td className={tdBase}><span className="font-bold text-[--text-1]">{d.count}</span></td>
                      <td className={tdBase}>
                        <span className="text-[11px]" style={{ fontFamily: 'monospace', color: 'var(--text-3)' }}>
                          {new Date(d.ultimo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </td>
                      <td className={tdBase}><PadraoBadge padraoV4={d.validacao.padraoV4} erros={d.validacao.erros} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {wizard && aba !== 'detectadas' && (
        <UTMWizard
          canal={aba as UTMCanal}
          clienteId={clienteId}
          clienteNome={cliente?.nome}
          isDemo={isDemo}
          onClose={() => setWizard(false)}
        />
      )}
    </>
  )
}
