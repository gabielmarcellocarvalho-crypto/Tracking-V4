// ─── RESOLUÇÃO DE IDENTIDADE ──────────────────────────────────────────────────
// Unifica eventos numa identidade única, independente da janela de atribuição
// das plataformas. Ordem de match:
//   1. v4id (cookie próprio, 13 meses)
//   2. email / telefone (quando o usuário se identifica — lead/compra/CRM)
//   3. fbp (Meta browser id)
//   4. gclid (Google click id)
//   5. IP + user agent (fingerprint fraco — último recurso)
// Usado pelo endpoint de ingestão (/api/track), roda no servidor.

import type { Evento, Identidade, IdentidadeStatus, Toque } from '@/lib/types'
import type { IdentityStore } from '@/lib/tracking/store-types'

const DIA_MS = 24 * 60 * 60 * 1000
export const JANELA_META_MS   = 7 * DIA_MS
export const JANELA_GOOGLE_MS = 90 * DIA_MS

const ORDEM_STATUS: IdentidadeStatus[] = ['visitante', 'lead', 'checkout', 'cliente']

function statusDoEvento(tipo: Evento['tipo']): IdentidadeStatus {
  if (tipo === 'compra') return 'cliente'
  if (tipo === 'checkout') return 'checkout'
  if (tipo === 'lead') return 'lead'
  return 'visitante'
}

function maiorStatus(a: IdentidadeStatus, b: IdentidadeStatus): IdentidadeStatus {
  return ORDEM_STATUS.indexOf(a) >= ORDEM_STATUS.indexOf(b) ? a : b
}

function unir(...listas: (string[] | undefined)[]): string[] {
  const set = new Set<string>()
  for (const l of listas) for (const v of l ?? []) if (v) set.add(v)
  return [...set].slice(0, 50)
}

function novaIdentidade(id: string, agora: number): Identidade {
  return {
    id,
    v4ids: [], fbps: [], fbcs: [], gclids: [], wbraids: [], gbraids: [],
    gaClientIds: [], emails: [], telefones: [], ips: [],
    status: 'visitante',
    valorTotal: 0,
    totalEventos: 0,
    criadoEm: agora,
    atualizadoEm: agora,
  }
}

/** Funde `b` dentro de `a` (a permanece; b é apagado). */
function fundir(a: Identidade, b: Identidade): Identidade {
  return {
    ...a,
    v4ids: unir(a.v4ids, b.v4ids),
    fbps: unir(a.fbps, b.fbps),
    fbcs: unir(a.fbcs, b.fbcs),
    gclids: unir(a.gclids, b.gclids),
    wbraids: unir(a.wbraids, b.wbraids),
    gbraids: unir(a.gbraids, b.gbraids),
    gaClientIds: unir(a.gaClientIds, b.gaClientIds),
    emails: unir(a.emails, b.emails),
    telefones: unir(a.telefones, b.telefones),
    ips: unir(a.ips, b.ips),
    nome: a.nome ?? b.nome,
    status: maiorStatus(a.status, b.status),
    valorTotal: a.valorTotal + b.valorTotal,
    totalEventos: a.totalEventos + b.totalEventos,
    primeiroToque: (a.primeiroToque?.ts ?? Infinity) <= (b.primeiroToque?.ts ?? Infinity)
      ? a.primeiroToque ?? b.primeiroToque
      : b.primeiroToque,
    ultimoToque: (a.ultimoToque?.ts ?? 0) >= (b.ultimoToque?.ts ?? 0)
      ? a.ultimoToque ?? b.ultimoToque
      : b.ultimoToque,
    ultimoCliqueMeta: Math.max(a.ultimoCliqueMeta ?? 0, b.ultimoCliqueMeta ?? 0) || undefined,
    ultimoCliqueGoogle: Math.max(a.ultimoCliqueGoogle ?? 0, b.ultimoCliqueGoogle ?? 0) || undefined,
    geo: a.geo ?? b.geo,
    userAgent: a.userAgent ?? b.userAgent,
    criadoEm: Math.min(a.criadoEm, b.criadoEm),
  }
}

/**
 * Resolve (ou cria) a identidade dona do evento e a atualiza.
 * Retorna o visitorId final — que deve ser gravado no evento.
 */
export async function resolverIdentidade(store: IdentityStore, evento: Evento): Promise<string> {
  const agora = evento.ts || Date.now()
  const { ids, dados, geo } = evento

  // 1..5 — busca na ordem de confiança
  const encontradas: Identidade[] = []
  const buscas: [string, string | undefined][] = [
    ['v4ids', ids.v4id],
    ['emails', dados?.email?.toLowerCase()],
    ['telefones', dados?.telefone?.replace(/\D/g, '') || undefined],
    ['fbps', ids.fbp],
    ['gclids', ids.gclid],
  ]
  for (const [campo, valor] of buscas) {
    const achada = await store.buscarPor(campo, valor)
    if (achada && !encontradas.some((e) => e.id === achada.id)) encontradas.push(achada)
  }
  // fingerprint fraco: só se nada mais achou e não há identificadores fortes
  if (encontradas.length === 0 && !ids.v4id && geo?.ip) {
    const porIp = await store.buscarPor('ips', geo.ip)
    if (porIp && porIp.userAgent && porIp.userAgent === evento.userAgent) encontradas.push(porIp)
  }

  // Merge de identidades duplicadas (evento ligou perfis que eram separados)
  let ident: Identidade
  if (encontradas.length === 0) {
    const novoId = ids.v4id ?? `anon_${agora.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    ident = novaIdentidade(novoId, agora)
  } else {
    ident = encontradas[0]
    for (const outra of encontradas.slice(1)) {
      ident = fundir(ident, outra)
      await store.apagar(String(outra.id))
    }
  }

  // ── Atualiza com o evento atual ──────────────────────────────────────────
  ident.v4ids       = unir(ident.v4ids, ids.v4id ? [ids.v4id] : [])
  ident.fbps        = unir(ident.fbps, ids.fbp ? [ids.fbp] : [])
  ident.fbcs        = unir(ident.fbcs, ids.fbc ? [ids.fbc] : [])
  ident.gclids      = unir(ident.gclids, ids.gclid ? [ids.gclid] : [])
  ident.wbraids     = unir(ident.wbraids, ids.wbraid ? [ids.wbraid] : [])
  ident.gbraids     = unir(ident.gbraids, ids.gbraid ? [ids.gbraid] : [])
  ident.gaClientIds = unir(ident.gaClientIds, ids.gaClientId ? [ids.gaClientId] : [])
  ident.emails      = unir(ident.emails, dados?.email ? [dados.email.toLowerCase()] : [])
  ident.telefones   = unir(ident.telefones, dados?.telefone ? [dados.telefone.replace(/\D/g, '')] : [])
  ident.ips         = unir(ident.ips, geo?.ip ? [geo.ip] : [])
  if (dados?.nome) ident.nome = dados.nome
  if (geo?.cidade || geo?.estado) ident.geo = { ...ident.geo, ...geo }
  if (evento.userAgent) ident.userAgent = evento.userAgent
  if (evento.dispositivo) ident.dispositivo = evento.dispositivo

  ident.status = maiorStatus(ident.status, statusDoEvento(evento.tipo))
  ident.totalEventos += 1
  if (evento.tipo === 'compra' && evento.valor) ident.valorTotal += evento.valor
  ident.atualizadoEm = agora

  // Toques — primeiro/último contato com origem identificada
  const toque: Toque = { ts: agora, origem: evento.origem, campanha: evento.utm?.campaign, utm: evento.utm }
  if (!ident.primeiroToque) ident.primeiroToque = toque
  ident.ultimoToque = toque

  // Cliques atribuíveis — mantêm o relógio das janelas
  if (ids.fbc || (evento.origem === 'meta' && evento.utm?.campaign)) ident.ultimoCliqueMeta = agora
  if (ids.gclid || ids.wbraid || ids.gbraid) ident.ultimoCliqueGoogle = agora

  // Atribuição: último clique válido dentro da janela; Meta 7d > Google 90d por recência
  const metaValido   = ident.ultimoCliqueMeta && agora - ident.ultimoCliqueMeta <= JANELA_META_MS
  const googleValido = ident.ultimoCliqueGoogle && agora - ident.ultimoCliqueGoogle <= JANELA_GOOGLE_MS
  if (metaValido && (!googleValido || ident.ultimoCliqueMeta! >= ident.ultimoCliqueGoogle!)) {
    ident.atribuicao = { plataforma: 'Meta Ads', janela: '7 dias' }
  } else if (googleValido) {
    ident.atribuicao = { plataforma: 'Google Ads', janela: '90 dias' }
  } else if (ident.ultimoCliqueMeta || ident.ultimoCliqueGoogle) {
    // Já teve clique pago mas as janelas expiraram — é aqui que a plataforma
    // continua enxergando o que Meta/Google já "esqueceram"
    ident.atribuicao = {
      plataforma: ident.ultimoCliqueMeta && (ident.ultimoCliqueMeta >= (ident.ultimoCliqueGoogle ?? 0))
        ? 'Meta Ads (janela expirada)' : 'Google Ads (janela expirada)',
      janela: 'expirada',
      foraDaJanelaMeta: true,
    }
  } else {
    ident.atribuicao = {
      plataforma: evento.origem === 'organico' ? 'Orgânico' : evento.origem === 'direto' ? 'Direto' : 'Não atribuído',
      janela: '—',
    }
  }

  const { id, ...payload } = ident
  // Remove undefined (Firestore rejeita)
  const limpo = JSON.parse(JSON.stringify(payload))
  await store.salvar(String(id), limpo)
  return String(id)
}
