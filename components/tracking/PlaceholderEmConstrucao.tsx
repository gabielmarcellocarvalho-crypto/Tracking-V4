'use client'

export default function PlaceholderEmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: '60px 24px', textAlign: 'center',
      background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 14,
    }}>
      <span style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--red), var(--purple))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={24} height={24}>
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
      </span>
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{titulo}</p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '8px 0 0', lineHeight: 1.6 }}>{descricao}</p>
      </div>
    </div>
  )
}
