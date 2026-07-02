// ─── TAXONOMIA UTM V4 ─────────────────────────────────────────────────────────
// Vocabulário oficial extraído das planilhas "PAID MEDIA / URL Builder V4 - CO"
// (pasta "Planilhas Modelos UTM/"). Cada item: rótulo legível + valor usado na string.

export interface TaxItem {
  label: string
  valor: string
}

// ── Offices / Squads ──────────────────────────────────────────────────────────
export const OFFICES: TaxItem[] = [
  { label: 'Atena',          valor: 'v4-ate' },
  { label: 'Falcon',         valor: 'v4-fal' },
  { label: 'Grandes contas', valor: 'v4-web' },
  { label: 'Thunder',        valor: 'v4-thu' },
]

// ── Países / Regiões / UFs ────────────────────────────────────────────────────
export const REGIOES: TaxItem[] = [
  { label: 'Brasil', valor: 'br' },
  { label: 'Acre', valor: 'ac' }, { label: 'Alagoas', valor: 'al' },
  { label: 'Amapá', valor: 'ap' }, { label: 'Amazonas', valor: 'am' },
  { label: 'Bahia', valor: 'ba' }, { label: 'Ceará', valor: 'ce' },
  { label: 'Distrito Federal', valor: 'df' }, { label: 'Espírito Santo', valor: 'es' },
  { label: 'Goiás', valor: 'go' }, { label: 'Maranhão', valor: 'ma' },
  { label: 'Mato Grosso', valor: 'mt' }, { label: 'Mato Grosso do Sul', valor: 'ms' },
  { label: 'Minas Gerais', valor: 'mg' }, { label: 'Pará', valor: 'pa' },
  { label: 'Paraíba', valor: 'pb' }, { label: 'Paraná', valor: 'pr' },
  { label: 'Pernambuco', valor: 'pe' }, { label: 'Piauí', valor: 'pi' },
  { label: 'Rio de Janeiro', valor: 'rj' }, { label: 'Rio Grande do Norte', valor: 'rn' },
  { label: 'Rio Grande do Sul', valor: 'rs' }, { label: 'Rondônia', valor: 'ro' },
  { label: 'Roraima', valor: 'rr' }, { label: 'Santa Catarina', valor: 'sc' },
  { label: 'São Paulo', valor: 'sp' }, { label: 'Sergipe', valor: 'se' },
  { label: 'Tocantins', valor: 'to' },
  { label: 'Centro-Oeste', valor: 'centro-oeste' }, { label: 'Sudeste', valor: 'sudeste' },
  { label: 'Sul', valor: 'sul' }, { label: 'Norte', valor: 'norte' },
  { label: 'Nordeste', valor: 'nordeste' },
  { label: 'Praça personalizada', valor: 'pra-perso' },
]

// ── Etapas de funil ───────────────────────────────────────────────────────────
export const FUNIS: TaxItem[] = [
  { label: 'Awareness',     valor: 'awar' },
  { label: 'Consideração',  valor: 'cons' },
  { label: 'Performance',   valor: 'perf' },
  { label: 'Topo de funil', valor: 'topo' },
]

// ── Objetivos ─────────────────────────────────────────────────────────────────
export const OBJETIVOS: TaxItem[] = [
  { label: 'Alcance',                     valor: 'alc' },
  { label: 'Views',                       valor: 'viw' },
  { label: 'Tráfego',                     valor: 'tra' },
  { label: 'Envolvimento',                valor: 'env' },
  { label: 'Cadastro',                    valor: 'cad' },
  { label: 'Lead — eventos e webinários', valor: 'led' },
  { label: 'Lead',                        valor: 'lead' },
  { label: 'Venda',                       valor: 'ved' },
  { label: 'Instalação do App',           valor: 'aci' },
  { label: 'Engajamento com o App',       valor: 'ace' },
  { label: 'Seguidores',                  valor: 'seg' },
  { label: 'Engajamento',                 valor: 'eng' },
  { label: 'Local / PDV',                 valor: 'pdv' },
]

// ── Tipos de campanha / canal ─────────────────────────────────────────────────
export const TIPOS_META: TaxItem[] = [
  { label: 'Link externo (tráfego para o site)', valor: 'link' },
  { label: 'Lead Ad (form nativo)',              valor: 'fb-leadad' },
  { label: 'Impulsionamento de post',            valor: 'post' },
]

export const TIPOS_GOOGLE: TaxItem[] = [
  { label: 'Search — anúncio de texto',        valor: 'search' },
  { label: 'Performance Max',                  valor: 'max' },
  { label: 'Google Shopping',                  valor: 'google-Shop' },
  { label: 'Display — banners',                valor: 'display' },
  { label: 'Discovery',                        valor: 'discovery' },
  { label: 'YouTube',                          valor: 'youtube' },
  { label: 'Geração de demanda',               valor: 'gdm' },
  { label: 'Google Local',                     valor: 'google-local' },
  { label: 'Visitas a lojas locais',           valor: 'gmn' },
  { label: 'Search Lead Ad (form nativo)',     valor: 'src-leadad' },
]

export const TIPOS_LINKEDIN: TaxItem[] = [
  { label: 'Lead Ad (form nativo)',       valor: 'in-leadad' },
  { label: 'Post impulsionado',           valor: 'in-post' },
  { label: 'Anúncio em vídeo',            valor: 'in-video' },
]

export const TIPOS_OUTROS: TaxItem[] = [
  { label: 'Anúncios na TV',       valor: 'tv' },
  { label: 'Anúncios em portais',  valor: 'portal' },
  { label: 'Pushnews — texto',     valor: 'push' },
  { label: 'Native Ads',           valor: 'native' },
]

// ── Segmentações ──────────────────────────────────────────────────────────────
export const SEGMENTACOES: TaxItem[] = [
  { label: 'Interesses',                          valor: 'int' },
  { label: 'Lookalike / público semelhante',      valor: 'lal' },
  { label: 'Listas de clientes',                  valor: 'lis' },
  { label: 'Mais de um segmento ao mesmo tempo',  valor: 'all' },
  { label: 'Remarketing',                         valor: 'rmkt' },
  { label: 'Palavra-chave',                       valor: 'kw' },
  { label: 'Tópico',                              valor: 'top' },
  { label: 'In-Market',                           valor: 'in-mkt' },
  { label: 'Engajamento orgânico',                valor: 'eng' },
  { label: 'Pageview — visitantes do site',       valor: 'pgv' },
  { label: 'Demográfico',                         valor: 'dmg' },
  { label: 'Segmentação dinâmica (Google Ads)',   valor: 'din' },
  { label: 'Behavior',                            valor: 'bhv' },
  { label: 'Inteligência artificial',             valor: 'ia' },
  { label: 'Aberto',                              valor: 'abrt' },
]

// ── Posicionamentos ───────────────────────────────────────────────────────────
export const POSICIONAMENTOS: TaxItem[] = [
  { label: 'Automático / mais de um posicionamento', valor: 'all' },
  { label: 'Apenas Facebook',                        valor: 'fb' },
  { label: 'Apenas Instagram',                       valor: 'ig' },
  { label: 'Apenas Stories',                         valor: 'sto' },
  { label: 'Apenas Feed',                            valor: 'fd' },
  { label: 'Grupos do Facebook',                     valor: 'gp' },
  { label: 'YouTube Bumper',                         valor: 'yt-bp' },
  { label: 'YouTube TrueView For Action',            valor: 'yt-fa' },
  { label: 'YouTube TrueView',                       valor: 'yt-tv' },
  { label: 'YouTube Discovery',                      valor: 'yt-dv' },
  { label: 'TikTok',                                 valor: 'tkt' },
  { label: 'TikTok Shop',                            valor: 'tk-shop' },
]

// ── Formatos (anúncio) ────────────────────────────────────────────────────────
export const FORMATOS: TaxItem[] = [
  { label: 'Link ad — single ad',              valor: 'linkad' },
  { label: 'Carrossel',                        valor: 'carrossel' },
  { label: 'Stories',                          valor: 'stories' },
  { label: 'Vídeo +30s',                       valor: 'video-+30' },
  { label: 'Vídeo 30s',                        valor: 'video-30' },
  { label: 'Vídeo 15s',                        valor: 'video-15' },
  { label: 'Vídeo 10s',                        valor: 'video-10' },
  { label: 'Vídeo 5s',                         valor: 'video-5' },
  { label: 'Anúncio dinâmico',                 valor: 'dinamico' },
  { label: 'Banner IAB (Display)',             valor: 'banner-iab' },
  { label: 'Banner responsivo (Display)',      valor: 'banner-responsivo' },
  { label: 'Collection',                       valor: 'collection' },
  { label: 'Post orgânico',                    valor: 'post-organico' },
  { label: 'Texto expandido',                  valor: 'txt-ex' },
  { label: 'Texto responsivo',                 valor: 'txt-resp' },
  { label: 'Texto push',                       valor: 'txt-push' },
  { label: 'Native Ads',                       valor: 'native' },
  { label: 'Anúncio PMax',                     valor: 'pmax-ad' },
  { label: 'Anúncio Search',                   valor: 'srch-ad' },
  { label: 'Sitelinks',                        valor: 'stlk' },
]

// ── Sources / Mediums ─────────────────────────────────────────────────────────
export const SOURCES_PAID: TaxItem[] = [
  { label: 'Meta (Facebook/Instagram)', valor: 'meta' },
  { label: 'Google',    valor: 'google' },
  { label: 'LinkedIn',  valor: 'linkedin' },
  { label: 'TikTok',    valor: 'tiktok' },
  { label: 'Bing',      valor: 'bing' },
  { label: 'Pinterest', valor: 'pinterest' },
  { label: 'Twitter/X', valor: 'twitter' },
  { label: 'Spotify',   valor: 'spotify' },
  { label: 'Waze',      valor: 'waze' },
  { label: 'DV360',     valor: 'dv360' },
  { label: 'Taboola',   valor: 'taboola' },
  { label: 'Outbrain',  valor: 'outbrain' },
]

export const SOURCES_OTHER: TaxItem[] = [
  { label: 'WhatsApp',    valor: 'whatsapp' },
  { label: 'E-mail',      valor: 'email' },
  { label: 'Eventos',     valor: 'eventos' },
  { label: 'Portal',      valor: 'portal' },
  { label: 'Folheteria',  valor: 'folheteria' },
  { label: 'SMS',         valor: 'sms' },
  { label: 'Interno',     valor: 'interno' },
  { label: 'Zendesk',     valor: 'zendesk' },
  { label: 'Referral',    valor: 'referal' },
  { label: 'Sales',       valor: 'sales' },
  { label: 'TV',          valor: 'tv' },
]

export const TIPOS_PECA_OTHER: TaxItem[] = [
  { label: 'Hiperlink',          valor: 'hiperlink' },
  { label: 'Banner',             valor: 'banner' },
  { label: 'Botão "saiba mais"', valor: 'button-learn-more' },
  { label: 'QR Code',            valor: 'qr-code' },
  { label: 'Pop-up',             valor: 'popup' },
  { label: 'Post de blog',       valor: 'post-blog' },
  { label: 'Notification bar',   valor: 'notification-bar' },
  { label: 'Release',            valor: 'release' },
  { label: 'Side banner',        valor: 'side-banner' },
  { label: 'Foto',               valor: 'photo' },
  { label: 'Descrição',          valor: 'description' },
  { label: 'Link interno',       valor: 'internal-link' },
]

// ── Lookups auxiliares ────────────────────────────────────────────────────────
export const TIPOS_POR_CANAL = {
  meta: TIPOS_META,
  google: TIPOS_GOOGLE,
  linkedin: TIPOS_LINKEDIN,
  other: TIPOS_OUTROS,
} as const

const valores = (items: TaxItem[]) => new Set(items.map((i) => i.valor.toLowerCase()))

export const VALORES = {
  offices:         valores(OFFICES),
  regioes:         valores(REGIOES),
  funis:           valores(FUNIS),
  objetivos:       valores(OBJETIVOS),
  tipos:           valores([...TIPOS_META, ...TIPOS_GOOGLE, ...TIPOS_LINKEDIN, ...TIPOS_OUTROS]),
  segmentacoes:    valores(SEGMENTACOES),
  posicionamentos: valores(POSICIONAMENTOS),
  formatos:        valores(FORMATOS),
}

export function labelDe(items: TaxItem[], valor?: string): string | undefined {
  if (!valor) return undefined
  return items.find((i) => i.valor.toLowerCase() === valor.toLowerCase())?.label
}
