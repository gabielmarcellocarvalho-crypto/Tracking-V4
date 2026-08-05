// ─── PLANO DE MÍDIA — CÁLCULO DAS COLUNAS DERIVADAS ───────────────────────────
// Fórmulas confirmadas linha a linha contra a planilha de referência (Growth
// Pack 2.0). Só os campos de PlanoMidiaItem são digitados; tudo aqui é
// recalculado na hora, nunca gravado no Firestore.
//
//   Orçamento Pós Imposto = Orçamento × fatorPosImposto
//   Share de orçamento    = Orçamento Pós Imposto (linha) ÷ Orçamento Pós Imposto total do mês
//   Custo de Mídia/Dia    = Orçamento Pós Imposto ÷ dias da inserção
//   Impressões            = Orçamento Pós Imposto ÷ CPM × 1000
//   Alcance               = Impressões ÷ Frequência
//   Cliques               = Impressões × CTR
//   CPC                   = Orçamento Pós Imposto ÷ Cliques
//   Sessões               = Cliques × Connect Rate
//   CPS                   = Orçamento Pós Imposto ÷ Sessões
//   Estágio 1 (Add to Cart / Leads)   = Cliques × Taxa Estágio 1
//   Estágio 2 (Checkout / MQL)        = Estágio 1 × Taxa Estágio 2
//   Estágio 3 (Purchase / SQL)        = Estágio 2 × Taxa Estágio 3
//   Estágio 4 (— / Vendas, só leads)  = Estágio 3 × Taxa Estágio 4
//
// Faturamento Projetado é digitado manualmente — não existe fórmula
// confiável confirmada pra derivá-lo (testado contra a planilha e não bateu).

import type { PlanoMidiaItem } from '@/lib/types'

export interface PlanoMidiaLinhaCalculada extends PlanoMidiaItem {
  dias: number
  orcamentoPosImposto: number
  shareOrcamento: number
  custoMidiaDia: number
  impressoes: number
  alcance: number
  cliques: number
  cpc: number
  sessoes: number
  cps: number
  estagio1: number
  estagio2: number
  estagio3: number
  estagio4?: number
}

function diasEntre(inicio: string, fim: string): number {
  const d1 = new Date(`${inicio}T00:00:00`).getTime()
  const d2 = new Date(`${fim}T00:00:00`).getTime()
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1)
}

export function calcularLinhaPlanoMidia(
  item: PlanoMidiaItem,
  fatorPosImposto: number,
  orcamentoTotalPosImpostoMes: number,
): PlanoMidiaLinhaCalculada {
  const dias = diasEntre(item.dataInicio, item.dataFim)
  const orcamentoPosImposto = item.orcamento * fatorPosImposto
  const shareOrcamento = orcamentoTotalPosImpostoMes > 0 ? orcamentoPosImposto / orcamentoTotalPosImpostoMes : 0
  const custoMidiaDia = orcamentoPosImposto / dias
  const impressoes = item.cpm > 0 ? (orcamentoPosImposto / item.cpm) * 1000 : 0
  const alcance = item.frequencia > 0 ? impressoes / item.frequencia : 0
  const cliques = impressoes * item.ctr
  const cpc = cliques > 0 ? orcamentoPosImposto / cliques : 0
  const sessoes = cliques * item.connectRate
  const cps = sessoes > 0 ? orcamentoPosImposto / sessoes : 0
  const estagio1 = cliques * item.taxaEstagio1
  const estagio2 = estagio1 * item.taxaEstagio2
  const estagio3 = estagio2 * item.taxaEstagio3
  const estagio4 = item.taxaEstagio4 !== undefined ? estagio3 * item.taxaEstagio4 : undefined

  return {
    ...item, dias, orcamentoPosImposto, shareOrcamento, custoMidiaDia,
    impressoes, alcance, cliques, cpc, sessoes, cps,
    estagio1, estagio2, estagio3, estagio4,
  }
}

/** Soma o Orçamento Pós Imposto de todas as linhas de um mês — usado como
 * denominador do Share quando não há config de Orçamento Total pro mês. */
export function somarOrcamentoPosImposto(itens: PlanoMidiaItem[], fatorPosImposto: number): number {
  return itens.reduce((s, i) => s + i.orcamento * fatorPosImposto, 0)
}
