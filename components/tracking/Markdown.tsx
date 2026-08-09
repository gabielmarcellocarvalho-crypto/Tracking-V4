'use client'

// Renderizador markdown minimalista (títulos, negrito, bullets, tabelas) —
// usado pelo Agente IA e pelo painel de notificações (mesmo formato de
// resposta/insight). O modelo às vezes responde com tabelas em pipe (`| a | b |`)
// — sem suporte a isso elas apareciam como texto cru com barras verticais.

function renderInline(s: string, keyBase: string | number) {
  const partes = s.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={`${keyBase}-${i}`} style={{ color: 'var(--t1)' }}>{p.slice(2, -2)}</strong>
      : <span key={`${keyBase}-${i}`}>{p}</span>
  )
}

const EH_LINHA_TABELA = (l: string) => /^\s*\|.*\|\s*$/.test(l)
const EH_SEPARADOR_TABELA = (l: string) => /^\s*\|?[\s:-]*\|[\s:|-]*\|?\s*$/.test(l) && l.includes('-')

function celulasDaLinha(l: string) {
  return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

function TabelaMarkdown({ linhas, keyBase }: { linhas: string[]; keyBase: string | number }) {
  const cabecalho = celulasDaLinha(linhas[0])
  const corpo = linhas.slice(2).map(celulasDaLinha)
  return (
    <div key={keyBase} style={{ overflowX: 'auto', margin: '2px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11.5 }}>
        <thead>
          <tr>
            {cabecalho.map((c, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '5px 10px', borderBottom: '1px solid var(--br)',
                color: 'var(--t3)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.03em',
                whiteSpace: 'nowrap',
              }}>
                {renderInline(c, `${keyBase}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corpo.map((linha, i) => (
            <tr key={i}>
              {linha.map((c, j) => (
                <td key={j} style={{
                  padding: '5px 10px', borderBottom: '1px solid var(--br)',
                  color: 'var(--t2)', whiteSpace: 'nowrap',
                }}>
                  {renderInline(c, `${keyBase}-${i}-${j}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Markdown({ texto }: { texto: string }) {
  const linhas = texto.split('\n')
  const blocos: React.ReactNode[] = []

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]

    // Bloco de tabela: linha de cabeçalho + separador (|---|---|) + linhas de dados
    if (EH_LINHA_TABELA(l) && linhas[i + 1] && EH_SEPARADOR_TABELA(linhas[i + 1])) {
      const tabela = [l, linhas[i + 1]]
      let j = i + 2
      while (j < linhas.length && EH_LINHA_TABELA(linhas[j])) {
        tabela.push(linhas[j])
        j++
      }
      blocos.push(<TabelaMarkdown key={i} linhas={tabela} keyBase={i} />)
      i = j - 1
      continue
    }

    if (l.startsWith('### ')) { blocos.push(<h4 key={i} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', margin: '8px 0 0' }}>{l.slice(4)}</h4>); continue }
    if (l.startsWith('## '))  { blocos.push(<h3 key={i} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(3)}</h3>); continue }
    if (l.startsWith('# '))   { blocos.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(2)}</h3>); continue }
    if (/^\s*[-•*] /.test(l)) {
      blocos.push(
        <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
          <span style={{ color: 'var(--red)', flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{renderInline(l.replace(/^\s*[-•*] /, ''), i)}</span>
        </div>
      )
      continue
    }
    if (/^\s*\d+\. /.test(l)) {
      const [, num, resto] = l.match(/^\s*(\d+)\. (.*)$/) ?? []
      blocos.push(
        <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
          <span style={{ color: 'var(--red)', fontWeight: 700, flexShrink: 0 }}>{num}.</span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{renderInline(resto ?? l, i)}</span>
        </div>
      )
      continue
    }
    if (l.startsWith('> ')) {
      blocos.push(
        <div key={i} style={{
          padding: '8px 11px', borderRadius: 7, borderLeft: '3px solid var(--red)',
          background: 'rgba(200,16,46,.06)', fontSize: 12, color: 'var(--t2)', lineHeight: 1.55,
        }}>
          {renderInline(l.slice(2), i)}
        </div>
      )
      continue
    }
    if (/^-{3,}$/.test(l.trim())) { blocos.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--br)', margin: '4px 0' }} />); continue }
    if (!l.trim()) continue
    blocos.push(<p key={i} style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, margin: 0 }}>{renderInline(l, i)}</p>)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {blocos}
    </div>
  )
}
