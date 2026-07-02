// ─── MOCK DATA — Tracking V4 ────────────────────────────────────────────────
// TODO: Substituir por chamadas reais à API / Firestore

export interface KPIData {
  label: string
  value: string
  trendLabel: string
  direction: 'up' | 'down'
  accentColor: string
  icon: string
}

export interface FunnelStep {
  label: string
  count: number
  percentage: number
  color: string
}

export interface ChartDay {
  day: string
  investment: number
  revenue: number
}

export type LeadSource = 'Meta Ads' | 'Google Ads' | 'Orgânico' | 'GA4'
export type LeadEvent = 'Compra' | 'Checkout' | 'Lead' | 'Page View'

export interface Lead {
  id: string
  name: string
  email: string
  source: LeadSource
  campaign: string
  event: LeadEvent
  date: string
}

// TODO: conectar Meta Ads API + Google Ads API
export const kpiData: KPIData[] = [
  {
    label: 'Investimento',
    value: 'R$18.420',
    trendLabel: '↑ +12,4% vs. mês ant.',
    direction: 'up',
    accentColor: '#F97316',
    icon: '💰',
  },
  {
    label: 'Receita Atribuída',
    value: 'R$94.200',
    trendLabel: '↑ +28,1% vs. mês ant.',
    direction: 'up',
    accentColor: '#10B981',
    icon: '📈',
  },
  {
    label: 'ROAS Geral',
    value: '5.11x',
    trendLabel: '↑ +0,7x vs. mês ant.',
    direction: 'up',
    accentColor: '#3B82F6',
    icon: '🎯',
  },
  {
    label: 'Leads Captados',
    value: '1.847',
    trendLabel: '↑ +8,3% vs. mês ant.',
    direction: 'up',
    accentColor: '#8B5CF6',
    icon: '👥',
  },
]

// TODO: conectar GA4 + Meta CAPI + Google Conversions
export const funnelData: FunnelStep[] = [
  { label: 'Page View', count: 42830, percentage: 100, color: '#3B82F6' },
  { label: 'Lead',      count: 18416, percentage: 43,  color: '#F97316' },
  { label: 'Checkout',  count: 8996,  percentage: 21,  color: '#8B5CF6' },
  { label: 'Compra',    count: 3855,  percentage: 9,   color: '#10B981' },
]

// TODO: conectar Meta Ads API + Google Ads API (daily breakdown)
export const chartData: ChartDay[] = [
  { day: 'Seg', investment: 2100, revenue: 9800  },
  { day: 'Ter', investment: 2800, revenue: 12400 },
  { day: 'Qua', investment: 2400, revenue: 11200 },
  { day: 'Qui', investment: 3200, revenue: 16800 },
  { day: 'Sex', investment: 3100, revenue: 15900 },
  { day: 'Sáb', investment: 2600, revenue: 13200 },
  { day: 'Dom', investment: 2220, revenue: 10900 },
]

// TODO: conectar Firestore (clientes/{clienteId}/leads)
export const leadsData: Lead[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    source: 'Meta Ads',
    campaign: 'CAM_META_CONV_JUN',
    event: 'Compra',
    date: '13/06/2026',
  },
  {
    id: '2',
    name: 'João Oliveira',
    email: 'joao.o@gmail.com',
    source: 'Google Ads',
    campaign: 'BRAND_SEARCH_JUN',
    event: 'Checkout',
    date: '13/06/2026',
  },
  {
    id: '3',
    name: 'Ana Ferreira',
    email: 'ana.ferreira@hotmail.com',
    source: 'Meta Ads',
    campaign: 'CAM_META_PROS_JUN',
    event: 'Lead',
    date: '12/06/2026',
  },
  {
    id: '4',
    name: 'Carlos Lima',
    email: 'carlos.lima@empresa.com',
    source: 'Google Ads',
    campaign: 'DISPLAY_RETAR_JUN',
    event: 'Compra',
    date: '12/06/2026',
  },
  {
    id: '5',
    name: 'Patricia Souza',
    email: 'p.souza@outlook.com',
    source: 'Orgânico',
    campaign: '—',
    event: 'Lead',
    date: '11/06/2026',
  },
]

export const sourceChips = [
  { id: 'meta',   label: 'Meta Ads',   color: '#1877F2', defaultOn: true  },
  { id: 'google', label: 'Google Ads', color: '#4285F4', defaultOn: true  },
  { id: 'ga4',    label: 'GA4',        color: '#E37400', defaultOn: true  },
  { id: 'shopify',label: 'Shopify',    color: '#96BF48', defaultOn: false },
]
