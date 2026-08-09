import type { ClienteTipo } from '@/lib/demo-data'

export type KpiDirecao = 'min' | 'max' // 'min' = alerta se o valor real ficar ABAIXO da meta; 'max' = alerta se ficar ACIMA
export type KpiFormato = 'moeda' | 'percentual' | 'razao' | 'numero'

export interface KpiDef {
  key: string
  label: string
  formato: KpiFormato
  direcao: KpiDirecao
}

// Só entram aqui KPIs 100% calculáveis a partir do que a Meta Marketing API e
// a Google Ads API realmente reportam (spend/impressions/clicks/funil) — nada
// que dependa do site já estar rastreando (isso já é coberto pelos "Alertas
// automáticos" existentes, que usam os eventos próprios).
export const KPIS_ECOMMERCE: KpiDef[] = [
  { key: 'ctr',           label: 'CTR (Cliques/Impressões)',       formato: 'percentual', direcao: 'min' },
  { key: 'cpc',            label: 'CPC (Custo por Clique)',         formato: 'moeda',      direcao: 'max' },
  { key: 'cpm',            label: 'CPM (Custo por Mil Impressões)', formato: 'moeda',      direcao: 'max' },
  { key: 'taxaAddToCart',  label: 'Taxa Clique → Add to Cart',      formato: 'percentual', direcao: 'min' },
  { key: 'taxaCheckout',   label: 'Taxa Add to Cart → Checkout',    formato: 'percentual', direcao: 'min' },
  { key: 'taxaConversao',  label: 'Taxa Clique → Compra',           formato: 'percentual', direcao: 'min' },
  { key: 'cpa',            label: 'CPA (Custo por Compra)',         formato: 'moeda',      direcao: 'max' },
  { key: 'roas',           label: 'ROAS',                           formato: 'razao',      direcao: 'min' },
  { key: 'ticketMedio',    label: 'Ticket Médio',                   formato: 'moeda',      direcao: 'min' },
]

// 'leads' e 'mensagens' — só o que dá pra calcular com dado real de anúncio,
// sem misturar com contagem de lead do site (não confiável por canal ainda).
export const KPIS_LEADS: KpiDef[] = [
  { key: 'ctr', label: 'CTR (Cliques/Impressões)',       formato: 'percentual', direcao: 'min' },
  { key: 'cpc', label: 'CPC (Custo por Clique)',          formato: 'moeda',      direcao: 'max' },
  { key: 'cpm', label: 'CPM (Custo por Mil Impressões)',  formato: 'moeda',      direcao: 'max' },
]

export function kpisDoTipo(tipo: ClienteTipo | undefined): KpiDef[] {
  return tipo === 'ecommerce' || tipo === undefined ? KPIS_ECOMMERCE : KPIS_LEADS
}

function div(a: number, b: number) {
  return b > 0 ? a / b : 0
}

export interface InsumosEcommerce {
  investimento: number; impressoes: number; cliques: number
  addToCart: number; checkout: number; purchase: number; faturamento: number
}

export function calcularKpisEcommerce(i: InsumosEcommerce): Record<string, number> {
  return {
    ctr: div(i.cliques, i.impressoes) * 100,
    cpc: div(i.investimento, i.cliques),
    cpm: div(i.investimento, i.impressoes) * 1000,
    taxaAddToCart: div(i.addToCart, i.cliques) * 100,
    taxaCheckout: div(i.checkout, i.addToCart) * 100,
    taxaConversao: div(i.purchase, i.cliques) * 100,
    cpa: div(i.investimento, i.purchase),
    roas: div(i.faturamento, i.investimento),
    ticketMedio: div(i.faturamento, i.purchase),
  }
}

export interface InsumosLeads {
  investimento: number; impressoes: number; cliques: number
}

export function calcularKpisLeads(i: InsumosLeads): Record<string, number> {
  return {
    ctr: div(i.cliques, i.impressoes) * 100,
    cpc: div(i.investimento, i.cliques),
    cpm: div(i.investimento, i.impressoes) * 1000,
  }
}

export function formatarKpi(v: number | undefined, formato: KpiFormato): string {
  const n = v ?? 0
  if (formato === 'moeda') return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (formato === 'percentual') return `${n.toFixed(2)}%`
  if (formato === 'razao') return `${n.toFixed(2)}x`
  return Math.round(n).toLocaleString('pt-BR')
}
