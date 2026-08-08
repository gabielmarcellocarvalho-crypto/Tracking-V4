export default function CarregandoCliente() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, background: 'var(--bg-base)', minHeight: '100vh',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        border: '3px solid var(--br)', borderTopColor: 'var(--red)',
        animation: 'spin .7s linear infinite',
      }} />
      <p style={{ fontSize: 12, color: 'var(--t3)' }}>Carregando…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
