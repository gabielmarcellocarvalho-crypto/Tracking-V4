// Mock data for the Tracking / Events page

export type EventStatus = 'online' | 'warning' | 'offline'

export interface EventHealth {
  id: string
  label: string
  description: string
  status: EventStatus
  lastFired: string       // relative "há 2 min"
  lastFiredAgo: number   // minutes ago (for logic)
  countToday: number
  countWeek: number
  alert?: string
  icon: string            // SVG path
  color: string
}

export const eventHealthData: EventHealth[] = [
  {
    id: 'page_view',
    label: 'Page View',
    description: 'Visualização de página',
    status: 'online',
    lastFired: 'há 1 min',
    lastFiredAgo: 1,
    countToday: 3_847,
    countWeek: 24_312,
    icon: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    color: '#10B981',
  },
  {
    id: 'lead',
    label: 'Lead',
    description: 'Formulário / conversão',
    status: 'online',
    lastFired: 'há 8 min',
    lastFiredAgo: 8,
    countToday: 142,
    countWeek: 891,
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    color: '#8B5CF6',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    description: 'Início de checkout',
    status: 'warning',
    lastFired: 'há 4 horas',
    lastFiredAgo: 240,
    countToday: 11,
    countWeek: 203,
    alert: 'Intervalo longo — verificar pixel',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    color: '#F59E0B',
  },
  {
    id: 'compra',
    label: 'Compra',
    description: 'Venda finalizada',
    status: 'offline',
    lastFired: 'há 26 horas',
    lastFiredAgo: 1560,
    countToday: 0,
    countWeek: 47,
    alert: 'Evento parado há mais de 24h — verificar integração',
    icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 15v-4H7l5-8v4h4l-5 8z',
    color: '#EF4444',
  },
]

// Volume por dia (últimos 7 dias)
export const eventVolumeData = [
  { dia: 'Seg', page_view: 3100, lead: 118, checkout: 28, compra: 9 },
  { dia: 'Ter', page_view: 3540, lead: 132, checkout: 31, compra: 11 },
  { dia: 'Qua', page_view: 2890, lead: 97,  checkout: 22, compra: 7  },
  { dia: 'Qui', page_view: 4210, lead: 156, checkout: 40, compra: 14 },
  { dia: 'Sex', page_view: 4800, lead: 178, checkout: 42, compra: 13 },
  { dia: 'Sáb', page_view: 3200, lead: 121, checkout: 29, compra: 8  },
  { dia: 'Dom', page_view: 2600, lead: 89,  checkout: 11, compra: 0  },
]

// Por fonte de tráfego
export const eventBySource = [
  { name: 'Meta Ads',     value: 42, color: '#1877F2' },
  { name: 'Google Ads',   value: 28, color: '#4285F4' },
  { name: 'Orgânico',     value: 18, color: '#10B981' },
  { name: 'Direto',       value: 8,  color: '#6B7280' },
  { name: 'Email',        value: 4,  color: '#F59E0B' },
]

// Heatmap por página
export interface PageHeatEntry {
  page: string
  events: number
  leads: number
  compras: number
  pct: number
}

export const pageHeatData: PageHeatEntry[] = [
  { page: '/',                    events: 8_340, leads: 0,   compras: 0,  pct: 100 },
  { page: '/produto/kit-adesivos', events: 5_210, leads: 0,   compras: 23, pct: 62  },
  { page: '/checkout',            events: 2_400, leads: 0,   compras: 0,  pct: 29  },
  { page: '/obrigado',            events: 1_890, leads: 0,   compras: 47, pct: 23  },
  { page: '/contato',             events: 1_240, leads: 89,  compras: 0,  pct: 15  },
  { page: '/sobre',               events: 980,   leads: 0,   compras: 0,  pct: 12  },
  { page: '/blog/dicas-growth',   events: 670,   leads: 12,  compras: 0,  pct: 8   },
  { page: '/lp/black-friday',     events: 540,   leads: 41,  compras: 9,  pct: 6   },
]

// Drill-down de eventos
export interface EventLogItem {
  id: string
  hora: string
  origem: string
  pagina: string
  valor?: string
  produto?: string
  dispositivo: string
}

export const eventLogs: Record<string, EventLogItem[]> = {
  page_view: [
    { id: '1', hora: '09:42:11', origem: 'Meta Ads',   pagina: '/',                  dispositivo: 'Mobile' },
    { id: '2', hora: '09:41:55', origem: 'Google Ads', pagina: '/produto/kit-adesivos', dispositivo: 'Desktop' },
    { id: '3', hora: '09:41:33', origem: 'Orgânico',   pagina: '/blog/dicas-growth', dispositivo: 'Mobile' },
    { id: '4', hora: '09:40:59', origem: 'Meta Ads',   pagina: '/',                  dispositivo: 'Mobile' },
    { id: '5', hora: '09:40:22', origem: 'Direto',     pagina: '/sobre',              dispositivo: 'Desktop' },
    { id: '6', hora: '09:39:47', origem: 'Google Ads', pagina: '/contato',            dispositivo: 'Tablet'  },
  ],
  lead: [
    { id: '1', hora: '09:41:02', origem: 'Meta Ads',   pagina: '/contato',            dispositivo: 'Mobile' },
    { id: '2', hora: '09:33:48', origem: 'Google Ads', pagina: '/lp/black-friday',    dispositivo: 'Desktop' },
    { id: '3', hora: '09:18:22', origem: 'Meta Ads',   pagina: '/blog/dicas-growth',  dispositivo: 'Mobile' },
    { id: '4', hora: '08:57:11', origem: 'Orgânico',   pagina: '/contato',            dispositivo: 'Mobile' },
    { id: '5', hora: '08:42:30', origem: 'Meta Ads',   pagina: '/lp/black-friday',    dispositivo: 'Desktop' },
  ],
  checkout: [
    { id: '1', hora: '05:12:08', origem: 'Meta Ads',   pagina: '/checkout',  produto: 'Kit Adesivos Pro', valor: 'R$89,90',  dispositivo: 'Mobile' },
    { id: '2', hora: '04:58:44', origem: 'Google Ads', pagina: '/checkout',  produto: 'Curso Online',     valor: 'R$197,00', dispositivo: 'Desktop' },
    { id: '3', hora: '03:30:19', origem: 'Meta Ads',   pagina: '/checkout',  produto: 'Kit Adesivos Pro', valor: 'R$89,90',  dispositivo: 'Mobile' },
  ],
  compra: [
    { id: '1', hora: '07:22:14', origem: 'Meta Ads',   pagina: '/obrigado', produto: 'Kit Adesivos Pro', valor: 'R$89,90',  dispositivo: 'Desktop' },
    { id: '2', hora: '06:48:33', origem: 'Google Ads', pagina: '/obrigado', produto: 'Curso Online',     valor: 'R$197,00', dispositivo: 'Mobile' },
  ],
}
