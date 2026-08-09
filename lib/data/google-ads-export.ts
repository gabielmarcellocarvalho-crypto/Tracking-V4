import type { GoogleAdsCampanha } from '@/lib/types'

// ─── EXPORT CSV — formato de importação do Google Ads Editor ─────────────────
// Baseado na documentação oficial de colunas do Editor (support.google.com/
// google-ads/editor/answer/57747) e no comportamento confirmado de que TODAS
// as linhas de um CSV combinado compartilham o mesmo cabeçalho — cada linha
// preenche só as colunas relevantes ao tipo dela (Campanha/Grupo/Palavra-
// chave/Anúncio/Sitelink/Callout/Snippet/Telefone), deixando o resto em
// branco. Google Ads Editor identifica o tipo da linha pelas colunas
// preenchidas, não por uma coluna "Row Type" explícita.
//
// IMPORTANTE: as colunas de Sitelink/Callout/Snippet variam mais entre
// versões do Editor do que Campanha/Grupo/Palavra-chave/RSA (essas quatro
// têm confirmação forte). Antes de confiar 100% no arquivo pra contas de
// produção, faça um teste de importação com um CSV pequeno no Google Ads
// Editor e ajuste os nomes de coluna aqui se algo não bater.

const NUM_HEADLINES = 15
const NUM_DESCRICOES = 4

const COLUNAS = [
  'Campaign', 'Campaign Type', 'Campaign Status', 'Budget',
  'Ad group', 'Ad group status', 'Max CPC',
  'Keyword', 'Criterion Type', 'Status',
  ...Array.from({ length: NUM_HEADLINES }, (_, i) => `Headline ${i + 1}`),
  ...Array.from({ length: NUM_DESCRICOES }, (_, i) => `Description ${i + 1}`),
  'Path 1', 'Path 2', 'Final URL',
  'Sitelink text', 'Sitelink final URL', 'Sitelink description line 1', 'Sitelink description line 2',
  'Callout text',
  'Structured snippet header', 'Structured snippet values',
  'Phone number',
] as const

type Linha = Partial<Record<typeof COLUNAS[number], string>>

function escaparCsv(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`
  return valor
}

function linhaParaCsv(linha: Linha): string {
  return COLUNAS.map((c) => escaparCsv(linha[c] ?? '')).join(',')
}

export function gerarCsvGoogleAdsEditor(campanha: GoogleAdsCampanha): string {
  const linhas: Linha[] = []

  // Campanha (uma linha só)
  linhas.push({
    Campaign: campanha.nome,
    'Campaign Type': 'Search',
    'Campaign Status': campanha.status,
    Budget: campanha.orcamentoDiario ? campanha.orcamentoDiario.toFixed(2) : '',
  })

  for (const grupo of campanha.grupos) {
    // Grupo de anúncios
    linhas.push({
      Campaign: campanha.nome,
      'Ad group': grupo.nome,
      'Ad group status': 'Enabled',
      'Max CPC': grupo.maxCpc ? grupo.maxCpc.toFixed(2) : '',
    })

    // Palavras-chave positivas
    for (const p of grupo.palavrasChave) {
      if (!p.texto.trim()) continue
      linhas.push({
        Campaign: campanha.nome, 'Ad group': grupo.nome,
        Keyword: p.texto.trim(), 'Criterion Type': p.tipo, Status: 'Enabled',
      })
    }
    // Palavras-chave negativas
    for (const n of grupo.negativas) {
      if (!n.texto.trim()) continue
      linhas.push({
        Campaign: campanha.nome, 'Ad group': grupo.nome,
        Keyword: n.texto.trim(), 'Criterion Type': `Negative ${n.tipo}`, Status: 'Enabled',
      })
    }

    // Anúncio responsivo de pesquisa (só emite se tiver pelo menos 1 headline)
    const headlines = grupo.headlines.filter((h) => h.trim())
    const descricoes = grupo.descricoes.filter((d) => d.trim())
    if (headlines.length > 0 && grupo.finalUrl.trim()) {
      const linhaAd: Linha = {
        Campaign: campanha.nome, 'Ad group': grupo.nome,
        'Final URL': grupo.finalUrl.trim(), 'Path 1': grupo.path1 ?? '', 'Path 2': grupo.path2 ?? '',
        Status: 'Enabled',
      }
      headlines.slice(0, NUM_HEADLINES).forEach((h, i) => { linhaAd[`Headline ${i + 1}` as keyof Linha] = h.trim().slice(0, 30) })
      descricoes.slice(0, NUM_DESCRICOES).forEach((d, i) => { linhaAd[`Description ${i + 1}` as keyof Linha] = d.trim().slice(0, 90) })
      linhas.push(linhaAd)
    }
  }

  // Recursos — nível de campanha
  for (const s of campanha.sitelinks) {
    if (!s.texto.trim() || !s.finalUrl.trim()) continue
    linhas.push({
      Campaign: campanha.nome,
      'Sitelink text': s.texto.trim(), 'Sitelink final URL': s.finalUrl.trim(),
      'Sitelink description line 1': s.descricao1 ?? '', 'Sitelink description line 2': s.descricao2 ?? '',
    })
  }
  for (const c of campanha.callouts) {
    if (!c.trim()) continue
    linhas.push({ Campaign: campanha.nome, 'Callout text': c.trim() })
  }
  for (const sn of campanha.snippets) {
    if (!sn.header.trim() || sn.valores.every((v) => !v.trim())) continue
    linhas.push({
      Campaign: campanha.nome,
      'Structured snippet header': sn.header.trim(),
      'Structured snippet values': sn.valores.filter((v) => v.trim()).join(';'),
    })
  }
  if (campanha.telefone?.trim()) {
    linhas.push({ Campaign: campanha.nome, 'Phone number': campanha.telefone.trim() })
  }

  const cabecalho = COLUNAS.join(',')
  return [cabecalho, ...linhas.map(linhaParaCsv)].join('\r\n')
}

export function baixarCsv(nomeArquivo: string, conteudo: string) {
  // BOM UTF-8 — sem isso o Excel/Google Sheets abre acentuação (ç, ã, é) quebrada.
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
