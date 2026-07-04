// ─── TIPOS CANÔNICOS — Tracking V4 ───────────────────────────────────────────
// Modelo de dados central da plataforma (Firestore + ingestão + UI)

import type { Timestamp } from 'firebase/firestore'

// ── Partner (cliente gerenciado — doc raiz em partners/{partnerId}) ───────────
// "Cliente"/"conexão" continuam o vocabulário da UI e das rotas (/clientes/**);
// só a coleção do Firestore e os tipos internos usam "Partner"/"Integration",
// nome herdado da estrutura definida para o banco desta plataforma.
export type PartnerTipo   = 'ecommerce' | 'leads' | 'mensagens'
export type PartnerStatus = 'ativo' | 'inativo'
/** Só relevante quando tipo === 'ecommerce' — cada plataforma tem webhook/API própria */
export type EcommercePlataforma = 'shopify' | 'nuvemshop' | 'outro'

export interface Partner {
  id: string
  nome: string
  segmento: string
  tipo: PartnerTipo
  status: PartnerStatus
  /** Plataforma de e-commerce (só quando tipo === 'ecommerce') — decide qual card aparece em Conexões */
  ecommercePlataforma?: EcommercePlataforma
  /** Chave usada pelo snippet v4track.js para autenticar a ingestão */
  trackingKey?: string
  /** E-mail (lowercase) do gestor dono deste cliente — resolve qual users/{email}.meta_integration usar no envio CAPI */
  donoEmail?: string
  /** true = cliente de demonstração (dados mock, não existe no Firestore) */
  demo?: boolean
  criadoEm?: number
  eventos?: number
}

// ── Evento ────────────────────────────────────────────────────────────────────
export type EventoTipo = 'page_view' | 'lead' | 'checkout' | 'compra' | 'custom'
export type Origem     = 'meta' | 'google' | 'organico' | 'direto' | 'email' | 'shopify' | 'outro'

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
  /** ID real da transação/pedido (e-commerce) — usado como external_id de dedup no CAPI */
  transactionId?: string
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

// ── Integração de plataforma (doc raiz em partners/{id}/integrations/{plataforma}) ─
export type IntegrationPlataforma = 'meta' | 'google' | 'ga4' | 'shopify' | 'nuvemshop'
export type IntegrationStatus     = 'desconectado' | 'configurado'

export interface Integration {
  plataforma: IntegrationPlataforma
  status: IntegrationStatus
  campos: Record<string, string>
  atualizadoEm?: number
}

// ── Membro de um partner (controle de acesso) ─────────────────────────────────
export type MemberRole = 'admin' | 'viewer'

export interface Member {
  email: string
  role: MemberRole
  addedAt: number
  addedBy?: string
}

// ── Integração Meta por usuário (OAuth) ───────────────────────────────────────
// Doc users/{email} — token compartilhado entre todos os clientes cujo
// donoEmail aponta para este e-mail. Só gravado/lido por rotas server
// (firebase-admin); nunca exposto via SDK client.
export interface UserMetaIntegration {
  accessToken: string
  /** epoch ms — token de longa duração do Meta expira em ~60 dias */
  tokenExpiry: number
  atualizadoEm: number
}

export interface UserDoc {
  email: string
  meta_integration?: UserMetaIntegration
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
