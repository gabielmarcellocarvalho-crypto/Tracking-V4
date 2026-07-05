'use client'

import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadGeo, LeadStatus } from '@/lib/demo-data'

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<LeadStatus, { color: string; label: string; bg: string }> = {
  'converteu':           { color: '#10B981', label: 'Converteu',           bg: 'rgba(16,185,129,.12)' },
  'lead':                { color: '#3B82F6', label: 'Lead',                bg: 'rgba(59,130,246,.12)' },
  'checkout-abandonado': { color: '#F59E0B', label: 'Checkout abandonado', bg: 'rgba(245,158,11,.12)' },
}

// ── Brazilian state centers ───────────────────────────────────────────────────
const STATE_CENTERS: Record<string, { lat: number; lng: number; nome: string }> = {
  AC: { lat: -9.02,  lng: -70.81, nome: 'Acre'             },
  AL: { lat: -9.57,  lng: -36.78, nome: 'Alagoas'          },
  AM: { lat: -3.12,  lng: -60.02, nome: 'Manaus'           },
  AP: { lat: 1.41,   lng: -51.77, nome: 'Amapá'            },
  BA: { lat: -12.97, lng: -38.50, nome: 'Salvador'         },
  CE: { lat: -3.73,  lng: -38.53, nome: 'Fortaleza'        },
  DF: { lat: -15.78, lng: -47.93, nome: 'Brasília'         },
  ES: { lat: -20.32, lng: -40.34, nome: 'Espírito Santo'   },
  GO: { lat: -16.69, lng: -49.26, nome: 'Goiânia'          },
  MA: { lat: -2.53,  lng: -44.30, nome: 'Maranhão'         },
  MG: { lat: -19.92, lng: -43.93, nome: 'Belo Horizonte'   },
  MS: { lat: -20.44, lng: -54.65, nome: 'Mato Grosso do S' },
  MT: { lat: -12.64, lng: -55.42, nome: 'Mato Grosso'      },
  PA: { lat: -1.46,  lng: -48.49, nome: 'Belém'            },
  PB: { lat: -7.12,  lng: -34.86, nome: 'Paraíba'          },
  PE: { lat: -8.06,  lng: -34.88, nome: 'Recife'           },
  PI: { lat: -5.09,  lng: -42.80, nome: 'Piauí'            },
  PR: { lat: -25.43, lng: -49.27, nome: 'Curitiba'         },
  RJ: { lat: -22.91, lng: -43.17, nome: 'Rio de Janeiro'   },
  RN: { lat: -5.79,  lng: -35.21, nome: 'Natal'            },
  RO: { lat: -8.76,  lng: -63.90, nome: 'Rondônia'         },
  RR: { lat: 2.82,   lng: -60.68, nome: 'Roraima'          },
  RS: { lat: -30.03, lng: -51.22, nome: 'Porto Alegre'     },
  SC: { lat: -27.60, lng: -48.55, nome: 'Florianópolis'    },
  SE: { lat: -10.90, lng: -37.07, nome: 'Sergipe'          },
  SP: { lat: -23.55, lng: -46.63, nome: 'São Paulo'        },
  TO: { lat: -10.25, lng: -48.33, nome: 'Tocantins'        },
}

// ── Derived data helpers ──────────────────────────────────────────────────────

function buildStateClusters(leads: LeadGeo[]) {
  const map: Record<string, { count: number; convertidos: number }> = {}
  for (const l of leads) {
    if (!map[l.estado]) map[l.estado] = { count: 0, convertidos: 0 }
    map[l.estado].count++
    if (l.status === 'converteu') map[l.estado].convertidos++
  }
  return Object.entries(map).map(([estado, data]) => ({
    estado,
    ...data,
    ...(STATE_CENTERS[estado] ?? { lat: -15, lng: -50, nome: estado }),
  }))
}

// Resolução do grid hexagonal H3 (mesmo sistema do Uber) — agrupa por área real
// em km, ao contrário do heatmap "borrado" (que renderiza um raio de 5km como
// menos de 1 pixel de textura e some da tela). Tabela oficial de aresta média
// por resolução: res 5 ≈ 8.5km, res 6 ≈ 3.2km — os níveis mais próximos dos
// ~10km (zoom de cidade) / ~5km (zoom individual) pedidos.
const HEX_RES_CIDADE     = 5 // ~8-10km por célula
const HEX_RES_INDIVIDUAL = 6 // ~3-5km por célula

// Gradiente de calor consistente com a marca (azul frio → laranja → vermelho no pico)
function heatColor(t: number): string {
  const stops: [number, number, number, number][] = [
    [0.0, 59, 130, 246],   // azul (--t2 status "lead")
    [0.5, 245, 158, 11],   // laranja (--status checkout-abandonado)
    [1.0, 200, 16, 46],    // vermelho da marca (--red)
  ]
  let a = stops[0], b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break }
  }
  const span = b[0] - a[0] || 1
  const f = (t - a[0]) / span
  const r = Math.round(a[1] + (b[1] - a[1]) * f)
  const g = Math.round(a[2] + (b[2] - a[2]) * f)
  const bl = Math.round(a[3] + (b[3] - a[3]) * f)
  return `rgba(${r},${g},${bl},${Math.min(1, 0.25 + t * 0.75)})`
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IcoUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IcoClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

// ── Lead detail panel ─────────────────────────────────────────────────────────
function LeadPanel({ lead, clienteId, onClose }: { lead: LeadGeo; clienteId: string; onClose: () => void }) {
  const router = useRouter()
  const cfg = STATUS_CFG[lead.status]
  return (
    <div style={{
      position: 'absolute', right: 20, top: 20, bottom: 20, width: 280,
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
      display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.6)', zIndex: 20,
      animation: 'slideInRight .22s cubic-bezier(.22,1,.36,1)',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, border: `1px solid ${cfg.color}44` }}>
            <IcoUser />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{lead.nome}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--t3)', marginTop: 1 }}>{lead.email}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color .15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}
        ><IcoClose /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, width: 'fit-content' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />{cfg.label}
        </span>
        {[
          { label: 'Cidade / Estado', value: `${lead.cidade}, ${lead.estado}` },
          { label: 'IP',              value: lead.ip,     mono: true },
          { label: 'Fonte',           value: lead.source },
          ...(lead.valor ? [{ label: 'Valor convertido', value: `R$ ${lead.valor.toFixed(2)}` }] : []),
        ].map(({ label, value, mono }) => (
          <div key={label}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--t1)', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--br)' }}>
        {lead.jornada ? (
          <button onClick={() => router.push(`/clientes/${clienteId}/jornada?leadId=${lead.jornada}`)}
            style={{ width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', background: 'var(--red)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .18s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-h)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)' }}
          >Ver jornada completa <IcoArrow /></button>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Jornada não disponível</div>
        )}
      </div>
    </div>
  )
}

// ── Cluster lead list panel ───────────────────────────────────────────────────
function ClusterPanel({
  title,
  leads,
  clienteId,
  onClose,
  onSelectLead,
}: {
  title: string
  leads: LeadGeo[]
  clienteId: string
  onClose: () => void
  onSelectLead: (lead: LeadGeo) => void
}) {
  const convertidos = leads.filter((l) => l.status === 'converteu').length
  const receita = leads.reduce((s, l) => s + (l.valor ?? 0), 0)

  return (
    <div style={{
      position: 'absolute', right: 20, top: 20, bottom: 20, width: 300,
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
      display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.6)', zIndex: 20,
      animation: 'slideInRight .22s cubic-bezier(.22,1,.36,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(200,16,46,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', border: '1px solid rgba(200,16,46,.25)' }}>
            <IcoPin />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{title}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--t3)', marginTop: 1 }}>{leads.length} lead{leads.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color .15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}
        ><IcoClose /></button>
      </div>

      {/* Summary chips */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--br)', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6' }}>{leads.length}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Total</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>{convertidos}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Convertidos</div>
        </div>
        {receita > 0 && (
          <div style={{ flex: 1, background: 'rgba(200,16,46,.08)', border: '1px solid rgba(200,16,46,.2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>R${receita.toFixed(0)}</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Receita</div>
          </div>
        )}
      </div>

      {/* Lead list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {leads.map((lead) => {
          const cfg = STATUS_CFG[lead.status]
          return (
            <button
              key={lead.id ?? lead.email}
              onClick={() => onSelectLead(lead)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '9px 10px', borderRadius: 9, border: '1px solid var(--br)',
                background: 'var(--bg-s)', cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = cfg.color + '55'
                el.style.background = cfg.bg
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--br)'
                el.style.background = 'var(--bg-s)'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 5px ${cfg.color}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.nome}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{lead.cidade} · {cfg.label}</div>
              </div>
              {lead.valor ? (
                <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981', flexShrink: 0 }}>R${lead.valor.toFixed(0)}</div>
              ) : (
                <IcoArrow />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ leads }: { leads: LeadGeo[] }) {
  const total       = leads.length
  const convertidos = leads.filter((l) => l.status === 'converteu').length
  const receita     = leads.reduce((s, l) => s + (l.valor ?? 0), 0)
  const byState     = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => { acc[l.estado] = (acc[l.estado] ?? 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div style={{ position: 'absolute', left: 20, bottom: 20, background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: '12px 16px', minWidth: 220, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
      <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 10 }}>Visão Geral</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {[{ label: 'Leads', value: total, color: 'var(--t1)' }, { label: 'Convertidos', value: convertidos, color: '#10B981' }, { label: 'Receita', value: `R$${receita.toFixed(0)}`, color: 'var(--red)' }].map(({ label, value, color }) => (
          <div key={label}><div style={{ fontSize: 17, fontWeight: 700, color, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{label}</div></div>
        ))}
      </div>
      <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 6 }}>Top estados</div>
      {byState.map(([estado, count]) => (
        <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', width: 24 }}>{estado}</div>
          <div style={{ flex: 1, height: 3, background: 'var(--br)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(count / total) * 100}%`, background: 'var(--red)', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', width: 16, textAlign: 'right' }}>{count}</div>
        </div>
      ))}
    </div>
  )
}

// ── Zoom level breadcrumb ─────────────────────────────────────────────────────
function ZoomDot({ active }: { active: boolean }) {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'var(--red)' : '#333', flexShrink: 0, boxShadow: active ? '0 0 6px var(--red)' : 'none', transition: 'all .25s' }} />
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ level }: { level: 'state' | 'city' | 'individual' }) {
  const isHexbin = level !== 'state'
  const hint = level === 'state'
    ? 'Clique num estado para ver os leads'
    : level === 'city'
    ? 'Clique num hexágono para ver os leads da região (~8-10km)'
    : 'Clique num hexágono para ver os leads próximos (~3-5km)'

  return (
    <div style={{ position: 'absolute', left: 20, top: 20, background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 10, padding: '10px 14px', zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,.4)', minWidth: 168 }}>
      {isHexbin ? (
        <>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 8 }}>Densidade de leads</div>
          <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, rgba(59,130,246,.5), rgba(245,158,11,.75), rgba(200,16,46,1))' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--t3)', marginTop: 4 }}>
            <span>Menos leads</span><span>Mais leads</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 8 }}>Status</div>
          {(Object.entries(STATUS_CFG) as [LeadStatus, typeof STATUS_CFG[LeadStatus]][]).map(([, cfg]) => (
            <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />
              <span style={{ fontSize: 11, color: 'var(--t2)' }}>{cfg.label}</span>
            </div>
          ))}
        </>
      )}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--br)', fontSize: 10, color: 'var(--t3)', lineHeight: 1.6 }}>
        {hint}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface GlobeLeadsProps {
  leads: LeadGeo[]
  clienteId: string
}

type ClusterSelection =
  | { type: 'state'; estado: string }
  | { type: 'hex'; points: LeadGeo[]; lat: number; lng: number }

export default function GlobeLeads({ leads, clienteId }: GlobeLeadsProps) {
  const globeRef     = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Start with null so globe only renders after we know the real container size
  const [size, setSize]               = useState<{ w: number; h: number } | null>(null)
  const [GlobeComp, setGlobeComp]     = useState<any>(null)
  // zoomLevel drives layer switching — only 3 possible values, avoids per-frame re-renders
  const [zoomLevel, setZoomLevel]     = useState<'state' | 'city' | 'individual'>('state')
  const altitudeRef                   = useRef(1.5)
  const [selected, setSelected]       = useState<LeadGeo | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<ClusterSelection | null>(null)
  const [brazilStates, setBrazilStates] = useState<any[]>([])

  // Load globe (browser-only WebGL)
  useEffect(() => {
    import('react-globe.gl').then((m) => setGlobeComp(() => m.default))
  }, [])

  // Load Brazilian states GeoJSON from IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF')
      .then((r) => r.json())
      .then((data) => { if (data?.features) setBrazilStates(data.features) })
      .catch(() => {})
  }, [])

  // Resize observer — sets size so globe renders at correct dimensions
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSize({ w: width, h: height })
    })
    if (containerRef.current) {
      obs.observe(containerRef.current)
      // Read immediately (ResizeObserver fires async on some browsers)
      const { clientWidth, clientHeight } = containerRef.current
      if (clientWidth > 0 && clientHeight > 0) {
        setSize({ w: clientWidth, h: clientHeight })
      } else if (typeof window !== 'undefined') {
        // Fallback: use window minus sidebar width
        setSize({ w: window.innerWidth - 256, h: window.innerHeight })
      }
    }
    return () => obs.disconnect()
  }, [])

  // Focus on Brazil on mount — lng -54 is Brazil's geographic center;
  // offset slightly west so Brazil appears visually centered despite left-side overlays
  useEffect(() => {
    if (!GlobeComp || !globeRef.current) return
    const t = setTimeout(() => {
      globeRef.current?.pointOfView({ lat: -16, lng: -54, altitude: 1.5 }, 1200)
    }, 300)
    return () => clearTimeout(t)
  }, [GlobeComp])

  // ── Derived layers ──────────────────────────────────────────────────────────
  const stateClusters = useMemo(() => buildStateClusters(leads), [leads])

  const isState      = zoomLevel === 'state'
  const isCity       = zoomLevel === 'city'
  const isIndividual = zoomLevel === 'individual'

  // Hexágonos ativos em city/individual — mesmo conjunto de pontos, resolução
  // (tamanho de célula) diferente por nível de zoom.
  const hexBinData = useMemo(
    () => (isCity || isIndividual ? leads : []),
    [isCity, isIndividual, leads],
  )
  const hexResolution = isIndividual ? HEX_RES_INDIVIDUAL : HEX_RES_CIDADE

  // ── Leads for selected cluster panel ────────────────────────────────────────
  const clusterLeads = useMemo(() => {
    if (!selectedCluster) return []
    if (selectedCluster.type === 'state')
      return leads.filter((l) => l.estado === selectedCluster.estado)
    return selectedCluster.points
  }, [leads, selectedCluster])

  const clusterTitle = useMemo(() => {
    if (!selectedCluster) return ''
    if (selectedCluster.type === 'state') return selectedCluster.estado
    // Usa a cidade/estado do primeiro lead do hexágono como título legível
    const primeiro = clusterLeads[0]
    return primeiro ? `${primeiro.cidade}, ${primeiro.estado}` : 'Região selecionada'
  }, [selectedCluster, clusterLeads])

  // ── Callbacks ───────────────────────────────────────────────────────────────

  // Called every animation frame by globe — uses ref to avoid per-frame re-renders;
  // only updates state when the zoom category crosses a threshold
  const handleZoom = useCallback(() => {
    if (!globeRef.current) return
    const alt = globeRef.current.pointOfView().altitude
    altitudeRef.current = alt
    const next: 'state' | 'city' | 'individual' =
      alt > 0.70 ? 'state' : alt > 0.35 ? 'city' : 'individual'
    setZoomLevel((prev) => (prev !== next ? next : prev))
  }, [])

  const handleStateClick = useCallback((cluster: object) => {
    const c = cluster as { lat: number; lng: number; estado: string }
    globeRef.current?.pointOfView({ lat: c.lat, lng: c.lng, altitude: 0.55 }, 700)
    setZoomLevel('city')
    setSelected(null)
    setSelectedCluster({ type: 'state', estado: c.estado })
  }, [])

  // Clique no hexágono abre o painel com os leads reais daquela célula
  // (hex.points já vem pronto da lib — nada de calcular distância aqui).
  const handleHexClick = useCallback((hex: object) => {
    const h = hex as { points: LeadGeo[]; center: { lat: number; lng: number } }
    globeRef.current?.pointOfView({ lat: h.center.lat, lng: h.center.lng, altitude: isCity ? 0.25 : 0.15 }, 700)
    if (isCity) setZoomLevel('individual')
    setSelected(null)
    setSelectedCluster({ type: 'hex', points: h.points as LeadGeo[], lat: h.center.lat, lng: h.center.lng })
  }, [isCity])

  const handleClusterLeadSelect = useCallback((lead: LeadGeo) => {
    setSelected(lead)
    setSelectedCluster(null)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Loading overlay — shown while globe lib or container size isn't ready */}
      {(!GlobeComp || !size) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', zIndex: 30 }}>
          <div style={{ textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--red)', borderTopColor: 'transparent', margin: '0 auto 12px', animation: 'spin .8s linear infinite' }} />
            <div style={{ fontSize: 13 }}>Carregando globo...</div>
          </div>
        </div>
      )}

      {GlobeComp && size && <GlobeComp
        ref={globeRef}
        width={size.w}
        height={size.h}

        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        atmosphereColor="rgba(200,16,46,0.18)"
        atmosphereAltitude={0.08}
        backgroundColor="rgba(0,0,0,0)"

        // ── Brazilian state borders ──────────────────────────────────────────
        polygonsData={brazilStates}
        polygonCapColor={() => 'rgba(0,0,0,0)'}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => 'rgba(200,16,46,0.45)'}
        polygonAltitude={0.001}

        // ── State-level rings + labels (zoomed far out) ─────────────────────
        ringsData={isState ? stateClusters : []}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => () => 'rgba(200,16,46,0.45)'}
        ringMaxRadius={(d: object) => Math.max(1.5, Math.min(5.5, (d as typeof stateClusters[0]).count * 0.55))}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={1300}

        labelsData={isState ? stateClusters : []}
        labelLat="lat"
        labelLng="lng"
        labelText={(d: object) => {
          const c = d as typeof stateClusters[0]
          return `${c.estado}  ${c.count}`
        }}
        labelSize={0.60}
        labelColor={() => '#ffffff'}
        labelDotRadius={0.38}
        labelDotOrientation={() => 'bottom' as const}
        labelAltitude={0.015}
        onLabelClick={handleStateClick}

        // ── Densidade por hexágono (H3) — células de área real, não um blur ──
        // que desaparece em raios pequenos. Cidade (~8-10km) ou individual (~3-5km).
        hexBinPointsData={hexBinData}
        hexBinPointLat={(d: object) => (d as LeadGeo).lat}
        hexBinPointLng={(d: object) => (d as LeadGeo).lng}
        hexBinResolution={hexResolution}
        hexMargin={0.15}
        hexTopColor={(h: object) => heatColor(Math.min(1, (h as { points: LeadGeo[] }).points.length / 12))}
        hexSideColor={(h: object) => heatColor(Math.min(1, (h as { points: LeadGeo[] }).points.length / 12))}
        hexAltitude={(h: object) => 0.003 + Math.min(0.025, (h as { points: LeadGeo[] }).points.length * 0.0018)}
        hexLabel={(h: object) => {
          const hb = h as { points: LeadGeo[] }
          const convertidos = hb.points.filter((p) => p.status === 'converteu').length
          const primeiro = hb.points[0]
          return `<div style="background:rgba(0,0,0,.88);border:1px solid #282828;padding:5px 10px;border-radius:7px;font-size:11px;color:#f0f0f0;font-family:Inter,sans-serif;pointer-events:none">
            <strong>${primeiro ? `${primeiro.cidade}, ${primeiro.estado}` : 'Região'}</strong><br/>${hb.points.length} lead${hb.points.length > 1 ? 's' : ''}${convertidos ? ` · <span style="color:#10B981">${convertidos} convertido${convertidos > 1 ? 's' : ''}</span>` : ''}<br/><span style="color:#888;font-size:10px">Clique para ver lista</span>
          </div>`
        }}
        onHexClick={handleHexClick}

        onZoom={handleZoom}
        animateIn
      />}

      {/* Overlays — only after globe is ready */}
      {GlobeComp && size && <>
        <Legend level={zoomLevel} />
        <StatsBar leads={leads} />
      </>}

      {/* Cluster lead list panel */}
      {selectedCluster && (
        <ClusterPanel
          title={clusterTitle}
          leads={clusterLeads}
          clienteId={clienteId}
          onClose={() => setSelectedCluster(null)}
          onSelectLead={handleClusterLeadSelect}
        />
      )}

      {/* Individual lead detail panel */}
      {selected && <LeadPanel lead={selected} clienteId={clienteId} onClose={() => setSelected(null)} />}

      {/* Zoom breadcrumb */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,.72)', border: '1px solid var(--br)', borderRadius: 20,
        padding: '5px 16px', fontSize: 11, color: 'var(--t3)', pointerEvents: 'none',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <ZoomDot active={zoomLevel === 'state'} />
        <span style={{ color: zoomLevel === 'state' ? 'var(--t1)' : 'var(--t3)' }}>Estados</span>
        <span style={{ color: '#3a3a3a' }}>›</span>
        <ZoomDot active={zoomLevel === 'city'} />
        <span style={{ color: zoomLevel === 'city' ? 'var(--t1)' : 'var(--t3)' }}>Cidades</span>
        <span style={{ color: '#3a3a3a' }}>›</span>
        <ZoomDot active={zoomLevel === 'individual'} />
        <span style={{ color: zoomLevel === 'individual' ? 'var(--t1)' : 'var(--t3)' }}>Leads individuais</span>
      </div>
    </div>
  )
}
