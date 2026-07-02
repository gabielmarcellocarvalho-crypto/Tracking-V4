// ─── PERFORMANCE MOCK DATA — Tracking V4 ─────────────────────────────────────
// TODO: substituir por chamadas reais (Firestore + APIs Meta/Google)

export type PerformanceTemplate = 'ecommerce' | 'leads' | 'mensagens' | 'personalizado'

export interface PerfConfig {
  template: PerformanceTemplate
  blocos_personalizados: { id: string; posicao: number }[]
}

// ── E-COMMERCE ────────────────────────────────────────────────────────────────
export const perfEcData = {
  kpis: {
    investimento:  18420,
    receita:       90200,
    roas:          4.90,
    ticketMedio:   234,
    totalCompras:  385,
    taxaAbandono:  68,
  },
  diario: [
    { dia: 'Seg', investimento: 2100, receita: 9800,  roas: 4.67 },
    { dia: 'Ter', investimento: 2800, receita: 12400, roas: 4.43 },
    { dia: 'Qua', investimento: 2400, receita: 11200, roas: 4.67 },
    { dia: 'Qui', investimento: 3200, receita: 16800, roas: 5.25 },
    { dia: 'Sex', investimento: 3100, receita: 15900, roas: 5.13 },
    { dia: 'Sáb', investimento: 2600, receita: 13200, roas: 5.08 },
    { dia: 'Dom', investimento: 2220, receita: 10900, roas: 4.91 },
  ],
  funil: [
    { label: 'Visitou',  count: 42830, pct: 100, color: '#3B82F6' },
    { label: 'Checkout', count: 8996,  pct: 21,  color: '#8B5CF6' },
    { label: 'Comprou',  count: 3855,  pct: 9,   color: '#10B981' },
  ],
  canais: [
    { name: 'Meta Ads', value: 55, color: '#1877F2' },
    { name: 'Google',   value: 27, color: '#4285F4' },
    { name: 'Outros',   value: 18, color: '#6B7280' },
  ],
  topProdutos: [
    { nome: 'Plano Anual',    vendas: 120, receita: 22788 },
    { nome: 'Plano Semestral', vendas: 85, receita: 10115 },
    { nome: 'Pack Mentoria',  vendas: 72, receita: 14328 },
    { nome: 'Plano Mensal',   vendas: 63, receita: 3717  },
    { nome: 'Kit Premium',    vendas: 45, receita: 8955  },
  ],
  recentes: [
    { nome: 'Maria Santos',   origem: 'Meta Ads',   campanha: 'CONV_JUN',    valor: 189.90, data: '16/06' },
    { nome: 'João Oliveira',  origem: 'Google Ads', campanha: 'BRAND_JUN',   valor: 312.00, data: '16/06' },
    { nome: 'Ana Lima',       origem: 'Meta Ads',   campanha: 'PROS_JUN',    valor: 189.90, data: '15/06' },
    { nome: 'Carlos Silva',   origem: 'Google Ads', campanha: 'DISPLAY_JUN', valor: 450.00, data: '15/06' },
    { nome: 'Patrícia Souza', origem: 'Orgânico',   campanha: '—',           valor: 189.90, data: '14/06' },
    { nome: 'Rafael Costa',   origem: 'Meta Ads',   campanha: 'CONV_JUN',    valor: 234.00, data: '14/06' },
  ],
}

// ── LEADS ─────────────────────────────────────────────────────────────────────
export const perfLeadsData = {
  kpis: {
    investimento:   18420,
    totalLeads:     1289,
    cpl:            14.3,
    taxaConversao:  12.4,
    qualificados:   780,
    naoQualificados: 509,
    cpa:            148,
  },
  diario: [
    { dia: 'Seg', leads: 142, cpl: 14.8 },
    { dia: 'Ter', leads: 198, cpl: 14.1 },
    { dia: 'Qua', leads: 167, cpl: 14.4 },
    { dia: 'Qui', leads: 223, cpl: 14.3 },
    { dia: 'Sex', leads: 218, cpl: 14.2 },
    { dia: 'Sáb', leads: 185, cpl: 14.1 },
    { dia: 'Dom', leads: 156, cpl: 14.2 },
  ],
  funil: [
    { label: 'Visitou',     count: 38400, pct: 100, color: '#3B82F6' },
    { label: 'Lead',        count: 1289,  pct: 3,   color: '#F59E0B' },
    { label: 'Qualificado', count: 780,   pct: 2,   color: '#8B5CF6' },
    { label: 'Vendeu',      count: 160,   pct: 0.4, color: '#10B981' },
  ],
  canais: [
    { name: 'Meta Ads',  value: 55, color: '#1877F2' },
    { name: 'Google',    value: 30, color: '#4285F4' },
    { name: 'LinkedIn',  value: 8,  color: '#0A66C2' },
    { name: 'Outros',    value: 7,  color: '#6B7280' },
  ],
  qualChart: [
    { name: 'Qualificados',     value: 780, color: '#10B981' },
    { name: 'Não Qualificados', value: 509, color: '#374151' },
  ],
  recentes: [
    { nome: 'Ana Ferreira',  origem: 'Meta Ads',   campanha: 'PROS_JUN',    status: 'qualificado',     data: '16/06' },
    { nome: 'Bruno Torres',  origem: 'Google Ads', campanha: 'BRAND_JUN',   status: 'lead',            data: '16/06' },
    { nome: 'Carla Mendes',  origem: 'LinkedIn',   campanha: 'B2B_JUN',     status: 'nao-qualificado', data: '15/06' },
    { nome: 'Diego Almeida', origem: 'Meta Ads',   campanha: 'CONV_JUN',    status: 'vendeu',          data: '15/06' },
    { nome: 'Eva Rodrigues', origem: 'Orgânico',   campanha: '—',           status: 'lead',            data: '14/06' },
    { nome: 'Felipe Nunes',  origem: 'Meta Ads',   campanha: 'LOOK_JUN',    status: 'qualificado',     data: '14/06' },
  ],
}

// ── MENSAGENS ─────────────────────────────────────────────────────────────────
export const perfMsgData = {
  kpis: {
    investimento:   18420,
    totalContatos:  835,
    cpm:            22.1,
    taxaResposta:   73,
    conversoes:     89,
    cpa:            207,
  },
  diario: [
    { dia: 'Seg', contatos: 87,  cpm: 24.1 },
    { dia: 'Ter', contatos: 124, cpm: 22.6 },
    { dia: 'Qua', contatos: 103, cpm: 23.3 },
    { dia: 'Qui', contatos: 156, cpm: 20.5 },
    { dia: 'Sex', contatos: 149, cpm: 20.8 },
    { dia: 'Sáb', contatos: 118, cpm: 22.0 },
    { dia: 'Dom', contatos: 98,  cpm: 22.7 },
  ],
  funil: [
    { label: 'Clicou',    count: 4820, pct: 100, color: '#3B82F6' },
    { label: 'Mensagem',  count: 835,  pct: 17,  color: '#F59E0B' },
    { label: 'Virou lead', count: 412, pct: 9,   color: '#8B5CF6' },
    { label: 'Comprou',   count: 89,   pct: 2,   color: '#10B981' },
  ],
  canais: [
    { name: 'Meta Ads',   value: 70, color: '#1877F2' },
    { name: 'Google',     value: 18, color: '#4285F4' },
    { name: 'Orgânico',   value: 12, color: '#6B7280' },
  ],
  recentes: [
    { nome: 'Gabriela Pinto',  origem: 'Meta Ads',   campanha: 'WA_JUN',   status: 'converteu', data: '16/06' },
    { nome: 'Henrique Costa',  origem: 'Meta Ads',   campanha: 'CONV_JUN', status: 'em contato', data: '16/06' },
    { nome: 'Isabela Ramos',   origem: 'Google Ads', campanha: 'BRAND',    status: 'sem resposta', data: '15/06' },
    { nome: 'Jorge Barbosa',   origem: 'Meta Ads',   campanha: 'WA_JUN',   status: 'converteu', data: '15/06' },
    { nome: 'Karen Azevedo',   origem: 'Orgânico',   campanha: '—',        status: 'em contato', data: '14/06' },
    { nome: 'Luís Cardoso',    origem: 'Meta Ads',   campanha: 'PROS_JUN', status: 'sem resposta', data: '14/06' },
  ],
}

// ── PERSONALIZADO — blocos disponíveis ───────────────────────────────────────
export const AVAILABLE_BLOCKS = [
  // Métricas
  { id: 'card-investimento',  tipo: 'card',   label: 'Investimento',          color: '#C8102E', cat: 'Métricas' },
  { id: 'card-receita',       tipo: 'card',   label: 'Receita',               color: '#10B981', cat: 'Métricas' },
  { id: 'card-roas',          tipo: 'card',   label: 'ROAS',                  color: '#3B82F6', cat: 'Métricas' },
  { id: 'card-cpl',           tipo: 'card',   label: 'CPL',                   color: '#8B5CF6', cat: 'Métricas' },
  { id: 'card-cpa',           tipo: 'card',   label: 'CPA',                   color: '#F59E0B', cat: 'Métricas' },
  { id: 'card-ticket',        tipo: 'card',   label: 'Ticket Médio',          color: '#10B981', cat: 'Métricas' },
  { id: 'card-leads',         tipo: 'card',   label: 'Total de Leads',        color: '#8B5CF6', cat: 'Métricas' },
  { id: 'card-compras',       tipo: 'card',   label: 'Total de Compras',      color: '#10B981', cat: 'Métricas' },
  { id: 'card-conversao',     tipo: 'card',   label: 'Taxa de Conversão',     color: '#3B82F6', cat: 'Métricas' },
  { id: 'card-capi',          tipo: 'card',   label: 'Match Rate Meta CAPI',  color: '#C8102E', cat: 'Métricas' },
  { id: 'card-gec',           tipo: 'card',   label: 'Match Rate Google EC',  color: '#4285F4', cat: 'Métricas' },
  { id: 'card-eventos',       tipo: 'card',   label: 'Total de Eventos',      color: '#F59E0B', cat: 'Métricas' },
  { id: 'card-qualificados',  tipo: 'card',   label: 'Leads Qualificados',    color: '#8B5CF6', cat: 'Métricas' },
  { id: 'card-abandono',      tipo: 'card',   label: 'Taxa de Abandono',      color: '#EF4444', cat: 'Métricas' },
  { id: 'card-cpm',           tipo: 'card',   label: 'Custo por Mensagem',    color: '#F59E0B', cat: 'Métricas' },
  { id: 'card-contatos',      tipo: 'card',   label: 'Total de Contatos',     color: '#10B981', cat: 'Métricas' },
  // Gráficos
  { id: 'chart-bar',          tipo: 'grafico', label: 'Receita vs Investimento', color: '#10B981', cat: 'Gráficos' },
  { id: 'chart-leads-dia',    tipo: 'grafico', label: 'Leads por Dia',           color: '#8B5CF6', cat: 'Gráficos' },
  { id: 'chart-roas',         tipo: 'grafico', label: 'ROAS ao Longo do Tempo',  color: '#3B82F6', cat: 'Gráficos' },
  { id: 'chart-cpl',          tipo: 'grafico', label: 'CPL ao Longo do Tempo',   color: '#F59E0B', cat: 'Gráficos' },
  { id: 'chart-funil',        tipo: 'grafico', label: 'Funil de Conversão',      color: '#8B5CF6', cat: 'Gráficos' },
  { id: 'chart-canais',       tipo: 'grafico', label: 'Origem por Canal',        color: '#C8102E', cat: 'Gráficos' },
  { id: 'chart-campanhas',    tipo: 'grafico', label: 'Top Campanhas',           color: '#3B82F6', cat: 'Gráficos' },
  // Tabelas
  { id: 'table-leads',        tipo: 'tabela', label: 'Leads Recentes',           color: '#6B7280', cat: 'Tabelas' },
  { id: 'table-compras',      tipo: 'tabela', label: 'Compras Recentes',         color: '#6B7280', cat: 'Tabelas' },
  { id: 'table-campanhas',    tipo: 'tabela', label: 'Top Campanhas',            color: '#6B7280', cat: 'Tabelas' },
  // Extras
  { id: 'extra-meta-inv',     tipo: 'extra',  label: 'Meta de Investimento',     color: '#C8102E', cat: 'Extras' },
  { id: 'extra-meta-leads',   tipo: 'extra',  label: 'Meta de Leads/Vendas',     color: '#8B5CF6', cat: 'Extras' },
  { id: 'extra-saude',        tipo: 'extra',  label: 'Saúde do Tracking',        color: '#10B981', cat: 'Extras' },
] as const

export const DEFAULT_PERSONALIZADO_BLOCKS = [
  'card-investimento', 'card-receita', 'card-roas', 'card-leads',
  'chart-bar', 'chart-funil', 'table-leads',
]
