'use client'

// Renderizador markdown minimalista (títulos, negrito, bullets) — usado pelo
// Agente IA e pelo painel de notificações (mesmo formato de resposta/insight).
export default function Markdown({ texto }: { texto: string }) {
  const linhas = texto.split('\n')
  const render = (s: string) => {
    const partes = s.split(/(\*\*[^*]+\*\*)/g)
    return partes.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--t1)' }}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {linhas.map((l, i) => {
        if (l.startsWith('### ')) return <h4 key={i} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', margin: '8px 0 0' }}>{l.slice(4)}</h4>
        if (l.startsWith('## '))  return <h3 key={i} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(3)}</h3>
        if (l.startsWith('# '))   return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '10px 0 0' }}>{l.slice(2)}</h3>
        if (/^\s*[-•*] /.test(l)) return (
          <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
            <span style={{ color: 'var(--red)', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{render(l.replace(/^\s*[-•*] /, ''))}</span>
          </div>
        )
        if (!l.trim()) return null
        return <p key={i} style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, margin: 0 }}>{render(l)}</p>
      })}
    </div>
  )
}
