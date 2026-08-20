// ─── FORECASTING — CÁLCULO DOS CENÁRIOS ───────────────────────────────────────
// Reaproveita o Plano de Mídia já cadastrado (partners/{id}/plano_midia) como
// base do cenário "Realista" — Pessimista/Otimista são o mesmo Plano de
// Mídia com CTR e taxas de conversão ajustadas por um delta % configurável
// por cliente (ver ForecastingCenarios em lib/types.ts).
//
// `faturamentoProjetado` de um PlanoMidiaItem é digitado à mão (não existe
// fórmula confiável confirmada que o derive do funil — ver comentário em
// plano-midia-calc.ts), então cenários não recalculam faturamento via CTR:
// escalam o próprio valor digitado pelo delta de conversão, junto com os
// volumes de estágio (que representam a mesma "eficiência do funil").

import type { ForecastingCenarioDelta, ForecastingCenarios, PlanoMidiaConfigMes, PlanoMidiaItem } from '@/lib/types'
import { calcularLinhaPlanoMidia, type PlanoMidiaLinhaCalculada } from './plano-midia-calc'

export type CenarioNome = 'pessimista' | 'realista' | 'otimista'

export function aplicarDeltaCenario(item: PlanoMidiaItem, delta: ForecastingCenarioDelta): PlanoMidiaItem {
  const fatorConversao = 1 + delta.deltaConversao
  return {
    ...item,
    ctr: item.ctr * (1 + delta.deltaCtr),
    taxaEstagio1: item.taxaEstagio1 * fatorConversao,
    taxaEstagio2: item.taxaEstagio2 * fatorConversao,
    taxaEstagio3: item.taxaEstagio3 * fatorConversao,
    taxaEstagio4: item.taxaEstagio4 !== undefined ? item.taxaEstagio4 * fatorConversao : undefined,
    faturamentoProjetado: item.faturamentoProjetado * fatorConversao,
  }
}

export interface ForecastingTotaisMes {
  orcamento: number
  impressoes: number
  cliques: number
  estagio1: number
  estagio2: number
  estagio3: number
  estagio4?: number
  faturamentoProjetado: number
  ctrMedio: number
  roas: number
}

function somarLinhas(linhas: PlanoMidiaLinhaCalculada[]): ForecastingTotaisMes {
  const orcamento = linhas.reduce((s, l) => s + l.orcamentoPosImposto, 0)
  const impressoes = linhas.reduce((s, l) => s + l.impressoes, 0)
  const cliques = linhas.reduce((s, l) => s + l.cliques, 0)
  const estagio1 = linhas.reduce((s, l) => s + l.estagio1, 0)
  const estagio2 = linhas.reduce((s, l) => s + l.estagio2, 0)
  const estagio3 = linhas.reduce((s, l) => s + l.estagio3, 0)
  const temEstagio4 = linhas.some((l) => l.estagio4 !== undefined)
  const estagio4 = temEstagio4 ? linhas.reduce((s, l) => s + (l.estagio4 ?? 0), 0) : undefined
  const faturamentoProjetado = linhas.reduce((s, l) => s + l.faturamentoProjetado, 0)
  return {
    orcamento, impressoes, cliques, estagio1, estagio2, estagio3, estagio4, faturamentoProjetado,
    ctrMedio: impressoes > 0 ? cliques / impressoes : 0,
    roas: orcamento > 0 ? faturamentoProjetado / orcamento : 0,
  }
}

/** Totais dos 3 cenários pra um mês, a partir dos itens de Plano de Mídia daquele mês. */
export function agregarForecastingMes(
  itensDoMes: PlanoMidiaItem[],
  config: PlanoMidiaConfigMes | undefined,
  cenarios: ForecastingCenarios,
): Record<CenarioNome, ForecastingTotaisMes> {
  const fatorPosImposto = config?.fatorPosImposto ?? 1
  const orcamentoTotalPosImposto = config?.orcamentoTotal
    ? config.orcamentoTotal * fatorPosImposto
    : itensDoMes.reduce((s, i) => s + i.orcamento * fatorPosImposto, 0)

  const calcular = (itens: PlanoMidiaItem[]) =>
    somarLinhas(itens.map((item) => calcularLinhaPlanoMidia(item, fatorPosImposto, orcamentoTotalPosImposto)))

  return {
    pessimista: calcular(itensDoMes.map((i) => aplicarDeltaCenario(i, cenarios.pessimista))),
    realista: calcular(itensDoMes),
    otimista: calcular(itensDoMes.map((i) => aplicarDeltaCenario(i, cenarios.otimista))),
  }
}

/** Padrão sugerido quando o cliente ainda não configurou os próprios % —
 * assimetria proposital (upside de conversão maior que o downside), mesmo
 * padrão observado na planilha de referência (Growthmap/Hawks). */
export const CENARIOS_PADRAO: ForecastingCenarios = {
  pessimista: { deltaCtr: -0.15, deltaConversao: -0.15 },
  otimista: { deltaCtr: 0.15, deltaConversao: 0.25 },
}

interface MetricasAdsDiaLike {
  spend: number
  faturamento?: number
  purchase?: number
  ticketMedio?: number
}

/** Reduz o mapa dia→métricas (já existente em useMetaAdsGasto/useGoogleAdsGasto)
 * pro total de um mês específico ('AAAA-MM') — é o "Realizado" real. */
export function somarRealizadoMes<T extends MetricasAdsDiaLike>(
  porDia: Map<string, T> | undefined,
  mesChave: string,
): { investimento: number; faturamento: number } {
  if (!porDia) return { investimento: 0, faturamento: 0 }
  let investimento = 0
  let faturamento = 0
  for (const [data, m] of porDia) {
    if (!data.startsWith(mesChave)) continue
    investimento += m.spend ?? 0
    faturamento += m.faturamento ?? 0
  }
  return { investimento, faturamento }
}
