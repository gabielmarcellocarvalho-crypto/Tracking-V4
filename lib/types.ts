// ─── TIPOS CANÔNICOS — Tracking V4 ───────────────────────────────────────────
// Modelo de dados central da plataforma (Firestore + ingestão + UI)

import type { Timestamp } from 'firebase/firestore'

// ── Partner (cliente gerenciado — doc raiz em partners/{partnerId}) ───────────
// "Cliente"/"conexão" continuam o vocabulário da UI e das rotas (/clientes/**);
// só a coleção do Firestore e os tipos internos usam "Partner"/"Integration",
// nome herdado da estrutura definida para o banco desta plataforma.
export type PartnerTipo   = 'ecommerce' | 'inside-sales'
export type PartnerStatus = 'ativo' | 'inativo'
/** Só relevante quando tipo === 'ecommerce' — cada plataforma tem webhook/API própria */
export type EcommercePlataforma = 'shopify' | 'nuvemshop' | 'tray' | 'loja-integrada' | 'outro'

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
  /**
   * epoch ms — eventos com `ts` menor ou igual a isso são ignorados em TODOS
   * os cálculos (Growth Pack, Performance, Agente IA, alertas). Usado quando
   * o cliente troca de plataforma (ex: Shopify → loja integrada) e o gestor
   * quer "zerar" o histórico sem apagar nada do Firestore — os eventos
   * continuam lá, só param de entrar nas contas a partir desse corte.
   */
  dadosIgnoradosAte?: number
  /**
   * visitorIds (Identidade.id) marcados como "desconsiderar" pelo gestor —
   * geralmente teste do próprio time (ex: gerar um PIX de teste sem pagar).
   * Eventos desses visitantes são excluídos de TODOS os cálculos (mesmo
   * escopo de `dadosIgnoradosAte`), sem apagar nada do Firestore — dá pra
   * desmarcar e voltar a contar. Alternado em Jornada do Usuário.
   */
  identidadesDesconsideradas?: string[]
}

// ── Evento ────────────────────────────────────────────────────────────────────
export type EventoTipo = 'page_view' | 'lead' | 'checkout' | 'compra' | 'view_item' | 'custom'
export type Origem     = 'meta' | 'google' | 'organico' | 'direto' | 'email' | 'shopify' | 'loja-integrada' | 'outro'

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

// ── Contador agregado (partners/{id}/stats) ───────────────────────────────────
// Mantido incrementalmente na ingestão (ver lib/tracking/ingest.ts) pra telas
// de resumo (Saúde dos Eventos, Volume por dia) não precisarem reler os
// documentos crus de eventos/ toda vez que alguém abre a página — só o
// drill-down/Jornada do Usuário continuam lendo eventos/ diretamente.
/** partners/{id}/stats/{YYYY-MM-DD} — contagem do dia, por tipo de evento */
export interface EventStatsDia {
  page_view?: number
  lead?: number
  checkout?: number
  compra?: number
  view_item?: number
  custom?: number
  /** soma de Evento.valor dos eventos tipo "compra" nesse dia */
  receita?: number
}
/** partners/{id}/stats/ultimo — timestamp (epoch ms) do último evento de cada tipo, sempre atual */
export interface EventStatsUltimo {
  page_view?: number
  lead?: number
  checkout?: number
  compra?: number
  view_item?: number
  custom?: number
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
  /** UTM em uso (default true) — desativar não apaga, só marca como fora de uso pra cruzar com Detectadas */
  ativo?: boolean
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
export type IntegrationPlataforma = 'meta' | 'meta-ads' | 'google' | 'google-ads' | 'ga4' | 'shopify' | 'nuvemshop' | 'tray' | 'loja-integrada'
export type IntegrationStatus     = 'desconectado' | 'configurado'

export interface Integration {
  plataforma: IntegrationPlataforma
  status: IntegrationStatus
  campos: Record<string, string>
  atualizadoEm?: number
}

// ── Plano de Mídia (Gestor de Mídia) — doc raiz em partners/{id}/plano_midia/{itemId} ─
// Cada doc é uma inserção/linha de campanha planejada. Só os campos abaixo são
// digitados — o resto (impressões, alcance, cliques, funil etc.) é calculado
// a partir deles em lib/data/plano-midia-calc.ts, nunca gravado no Firestore.
export type PlanoMidiaVeiculo = 'meta' | 'google'

export interface PlanoMidiaItem {
  id?: string
  mes: string // 'AAAA-MM'
  dataInicio: string // 'AAAA-MM-DD'
  dataFim: string
  veiculo: PlanoMidiaVeiculo
  campanha: string
  objetivo: string
  kpiPrimario: string
  funil: string // ex: 'Aquisição (Topo)', 'Remarketing (Fundo)', 'Receita (Fundo)'
  orcamento: number
  frequencia: number
  cpm: number
  ctr: number // percentual como decimal, ex: 0.0348 = 3,48%
  connectRate: number
  taxaEstagio1: number // Taxa Conv. Cart (e-commerce) ou Leads (funil de leads)
  taxaEstagio2: number // Checkout ou MQL
  taxaEstagio3: number // Purchase ou SQL
  taxaEstagio4?: number // só funil de leads: SQL → Vendas
  faturamentoProjetado: number
  atualizadoEm?: number
}

// Config por mês — parâmetros compartilhados por todas as inserções do mês.
export interface PlanoMidiaConfigMes {
  mes: string
  orcamentoTotal: number
  ticketMedio: number
  fatorPosImposto: number // decimal, ex: 0.8718 = deduz 12,82%
}

// ── Forecasting (Gestor de Mídia) — doc raiz em partners/{id}/forecasting_config/main ─
// % de variação aplicado sobre o Plano de Mídia pra gerar os cenários
// Pessimista/Otimista — Realista é o Plano de Mídia como está, sem ajuste.
// Ex: pessimista.deltaCtr = -0.15 → CTR 15% pior que o planejado.
export interface ForecastingCenarioDelta {
  deltaCtr: number
  deltaConversao: number
}
export interface ForecastingCenarios {
  pessimista: ForecastingCenarioDelta
  otimista: ForecastingCenarioDelta
  atualizadoEm?: number
}

// ── Metas de KPI (Gestor de Mídia) — doc raiz em partners/{id}/kpi_metas/config ─
// Um mapa por canal (geral/meta/google) → por KPI → se está sendo monitorado
// e qual o valor aceitável. `direcao` do KPI (min/max) decide o que "abaixo
// do aceitável" significa (ver KPIS_ECOMMERCE/KPIS_LEADS em lib/data/kpis.ts).
export interface KpiMetaConfig {
  ativo: boolean
  valor: number
}
export interface KpiMetasDoc {
  geral?: Record<string, KpiMetaConfig>
  meta?: Record<string, KpiMetaConfig>
  google?: Record<string, KpiMetaConfig>
  atualizadoEm?: number
}

// ── Status de KPI (Gestor de Mídia) — doc raiz em partners/{id}/kpi_status/atual ─
// Recalculado sempre que o gestor abre Gestor de Mídia (não em toda página, pra
// não gerar chamada às APIs de Ads em rotas que não precisam disso) — o sino de
// notificações só LÊ este doc, nunca recalcula.
export interface KpiViolacao {
  key: string
  label: string
  valorAtual: number
  meta: number
  direcao: 'min' | 'max'
  formato: 'moeda' | 'percentual' | 'razao' | 'numero'
}
export interface KpiStatusDoc {
  geral?: KpiViolacao[]
  meta?: KpiViolacao[]
  google?: KpiViolacao[]
  periodoLabel?: string
  atualizadoEm?: number
}

// ── Campanhas de Google Ads (Gestor de Mídia) — doc raiz em
// partners/{id}/google_ads_campanhas/{campanhaId} ────────────────────────────
// Modelo espelha o template de planilha (Palavra Chaves / Anúncio / Recursos)
// que os gestores já usavam pra montar campanha antes de subir pro Google Ads
// Editor. Sitelinks/Callouts/Snippets/Telefone ficam no nível da CAMPANHA
// (não por grupo) — é como o Google Ads trata esses recursos de verdade.
export type GoogleAdsMatchType = 'Broad' | 'Phrase' | 'Exact'

export interface GoogleAdsPalavra {
  texto: string
  tipo: GoogleAdsMatchType
  volumeBusca?: number // vol. de pesquisas mensais — só referência, não vai no export
}

export interface GoogleAdsGrupo {
  id: string
  nome: string
  maxCpc: number
  palavrasChave: GoogleAdsPalavra[]
  negativas: GoogleAdsPalavra[]
  headlines: string[]  // até 15, 30 caracteres cada (Responsive Search Ad)
  descricoes: string[] // até 4, 90 caracteres cada
  path1: string
  path2: string
  finalUrl: string
}

export interface GoogleAdsSitelink {
  texto: string
  finalUrl: string
  descricao1?: string
  descricao2?: string
}

export interface GoogleAdsSnippet {
  header: string // um dos headers fixos do Google (ex: 'Marcas', 'Serviços', 'Estilos'...)
  valores: string[]
}

export interface GoogleAdsCampanha {
  id?: string
  nome: string
  orcamentoDiario: number
  status: 'Enabled' | 'Paused'
  grupos: GoogleAdsGrupo[]
  sitelinks: GoogleAdsSitelink[]
  callouts: string[]
  snippets: GoogleAdsSnippet[]
  telefone?: string
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
