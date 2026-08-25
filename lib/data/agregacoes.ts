// ─── AGREGAÇÕES ───────────────────────────────────────────────────────────────
// Transformam eventos/identidades brutos do Firestore nos formatos que as telas
// já consomem (mesmos shapes dos dados demo).

import type { Evento, EventoTipo, Identidade, Origem, PartnerTipo, EventStatsDia, EventStatsUltimo } from '@/lib/types'
import type { EventHealth, EventLogItem, PageHeatEntry } from '@/lib/demo-data-tracking'
import type { UsuarioJornada, EventoJornada } from '@/lib/demo-data'

const DIA_MS = 24 * 60 * 60 * 1000

function toYMD(d: Date) { return d.toISOString().slice(0, 10) }

/** Soma um Map<'YYYY-MM-DD', number> (ex: page views do GA4) entre dois timestamps, inclusive. */
function somarPeriodoMap(porDia: Map<string, number>, inicio: number, fim: number): number {
  let soma = 0
  for (let d = new Date(inicio).setHours(0, 0, 0, 0); d <= fim; d += DIA_MS) {
    soma += porDia.get(toYMD(new Date(d))) ?? 0
  }
  return soma
}

export interface JanelaPeriodo { start: Date; end: Date }

// Máximo de pontos numa série temporal — períodos maiores agrupam por semana
// pra não estourar o gráfico (ex: um "Personalizado" de vários meses).
const MAX_PONTOS_SERIE = 60

export const ORIGEM_LABEL: Record<Origem, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  organico: 'Orgânico',
  direto: 'Direto',
  email: 'Email',
  shopify: 'Shopify',
  'loja-integrada': 'Loja Integrada',
  outro: 'Outro',
}

const ORIGEM_COR: Record<string, string> = {
  'Meta Ads': '#1877F2', 'Google Ads': '#4285F4', 'Orgânico': '#10B981',
  'Direto': '#6B7280', 'Email': '#F59E0B', 'Shopify': '#96BF48', 'Loja Integrada': '#00C48C', 'Outro': '#8B5CF6',
}

const EVENTO_META: Record<string, Pick<EventHealth, 'label' | 'description' | 'icon' | 'color'>> = {
  page_view: {
    label: 'Page View', description: 'Visualização de página',
    icon: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    color: '#10B981',
  },
  lead: {
    label: 'Lead', description: 'Formulário / conversão',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    color: '#8B5CF6',
  },
  checkout: {
    label: 'Checkout', description: 'Início de checkout',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    color: '#F59E0B',
  },
  compra: {
    label: 'Compra', description: 'Venda finalizada',
    icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 15v-4H7l5-8v4h4l-5 8z',
    color: '#EF4444',
  },
  view_item: {
    label: 'View Item', description: 'Visualização de produto',
    icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    color: '#06B6D4',
  },
}

function tempoRelativo(ms: number): string {
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} hora${h > 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  return `há ${d} dia${d > 1 ? 's' : ''}`
}

/** "Últimos 30 dias" → "30 dias" · "Hoje" → "hoje" — rótulo curto pro card de saúde. */
function labelPeriodoCurto(label: string): string {
  return label.replace(/^Últimos\s+/i, '').toLowerCase()
}

// E-commerce não tem etapa de "Lead" (retirado dos dashs por decisão do
// Gabriel); inside-sales não tem checkout/compra (não existe e-commerce pra
// gerar esses eventos). Sem tipo (demo/desconhecido), mostra tudo.
export function eventoTiposDoCliente(tipoCliente?: PartnerTipo): EventoTipo[] {
  if (tipoCliente === 'ecommerce')    return ['page_view', 'view_item', 'checkout', 'compra']
  if (tipoCliente === 'inside-sales') return ['page_view', 'lead']
  return ['page_view', 'lead', 'checkout', 'compra']
}

// ── Saúde dos eventos ─────────────────────────────────────────────────────────
// `periodo` é o filtro de data selecionado no topo da tela (Hoje/7/30/90
// dias/Personalizado) — quando ausente (ex: gerarAlertas, Agente IA), cai pra
// uma janela fixa de 7 dias, que é o comportamento que essas duas chamadas
// internas sempre tiveram. `tipoCliente` decide quais tipos de evento fazem
// sentido pra esse cliente (ver eventoTiposDoCliente).
export function agregarSaudeEventos(
  eventos: Evento[],
  periodo?: { start: Date; end: Date; label: string },
  tipoCliente?: PartnerTipo,
  ga4?: { porDia: Map<string, number> },
): EventHealth[] {
  const agora = Date.now()
  const inicioHoje = new Date().setHours(0, 0, 0, 0)
  const inicioPeriodo = periodo ? new Date(periodo.start).setHours(0, 0, 0, 0) : agora - 7 * DIA_MS
  const fimPeriodo = periodo ? new Date(periodo.end).setHours(23, 59, 59, 999) : agora
  const periodoLabel = periodo ? labelPeriodoCurto(periodo.label) : '7 dias'

  return eventoTiposDoCliente(tipoCliente).map((tipo) => {
    const doTipo = eventos.filter((e) => e.tipo === tipo)
    const ultimo = doTipo.reduce<number>((m, e) => Math.max(m, e.ts), 0)
    const minAtras = ultimo ? Math.floor((agora - ultimo) / 60000) : Infinity

    // Limiares por criticidade do evento (compra pode ser mais espaçada que page_view)
    const limiteWarn = tipo === 'page_view' ? 60 : tipo === 'lead' ? 360 : 720
    const status: EventHealth['status'] =
      minAtras === Infinity || minAtras > 1440 ? 'offline'
      : minAtras > limiteWarn ? 'warning'
      : 'online'

    const alert =
      status === 'offline' ? (ultimo ? 'Evento parado há mais de 24h — verificar integração' : 'Nenhum evento recebido ainda')
      : status === 'warning' ? 'Intervalo longo — verificar disparo no site'
      : undefined

    const contagemSnippetPeriodo = doTipo.filter((e) => e.ts >= inicioPeriodo && e.ts <= fimPeriodo).length

    // GA4 prevalece sobre o snippet pro page_view do período (nunca soma —
    // troca a fonte) — "Hoje" sempre fica no snippet porque o GA4 tem atraso
    // de processamento e mostraria número baixo/zerado sem ser esse o caso.
    // Mantém a contagem do snippet visível em fonteAlternativa pra dar pra
    // conferir se as duas fontes batem.
    let countPeriodo = contagemSnippetPeriodo
    let fonteAlternativa: EventHealth['fonteAlternativa']
    if (tipo === 'page_view' && ga4) {
      countPeriodo = somarPeriodoMap(ga4.porDia, inicioPeriodo, fimPeriodo)
      fonteAlternativa = { label: 'snippet', valor: contagemSnippetPeriodo }
    }

    return {
      id: tipo,
      ...EVENTO_META[tipo],
      status,
      lastFired: ultimo ? tempoRelativo(ultimo) : '—',
      lastFiredAgo: minAtras === Infinity ? 99999 : minAtras,
      countToday: doTipo.filter((e) => e.ts >= inicioHoje).length,
      countPeriodo,
      periodoLabel,
      fonteAlternativa,
      alert,
    }
  })
}

// ── Saúde dos eventos, a partir do contador agregado (partners/{id}/stats) ────
// Mesmo resultado de agregarSaudeEventos, mas lendo o resumo pré-calculado em
// vez de escanear eventos crus — não precisa do array inteiro de eventos do
// período pra só somar contagem. "Evento parado" fica mais preciso aqui (usa
// stats/ultimo, sempre atual) do que reconstruir de uma amostra limitada de
// eventos crus, que pode não conter o tipo mais raro (ex: compra).
export function agregarSaudeEventosDeStats(
  porDia: Map<string, EventStatsDia>,
  ultimo: EventStatsUltimo | null,
  periodo?: { label: string },
  tipoCliente?: PartnerTipo,
): EventHealth[] {
  const agora = Date.now()
  const hojeStr = toYMD(new Date())
  const periodoLabel = periodo ? labelPeriodoCurto(periodo.label) : '7 dias'

  return eventoTiposDoCliente(tipoCliente).map((tipo) => {
    const ultimoTs = (ultimo?.[tipo as keyof EventStatsUltimo] as number | undefined) ?? 0
    const minAtras = ultimoTs ? Math.floor((agora - ultimoTs) / 60000) : Infinity

    const limiteWarn = tipo === 'page_view' ? 60 : tipo === 'lead' ? 360 : 720
    const status: EventHealth['status'] =
      minAtras === Infinity || minAtras > 1440 ? 'offline'
      : minAtras > limiteWarn ? 'warning'
      : 'online'

    const alert =
      status === 'offline' ? (ultimoTs ? 'Evento parado há mais de 24h — verificar integração' : 'Nenhum evento recebido ainda')
      : status === 'warning' ? 'Intervalo longo — verificar disparo no site'
      : undefined

    let countPeriodo = 0
    for (const stats of porDia.values()) countPeriodo += (stats[tipo as keyof EventStatsDia] as number | undefined) ?? 0
    const countToday = (porDia.get(hojeStr)?.[tipo as keyof EventStatsDia] as number | undefined) ?? 0

    return {
      id: tipo,
      ...EVENTO_META[tipo],
      status,
      lastFired: ultimoTs ? tempoRelativo(ultimoTs) : '—',
      lastFiredAgo: minAtras === Infinity ? 99999 : minAtras,
      countToday,
      countPeriodo,
      periodoLabel,
      alert,
    }
  })
}

// ── Volume por dia (últimos 7 dias) ──────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Métricas diárias de mídia paga — subset estrutural comum ao Meta e Google (checkout/purchase). */
interface MidiaPagaDia { checkout: number; purchase: number }

export interface FallbackMidiaPaga {
  /** true = cliente tem e-commerce conectado (webhook configurado) — eventos do site são a fonte, sem fallback */
  ecommerceConectado: boolean
  metaPorDia?: Map<string, MidiaPagaDia>
  googlePorDia?: Map<string, MidiaPagaDia>
}

export function agregarVolume7Dias(
  eventos: Evento[],
  janela: JanelaPeriodo | number = 7,
  fallback?: FallbackMidiaPaga,
  ga4?: { porDia: Map<string, number> },
) {
  const range: JanelaPeriodo = typeof janela === 'number'
    ? { start: new Date(Date.now() - janela * DIA_MS), end: new Date() }
    : janela

  const corte = new Date(range.start).setHours(0, 0, 0, 0)
  const ateFim = new Date(range.end).setHours(23, 59, 59, 999)
  const totalDias = Math.max(1, Math.round((ateFim - corte) / DIA_MS) + 1)
  const agrupaPorSemana = totalDias > MAX_PONTOS_SERIE
  const passoMs = agrupaPorSemana ? 7 * DIA_MS : DIA_MS
  const usaFallback = fallback && !fallback.ecommerceConectado

  const dias: { dia: string; page_view: number; lead: number; checkout: number; compra: number; view_item: number }[] = []
  for (let inicio = corte; inicio <= ateFim; inicio += passoMs) {
    const fim = Math.min(inicio + passoMs, ateFim + 1)
    const doDia = eventos.filter((e) => e.ts >= inicio && e.ts < fim)
    let checkout = doDia.filter((e) => e.tipo === 'checkout').length
    let compra = doDia.filter((e) => e.tipo === 'compra').length

    // Sem e-commerce conectado, o site não tem como reportar checkout/compra
    // reais — usa o que Meta/Google Ads reportaram de conversão nesses dias
    // como aproximação (prioriza sempre o dado real do e-commerce quando existe).
    if (usaFallback) {
      for (let d = inicio; d < fim; d += DIA_MS) {
        const key = toYMD(new Date(d))
        checkout += (fallback!.metaPorDia?.get(key)?.checkout ?? 0) + (fallback!.googlePorDia?.get(key)?.checkout ?? 0)
        compra   += (fallback!.metaPorDia?.get(key)?.purchase ?? 0) + (fallback!.googlePorDia?.get(key)?.purchase ?? 0)
      }
    }

    // GA4 prevalece sobre o snippet pro page_view (nunca soma — troca a fonte,
    // mesma regra de agregarSaudeEventos). Cada ponto do gráfico já é um dia
    // fechado, então não tem o problema de atraso do GA4 que existe pro "Hoje".
    const pageView = ga4 ? somarPeriodoMap(ga4.porDia, inicio, fim - 1) : doDia.filter((e) => e.tipo === 'page_view').length

    dias.push({
      // Nome de dia da semana ("Ter", "Qua"...) só é seguro pra janelas de
      // até 7 dias -- em janelas maiores ele se repete (ex: 30 dias tem
      // "Qua" umas 4 vezes), e o Recharts confunde os pontos duplicados
      // no hover, mostrando o tooltip errado (achado ao vivo testando com
      // o Gabriel: parava num pico alto e o tooltip mostrava "0" de um dia
      // completamente diferente). dd/mm é sempre único.
      dia: totalDias > 7
        ? `${new Date(inicio).getDate().toString().padStart(2, '0')}/${(new Date(inicio).getMonth() + 1).toString().padStart(2, '0')}`
        : DIAS_SEMANA[new Date(inicio).getDay()],
      page_view: pageView,
      lead:      doDia.filter((e) => e.tipo === 'lead').length,
      checkout,
      compra,
      view_item: doDia.filter((e) => e.tipo === 'view_item').length,
    })
  }
  return dias
}

// Mesmo resultado de agregarVolume7Dias (mesma regra de fallback pra mídia
// paga e agrupamento por semana em janelas longas), lendo o contador
// agregado em vez de escanear eventos crus por dia.
export function agregarVolume7DiasDeStats(
  porDia: Map<string, EventStatsDia>,
  janela: JanelaPeriodo | number = 7,
  fallback?: FallbackMidiaPaga,
  ga4?: { porDia: Map<string, number> },
) {
  const range: JanelaPeriodo = typeof janela === 'number'
    ? { start: new Date(Date.now() - janela * DIA_MS), end: new Date() }
    : janela

  const corte = new Date(range.start).setHours(0, 0, 0, 0)
  const ateFim = new Date(range.end).setHours(23, 59, 59, 999)
  const totalDias = Math.max(1, Math.round((ateFim - corte) / DIA_MS) + 1)
  const agrupaPorSemana = totalDias > MAX_PONTOS_SERIE
  const passoMs = agrupaPorSemana ? 7 * DIA_MS : DIA_MS
  const usaFallback = fallback && !fallback.ecommerceConectado

  const dias: { dia: string; page_view: number; lead: number; checkout: number; compra: number; view_item: number }[] = []
  for (let inicio = corte; inicio <= ateFim; inicio += passoMs) {
    const fim = Math.min(inicio + passoMs, ateFim + 1)
    let checkout = 0, compra = 0, lead = 0, pageView = 0, viewItem = 0
    for (let d = inicio; d < fim; d += DIA_MS) {
      const stats = porDia.get(toYMD(new Date(d)))
      checkout += stats?.checkout ?? 0
      compra += stats?.compra ?? 0
      lead += stats?.lead ?? 0
      viewItem += stats?.view_item ?? 0
      pageView += stats?.page_view ?? 0
    }

    if (usaFallback) {
      for (let d = inicio; d < fim; d += DIA_MS) {
        const key = toYMD(new Date(d))
        checkout += (fallback!.metaPorDia?.get(key)?.checkout ?? 0) + (fallback!.googlePorDia?.get(key)?.checkout ?? 0)
        compra   += (fallback!.metaPorDia?.get(key)?.purchase ?? 0) + (fallback!.googlePorDia?.get(key)?.purchase ?? 0)
      }
    }

    // GA4 prevalece sobre o snippet pro page_view, mesma regra de agregarVolume7Dias.
    if (ga4) pageView = somarPeriodoMap(ga4.porDia, inicio, fim - 1)

    dias.push({
      dia: totalDias > 7
        ? `${new Date(inicio).getDate().toString().padStart(2, '0')}/${(new Date(inicio).getMonth() + 1).toString().padStart(2, '0')}`
        : DIAS_SEMANA[new Date(inicio).getDay()],
      page_view: pageView,
      lead,
      checkout,
      compra,
      view_item: viewItem,
    })
  }
  return dias
}

// ── % por origem ──────────────────────────────────────────────────────────────
export function agregarPorOrigem(eventos: Evento[]) {
  const contagem = new Map<string, number>()
  for (const e of eventos) {
    const label = ORIGEM_LABEL[e.origem] ?? 'Outro'
    contagem.set(label, (contagem.get(label) ?? 0) + 1)
  }
  const total = eventos.length || 1
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: ORIGEM_COR[name] ?? '#6B7280',
    }))
}

// ── Heatmap de páginas ────────────────────────────────────────────────────────
export function agregarPaginas(eventos: Evento[]): PageHeatEntry[] {
  const porPagina = new Map<string, { events: number; leads: number; compras: number }>()
  for (const e of eventos) {
    const page = e.pagina || '/'
    const atual = porPagina.get(page) ?? { events: 0, leads: 0, compras: 0 }
    atual.events++
    if (e.tipo === 'lead') atual.leads++
    if (e.tipo === 'compra') atual.compras++
    porPagina.set(page, atual)
  }
  const lista = [...porPagina.entries()].sort((a, b) => b[1].events - a[1].events).slice(0, 10)
  const max = lista[0]?.[1].events || 1
  return lista.map(([page, c]) => ({
    page, ...c, pct: Math.round((c.events / max) * 100),
  }))
}

// ── Logs por tipo (drill-down) ────────────────────────────────────────────────
export function agregarLogs(eventos: Evento[]): Record<string, EventLogItem[]> {
  const out: Record<string, EventLogItem[]> = { page_view: [], lead: [], checkout: [], compra: [], view_item: [] }
  for (const e of eventos.slice(0, 400)) {
    if (!out[e.tipo]) continue
    if (out[e.tipo].length >= 12) continue
    out[e.tipo].push({
      id: e.id ?? String(e.ts),
      hora: new Date(e.ts).toLocaleTimeString('pt-BR'),
      origem: ORIGEM_LABEL[e.origem] ?? 'Outro',
      pagina: e.pagina || e.url || '—',
      valor: e.valor ? `R$${e.valor.toFixed(2).replace('.', ',')}` : undefined,
      produto: e.produto,
      dispositivo: e.dispositivo ? e.dispositivo[0].toUpperCase() + e.dispositivo.slice(1) : '—',
    })
  }
  return out
}

// ── Jornada: identidade + eventos → shape da tela ────────────────────────────
export function identidadeParaUsuarioJornada(ident: Identidade, eventos: Evento[]): UsuarioJornada {
  const meus = eventos
    .filter((e) => e.visitorId === ident.id)
    .sort((a, b) => a.ts - b.ts)

  const email = ident.emails[0] ?? ''
  const emailMasked = email
    ? email.slice(0, 2) + '***@' + (email.split('@')[1] ?? '')
    : `visitante ${String(ident.id).slice(0, 6)}`

  const status: UsuarioJornada['status'] =
    ident.status === 'cliente' ? 'converteu'
    : ident.status === 'checkout' ? 'checkout-abandonado'
    : ident.status === 'visitante' ? 'engajado'
    : 'lead'

  const evsJornada: EventoJornada[] = meus.map((e, i) => ({
    id: e.id ?? `e${i}`,
    tipo: e.tipo === 'custom' ? 'page_view' : e.tipo,
    data: new Date(e.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    hora: new Date(e.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    plataforma: e.origem === 'meta' ? 'Meta' : e.origem === 'google' ? 'Google' : undefined,
    campanha: e.utm?.campaign,
    conjunto: e.utmParsed?.conjunto
      ? [e.utmParsed.conjunto.posicionamento, e.utmParsed.conjunto.segmentacao, e.utmParsed.conjunto.detalhe].filter(Boolean).join('_') || undefined
      : undefined,
    anuncio: e.utmParsed?.anuncio
      ? [e.utmParsed.anuncio.formato, e.utmParsed.anuncio.detalhe].filter(Boolean).join('_') || undefined
      : undefined,
    pagina: e.pagina,
    produto: e.produto,
    valor: e.valor,
    email: e.dados?.email,
    telefone: e.dados?.telefone,
    fbp: e.ids.fbp,
    fbc: e.ids.fbc,
    gclid: e.ids.gclid,
    janelaMeta: ident.ultimoCliqueMeta ? e.ts - ident.ultimoCliqueMeta <= 7 * DIA_MS : undefined,
    atribuicao: ident.atribuicao?.plataforma,
  }))

  return {
    id: String(ident.id),
    email,
    emailMasked,
    status,
    valor: ident.valorTotal > 0 ? ident.valorTotal : undefined,
    eventos: evsJornada,
    cookies: {
      fbp: ident.fbps[0],
      fbc: ident.fbcs[0],
      gclid: ident.gclids[0],
      wbraid: ident.wbraids[0],
      gbraid: ident.gbraids[0],
    },
    dados: {
      email,
      telefone: ident.telefones[0],
      cidade: ident.geo?.cidade,
      estado: ident.geo?.estado,
      ip: ident.ips[0],
      userAgent: ident.userAgent,
    },
    atribuicaoFinal: {
      plataforma: ident.atribuicao?.plataforma ?? 'Não atribuído',
      janela: ident.atribuicao?.janela ?? '—',
    },
  }
}

// identidadesParaGeo mudou pra lib/data/geo-mapa.ts — importar direto de lá
// (isolado porque carrega uma base de ~200KB de coordenadas de municípios;
// reexportar daqui arriscaria puxar esse peso pra toda página que usa
// qualquer outra função deste arquivo).

// ── Performance: KPIs e séries por template ──────────────────────────────────
export function agregarPerformance(eventos: Evento[], janela: JanelaPeriodo | number = 30) {
  const agora = new Date()
  const range: JanelaPeriodo = typeof janela === 'number'
    ? { start: new Date(Date.now() - janela * DIA_MS), end: agora }
    : janela

  const corte = new Date(range.start).setHours(0, 0, 0, 0)
  const ateFim = new Date(range.end).setHours(23, 59, 59, 999)
  const periodo = eventos.filter((e) => e.ts >= corte && e.ts <= ateFim)

  const compras = periodo.filter((e) => e.tipo === 'compra')
  const leads = periodo.filter((e) => e.tipo === 'lead')
  const checkouts = periodo.filter((e) => e.tipo === 'checkout')
  const views = periodo.filter((e) => e.tipo === 'page_view')

  const receita = compras.reduce((s, e) => s + (e.valor ?? 0), 0)

  // Série ao longo do período — um ponto por dia, ou por semana quando o
  // período é longo demais pra caber em pontos diários legíveis.
  const totalDias = Math.max(1, Math.round((ateFim - corte) / DIA_MS) + 1)
  const agrupaPorSemana = totalDias > MAX_PONTOS_SERIE
  const passoMs = agrupaPorSemana ? 7 * DIA_MS : DIA_MS

  const diario: { dia: string; dataISO: string; investimento: number; receita: number; roas: number; leads: number; cpl: number; contatos: number; cpm: number }[] = []
  for (let inicio = corte; inicio <= ateFim; inicio += passoMs) {
    const fim = Math.min(inicio + passoMs, ateFim + 1)
    const doPeriodo = periodo.filter((e) => e.ts >= inicio && e.ts < fim)
    const dataInicio = new Date(inicio)
    diario.push({
      // Mesmo motivo do agregarVolume7Dias: nome de dia da semana só é
      // único até 7 dias -- em janelas maiores, dd/mm evita o Recharts
      // confundir pontos duplicados no hover.
      dia: totalDias > 7
        ? `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')}`
        : DIAS_SEMANA[dataInicio.getDay()],
      // Início do bucket em YYYY-MM-DD — usado pra casar com gasto real de
      // ads (buscado por data), já que `dia` é só o rótulo de exibição.
      dataISO: dataInicio.toISOString().slice(0, 10),
      investimento: 0, // preenchido pelo caller quando há conexão de Ads
      receita: doPeriodo.filter((e) => e.tipo === 'compra').reduce((s, e) => s + (e.valor ?? 0), 0),
      roas: 0,
      leads: doPeriodo.filter((e) => e.tipo === 'lead').length,
      cpl: 0,
      contatos: doPeriodo.filter((e) => e.tipo === 'lead').length,
      cpm: 0,
    })
  }

  // Top produtos
  const porProduto = new Map<string, { vendas: number; receita: number }>()
  for (const c of compras) {
    if (!c.produto) continue
    const p = porProduto.get(c.produto) ?? { vendas: 0, receita: 0 }
    p.vendas++
    p.receita += c.valor ?? 0
    porProduto.set(c.produto, p)
  }
  const topProdutos = [...porProduto.entries()]
    .sort((a, b) => b[1].receita - a[1].receita).slice(0, 5)
    .map(([nome, p]) => ({ nome, ...p }))

  // Recentes (compras e leads)
  const recentes = periodo
    .filter((e) => e.tipo === 'compra' || e.tipo === 'lead')
    .slice(0, 8)
    .map((e) => ({
      nome: e.dados?.nome ?? e.dados?.email?.split('@')[0] ?? 'Visitante',
      origem: ORIGEM_LABEL[e.origem] ?? 'Outro',
      campanha: e.utm?.campaign ?? '—',
      valor: e.valor,
      status: e.tipo === 'compra' ? 'vendeu' : 'lead',
      data: new Date(e.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }))

  const pct = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 100) : 0)

  return {
    kpis: {
      investimento: 0, // aguarda conexão com APIs de ads
      receita,
      roas: 0,
      ticketMedio: compras.length ? Math.round(receita / compras.length) : 0,
      totalCompras: compras.length,
      taxaAbandono: checkouts.length ? Math.round(((checkouts.length - compras.length) / checkouts.length) * 100) : 0,
      totalLeads: leads.length,
      cpl: 0,
      taxaConversao: views.length ? Math.round((leads.length / views.length) * 1000) / 10 : 0,
      totalEventos: periodo.length,
    },
    diario,
    // Largura de cada bucket de `diario`, em dias — 1 (diário) ou 7 (semanal
    // em períodos longos). O caller usa isso pra somar gasto real de ads por
    // bucket a partir de `dataISO`.
    passoDias: agrupaPorSemana ? 7 : 1,
    funil: [
      { label: 'Visitou',  count: views.length,     pct: 100,                              color: '#3B82F6' },
      { label: 'Lead',     count: leads.length,     pct: pct(leads.length, views.length),  color: '#F59E0B' },
      { label: 'Checkout', count: checkouts.length, pct: pct(checkouts.length, views.length), color: '#8B5CF6' },
      { label: 'Comprou',  count: compras.length,   pct: pct(compras.length, views.length), color: '#10B981' },
    ],
    canais: agregarPorOrigem(periodo),
    topProdutos,
    recentes,
  }
}

// ── Alertas determinísticos (matéria-prima do agente) ─────────────────────────
export interface Alerta {
  tipo: string
  titulo: string
  corpo: string
  severidade: 'info' | 'atencao' | 'critico'
}

export function gerarAlertas(eventos: Evento[], tipoCliente?: PartnerTipo): Alerta[] {
  const alertas: Alerta[] = []
  if (eventos.length === 0) return alertas

  const saude = agregarSaudeEventos(eventos, undefined, tipoCliente)
  for (const s of saude) {
    if (s.status === 'offline' && s.countPeriodo > 0) {
      alertas.push({
        tipo: 'evento-parado',
        titulo: `Evento "${s.label}" parado`,
        corpo: `Último disparo ${s.lastFired}. Verificar integração no site.`,
        severidade: 'critico',
      })
    }
  }

  const comUtm = eventos.filter((e) => e.utm?.campaign)
  const foraDoPadrao = comUtm.filter((e) => e.utmParsed && !e.utmParsed.padraoV4)
  if (comUtm.length >= 10 && foraDoPadrao.length / comUtm.length > 0.1) {
    alertas.push({
      tipo: 'utm-fora-padrao',
      titulo: `${Math.round((foraDoPadrao.length / comUtm.length) * 100)}% das UTMs fora do padrão V4`,
      corpo: `${foraDoPadrao.length} de ${comUtm.length} eventos com UTM chegaram fora da nomenclatura V4. Ver aba UTMs → Detectadas.`,
      severidade: 'atencao',
    })
  }

  const semIds = eventos.filter((e) => !e.ids.fbp && !e.ids.fbc && !e.ids.gclid && !e.ids.gaClientId)
  if (eventos.length >= 20 && semIds.length / eventos.length > 0.5) {
    alertas.push({
      tipo: 'poucos-sinais',
      titulo: 'Mais da metade dos eventos sem sinais de atribuição',
      corpo: `${Math.round((semIds.length / eventos.length) * 100)}% dos eventos chegaram sem fbp/fbc/gclid/ga_client_id — match rate do CAPI vai sofrer.`,
      severidade: 'atencao',
    })
  }

  return alertas
}

// ── Growth Pack (Gestor de Mídia) ──────────────────────────────────────────────
// Funil varia por tipo de cliente: 'ecommerce' segue Sessões→Cart→Checkout→
// Purchase; 'leadsFunil' (usado tanto por tipo 'leads' quanto 'mensagens', que
// reaproveita a mesma planilha por enquanto) segue Alcance→Clique→Leads→MQL→
// SQL→Vendas. Alguns campos não têm evento correspondente ainda (Add to Cart
// no e-commerce; MQL/SQL nos dois outros tipos) — ficam marcados como 'manual'
// no config de colunas e são só mesclados aqui, não calculados.
export type GrowthPackFunil = 'ecommerce' | 'leadsFunil'
export type GrowthPackCanal = 'geral' | 'meta' | 'google'

export interface MetricasAdsMes {
  spend: number; reach: number; clicks: number
  sessoes: number; addToCart: number; checkout: number; purchase: number; faturamento: number
}
export interface MetricasAdsMesGoogle {
  spend: number; impressions: number; clicks: number
  addToCart: number; checkout: number; purchase: number; faturamento: number
}

export interface GrowthPackLinhaMes {
  mes: string   // 'AAAA-MM'
  label: string // 'Janeiro' etc
  realizado: Record<string, number>
  // true quando o canal 'geral' inclui algum valor de funil vindo do Meta ou
  // Google (não só do site) — 'geral' SOMA site + Meta + Google (decisão do
  // usuário), o que pode contar a mesma conversão mais de uma vez se ela foi
  // atribuída por mais de uma plataforma. Este flag só avisa que a soma
  // inclui dado de Ads, não corrige a sobreposição.
  estimativaAds?: boolean
}

const MESES_PT_LONGO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const ADS_MES_ZERADO: MetricasAdsMes = { spend: 0, reach: 0, clicks: 0, sessoes: 0, addToCart: 0, checkout: 0, purchase: 0, faturamento: 0 }
const ADS_MES_ZERADO_GOOGLE: MetricasAdsMesGoogle = { spend: 0, impressions: 0, clicks: 0, addToCart: 0, checkout: 0, purchase: 0, faturamento: 0 }

function somarMes<T extends object>(porDia: Map<string, T> | undefined, inicioMes: Date, fimMes: Date, zerado: T): T {
  const total: Record<string, number> = { ...zerado } as unknown as Record<string, number>
  if (porDia) {
    for (let d = new Date(inicioMes); d < fimMes; d.setDate(d.getDate() + 1)) {
      const dia = porDia.get(d.toISOString().slice(0, 10)) as unknown as Record<string, number> | undefined
      if (!dia) continue
      for (const k of Object.keys(total)) total[k] += dia[k] ?? 0
    }
  }
  return total as unknown as T
}

// Calcula uma linha (Geral/Meta/Google, funil por tipo) pra um intervalo de
// datas arbitrário — usado tanto por mês (12 chamadas) quanto pro total do
// ano (1 chamada). É importante ser UMA chamada por total, e não a soma de
// 12 chamadas mensais: como 'geral' usa o MAIOR valor entre fontes (não
// soma, pra não duplicar conversão contada por Meta e Google ao mesmo
// tempo), somar 12 máximos mensais pode passar do máximo anual de qualquer
// canal isolado (ex: Meta vence em Jan, Google vence em Fev — a soma dos
// dois "vencedores" mensais pode superar o total anual de cada um).
// Interseção entre dois intervalos [start, endExclusive) — usada pra recortar
// cada mês do Growth Pack pelo período universal compartilhado (7/30/90
// dias, personalizado). Se não houver sobreposição, retorna um intervalo de
// largura zero (produz dado zerado, não quebra a conta).
function intersecaoIntervalos(aStart: Date, aEnd: Date, filtro?: JanelaPeriodo): [Date, Date] {
  if (!filtro) return [aStart, aEnd]
  const fStart = new Date(filtro.start).setHours(0, 0, 0, 0)
  const fEnd = new Date(filtro.end).setHours(23, 59, 59, 999) + 1 // exclusivo
  const start = Math.max(aStart.getTime(), fStart)
  const end = Math.min(aEnd.getTime(), fEnd)
  return end > start ? [new Date(start), new Date(end)] : [new Date(start), new Date(start)]
}

function calcularLinhaGrowthPack(
  doCanal: Evento[],
  inicio: Date,
  fim: Date,
  funil: GrowthPackFunil,
  canal: GrowthPackCanal,
  metaAdsPorDia: Map<string, MetricasAdsMes> | undefined,
  googleAdsPorDia: Map<string, MetricasAdsMesGoogle> | undefined,
): { realizado: Record<string, number>; estimativaAds: boolean } {
  const usaMeta = canal === 'geral' || canal === 'meta'
  const usaGoogle = canal === 'geral' || canal === 'google'

  const doPeriodo = doCanal.filter((e) => e.ts >= inicio.getTime() && e.ts < fim.getTime())
  const metaTotal = somarMes(metaAdsPorDia, inicio, fim, ADS_MES_ZERADO)
  const googleTotal = somarMes(googleAdsPorDia, inicio, fim, ADS_MES_ZERADO_GOOGLE)

  // Investimento/alcance/cliques são aditivos de verdade (gasto no Meta e
  // no Google são reais e distintos) — soma sem risco de duplicar.
  let investimento = 0, alcance = 0, cliques = 0
  if (usaMeta)   { investimento += metaTotal.spend;   alcance += metaTotal.reach;        cliques += metaTotal.clicks }
  if (usaGoogle) { investimento += googleTotal.spend; alcance += googleTotal.impressions; cliques += googleTotal.clicks }

  const views = doPeriodo.filter((e) => e.tipo === 'page_view').length
  const leads = doPeriodo.filter((e) => e.tipo === 'lead').length
  const checkoutsSite = doPeriodo.filter((e) => e.tipo === 'checkout').length
  const comprasSite = doPeriodo.filter((e) => e.tipo === 'compra')
  const faturamentoSite = comprasSite.reduce((s, e) => s + (e.valor ?? 0), 0)

  let realizado: Record<string, number>
  let estimativaAds = false

  if (funil === 'ecommerce') {
    let sessoes: number, addToCart: number, checkout: number, purchase: number, faturamento: number
    if (canal === 'meta') {
      sessoes = metaTotal.sessoes; addToCart = metaTotal.addToCart; checkout = metaTotal.checkout
      purchase = metaTotal.purchase; faturamento = metaTotal.faturamento
    } else if (canal === 'google') {
      sessoes = googleTotal.clicks // Google não tem um equivalente validado a landing_page_view — cliques é a aproximação disponível
      addToCart = googleTotal.addToCart; checkout = googleTotal.checkout
      purchase = googleTotal.purchase; faturamento = googleTotal.faturamento
    } else {
      // 'geral' — soma site + Meta + Google (decisão explícita do usuário:
      // prioriza ver o total consolidado do período em vez de proteger
      // contra dupla contagem entre plataformas — risco aceito).
      sessoes = views + metaTotal.sessoes + googleTotal.clicks
      addToCart = metaTotal.addToCart + googleTotal.addToCart
      checkout = checkoutsSite + metaTotal.checkout + googleTotal.checkout
      purchase = comprasSite.length + metaTotal.purchase + googleTotal.purchase
      faturamento = faturamentoSite + metaTotal.faturamento + googleTotal.faturamento
      estimativaAds = metaTotal.checkout + metaTotal.purchase + googleTotal.checkout + googleTotal.purchase > 0
    }
    realizado = {
      investimento, alcance,
      sessoes, addToCart, checkout, purchase, faturamento,
      roas: investimento > 0 ? faturamento / investimento : 0,
      cps: sessoes > 0 ? investimento / sessoes : 0,
    }
  } else {
    // Leads/Mensagens: mantém só o que já vinha do site — ainda não
    // validamos um equivalente confiável de lead/venda direto do Meta ou
    // Google pra evitar inventar número sem checar antes.
    realizado = {
      investimento, alcance, clique: cliques,
      leads,
      vendas: comprasSite.length,
      faturamento: faturamentoSite,
      roas: investimento > 0 ? faturamentoSite / investimento : 0,
      cpl: leads > 0 ? investimento / leads : 0,
    }
  }

  return { realizado, estimativaAds }
}

export function agregarGrowthPackAno(
  eventos: Evento[],
  ano: number,
  funil: GrowthPackFunil,
  canal: GrowthPackCanal,
  metaAdsPorDia?: Map<string, MetricasAdsMes>,
  googleAdsPorDia?: Map<string, MetricasAdsMesGoogle>,
  // Período universal compartilhado (o mesmo seletor de Performance/Eventos)
  // — cada mês é recortado pela interseção com esse período, então "Últimos
  // 7 dias" zera todos os meses fora da janela em vez de mostrar o ano
  // inteiro sem filtro nenhum.
  filtro?: JanelaPeriodo,
): GrowthPackLinhaMes[] {
  const doCanal = canal === 'geral' ? eventos : eventos.filter((e) => e.origem === canal)

  const linhas: GrowthPackLinhaMes[] = []
  for (let mes = 0; mes < 12; mes++) {
    const [inicioMes, fimMes] = intersecaoIntervalos(new Date(ano, mes, 1), new Date(ano, mes + 1, 1), filtro)
    const { realizado, estimativaAds } = calcularLinhaGrowthPack(doCanal, inicioMes, fimMes, funil, canal, metaAdsPorDia, googleAdsPorDia)

    linhas.push({
      mes: `${ano}-${String(mes + 1).padStart(2, '0')}`,
      label: MESES_PT_LONGO[mes],
      realizado,
      estimativaAds,
    })
  }
  return linhas
}

/** Total do ano calculado de uma vez (não é a soma das 12 linhas mensais) —
 * essencial pro canal 'geral', onde somar 12 máximos mensais já-deduplicados
 * pode estourar o máximo anual de qualquer canal isolado. Também recortado
 * pelo período universal compartilhado, igual às linhas mensais. */
export function agregarGrowthPackTotalAno(
  eventos: Evento[],
  ano: number,
  funil: GrowthPackFunil,
  canal: GrowthPackCanal,
  metaAdsPorDia?: Map<string, MetricasAdsMes>,
  googleAdsPorDia?: Map<string, MetricasAdsMesGoogle>,
  filtro?: JanelaPeriodo,
): Record<string, number> {
  const doCanal = canal === 'geral' ? eventos : eventos.filter((e) => e.origem === canal)
  const [inicio, fim] = intersecaoIntervalos(new Date(ano, 0, 1), new Date(ano + 1, 0, 1), filtro)
  return calcularLinhaGrowthPack(doCanal, inicio, fim, funil, canal, metaAdsPorDia, googleAdsPorDia).realizado
}
