// ─── AGREGAÇÕES ───────────────────────────────────────────────────────────────
// Transformam eventos/identidades brutos do Firestore nos formatos que as telas
// já consomem (mesmos shapes dos dados demo).

import type { Evento, EventoTipo, Identidade, Origem } from '@/lib/types'
import type { EventHealth, EventLogItem, PageHeatEntry } from '@/lib/demo-data-tracking'
import type { UsuarioJornada, EventoJornada, LeadGeo } from '@/lib/demo-data'

const DIA_MS = 24 * 60 * 60 * 1000

export const ORIGEM_LABEL: Record<Origem, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  organico: 'Orgânico',
  direto: 'Direto',
  email: 'Email',
  shopify: 'Shopify',
  outro: 'Outro',
}

const ORIGEM_COR: Record<string, string> = {
  'Meta Ads': '#1877F2', 'Google Ads': '#4285F4', 'Orgânico': '#10B981',
  'Direto': '#6B7280', 'Email': '#F59E0B', 'Shopify': '#96BF48', 'Outro': '#8B5CF6',
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

// ── Saúde dos eventos ─────────────────────────────────────────────────────────
export function agregarSaudeEventos(eventos: Evento[]): EventHealth[] {
  const agora = Date.now()
  const inicioHoje = new Date().setHours(0, 0, 0, 0)
  const inicioSemana = agora - 7 * DIA_MS

  return (['page_view', 'lead', 'checkout', 'compra'] as EventoTipo[]).map((tipo) => {
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

    return {
      id: tipo,
      ...EVENTO_META[tipo],
      status,
      lastFired: ultimo ? tempoRelativo(ultimo) : '—',
      lastFiredAgo: minAtras === Infinity ? 99999 : minAtras,
      countToday: doTipo.filter((e) => e.ts >= inicioHoje).length,
      countWeek: doTipo.filter((e) => e.ts >= inicioSemana).length,
      alert,
    }
  })
}

// ── Volume por dia (últimos 7 dias) ──────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function agregarVolume7Dias(eventos: Evento[]) {
  const dias: { dia: string; page_view: number; lead: number; checkout: number; compra: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const inicio = new Date(Date.now() - i * DIA_MS).setHours(0, 0, 0, 0)
    const fim = inicio + DIA_MS
    const doDia = eventos.filter((e) => e.ts >= inicio && e.ts < fim)
    dias.push({
      dia: DIAS_SEMANA[new Date(inicio).getDay()],
      page_view: doDia.filter((e) => e.tipo === 'page_view').length,
      lead:      doDia.filter((e) => e.tipo === 'lead').length,
      checkout:  doDia.filter((e) => e.tipo === 'checkout').length,
      compra:    doDia.filter((e) => e.tipo === 'compra').length,
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
  const out: Record<string, EventLogItem[]> = { page_view: [], lead: [], checkout: [], compra: [] }
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

// ── Mapa: identidades → pontos geo ────────────────────────────────────────────
// Coordenadas aproximadas por capital de estado (fallback quando não há lat/lng)
const COORD_ESTADO: Record<string, [number, number]> = {
  AC: [-9.98, -67.81], AL: [-9.65, -35.71], AP: [0.03, -51.05], AM: [-3.12, -60.02],
  BA: [-12.97, -38.50], CE: [-3.73, -38.53], DF: [-15.78, -47.93], ES: [-20.32, -40.34],
  GO: [-16.69, -49.26], MA: [-2.53, -44.30], MT: [-15.60, -56.10], MS: [-20.44, -54.65],
  MG: [-19.92, -43.93], PA: [-1.46, -48.49], PB: [-7.12, -34.86], PR: [-25.43, -49.27],
  PE: [-8.06, -34.88], PI: [-5.09, -42.80], RJ: [-22.91, -43.17], RN: [-5.79, -35.21],
  RS: [-30.03, -51.22], RO: [-8.76, -63.90], RR: [2.82, -60.67], SC: [-27.60, -48.55],
  SP: [-23.55, -46.63], SE: [-10.91, -37.07], TO: [-10.17, -48.33],
}

export function identidadesParaGeo(identidades: Identidade[]): LeadGeo[] {
  return identidades
    .filter((i) => i.geo?.estado || i.geo?.cidade)
    .map((i) => {
      const uf = (i.geo?.estado ?? '').toUpperCase()
      const [lat, lng] = COORD_ESTADO[uf] ?? [-15.78, -47.93]
      // jitter leve para não sobrepor pontos da mesma cidade
      const seed = String(i.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      const status: LeadGeo['status'] =
        i.status === 'cliente' ? 'converteu' : i.status === 'checkout' ? 'checkout-abandonado' : 'lead'
      return {
        id: String(i.id),
        nome: i.nome ?? i.emails[0]?.split('@')[0] ?? 'Visitante',
        email: i.emails[0] ? i.emails[0].slice(0, 2) + '***@' + i.emails[0].split('@')[1] : '—',
        cidade: i.geo?.cidade ?? '—',
        estado: uf || '—',
        ip: i.ips[0] ?? '—',
        lat: lat + ((seed % 20) - 10) * 0.01,
        lng: lng + ((seed % 17) - 8) * 0.01,
        status,
        valor: i.valorTotal > 0 ? i.valorTotal : undefined,
        source: i.atribuicao?.plataforma ?? 'Direto',
        jornada: String(i.id),
      }
    })
}

// ── Performance: KPIs e séries por template ──────────────────────────────────
export function agregarPerformance(eventos: Evento[], dias = 30) {
  const corte = Date.now() - dias * DIA_MS
  const periodo = eventos.filter((e) => e.ts >= corte)

  const compras = periodo.filter((e) => e.tipo === 'compra')
  const leads = periodo.filter((e) => e.tipo === 'lead')
  const checkouts = periodo.filter((e) => e.tipo === 'checkout')
  const views = periodo.filter((e) => e.tipo === 'page_view')

  const receita = compras.reduce((s, e) => s + (e.valor ?? 0), 0)

  // Série diária (7 pontos)
  const diario: { dia: string; investimento: number; receita: number; roas: number; leads: number; cpl: number; contatos: number; cpm: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const inicio = new Date(Date.now() - i * DIA_MS).setHours(0, 0, 0, 0)
    const fim = inicio + DIA_MS
    const doDia = periodo.filter((e) => e.ts >= inicio && e.ts < fim)
    diario.push({
      dia: DIAS_SEMANA[new Date(inicio).getDay()],
      investimento: 0, // vem da API de ads quando conectada
      receita: doDia.filter((e) => e.tipo === 'compra').reduce((s, e) => s + (e.valor ?? 0), 0),
      roas: 0,
      leads: doDia.filter((e) => e.tipo === 'lead').length,
      cpl: 0,
      contatos: doDia.filter((e) => e.tipo === 'lead').length,
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

export function gerarAlertas(eventos: Evento[]): Alerta[] {
  const alertas: Alerta[] = []
  if (eventos.length === 0) return alertas

  const saude = agregarSaudeEventos(eventos)
  for (const s of saude) {
    if (s.status === 'offline' && s.countWeek > 0) {
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
