// ─── MONTAGEM DE PAYLOADS DE CONVERSÃO ───────────────────────────────────────
// Formata eventos lead/compra nos payloads finais de Meta CAPI e Google
// Enhanced Conversions. A fila fica em clientes/{id}/conversoes com status
// "aguardando-conexao" até existirem credenciais.
// Somente servidor (usa node:crypto).

import { createHash } from 'crypto'
import type { Evento, Conversao } from '@/lib/types'

export function sha256(valor: string): string {
  return createHash('sha256').update(valor.trim().toLowerCase()).digest('hex')
}

export function normalizarTelefone(tel: string): string {
  const digitos = tel.replace(/\D/g, '')
  // Enhanced/CAPI esperam E.164 — assume Brasil quando sem código do país
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

/** 0–10 — estimativa de qualidade de match pelos sinais presentes */
export function estimarMatchQuality(e: Evento): number {
  let score = 0
  if (e.dados?.email) score += 3
  if (e.dados?.telefone) score += 2
  if (e.ids.fbc) score += 2
  if (e.ids.fbp) score += 1
  if (e.ids.gclid) score += 3
  if (e.geo?.ip && e.userAgent) score += 1
  return Math.min(10, score)
}

const NOME_EVENTO_CAPI: Record<string, string> = {
  lead: 'Lead',
  checkout: 'InitiateCheckout',
  compra: 'Purchase',
}

export function montarPayloadMetaCAPI(e: Evento): Record<string, unknown> {
  const userData: Record<string, unknown> = {}
  if (e.dados?.email)    userData.em = [sha256(e.dados.email)]
  if (e.dados?.telefone) userData.ph = [sha256(normalizarTelefone(e.dados.telefone))]
  if (e.geo?.ip)         userData.client_ip_address = e.geo.ip
  if (e.userAgent)       userData.client_user_agent = e.userAgent
  if (e.ids.fbp)         userData.fbp = e.ids.fbp
  if (e.ids.fbc)         userData.fbc = e.ids.fbc

  const payload: Record<string, unknown> = {
    event_name: NOME_EVENTO_CAPI[e.tipo] ?? e.tipo,
    event_time: Math.floor(e.ts / 1000),
    action_source: 'website',
    event_source_url: e.url,
    user_data: userData,
  }
  if (e.valor) payload.custom_data = { currency: 'BRL', value: e.valor }
  return payload
}

export function montarPayloadGoogleEnhanced(e: Evento): Record<string, unknown> {
  const userIdentifiers: Record<string, string>[] = []
  if (e.dados?.email)    userIdentifiers.push({ hashed_email: sha256(e.dados.email) })
  if (e.dados?.telefone) userIdentifiers.push({ hashed_phone_number: sha256(normalizarTelefone(e.dados.telefone)) })

  return {
    gclid: e.ids.gclid ?? null,
    wbraid: e.ids.wbraid ?? null,
    gbraid: e.ids.gbraid ?? null,
    conversion_date_time: new Date(e.ts).toISOString(),
    conversion_value: e.valor ?? null,
    currency_code: 'BRL',
    user_identifiers: userIdentifiers,
  }
}

/** Cria os docs de conversão pendentes para um evento lead/checkout/compra. */
export function montarConversoes(e: Evento, eventoId: string): Omit<Conversao, 'id'>[] {
  if (!['lead', 'checkout', 'compra'].includes(e.tipo)) return []
  const matchQuality = estimarMatchQuality(e)
  const base = {
    evento: e.tipo,
    eventoId,
    visitorId: e.visitorId,
    status: 'aguardando-conexao' as const,
    matchQuality,
    tentativas: 0,
    ts: e.ts,
  }

  const out: Omit<Conversao, 'id'>[] = [
    { ...base, plataforma: 'meta-capi', payload: montarPayloadMetaCAPI(e) },
  ]
  // Google Enhanced só faz sentido com click id do Google ou identificadores de usuário
  if (e.ids.gclid || e.ids.wbraid || e.ids.gbraid || e.dados?.email || e.dados?.telefone) {
    out.push({ ...base, plataforma: 'google-enhanced', payload: montarPayloadGoogleEnhanced(e) })
  }
  return out
}
