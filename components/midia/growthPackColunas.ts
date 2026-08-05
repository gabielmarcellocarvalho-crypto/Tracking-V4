import type { ClienteTipo } from '@/lib/demo-data'
import type { GrowthPackFunil } from '@/lib/data/agregacoes'

export interface GrowthPackColuna {
  key: string
  label: string
  // 'auto' = calculado a partir de eventos/Ads; 'manual' = não tem fonte
  // automática ainda, o gestor preenche mês a mês.
  fonte: 'auto' | 'manual'
  formato: 'moeda' | 'numero' | 'razao'
}

// 'mensagens' reaproveita o funil de 'leads' até termos uma planilha própria
// (decisão registrada na conversa de unificação — sem dado de refência ainda).
export function funilDoTipo(tipo: ClienteTipo): GrowthPackFunil {
  return tipo === 'ecommerce' ? 'ecommerce' : 'leadsFunil'
}

export const COLUNAS_ECOMMERCE: GrowthPackColuna[] = [
  { key: 'investimento', label: 'Investimento', fonte: 'auto',   formato: 'moeda' },
  { key: 'alcance',      label: 'Alcance',       fonte: 'auto',   formato: 'numero' },
  { key: 'sessoes',      label: 'Sessões',       fonte: 'auto',   formato: 'numero' },
  { key: 'addToCart',    label: 'Add to Cart',   fonte: 'auto',   formato: 'numero' },
  { key: 'checkout',     label: 'Checkout',      fonte: 'auto',   formato: 'numero' },
  { key: 'purchase',     label: 'Purchase',      fonte: 'auto',   formato: 'numero' },
  { key: 'faturamento',  label: 'Faturamento',   fonte: 'auto',   formato: 'moeda' },
  { key: 'roas',         label: 'ROAS',          fonte: 'auto',   formato: 'razao' },
]

export const COLUNAS_LEADS: GrowthPackColuna[] = [
  { key: 'investimento', label: 'Investimento', fonte: 'auto',   formato: 'moeda' },
  { key: 'alcance',      label: 'Alcance',       fonte: 'auto',   formato: 'numero' },
  { key: 'clique',       label: 'Clique',        fonte: 'auto',   formato: 'numero' },
  { key: 'leads',        label: 'Leads',         fonte: 'auto',   formato: 'numero' },
  { key: 'mql',          label: 'MQL',           fonte: 'manual', formato: 'numero' },
  { key: 'sql',          label: 'SQL',           fonte: 'manual', formato: 'numero' },
  { key: 'vendas',       label: 'Vendas',        fonte: 'auto',   formato: 'numero' },
  { key: 'faturamento',  label: 'Faturamento',   fonte: 'auto',   formato: 'moeda' },
  { key: 'roas',         label: 'ROAS',          fonte: 'auto',   formato: 'razao' },
]

export function colunasDoFunil(funil: GrowthPackFunil): GrowthPackColuna[] {
  return funil === 'ecommerce' ? COLUNAS_ECOMMERCE : COLUNAS_LEADS
}

export function formatarValor(v: number | undefined, formato: GrowthPackColuna['formato']): string {
  const n = v ?? 0
  if (formato === 'moeda') return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (formato === 'razao') return n.toFixed(2)
  return Math.round(n).toLocaleString('pt-BR')
}
