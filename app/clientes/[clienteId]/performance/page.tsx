'use client'

import { use, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import TemplateSelect from '@/components/performance/TemplateSelect'
import { useCliente } from '@/lib/data/partners'
import { useDateRange } from '@/lib/date-range-context'
import { useMetaAdsGasto } from '@/lib/data/meta-ads-metrics'
import { useGoogleAdsGasto } from '@/lib/data/google-ads-metrics'
import { useGA4Dados } from '@/lib/data/ga4-metrics'
import { useEventos, useConexoes } from '@/lib/data/colecoes'
import { agregarPerformance } from '@/lib/data/agregacoes'
import type { PerformanceTemplate } from '@/lib/demo-data-performance'
import { DEFAULT_PERSONALIZADO_BLOCKS } from '@/lib/demo-data-performance'

// Lazy-load templates
const EcommerceTemplate    = dynamic(() => import('@/components/performance/EcommerceTemplate'))
const LeadsTemplate        = dynamic(() => import('@/components/performance/LeadsTemplate'))
const MensagensTemplate    = dynamic(() => import('@/components/performance/MensagensTemplate'))
const GA4Template          = dynamic(() => import('@/components/performance/GA4Template'))
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

// ── Visão por canal (só template E-commerce por enquanto) ────────────────────
type CanalPerformance = 'geral' | 'meta' | 'google' | 'ga4'

const CANAIS_PERFORMANCE: { key: CanalPerformance; label: string }[] = [
  { key: 'geral',  label: 'Geral' },
  { key: 'meta',   label: 'Meta' },
  { key: 'google', label: 'Google' },
  { key: 'ga4',    label: 'GA4' },
]

function construirFunilAds(sessoes: number, addToCart: number, checkout: number, purchase: number) {
  const pct = (n: number) => (sessoes > 0 ? Math.round((n / sessoes) * 100) : 0)
  return [
    { label: 'Sessões',     count: Math.round(sessoes),   pct: 100,             color: '#3B82F6' },
    { label: 'Add to Cart', count: Math.round(addToCart), pct: pct(addToCart), color: '#F59E0B' },
    { label: 'Checkout',    count: Math.round(checkout),  pct: pct(checkout),  color: '#8B5CF6' },
    { label: 'Compra',      count: Math.round(purchase),  pct: pct(purchase),  color: '#10B981' },
  ]
}

function fmtDiaChave(chave: string) {
  const [, m, d] = chave.split('-')
  return `${d}/${m}`
}

function ConexaoNecessaria({ plataforma, clienteId }: { plataforma: string; clienteId: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '60px 24px', textAlign: 'center',
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
    }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{plataforma} não conectado</p>
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
        Conecte o {plataforma} em Conexões pra ver essa visão isolada da plataforma.
      </p>
      <Link
        href={`/clientes/${clienteId}/conexoes`}
        style={{ marginTop: 4, padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'var(--red)', color: '#fff', textDecoration: 'none' }}
      >
        Ir para Conexões
      </Link>
    </div>
  )
}

// Sem isso, o tempo real de resposta da API (Meta/Google/GA4, 1-3s) fazia a
// tela mostrar "não conectado" por engano enquanto o dado ainda estava a
// caminho — parecia bug (plataforma conectada "esquecendo" que está
// conectada) quando na verdade só estava carregando.
function CarregandoCanal({ plataforma }: { plataforma: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '60px 24px', textAlign: 'center',
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}
        style={{ animation: 'spin 1s linear infinite' }}>
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0 }}>Carregando dados do {plataforma}…</p>
    </div>
  )
}

export default function PerformancePage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { range: periodo } = useDateRange()
  // Sem isso, cliente de alto volume estoura o limite padrão de eventos antes
  // de alcançar o período pedido e o filtro de data fica silenciosamente
  // truncado (mesmo bug achado e corrigido na tela de Eventos).
  const { eventos } = useEventos(isDemo ? undefined : clienteId, { desde: periodo.start.getTime(), limite: 20000 })
  const { conexoes } = useConexoes(isDemo ? undefined : clienteId)

  const usarDemo = isDemo

  // Tipo do cliente decide quais templates fazem sentido — ecommerce não tem
  // Leads/Mensagens (sem filtro de lead pro tipo de cliente errado) e
  // inside-sales não tem E-commerce (sem filtro de compra/checkout).
  const templatesPermitidos: PerformanceTemplate[] = cliente?.tipo === 'ecommerce'
    ? ['ecommerce', 'personalizado']
    : ['leads', 'mensagens', 'personalizado']
  const defaultTemplate: PerformanceTemplate = cliente?.tipo === 'ecommerce' ? 'ecommerce' : 'leads'
  const [template, setTemplate] = useState<PerformanceTemplate>(defaultTemplate)

  // Visão por canal — "Geral" continua só mídia paga (Meta+Google), a aba
  // GA4 é tráfego nativo do GA4 (sessões/canais), nunca misturados.
  const [canal, setCanal] = useState<CanalPerformance>('geral')
  const ga4Conectado = !usarDemo && conexoes.some((c) => c.id === 'ga4' && c.status === 'configurado')
  // Personalizado não usa o seletor de canal — dispara o fetch também
  // quando esse template está ativo (pode ter blocos GA4 no layout).
  const { dados: ga4Dados, loading: loadingGA4 } = useGA4Dados(
    ga4Conectado && (canal === 'ga4' || template === 'personalizado') ? clienteId : undefined, periodo,
  )

  // Agregação real dos eventos dentro do período selecionado — null quando cliente é demo
  const agregadoBase = useMemo(
    () => (usarDemo ? null : agregarPerformance(eventos, periodo)),
    [usarDemo, eventos, periodo],
  )

  // Gasto real de Ads (Conexões → "Meta Ads (Métricas)" / "Google Ads (Métricas)"), pro mesmo período
  const { gasto: metaGasto, loading: loadingMeta, ultimaAtualizacao: ultimaMeta, refetch: refetchMeta } =
    useMetaAdsGasto(usarDemo ? undefined : clienteId, periodo)
  const { gasto: googleGasto, loading: loadingGoogle, ultimaAtualizacao: ultimaGoogle, refetch: refetchGoogle } =
    useGoogleAdsGasto(usarDemo ? undefined : clienteId, periodo)

  const carregandoAds = loadingMeta || loadingGoogle
  const ultimaAtualizacaoAds = [ultimaMeta, ultimaGoogle].filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  const atualizarMetricas = () => { refetchMeta(); refetchGoogle() }

  // Injeta o gasto real de Ads (Meta + Google somados) na agregação de
  // eventos — sem isso, investimento/ROAS ficam sempre zerados (não vêm do
  // tracking próprio)
  const agregado = useMemo(() => {
    if (!agregadoBase) return null
    if (!metaGasto && !googleGasto) return agregadoBase

    const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
    const diario = agregadoBase.diario.map((d) => {
      let investimento = 0
      const inicioBucket = new Date(`${d.dataISO}T00:00:00`)
      for (let i = 0; i < agregadoBase.passoDias; i++) {
        const chave = addDays(inicioBucket, i).toISOString().slice(0, 10)
        investimento += (metaGasto?.porData.get(chave)?.spend ?? 0) + (googleGasto?.porData.get(chave)?.spend ?? 0)
      }
      return { ...d, investimento, roas: investimento > 0 ? d.receita / investimento : 0 }
    })

    const investimentoTotal = (metaGasto?.total.spend ?? 0) + (googleGasto?.total.spend ?? 0)
    return {
      ...agregadoBase,
      diario,
      kpis: {
        ...agregadoBase.kpis,
        investimento: investimentoTotal,
        roas: investimentoTotal > 0 ? agregadoBase.kpis.receita / investimentoTotal : 0,
      },
    }
  }, [agregadoBase, metaGasto, googleGasto])

  // Visão E-commerce isolada por plataforma — usa só o que a própria Meta ou
  // Google reportam (spend + funil de actions/conversion categories), sem
  // misturar com o site. "Geral" continua sendo o combinado de sempre.
  const ecommerceMeta = useMemo(() => {
    if (!metaGasto) return null
    const t = metaGasto.total
    const receita = t.faturamento
    const roas = t.spend > 0 ? receita / t.spend : 0
    const ticketMedio = t.purchase > 0 ? Math.round(receita / t.purchase) : 0
    const taxaAbandono = t.checkout > 0 ? Math.round(((t.checkout - t.purchase) / t.checkout) * 100) : 0
    const dias = [...metaGasto.porData.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    return {
      kpis: {
        investimento: t.spend, receita, roas, ticketMedio, totalCompras: Math.round(t.purchase), taxaAbandono,
        alcance: Math.round(t.reach), impressoes: Math.round(t.impressions), cliques: Math.round(t.clicks),
        cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
        cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
      },
      diario: dias.map(([chave, d]) => ({
        dia: fmtDiaChave(chave), investimento: d.spend, receita: d.faturamento,
        roas: d.spend > 0 ? d.faturamento / d.spend : 0,
      })),
      funil: construirFunilAds(t.sessoes, t.addToCart, t.checkout, t.purchase),
      canais: [{ name: 'Meta Ads', value: 100, color: '#1877F2' }],
      topProdutos: [] as { nome: string; vendas: number; receita: number }[],
      recentes: [] as { nome: string; origem: string; campanha: string; valor: number; data: string }[],
    }
  }, [metaGasto])

  const ecommerceGoogle = useMemo(() => {
    if (!googleGasto) return null
    const t = googleGasto.total
    const receita = t.faturamento
    const roas = t.spend > 0 ? receita / t.spend : 0
    const ticketMedio = t.purchase > 0 ? Math.round(receita / t.purchase) : 0
    const taxaAbandono = t.checkout > 0 ? Math.round(((t.checkout - t.purchase) / t.checkout) * 100) : 0
    const dias = [...googleGasto.porData.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    return {
      kpis: {
        investimento: t.spend, receita, roas, ticketMedio, totalCompras: Math.round(t.purchase), taxaAbandono,
        // Google não expõe "alcance" (contas únicas) no relatório básico — impressões é o que temos.
        impressoes: Math.round(t.impressions), cliques: Math.round(t.clicks),
        cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
        cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
      },
      diario: dias.map(([chave, d]) => ({
        dia: fmtDiaChave(chave), investimento: d.spend, receita: d.faturamento,
        roas: d.spend > 0 ? d.faturamento / d.spend : 0,
      })),
      // Google não tem um equivalente validado a landing_page_view — cliques é a aproximação disponível pra "sessões"
      funil: construirFunilAds(t.clicks, t.addToCart, t.checkout, t.purchase),
      canais: [{ name: 'Google Ads', value: 100, color: '#4285F4' }],
      topProdutos: [] as { nome: string; vendas: number; receita: number }[],
      recentes: [] as { nome: string; origem: string; campanha: string; valor: number; data: string }[],
    }
  }, [googleGasto])

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
        // E-commerce não tem etapa de "Lead" no funil — só existe pra clientes leads/mensagens
        funil: p.funil.filter((f) => f.label !== 'Lead'),
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

  const [loading, setLoading]           = useState(true)
  const [personBlocks, setPersonBlocks] = useState<string[]>(DEFAULT_PERSONALIZADO_BLOCKS)
  // Independente de qual template está ativo agora — existe um layout
  // Personalizado salvo pra esse cliente? Trocar de template no dropdown só
  // muda QUAL está ativo, nunca apaga esse layout; isso avisa que ele ainda
  // existe mesmo quando não é o que está na tela.
  const [temPersonalizadoSalvo, setTemPersonalizadoSalvo] = useState(false)

  useEffect(() => {
    let templateAplicadoRef = false
    const load = async () => {
      try {
        const ref  = doc(db, 'partners', clienteId, 'performance_config', 'main')
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          // Ignora template salvo que não faz mais sentido pro tipo atual do
          // cliente (ex: cliente virou e-commerce mas tinha "leads" salvo).
          const t = data.template as PerformanceTemplate | undefined
          const aindaValido = t && (cliente?.tipo === 'ecommerce' ? t !== 'leads' && t !== 'mensagens' : t !== 'ecommerce')
          if (aindaValido) { setTemplate(t); templateAplicadoRef = true }
          if (Array.isArray(data.blocos_personalizados) && data.blocos_personalizados.length > 0) {
            const sorted = [...data.blocos_personalizados].sort((a, b) => a.posicao - b.posicao)
            setPersonBlocks(sorted.map((b: { id: string; posicao: number }) => b.id))
            setTemPersonalizadoSalvo(true)
          }
        }
        // Sem preferência salva válida — usa o default calculado a partir do
        // tipo real do cliente. Sem isso, `template` ficava travado no valor
        // do primeiro render (sempre "leads", já que `cliente` ainda era
        // null nesse momento) mesmo depois do tipo real chegar — o badge
        // "Performance" mostrava Leads/Mensagens pra cliente ecommerce até
        // o usuário trocar manualmente no dropdown (bug pego ao vivo).
        if (!templateAplicadoRef && cliente?.tipo) {
          setTemplate(cliente.tipo === 'ecommerce' ? 'ecommerce' : 'leads')
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
    // cliente carrega async — reavalia quando o tipo real chegar, senão o
    // check acima usaria cliente=null (undefined) e podia rejeitar um
    // template salvo válido enquanto o cliente ainda estava carregando.
  }, [clienteId, cliente?.tipo])

  const handleTemplateChange = async (t: PerformanceTemplate) => {
    if (t === template) return
    setTemplate(t)
    try {
      await setDoc(
        doc(db, 'partners', clienteId, 'performance_config', 'main'),
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
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} clienteId={isDemo ? undefined : clienteId} />

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
                {/* Sem AnimatePresence/motion aqui de propósito — com mode="wait"
                    e troca rápida de key (ex: selecionar E-commerce logo depois de
                    Personalizado), a animação de saída às vezes nunca completava e
                    o badge ficava travado pra sempre no primeiro valor renderizado
                    ("Leads", o default antes do tipo do cliente carregar), mesmo
                    com o dashboard já mostrando outro template — bug real visto
                    ao vivo. Um span simples sempre reflete o template atual. */}
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, letterSpacing: '.04em',
                    background: meta.color + '18',
                    color: meta.color,
                    border: `1px solid ${meta.color}30`,
                  }}
                >
                  {meta.label}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
                {meta.badge} — dados do período selecionado
              </p>
            </div>
          </div>

          {/* Right: animated select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {temPersonalizadoSalvo && template !== 'personalizado' && (
              <button
                onClick={() => handleTemplateChange('personalizado')}
                title="Você tem um layout Personalizado salvo pra este cliente"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#F59E0B',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Ver layout Personalizado salvo
              </button>
            )}
            <TemplateSelect value={template} onChange={handleTemplateChange} permitidos={templatesPermitidos} />
          </div>
        </div>

        {template === 'ecommerce' && (
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, background: 'var(--bg-c)', border: '1px solid var(--br)', width: 'fit-content', marginTop: 12 }}>
            {CANAIS_PERFORMANCE.map((c) => {
              const disabled = c.key === 'ga4' ? !ga4Conectado : false
              return (
                <button
                  key={c.key}
                  onClick={() => !disabled && setCanal(c.key)}
                  disabled={disabled}
                  title={disabled ? 'GA4 não conectado — configure em Conexões' : undefined}
                  style={{
                    padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: canal === c.key ? 'var(--red)' : 'transparent',
                    color: disabled ? 'var(--t3)' : canal === c.key ? '#fff' : 'var(--t2)',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={{
          padding: '8px 24px', borderBottom: '1px solid var(--br)',
          background: 'var(--bg-base)', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Período: <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{periodo.label}</span>
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--br)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Métricas de Ads: <span style={{ color: 'var(--t2)', fontWeight: 600 }}>
              {carregandoAds ? 'atualizando…' : ultimaAtualizacaoAds
                ? `atualizado às ${ultimaAtualizacaoAds.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'sem conexão de Ads'}
            </span>
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--br)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 500 }}>
            Dados: <span style={{ color: usarDemo ? '#8B5CF6' : '#10B981', fontWeight: 600 }}>
              {usarDemo ? 'Demo — instale o snippet no site' : `Reais — ${eventos.length.toLocaleString('pt-BR')} eventos`}
            </span>
          </span>
          {!usarDemo && (
            <button
              onClick={atualizarMetricas}
              disabled={carregandoAds}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'var(--bg-c)', border: '1px solid var(--br)', color: 'var(--t2)',
                cursor: carregandoAds ? 'default' : 'pointer', opacity: carregandoAds ? 0.6 : 1,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}
                style={{ animation: carregandoAds ? 'spin 1s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Atualizar métricas
            </button>
          )}
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
              {template === 'ecommerce' && canal === 'geral' && <EcommerceTemplate dados={real?.ecommerce} real={!usarDemo} />}
              {template === 'ecommerce' && canal === 'meta' && (
                ecommerceMeta
                  ? <EcommerceTemplate dados={ecommerceMeta} real={!usarDemo} />
                  : loadingMeta
                    ? <CarregandoCanal plataforma="Meta Ads" />
                    : <ConexaoNecessaria plataforma="Meta Ads" clienteId={clienteId} />
              )}
              {template === 'ecommerce' && canal === 'google' && (
                ecommerceGoogle
                  ? <EcommerceTemplate dados={ecommerceGoogle} real={!usarDemo} />
                  : loadingGoogle
                    ? <CarregandoCanal plataforma="Google Ads" />
                    : <ConexaoNecessaria plataforma="Google Ads" clienteId={clienteId} />
              )}
              {template === 'ecommerce' && canal === 'ga4' && (
                ga4Dados
                  ? <GA4Template dados={ga4Dados} real={!usarDemo} />
                  : loadingGA4
                    ? <CarregandoCanal plataforma="GA4" />
                    : <ConexaoNecessaria plataforma="GA4" clienteId={clienteId} />
              )}
              {template === 'leads'         && <LeadsTemplate dados={real?.leads} real={!usarDemo} />}
              {template === 'mensagens'     && <MensagensTemplate dados={real?.mensagens} real={!usarDemo} />}
              {template === 'personalizado' && (
                <PersonalizadoTemplate
                  clienteId={clienteId}
                  initialBlocks={personBlocks}
                  dados={agregado ?? undefined}
                  real={!usarDemo}
                  onSaved={() => setTemPersonalizadoSalvo(true)}
                  ga4Dados={ga4Dados ?? undefined}
                  ga4Conectado={ga4Conectado}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
