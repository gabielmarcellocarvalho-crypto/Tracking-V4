// ─── TIPOS CANÔNICOS — Tracking V4 ───────────────────────────────────────────
// Modelo de dados central da plataforma (Firestore + ingestão + UI)

import type { Timestamp } from 'firebase/firestore'

// ── Cliente ───────────────────────────────────────────────────────────────────
export type ClienteTipo   = 'ecommerce' | 'leads' | 'mensagens'
export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente {
  id: string
  nome: string
  segmento: string
  tipo: ClienteTipo
  status: ClienteStatus
  /** Chave usada pelo snippet v4track.js para autenticar a ingestão */
  trackingKey?: string
  /** true = cliente de demonstração (dados mock, não existe no Firestore) */
  demo?: boolean
  criadoEm?: number
  eventos?: number
}

// ── Evento ────────────────────────────────────────────────────────────────────
export type EventoTipo = 'page_view' | 'lead' | 'checkout' | 'compra' | 'custom'
export type Origem     = 'meta' | 'google' | 'organico' | 'direto' | 'email' | 'outro'

export interface UTMSet {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

/** Decomposição da nomenclatura V4 — cada nível herda o anterior */
export interface UTMParsed {
  campanha?: {
    office?: string
    regiao?: string
    funil?: string
    objetivo?: string
    cliente?: string
    tipo?: string
    detalhe?: string
  }
  conjunto?: {
    posicionamento?: string
    segmentacao?: string
    detalhe?: string
  }
  anuncio?: {
    formato?: string
    detalhe?: string
  }
  padraoV4: boolean
  erros?: string[]
}

export interface EventoIds {
  /** Cookie próprio _v4id (13 meses) — identificador primário da jornada */
  v4id?: string
  fbp?: string
  fbc?: string
  gclid?: string
  wbraid?: string
  gbraid?: string
  gaClientId?: string
  gaSessionId?: string
}

export interface EventoDados {
  email?: string
  telefone?: string
  nome?: string
  emailHash?: string
  telefoneHash?: string
}

export interface EventoGeo {
  ip?: string
  cidade?: string
  estado?: string
  pais?: string
}

export interface Evento {
  id?: string
  tipo: EventoTipo
  /** epoch ms */
  ts: number
  url?: string
  pagina?: string
  titulo?: string
  referrer?: string
  utm?: UTMSet
  utmParsed?: UTMParsed
  ids: EventoIds
  dados?: EventoDados
  geo?: EventoGeo
  userAgent?: string
  dispositivo?: 'mobile' | 'desktop' | 'tablet' | 'outro'
  valor?: number
  produto?: string
  origem: Origem
  /** id da identidade unificada dona deste evento */
  visitorId: string
}

// ── Identidade (perfil unificado / jornada) ───────────────────────────────────
export type IdentidadeStatus = 'visitante' | 'lead' | 'checkout' | 'cliente'

export interface Toque {
  ts: number
  origem: Origem
  campanha?: string
  utm?: UTMSet
}

export interface Identidade {
  id?: string
  /** identificadores acumulados — base da resolução de identidade */
  v4ids: string[]
  fbps: string[]
  fbcs: string[]
  gclids: string[]
  wbraids: string[]
  gbraids: string[]
  gaClientIds: string[]
  emails: string[]
  telefones: string[]
  ips: string[]
  nome?: string
  status: IdentidadeStatus
  valorTotal: number
  totalEventos: number
  primeiroToque?: Toque
  ultimoToque?: Toque
  /** ts do último clique atribuível — para calcular janelas */
  ultimoCliqueMeta?: number
  ultimoCliqueGoogle?: number
  atribuicao?: {
    plataforma: string
    janela: string
    /** evento mais recente aconteceu fora da janela de 7d do Meta */
    foraDaJanelaMeta?: boolean
  }
  geo?: EventoGeo
  userAgent?: string
  dispositivo?: string
  criadoEm: number
  atualizadoEm: number
}

// ── UTM registrada (gerador) ──────────────────────────────────────────────────
export type UTMCanal = 'meta' | 'google' | 'linkedin' | 'other'

export interface UTMRegistro {
  id?: string
  canal: UTMCanal
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
  componentes?: UTMParsed
  urlBase?: string
  urlTagueada?: string
  validacao: { padraoV4: boolean; erros: string[] }
  criadoEm: number
}

// ── Conversão (fila CAPI / Enhanced Conversions) ──────────────────────────────
export type ConversaoPlataforma = 'meta-capi' | 'google-enhanced'
export type ConversaoStatus     = 'aguardando-conexao' | 'pendente' | 'enviado' | 'erro'

export interface Conversao {
  id?: string
  plataforma: ConversaoPlataforma
  evento: string
  eventoId?: string
  visitorId?: string
  /** payload já no formato da plataforma (user_data com hashes, etc.) */
  payload: Record<string, unknown>
  status: ConversaoStatus
  /** 0–10: estimativa de match pelos campos presentes */
  matchQuality: number
  tentativas: number
  ts: number
  ultimaResposta?: string
}

// ── Conexão de plataforma ─────────────────────────────────────────────────────
export type ConexaoPlataforma = 'meta' | 'google' | 'ga4'
export type ConexaoStatus     = 'desconectado' | 'configurado'

export interface Conexao {
  plataforma: ConexaoPlataforma
  status: ConexaoStatus
  campos: Record<string, string>
  atualizadoEm?: number
}

// ── Insight (agente IA / regras) ──────────────────────────────────────────────
export type InsightSeveridade = 'info' | 'atencao' | 'critico'

export interface Insight {
  id?: string
  tipo: string
  titulo: string
  /** markdown */
  corpo: string
  severidade: InsightSeveridade
  origem: 'agente' | 'regra'
  dados?: Record<string, unknown>
  criadoEm: number
}

// ── Helper Firestore ──────────────────────────────────────────────────────────
export type ComTimestamp<T> = Omit<T, 'ts' | 'criadoEm' | 'atualizadoEm'> & {
  ts?: Timestamp | number
  criadoEm?: Timestamp | number
  atualizadoEm?: Timestamp | number
}
