// ─── GEO PARA O MAPA DE LEADS ─────────────────────────────────────────────────
// Isolado da agregacoes.ts de propósito: br-municipios.json tem ~200KB e só a
// página /mapa precisa disso — se ficasse no módulo compartilhado, toda página
// que importa qualquer função de agregacoes.ts (jornada, performance, agente)
// carregaria esses ~200KB à toa.

import type { Identidade } from '@/lib/types'
import type { LeadGeo } from '@/lib/demo-data'
import municipiosBR from '@/lib/data/br-municipios.json'

// Coordenadas aproximadas por capital de estado (fallback quando a cidade não bate no dataset)
const COORD_ESTADO: Record<string, [number, number]> = {
  AC: [-9.98, -67.81], AL: [-9.65, -35.71], AP: [0.03, -51.05], AM: [-3.12, -60.02],
  BA: [-12.97, -38.50], CE: [-3.73, -38.53], DF: [-15.78, -47.93], ES: [-20.32, -40.34],
  GO: [-16.69, -49.26], MA: [-2.53, -44.30], MT: [-15.60, -56.10], MS: [-20.44, -54.65],
  MG: [-19.92, -43.93], PA: [-1.46, -48.49], PB: [-7.12, -34.86], PR: [-25.43, -49.27],
  PE: [-8.06, -34.88], PI: [-5.09, -42.80], RJ: [-22.91, -43.17], RN: [-5.79, -35.21],
  RS: [-30.03, -51.22], RO: [-8.76, -63.90], RR: [2.82, -60.67], SC: [-27.60, -48.55],
  SP: [-23.55, -46.63], SE: [-10.91, -37.07], TO: [-10.17, -48.33],
}

function normalizarTexto(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const MUNICIPIOS_BR = municipiosBR as unknown as Record<string, [number, number]>

/** Resolve coordenada real do lead: cidade exata > centro do estado > null (fora do Brasil / não identificável). */
function resolverCoordenada(cidade: string | undefined, uf: string, pais: string | undefined): [number, number] | null {
  // Sinal mais confiável é o país (vem do IP) — evita, por ex., um "PA" dos EUA
  // (Pennsylvania) ser lido como o "PA" brasileiro (Pará) só pela sigla batendo.
  if (pais && pais.toUpperCase() !== 'BR') return null
  if (!(uf in COORD_ESTADO)) return null

  if (cidade) {
    const chave = `${normalizarTexto(cidade)}|${uf}`
    const coordCidade = MUNICIPIOS_BR[chave]
    if (coordCidade) return coordCidade
  }
  return COORD_ESTADO[uf]
}

export interface GeoResultado {
  pontos: LeadGeo[]
  /** fora do Brasil ou com estado/país não identificável — não entram no mapa pra não posicionar errado */
  foraDoMapa: number
}

export function identidadesParaGeo(identidades: Identidade[]): GeoResultado {
  const pontos: LeadGeo[] = []
  let foraDoMapa = 0

  for (const i of identidades) {
    // Visitante que só teve page_view não é lead — não polui o mapa; fica só em Tracking/Performance
    if (i.status === 'visitante') continue
    if (!i.geo?.estado && !i.geo?.cidade) continue

    const uf = (i.geo?.estado ?? '').toUpperCase()
    const coordenada = resolverCoordenada(i.geo?.cidade, uf, i.geo?.pais)
    if (!coordenada) { foraDoMapa++; continue }

    const [lat, lng] = coordenada
    // jitter leve só quando cai no centro do estado (cidade não identificada) —
    // evita empilhar; coordenada real de cidade não precisa de jitter.
    const cidadeEncontrada = i.geo?.cidade && MUNICIPIOS_BR[`${normalizarTexto(i.geo.cidade)}|${uf}`]
    const seed = String(i.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const jitterLat = cidadeEncontrada ? 0 : ((seed % 20) - 10) * 0.01
    const jitterLng = cidadeEncontrada ? 0 : ((seed % 17) - 8) * 0.01

    const status: LeadGeo['status'] =
      i.status === 'cliente' ? 'converteu' : i.status === 'checkout' ? 'checkout-abandonado' : 'lead'

    pontos.push({
      id: String(i.id),
      nome: i.nome ?? i.emails[0]?.split('@')[0] ?? 'Visitante',
      email: i.emails[0] ? i.emails[0].slice(0, 2) + '***@' + i.emails[0].split('@')[1] : '—',
      cidade: i.geo?.cidade ?? '—',
      estado: uf || '—',
      ip: i.ips[0] ?? '—',
      lat: lat + jitterLat,
      lng: lng + jitterLng,
      status,
      valor: i.valorTotal > 0 ? i.valorTotal : undefined,
      source: i.atribuicao?.plataforma ?? 'Direto',
      jornada: String(i.id),
    })
  }

  return { pontos, foraDoMapa }
}
