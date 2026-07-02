// ─── MOTOR DE UTM V4 ──────────────────────────────────────────────────────────
// Constrói, decompõe e valida strings no padrão hierárquico cumulativo V4:
//   utm_campaign = office_regiao_funil_objetivo_cliente_tipo_detalhe
//   utm_term     = utm_campaign_posicionamento_segmentacao_detalhe
//   utm_content  = utm_term_formato_detalhe

import type { UTMCanal, UTMParsed, UTMSet, Origem, EventoIds } from '@/lib/types'
import { VALORES } from './taxonomy'

// ── Slug ──────────────────────────────────────────────────────────────────────
/** minúsculas, sem acento, espaços→hífen, só [a-z0-9-+] */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // underscore é o separador de níveis — vira hífen
    .replace(/[^a-z0-9+-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Build ─────────────────────────────────────────────────────────────────────
export interface BuildUTMInput {
  canal: UTMCanal
  office: string
  regiao: string
  funil: string
  objetivo: string
  cliente: string
  tipo: string
  detalheCampanha?: string
  posicionamento: string
  segmentacao: string
  detalheConjunto?: string
  formato: string
  detalheAnuncio?: string
  source?: string
  medium?: string
}

export interface BuiltUTM extends UTMSet {
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

export function buildUTM(i: BuildUTMInput): BuiltUTM {
  const campParts = [i.office, i.regiao, i.funil, i.objetivo, slugify(i.cliente), i.tipo]
  if (i.detalheCampanha) campParts.push(slugify(i.detalheCampanha))
  const campaign = campParts.join('_')

  const termParts = [campaign, i.posicionamento, i.segmentacao]
  if (i.detalheConjunto) termParts.push(slugify(i.detalheConjunto))
  const term = termParts.join('_')

  const contentParts = [term, i.formato]
  if (i.detalheAnuncio) contentParts.push(slugify(i.detalheAnuncio))
  const content = contentParts.join('_')

  const source = i.source ?? (i.canal === 'other' ? 'whatsapp' : i.canal)
  const medium = i.medium ?? (i.canal === 'other' ? 'organic' : 'paid')

  return { source, medium, campaign, term, content }
}

/** String de parâmetros dinâmicos do Meta (colar no campo "Parâmetros de URL") */
export const META_DINAMICO =
  'utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}'

export function montarUrl(urlBase: string, utm: UTMSet): string {
  if (!urlBase) return ''
  const sep = urlBase.includes('?') ? '&' : '?'
  const params: string[] = []
  if (utm.medium)   params.push(`utm_medium=${utm.medium}`)
  if (utm.source)   params.push(`utm_source=${utm.source}`)
  if (utm.campaign) params.push(`utm_campaign=${utm.campaign}`)
  if (utm.term)     params.push(`utm_term=${utm.term}`)
  if (utm.content)  params.push(`utm_content=${utm.content}`)
  return params.length ? `${urlBase}${sep}${params.join('&')}` : urlBase
}

// ── Parse ─────────────────────────────────────────────────────────────────────
const isDinamico = (s?: string) => !!s && /\{\{.+\}\}/.test(s)

/**
 * Decompõe qualquer conjunto de UTMs nos componentes nomeados do padrão V4.
 * Tolerante: devolve o que conseguir identificar + lista de erros de conformidade.
 */
export function parseUTM(utm: UTMSet): UTMParsed {
  const erros: string[] = []
  const out: UTMParsed = { padraoV4: false, erros }

  const campaign = utm.campaign?.trim()
  if (!campaign) {
    erros.push('utm_campaign ausente')
    return out
  }
  if (isDinamico(campaign)) {
    // Macros do Meta ({{campaign.name}}) — válido, mas não decompõível
    out.padraoV4 = true
    out.erros = []
    return out
  }

  const cParts = campaign.split('_')
  if (cParts.length < 6) {
    erros.push(`utm_campaign tem ${cParts.length} níveis — padrão V4 exige 6+ (office_regiao_funil_objetivo_cliente_tipo[_detalhe])`)
  }
  const [office, regiao, funil, objetivo, cliente, tipo, ...detC] = cParts
  out.campanha = {
    office, regiao, funil, objetivo, cliente, tipo,
    detalhe: detC.length ? detC.join('_') : undefined,
  }

  const low = (s?: string) => s?.toLowerCase() ?? ''
  if (office && !VALORES.offices.has(low(office)) && !office.startsWith('v4-'))
    erros.push(`office "${office}" fora do vocabulário (esperado v4-*)`)
  if (regiao && !VALORES.regioes.has(low(regiao)))
    erros.push(`região "${regiao}" fora do vocabulário`)
  if (funil && !VALORES.funis.has(low(funil)))
    erros.push(`funil "${funil}" fora do vocabulário (awar/cons/perf/topo)`)
  if (objetivo && !VALORES.objetivos.has(low(objetivo)))
    erros.push(`objetivo "${objetivo}" fora do vocabulário`)
  if (tipo && !VALORES.tipos.has(low(tipo)))
    erros.push(`tipo "${tipo}" fora do vocabulário`)

  // utm_term deve herdar utm_campaign
  const term = utm.term?.trim()
  if (term && !isDinamico(term)) {
    if (term.startsWith(campaign + '_')) {
      const [pos, seg, ...detT] = term.slice(campaign.length + 1).split('_')
      out.conjunto = { posicionamento: pos, segmentacao: seg, detalhe: detT.length ? detT.join('_') : undefined }
      if (pos && !VALORES.posicionamentos.has(low(pos)))
        erros.push(`posicionamento "${pos}" fora do vocabulário`)
      if (seg && !VALORES.segmentacoes.has(low(seg)))
        erros.push(`segmentação "${seg}" fora do vocabulário`)
    } else {
      erros.push('utm_term não herda utm_campaign (padrão cumulativo quebrado)')
    }
  }

  // utm_content deve herdar utm_term
  const content = utm.content?.trim()
  if (content && !isDinamico(content)) {
    if (term && content.startsWith(term + '_')) {
      const [formato, ...detA] = content.slice(term.length + 1).split('_')
      out.anuncio = { formato, detalhe: detA.length ? detA.join('_') : undefined }
      if (formato && !VALORES.formatos.has(low(formato)))
        erros.push(`formato "${formato}" fora do vocabulário`)
    } else {
      erros.push('utm_content não herda utm_term (padrão cumulativo quebrado)')
    }
  }

  if (/[A-Z]/.test(campaign.replace(/google-Shop/g, '')))
    erros.push('utm_campaign contém maiúsculas')
  if (/\s/.test(campaign)) erros.push('utm_campaign contém espaços')

  out.padraoV4 = erros.length === 0 && cParts.length >= 6
  return out
}

export interface ValidacaoUTM {
  padraoV4: boolean
  erros: string[]
  /** 0–100 — conformidade aproximada */
  score: number
}

export function validateUTM(utm: UTMSet): ValidacaoUTM {
  const parsed = parseUTM(utm)
  const erros = parsed.erros ?? []
  const totalChecks = 10
  const score = Math.max(0, Math.round(((totalChecks - erros.length) / totalChecks) * 100))
  return { padraoV4: parsed.padraoV4, erros, score }
}

// ── Detecção de origem ────────────────────────────────────────────────────────
export function detectOrigem(utm?: UTMSet, ids?: EventoIds, referrer?: string): Origem {
  if (ids?.gclid || ids?.wbraid || ids?.gbraid) return 'google'
  if (ids?.fbc) return 'meta'

  const source = utm?.source?.toLowerCase() ?? ''
  const medium = utm?.medium?.toLowerCase() ?? ''

  if (['meta', 'facebook', 'instagram', 'fb', 'ig'].includes(source)) return 'meta'
  if (['google', 'youtube'].includes(source)) return 'google'
  if (source === 'email' || medium === 'email') return 'email'
  if (medium === 'organic') return 'organico'
  if (source) return 'outro'

  if (referrer) {
    const r = referrer.toLowerCase()
    if (r.includes('facebook.') || r.includes('instagram.')) return 'meta'
    if (r.includes('google.') || r.includes('bing.') || r.includes('duckduckgo.')) return 'organico'
    return 'outro'
  }
  return 'direto'
}
