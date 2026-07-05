'use client'

import { use, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { leadsGeoData, type LeadStatus } from '@/lib/demo-data'
import { useCliente } from '@/lib/data/partners'
import { useIdentidades } from '@/lib/data/colecoes'
import { identidadesParaGeo } from '@/lib/data/geo-mapa'

const STATUS_FILTRO_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  lead:                  { label: 'Lead',               color: '#3B82F6' },
  'checkout-abandonado': { label: 'Carrinho/checkout',  color: '#F59E0B' },
  converteu:             { label: 'Comprou',             color: '#10B981' },
}

const GlobeLeads = dynamic(() => import('@/components/mapa/GlobeLeads'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>
      <div style={{ textAlign: 'center', color: '#555' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #C8102E', borderTopColor: 'transparent', margin: '0 auto 12px', animation: 'spin .8s linear infinite' }} />
        <div style={{ fontSize: 13 }}>Carregando globo...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  ),
})

export default function MapaPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { identidades } = useIdentidades(isDemo ? undefined : clienteId)

  const usarDemo = isDemo
  const { pontos: todosLeads, foraDoMapa } = useMemo(
    () => (usarDemo ? { pontos: leadsGeoData, foraDoMapa: 0 } : identidadesParaGeo(identidades)),
    [usarDemo, identidades],
  )

  const [statusAtivos, setStatusAtivos] = useState<Set<LeadStatus>>(
    () => new Set(Object.keys(STATUS_FILTRO_CONFIG) as LeadStatus[]),
  )
  const toggleStatus = (status: LeadStatus) => {
    setStatusAtivos((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size > 1) next.delete(status) // nunca deixa zerar tudo
      } else {
        next.add(status)
      }
      return next
    })
  }
  const leads = useMemo(
    () => todosLeads.filter((l) => statusAtivos.has(l.status)),
    [todosLeads, statusAtivos],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      {/* Page title bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--br)', background: 'var(--bg-s)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Mapa de Leads</h2>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
            Distribuição geográfica dos leads por IP — {leads.length} leads rastreados
            {usarDemo ? ' · dados demo' : ' · dados reais'}
          </p>
        </div>

        {/* Filtro por status (carrinho/checkout, comprou, lead) */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.keys(STATUS_FILTRO_CONFIG) as LeadStatus[]).map((status) => {
            const cfg = STATUS_FILTRO_CONFIG[status]
            const ativo = statusAtivos.has(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  background: ativo ? cfg.color + '18' : 'transparent',
                  border: `1px solid ${ativo ? cfg.color + '55' : 'var(--br)'}`,
                  color: ativo ? cfg.color : 'var(--t3)', opacity: ativo ? 1 : 0.6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,.1)', color: '#10B981', border: '1px solid rgba(16,185,129,.25)' }}>
            {leads.filter((l) => l.status === 'converteu').length} convertidos
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(200,16,46,.1)', color: 'var(--red)', border: '1px solid rgba(200,16,46,.25)' }}>
            {leads.length} total
          </div>
          {foraDoMapa > 0 && (
            <div
              title="Eventos com IP fora do Brasil ou sem estado identificável — não entram no mapa pra evitar posição incorreta. Pode indicar tráfego inválido/bot na campanha."
              style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.25)', cursor: 'help' }}
            >
              {foraDoMapa} fora do Brasil / sem geo
            </div>
          )}
        </div>
      </div>

      {/* Globe fills remaining space */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GlobeLeads leads={leads} clienteId={clienteId} />
        {!usarDemo && leads.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', background: '#0B0B0B',
          }}>
            <div style={{ textAlign: 'center', color: 'var(--t3)', maxWidth: 320, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>Nenhum lead rastreado ainda</p>
              <p style={{ fontSize: 11.5, margin: '6px 0 0', lineHeight: 1.5 }}>
                Assim que o snippet capturar visitantes com localização, eles aparecem aqui.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
