// ─── MOCK DATA — Tracking V4 ─────────────────────────────────────────────────
// TODO: substituir por chamadas reais ao Firestore

// ─── KPI ─────────────────────────────────────────────────────────────────────
export interface KPIData {
  label: string
  value: string
  trendLabel: string
  direction: 'up' | 'down'
  accentColor: string
  svgPath: string
}

export const kpiData: KPIData[] = [
  { label: 'Investimento',      value: 'R$18.420', trendLabel: '↑ +12,4% vs. mês ant.', direction: 'up', accentColor: '#C8102E', svgPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { label: 'Receita Atribuída', value: 'R$94.200', trendLabel: '↑ +28,1% vs. mês ant.', direction: 'up', accentColor: '#10B981', svgPath: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { label: 'ROAS Geral',        value: '5.11x',   trendLabel: '↑ +0,7x vs. mês ant.',  direction: 'up', accentColor: '#3B82F6', svgPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { label: 'Leads Captados',    value: '1.847',   trendLabel: '↑ +8,3% vs. mês ant.',  direction: 'up', accentColor: '#8B5CF6', svgPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
]

// ─── FUNIL ───────────────────────────────────────────────────────────────────
export interface FunnelStep {
  label: string
  count: number
  percentage: number
  color: string
}

export const funnelData: FunnelStep[] = [
  { label: 'Page View', count: 42830, percentage: 100, color: '#3B82F6' },
  { label: 'Lead',      count: 18416, percentage: 43,  color: '#F59E0B' },
  { label: 'Checkout',  count: 8996,  percentage: 21,  color: '#8B5CF6' },
  { label: 'Compra',    count: 3855,  percentage: 9,   color: '#10B981' },
]

// ─── GRÁFICO ─────────────────────────────────────────────────────────────────
export interface ChartDay {
  day: string
  investment: number
  revenue: number
}

export const chartData: ChartDay[] = [
  { day: 'Seg', investment: 2100, revenue: 9800  },
  { day: 'Ter', investment: 2800, revenue: 12400 },
  { day: 'Qua', investment: 2400, revenue: 11200 },
  { day: 'Qui', investment: 3200, revenue: 16800 },
  { day: 'Sex', investment: 3100, revenue: 15900 },
  { day: 'Sáb', investment: 2600, revenue: 13200 },
  { day: 'Dom', investment: 2220, revenue: 10900 },
]

// ─── LEADS ───────────────────────────────────────────────────────────────────
export type LeadSource = 'Meta Ads' | 'Google Ads' | 'Orgânico' | 'GA4'
export type LeadEvent  = 'Compra' | 'Checkout' | 'Lead' | 'Page View'

export interface Lead {
  id: string
  name: string
  email: string
  source: LeadSource
  campaign: string
  event: LeadEvent
  date: string
}

export const leadsData: Lead[] = [
  { id: '1', name: 'Maria Santos',   email: 'maria.santos@email.com',     source: 'Meta Ads',   campaign: 'CAM_META_CONV_JUN',  event: 'Compra',    date: '13/06/2026' },
  { id: '2', name: 'João Oliveira',  email: 'joao.o@gmail.com',           source: 'Google Ads', campaign: 'BRAND_SEARCH_JUN',   event: 'Checkout',  date: '13/06/2026' },
  { id: '3', name: 'Ana Ferreira',   email: 'ana.ferreira@hotmail.com',   source: 'Meta Ads',   campaign: 'CAM_META_PROS_JUN',  event: 'Lead',      date: '12/06/2026' },
  { id: '4', name: 'Carlos Lima',    email: 'carlos.lima@empresa.com',    source: 'Google Ads', campaign: 'DISPLAY_RETAR_JUN',  event: 'Compra',    date: '12/06/2026' },
  { id: '5', name: 'Patricia Souza', email: 'p.souza@outlook.com',        source: 'Orgânico',   campaign: '—',                  event: 'Lead',      date: '11/06/2026' },
]

export const sourceChips = [
  { id: 'meta',    label: 'Meta Ads',   color: '#1877F2', defaultOn: true  },
  { id: 'google',  label: 'Google Ads', color: '#4285F4', defaultOn: true  },
  { id: 'ga4',     label: 'GA4',        color: '#E37400', defaultOn: true  },
  { id: 'shopify', label: 'Shopify',    color: '#96BF48', defaultOn: false },
]

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export type ClienteTipo   = 'ecommerce' | 'leads' | 'mensagens'
export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente {
  id: string
  nome: string
  segmento: string
  tipo: ClienteTipo
  status: ClienteStatus
  eventos: number
}

export const clientesData: Cliente[] = [
  { id: 'klubi',        nome: 'Klubi',              segmento: 'Finanças',      tipo: 'ecommerce',  status: 'ativo',   eventos: 124800 },
  { id: 'nova-era',     nome: 'Loja Nova Era',      segmento: 'E-commerce',    tipo: 'ecommerce',  status: 'ativo',   eventos: 84200  },
  { id: 'studio-fit',   nome: 'Studio Fit',         segmento: 'Academia',      tipo: 'leads',      status: 'ativo',   eventos: 31400  },
  { id: 'consultoria',  nome: 'Consultoria Plus',   segmento: 'Consultoria',   tipo: 'leads',      status: 'ativo',   eventos: 18900  },
  { id: 'zap-vendas',   nome: 'ZapVendas',          segmento: 'Tecnologia',    tipo: 'mensagens',  status: 'ativo',   eventos: 52300  },
  { id: 'odonto-elite', nome: 'OdontoElite',        segmento: 'Saúde',         tipo: 'leads',      status: 'ativo',   eventos: 9700   },
  { id: 'roupas-moda',  nome: 'Modas São Paulo',    segmento: 'Moda',          tipo: 'ecommerce',  status: 'inativo', eventos: 4100   },
  { id: 'imob-prime',   nome: 'ImobPrime',          segmento: 'Imobiliário',   tipo: 'leads',      status: 'ativo',   eventos: 14600  },
]

// ─── UTMs MOCK ────────────────────────────────────────────────────────────────
export type UTMTipoMeta    = 'link' | 'fb-leadad' | 'post'
export type UTMTipoGoogle  = 'search' | 'pmax' | 'shopping' | 'display' | 'discovery'
export type UTMTipoLinkedin = 'in-leadad' | 'in-post' | 'in-video'

export interface UTMMeta {
  id: string
  campaign: string
  term: string
  content: string
  source: 'meta'
  medium: 'paid'
}

export interface UTMGoogle {
  id: string
  tipo: UTMTipoGoogle
  campaign: string
  term: string
  content: string
  source: 'google'
  medium: 'paid'
}

export interface UTMLinkedin {
  id: string
  tipo: UTMTipoLinkedin
  campaign: string
  term: string
  content: string
  source: 'linkedin'
  medium: 'paid'
}

export interface UTMOther {
  id: string
  campaign: string
  source: string
  medium: string
  tipoPeca: string
}

export const utmMetaData: UTMMeta[] = [
  { id: '1', campaign: 'v4-ate_sp_perf_ved_klubi_link_assinatura', term: 'v4-ate_sp_perf_ved_klubi_link_assinatura_all_int_broad', content: 'v4-ate_sp_perf_ved_klubi_link_assinatura_all_int_broad_linkad_001', source: 'meta', medium: 'paid' },
  { id: '2', campaign: 'v4-ate_sp_perf_ved_klubi_link_remarketing', term: 'v4-ate_sp_perf_ved_klubi_link_remarketing_feed_ret_visitors', content: 'v4-ate_sp_perf_ved_klubi_link_remarketing_feed_ret_visitors_linkad_002', source: 'meta', medium: 'paid' },
]

export const utmGoogleData: UTMGoogle[] = [
  { id: '1', tipo: 'search', campaign: 'v4-ate_sp_perf_ved_klubi_search_brand', term: 'v4-ate_sp_perf_ved_klubi_search_brand_all_exact_brand', content: 'v4-ate_sp_perf_ved_klubi_search_brand_all_exact_brand_search_001', source: 'google', medium: 'paid' },
  { id: '2', tipo: 'pmax',   campaign: 'v4-ate_sp_perf_ved_klubi_max_geral',   term: 'v4-ate_sp_perf_ved_klubi_max_geral_all_auto_geral',         content: 'v4-ate_sp_perf_ved_klubi_max_geral_all_auto_geral_max_001',   source: 'google', medium: 'paid' },
]

export const utmLinkedinData: UTMLinkedin[] = [
  { id: '1', tipo: 'in-leadad', campaign: 'v4-ate_sp_topo_lead_klubi_in-leadad_form', term: 'v4-ate_sp_topo_lead_klubi_in-leadad_form_all_dmg_diretor', content: 'v4-ate_sp_topo_lead_klubi_in-leadad_form_all_dmg_diretor_in-leadad_001', source: 'linkedin', medium: 'paid' },
]

export const utmOtherData: UTMOther[] = [
  { id: '1', campaign: 'v4-ate_sp_topo_eng_klubi_email_newsletter', source: 'email',    medium: 'organic', tipoPeca: 'hiperlink' },
  { id: '2', campaign: 'v4-ate_sp_topo_eng_klubi_whats_campanha',   source: 'whatsapp', medium: 'organic', tipoPeca: 'button-learn-more' },
]

// ─── JORNADA MOCK ────────────────────────────────────────────────────────────
export type EventoTipo = 'page_view' | 'lead' | 'checkout' | 'compra'

export interface EventoJornada {
  id: string
  tipo: EventoTipo
  data: string
  hora: string
  plataforma?: string
  canal?: string
  campanha?: string
  conjunto?: string
  anuncio?: string
  pagina?: string
  tempoPagina?: string
  produto?: string
  valor?: number
  email?: string
  telefone?: string
  fbp?: string
  fbc?: string
  gclid?: string
  janelaMeta?: boolean
  atribuicao?: string
}

export interface UsuarioJornada {
  id: string
  email: string
  emailMasked: string
  status: 'converteu' | 'lead' | 'checkout-abandonado'
  valor?: number
  eventos: EventoJornada[]
  cookies: {
    fbp?: string
    fbc?: string
    gclid?: string
    wbraid?: string
    gbraid?: string
  }
  dados: {
    email: string
    telefone?: string
    cidade?: string
    estado?: string
    ip?: string
    userAgent?: string
  }
  atribuicaoFinal: {
    plataforma: string
    janela: string
  }
}

export const usuariosJornada: UsuarioJornada[] = [
  {
    id: '1',
    email: 'joana.silva@gmail.com',
    emailMasked: 'jo***@gmail.com',
    status: 'converteu',
    valor: 189.90,
    cookies: { fbp: 'fb.1.1686000000.123456789', fbc: 'fb.1.1686001200.AbCdEfGhIj' },
    dados: { email: 'joana.silva@gmail.com', telefone: '(11) 99999-1234', cidade: 'São Paulo', estado: 'SP', ip: '177.70.12.45', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
    atribuicaoFinal: { plataforma: 'Meta Ads', janela: '7 dias' },
    eventos: [
      { id: 'e1', tipo: 'page_view', data: '15/05', hora: '10:23', plataforma: 'Meta', canal: 'Instagram', campanha: 'v4-ate_sp_perf_ved_klubi_link_assinatura', conjunto: 'all_int_broad', anuncio: 'linkad_001', fbp: 'fb.1.1686000000.123456789' },
      { id: 'e2', tipo: 'lead',     data: '15/05', hora: '10:31', email: 'joana.silva@gmail.com', telefone: '(11) 99999-1234', fbc: 'fb.1.1686001200.AbCdEfGhIj', janelaMeta: true, atribuicao: 'Meta Ads' },
      { id: 'e3', tipo: 'page_view', data: '17/05', hora: '14:05', pagina: '/assinatura', tempoPagina: '4m 22s', atribuicao: 'Meta (cookie ativo)' },
      { id: 'e4', tipo: 'checkout', data: '17/05', hora: '14:09', produto: 'Plano Mensal Klubi', valor: 189.90, campanha: 'v4-ate_sp_perf_ved_klubi_link_remarketing' },
      { id: 'e5', tipo: 'compra',   data: '17/05', hora: '14:15', valor: 189.90, atribuicao: 'Meta Ads' },
    ],
  },
  {
    id: '2',
    email: 'marcos.r@hotmail.com',
    emailMasked: 'ma***@hotmail.com',
    status: 'lead',
    cookies: { fbp: 'fb.1.1686100000.987654321' },
    dados: { email: 'marcos.r@hotmail.com', cidade: 'Campinas', estado: 'SP', ip: '189.30.45.67' },
    atribuicaoFinal: { plataforma: 'Meta Ads', janela: '7 dias' },
    eventos: [
      { id: 'e1', tipo: 'page_view', data: '14/05', hora: '09:10', plataforma: 'Meta', canal: 'Facebook', campanha: 'v4-ate_sp_perf_ved_klubi_link_assinatura', fbp: 'fb.1.1686100000.987654321' },
      { id: 'e2', tipo: 'lead',     data: '14/05', hora: '09:18', email: 'marcos.r@hotmail.com', janelaMeta: true },
    ],
  },
  {
    id: '3',
    email: 'carla.m@gmail.com',
    emailMasked: 'ca***@gmail.com',
    status: 'converteu',
    valor: 312.00,
    cookies: { gclid: 'CjwKCAjw-tKtBhBeEiwAnnP0aBcDeFg' },
    dados: { email: 'carla.m@gmail.com', telefone: '(21) 98888-5678', cidade: 'Rio de Janeiro', estado: 'RJ', ip: '201.20.30.40' },
    atribuicaoFinal: { plataforma: 'Google Ads', janela: '90 dias' },
    eventos: [
      { id: 'e1', tipo: 'page_view', data: '10/05', hora: '11:00', plataforma: 'Google', canal: 'Search', campanha: 'v4-ate_sp_perf_ved_klubi_search_brand', gclid: 'CjwKCAjw-tKtBhBeEiwAnnP0aBcDeFg' },
      { id: 'e2', tipo: 'lead',     data: '10/05', hora: '11:08', email: 'carla.m@gmail.com', telefone: '(21) 98888-5678' },
      { id: 'e3', tipo: 'compra',   data: '12/05', hora: '16:30', valor: 312.00, atribuicao: 'Google Ads' },
    ],
  },
  {
    id: '4',
    email: 'renata.f@gmail.com',
    emailMasked: 're***@gmail.com',
    status: 'checkout-abandonado',
    cookies: { fbp: 'fb.1.1686200000.112233445', fbc: 'fb.1.1686201000.XyZaBcDeF' },
    dados: { email: 'renata.f@gmail.com', cidade: 'Belo Horizonte', estado: 'MG', ip: '200.100.50.25' },
    atribuicaoFinal: { plataforma: 'Meta Ads', janela: '7 dias' },
    eventos: [
      { id: 'e1', tipo: 'page_view', data: '13/05', hora: '20:15', plataforma: 'Meta', canal: 'Instagram', campanha: 'v4-ate_sp_perf_ved_klubi_link_assinatura', fbp: 'fb.1.1686200000.112233445' },
      { id: 'e2', tipo: 'lead',     data: '13/05', hora: '20:22', email: 'renata.f@gmail.com', fbc: 'fb.1.1686201000.XyZaBcDeF', janelaMeta: true },
      { id: 'e3', tipo: 'checkout', data: '13/05', hora: '20:28', produto: 'Plano Anual Klubi', valor: 189.90 },
    ],
  },
]

// ─── MAPA DE LEADS — dados geográficos ───────────────────────────────────────
export type LeadStatus = 'converteu' | 'lead' | 'checkout-abandonado'

export interface LeadGeo {
  id: string
  nome: string
  email: string
  cidade: string
  estado: string
  ip: string
  lat: number
  lng: number
  status: LeadStatus
  valor?: number
  source: string
  jornada?: string   // userId para linkar com usuariosJornada
}

export const leadsGeoData: LeadGeo[] = [
  // Usuários existentes (linkados à jornada)
  { id: '1',  nome: 'Joana Silva',     email: 'jo***@gmail.com',    cidade: 'São Paulo',      estado: 'SP', ip: '177.70.12.45',   lat: -23.5505, lng: -46.6333, status: 'converteu',          valor: 189.90, source: 'Meta Ads',   jornada: '1' },
  { id: '2',  nome: 'Marcos R.',       email: 'ma***@hotmail.com',  cidade: 'Campinas',       estado: 'SP', ip: '189.30.45.67',   lat: -22.9099, lng: -47.0626, status: 'lead',                              source: 'Meta Ads',   jornada: '2' },
  { id: '3',  nome: 'Carla M.',        email: 'ca***@gmail.com',    cidade: 'Rio de Janeiro', estado: 'RJ', ip: '201.20.30.40',   lat: -22.9068, lng: -43.1729, status: 'converteu',          valor: 312.00, source: 'Google Ads', jornada: '3' },
  { id: '4',  nome: 'Renata F.',       email: 're***@gmail.com',    cidade: 'Belo Horizonte', estado: 'MG', ip: '200.100.50.25',  lat: -19.9166, lng: -43.9345, status: 'checkout-abandonado',              source: 'Meta Ads',   jornada: '4' },
  // Leads adicionais para visualização do mapa
  { id: '5',  nome: 'Pedro A.',        email: 'pe***@gmail.com',    cidade: 'Curitiba',       estado: 'PR', ip: '191.50.60.70',   lat: -25.4290, lng: -49.2671, status: 'lead',                              source: 'Google Ads' },
  { id: '6',  nome: 'Amanda L.',       email: 'am***@outlook.com',  cidade: 'Porto Alegre',   estado: 'RS', ip: '177.80.90.11',   lat: -30.0346, lng: -51.2177, status: 'converteu',          valor: 450.00, source: 'Meta Ads' },
  { id: '7',  nome: 'Bruno T.',        email: 'br***@gmail.com',    cidade: 'Salvador',       estado: 'BA', ip: '189.40.55.80',   lat: -12.9714, lng: -38.5014, status: 'lead',                              source: 'Orgânico' },
  { id: '8',  nome: 'Clara O.',        email: 'cl***@yahoo.com',    cidade: 'Recife',         estado: 'PE', ip: '200.60.70.90',   lat: -8.0578,  lng: -34.8829, status: 'lead',                              source: 'Meta Ads' },
  { id: '9',  nome: 'Diego N.',        email: 'di***@gmail.com',    cidade: 'Fortaleza',      estado: 'CE', ip: '177.90.10.20',   lat: -3.7319,  lng: -38.5267, status: 'checkout-abandonado',              source: 'Google Ads' },
  { id: '10', nome: 'Elena B.',        email: 'el***@gmail.com',    cidade: 'Brasília',       estado: 'DF', ip: '189.50.60.70',   lat: -15.7801, lng: -47.9292, status: 'converteu',          valor: 890.00, source: 'Google Ads' },
  { id: '11', nome: 'Felipe C.',       email: 'fe***@hotmail.com',  cidade: 'Manaus',         estado: 'AM', ip: '179.30.40.50',   lat: -3.1190,  lng: -60.0217, status: 'lead',                              source: 'Meta Ads' },
  { id: '12', nome: 'Giovanna P.',     email: 'gi***@gmail.com',    cidade: 'Goiânia',        estado: 'GO', ip: '200.70.80.90',   lat: -16.6869, lng: -49.2648, status: 'lead',                              source: 'Meta Ads' },
  { id: '13', nome: 'Hugo M.',         email: 'hu***@gmail.com',    cidade: 'Florianópolis',  estado: 'SC', ip: '191.60.70.80',   lat: -27.5954, lng: -48.5480, status: 'converteu',          valor: 250.00, source: 'Google Ads' },
  { id: '14', nome: 'Isabela R.',      email: 'is***@gmail.com',    cidade: 'Natal',          estado: 'RN', ip: '177.40.50.60',   lat: -5.7945,  lng: -35.2110, status: 'lead',                              source: 'Meta Ads' },
  { id: '15', nome: 'Jonas K.',        email: 'jo***@outlook.com',  cidade: 'Belém',          estado: 'PA', ip: '189.60.70.80',   lat: -1.4558,  lng: -48.4902, status: 'lead',                              source: 'Orgânico' },
  { id: '16', nome: 'Kelly V.',        email: 'ke***@gmail.com',    cidade: 'São Paulo',      estado: 'SP', ip: '177.71.13.46',   lat: -23.5350, lng: -46.6250, status: 'converteu',          valor: 189.90, source: 'Meta Ads' },
  { id: '17', nome: 'Lucas D.',        email: 'lu***@gmail.com',    cidade: 'São Paulo',      estado: 'SP', ip: '189.31.46.68',   lat: -23.5620, lng: -46.6540, status: 'checkout-abandonado',              source: 'Google Ads' },
  { id: '18', nome: 'Mariana T.',      email: 'ma***@gmail.com',    cidade: 'Rio de Janeiro', estado: 'RJ', ip: '201.21.31.41',   lat: -22.9180, lng: -43.1650, status: 'lead',                              source: 'Meta Ads' },
  { id: '19', nome: 'Nicolas E.',      email: 'ni***@gmail.com',    cidade: 'Curitiba',       estado: 'PR', ip: '191.51.61.71',   lat: -25.4350, lng: -49.2800, status: 'converteu',          valor: 320.00, source: 'Meta Ads' },
  { id: '20', nome: 'Olivia S.',       email: 'ol***@gmail.com',    cidade: 'Belo Horizonte', estado: 'MG', ip: '200.101.51.26',  lat: -19.9220, lng: -43.9400, status: 'lead',                              source: 'Google Ads' },
]
