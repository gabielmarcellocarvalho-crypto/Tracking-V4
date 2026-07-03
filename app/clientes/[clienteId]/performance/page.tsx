'use client'

import { use, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import TemplateSelect from '@/components/performance/TemplateSelect'
import { useCliente } from '@/lib/data/clientes'
import { useEventos } from '@/lib/data/colecoes'
import { agregarPerformance } from '@/lib/data/agregacoes'
import type { PerformanceTemplate } from '@/lib/demo-data-performance'
import { DEFAULT_PERSONALIZADO_BLOCKS } from '@/lib/demo-data-performance'

// Lazy-load templates
const EcommerceTemplate    = dynamic(() => import('@/components/performance/EcommerceTemplate'))
const LeadsTemplate        = dynamic(() => import('@/components/performance/LeadsTemplate'))
const MensagensTemplate    = dynamic(() => import('@/components/performance/MensagensTemplate'))
const PersonalizadoTemplate = dynamic(() => import('@/components/performance/PersonalizadoTemplate'))

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            height: 100, borderRadius: 12,
            background: 'var(--bg-c)', border: '1px solid var(--br)',
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.07}s`,
          }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{
            height: 260, borderRadius: 12,
            background: 'var(--bg-c)', border: '1px solid var(--br)',
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
      <div style={{ height: 200, borderRadius: 12, background: 'var(--bg-c)', border: '1px solid var(--br)', animation: 'pulse 1.4s ease-in-out infinite' }} />
    </div>
  )
}

const TEMPLATE_META: Record<PerformanceTemplate, { label: string; color: string; badge: string }> = {
  ecommerce:    { label: 'E-commerce',    color: '#10B981', badge: 'Receita · ROAS · Compras' },
  leads:        { label: 'Leads',          color: '#8B5CF6', badge: 'CPL · Qualificados · CPA' },
  mensagens:    { label: 'Mensagens',      color: '#25D366', badge: 'WhatsApp · Contatos · CPM' },
  personalizado: { label: 'Personalizado', color: '#F59E0B', badge: 'Dashboard customizado' },
}

export default function PerformancePage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { eventos } = useEventos(isDemo ? undefined : clienteId)

  const usarDemo = isDemo

  // Agregação real dos eventos do período (30 dias) — null quando cliente é demo
  const agregado = useMemo(
    () => (usarDemo ? null : agregarPerformance(eventos, 30)),
    [usarDemo, eventos],
  )

  // Shapes específicos de cada template, a partir da mesma agregação
  const real = useMemo(() => {
    if (!agregado) return null
    const p = agregado
    return {
      ecommerce: {
        kpis: {
          investimento: p.kpis.investimento, receita: p.kpis.receita, roas: p.kpis.roas,
          ticketMedio: p.kpis.ticketMedio, totalCompras: p.kpis.totalCompras, taxaAbandono: p.kpis.taxaAbandono,
        },
        diario: p.diario.map((d) => ({ dia: d.dia, investimento: d.investimento, receita: d.receita, roas: d.roas })),
        funil: p.funil,
        canais: p.canais,
        topProdutos: p.topProdutos,
        recentes: p.recentes.map((r) => ({ nome: r.nome, origem: r.origem, campanha: r.campanha, valor: r.valor ?? 0, data: r.data })),
      },
      leads: {
        kpis: {
          investimento: p.kpis.investimento, totalLeads: p.kpis.totalLeads, cpl: p.kpis.cpl,
          taxaConversao: p.kpis.taxaConversao, qualificados: p.kpis.totalLeads, naoQualificados: 0, cpa: 0,
        },
        diario: p.diario.map((d) => ({ dia: d.dia, leads: d.leads, cpl: d.cpl })),
        funil: p.funil,
        canais: p.canais,
        qualChart: [
          { name: 'Leads', value: p.kpis.totalLeads, color: '#10B981' },
          { name: 'Sem classificação', value: 0, color: '#374151' },
        ],
        recentes: p.recentes.map((r) => ({ nome: r.nome, origem: r.origem, campanha: r.campanha, status: r.status, data: r.data })),
      },
      mensagens: {
        kpis: {
          investimento: p.kpis.investimento, totalContatos: p.kpis.totalLeads, cpm: 0,
          taxaResposta: 0, conversoes: p.kpis.totalCompras, cpa: 0,
        },
        diario: p.diario.map((d) => ({ dia: d.dia, contatos: d.contatos, cpm: d.cpm })),
        funil: p.funil,
        canais: p.canais,
        recentes: p.recentes.map((r) => ({ nome: r.nome, origem: r.origem, campanha: r.campanha, status: r.status, data: r.data })),
      },
    }
  }, [agregado])

  const defaultTemplate: PerformanceTemplate = cliente?.tipo ?? 'ecommerce'

  const [template, setTemplate]         = useState<PerformanceTemplate>(defaultTemplate)
  const [loading, setLoading]           = useState(true)
  const [personBlocks, setPersonBlocks] = useState<string[]>(DEFAULT_PERSONALIZADO_BLOCKS)

  useEffect(() => {
    const load = async () => {
      try {
        const ref  = doc(db, 'clientes', clienteId, 'performance_config', 'main')
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          if (data.template) setTemplate(data.template as PerformanceTemplate)
          if (Array.isArray(data.blocos_personalizados) && data.blocos_personalizados.length > 0) {
            const sorted = [...data.blocos_personalizados].sort((a, b) => a.posicao - b.posicao)
            setPersonBlocks(sorted.map((b: { id: string; posicao: number }) => b.id))
          }
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [clienteId])

  const handleTemplateChange = async (t: PerformanceTemplate) => {
    if (t === template) return
    setTemplate(t)
    try {
      await setDoc(
        doc(db, 'clientes', clienteId, 'performance_config', 'main'),
        { template: t },
        { merge: true }
      )
    } catch { /* silent */ }
  }

  const meta = TEMPLATE_META[template]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
      `}</style>

      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      {/* Page header */}
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid var(--br)',
        background: 'var(--bg-s)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Left: title + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                  Performance
                </h2>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={template}
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 4 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, letterSpacing: '.04em',
                      background: meta.color + '18',
                      color: meta.color,
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    {meta.label}
                  </motion.span>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={template + '-desc'}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}
                >
                  {meta.badge} — dados do período selecionado
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: animated select */}
          <TemplateSelect value={template} onChange={handleTemplateChange} />
        </div>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={{
          padding: '8px 24px', borderBottom: '1px solid var(--br)',
          background: 'var(--bg-base)', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Período: <span style={{ color: 'var(--t2)', fontWeight: 600 }}>Últimos 30 dias</span>
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--br)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Atualizado: <span style={{ color: 'var(--t2)', fontWeight: 600 }}>hoje às 09:00</span>
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--br)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Dados: <span style={{ color: usarDemo ? '#8B5CF6' : '#10B981', fontWeight: 600 }}>
              {usarDemo ? 'Demo — instale o snippet no site' : `Reais — ${eventos.length.toLocaleString('pt-BR')} eventos`}
            </span>
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-base)' }}>
        {loading ? (
          <Skeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={template}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {template === 'ecommerce'     && <EcommerceTemplate dados={real?.ecommerce} real={!usarDemo} />}
              {template === 'leads'         && <LeadsTemplate dados={real?.leads} real={!usarDemo} />}
              {template === 'mensagens'     && <MensagensTemplate dados={real?.mensagens} real={!usarDemo} />}
              {template === 'personalizado' && (
                <PersonalizadoTemplate
                  clienteId={clienteId}
                  initialBlocks={personBlocks}
                  dados={agregado ?? undefined}
                  real={!usarDemo}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
