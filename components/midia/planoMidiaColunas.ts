import type { GrowthPackFunil } from '@/lib/data/agregacoes'

export interface PlanoMidiaColuna {
  key: string
  label: string
  fonte: 'manual' | 'calculado'
  formato: 'moeda' | 'numero' | 'percent' | 'razao' | 'texto'
}

// Rótulos do funil de conversão (estágios 1–4) variam por tipo de cliente —
// mesma decisão já usada no Growth Pack.
const ROTULOS_FUNIL: Record<GrowthPackFunil, { estagio1: string; estagio2: string; estagio3: string; estagio4?: string }> = {
  ecommerce:  { estagio1: 'Add to Cart', estagio2: 'Checkout', estagio3: 'Purchase' },
  leadsFunil: { estagio1: 'Leads', estagio2: 'MQL', estagio3: 'SQL', estagio4: 'Vendas' },
}

export function rotulosFunilPlanoMidia(funil: GrowthPackFunil) {
  return ROTULOS_FUNIL[funil]
}

export function colunasPlanoMidia(funil: GrowthPackFunil): PlanoMidiaColuna[] {
  const r = ROTULOS_FUNIL[funil]
  const colunas: PlanoMidiaColuna[] = [
    { key: 'dataInicio',           label: 'Início',              fonte: 'manual',    formato: 'texto' },
    { key: 'dataFim',               label: 'Fim',                 fonte: 'manual',    formato: 'texto' },
    { key: 'dias',                  label: 'Dias',                fonte: 'calculado', formato: 'numero' },
    { key: 'veiculo',               label: 'Veículo',             fonte: 'manual',    formato: 'texto' },
    { key: 'campanha',              label: 'Campanha',            fonte: 'manual',    formato: 'texto' },
    { key: 'objetivo',              label: 'Objetivo',            fonte: 'manual',    formato: 'texto' },
    { key: 'kpiPrimario',           label: 'KPI Primário',        fonte: 'manual',    formato: 'texto' },
    { key: 'funil',                 label: 'Funil',               fonte: 'manual',    formato: 'texto' },
    { key: 'orcamento',             label: 'Orçamento',           fonte: 'manual',    formato: 'moeda' },
    { key: 'orcamentoPosImposto',   label: 'Orç. Pós Imposto',    fonte: 'calculado', formato: 'moeda' },
    { key: 'shareOrcamento',        label: 'Share Orçamento',     fonte: 'calculado', formato: 'percent' },
    { key: 'custoMidiaDia',         label: 'Custo Mídia/Dia',     fonte: 'calculado', formato: 'moeda' },
    { key: 'frequencia',            label: 'Frequência',          fonte: 'manual',    formato: 'razao' },
    { key: 'alcance',               label: 'Alcance',             fonte: 'calculado', formato: 'numero' },
    { key: 'impressoes',            label: 'Impressões',          fonte: 'calculado', formato: 'numero' },
    { key: 'cpm',                   label: 'CPM',                 fonte: 'manual',    formato: 'moeda' },
    { key: 'cliques',               label: 'Cliques',             fonte: 'calculado', formato: 'numero' },
    { key: 'cpc',                   label: 'CPC',                 fonte: 'calculado', formato: 'moeda' },
    { key: 'ctr',                   label: 'CTR',                 fonte: 'manual',    formato: 'percent' },
    { key: 'connectRate',           label: 'Connect Rate',        fonte: 'manual',    formato: 'percent' },
    { key: 'sessoes',               label: 'Sessões',             fonte: 'calculado', formato: 'numero' },
    { key: 'cps',                   label: 'CPS',                 fonte: 'calculado', formato: 'moeda' },
    { key: 'taxaEstagio1',          label: `Taxa Conv. ${r.estagio1}`, fonte: 'manual', formato: 'percent' },
    { key: 'estagio1',              label: r.estagio1,            fonte: 'calculado', formato: 'numero' },
    { key: 'taxaEstagio2',          label: `Taxa Conv. ${r.estagio2}`, fonte: 'manual', formato: 'percent' },
    { key: 'estagio2',              label: r.estagio2,            fonte: 'calculado', formato: 'numero' },
    { key: 'taxaEstagio3',          label: `Taxa Conv. ${r.estagio3}`, fonte: 'manual', formato: 'percent' },
    { key: 'estagio3',              label: r.estagio3,            fonte: 'calculado', formato: 'numero' },
  ]
  if (r.estagio4) {
    colunas.push(
      { key: 'taxaEstagio4', label: `Taxa Conv. ${r.estagio4}`, fonte: 'manual', formato: 'percent' },
      { key: 'estagio4',     label: r.estagio4,                 fonte: 'calculado', formato: 'numero' },
    )
  }
  colunas.push({ key: 'faturamentoProjetado', label: 'Projeção Faturamento', fonte: 'manual', formato: 'moeda' })
  return colunas
}

export function formatarValorPlanoMidia(v: number | string | undefined, formato: PlanoMidiaColuna['formato']): string {
  if (formato === 'texto') return String(v ?? '—')
  const n = Number(v ?? 0)
  if (formato === 'moeda') return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
  if (formato === 'percent') return `${(n * 100).toFixed(2)}%`
  if (formato === 'razao') return n.toFixed(2)
  return Math.round(n).toLocaleString('pt-BR')
}
