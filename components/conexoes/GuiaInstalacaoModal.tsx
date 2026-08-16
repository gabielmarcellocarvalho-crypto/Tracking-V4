'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Passo {
  titulo: string
  onde: string
  codigo: string
  cor: string
}

// Os valores abaixo (189.90, e-mail, nome do produto) são só exemplo pra
// mostrar o formato — na página real, troque pela variável dinâmica que a
// plataforma do site já expõe pro valor/e-mail/produto daquele pedido
// específico (cada plataforma expõe isso de um jeito diferente).
function montarPassos(): Passo[] {
  return [
    {
      titulo: '1. Checkout — cole na página de checkout',
      onde: 'Ex: /checkout, /finalizar-compra — dispara assim que o cliente entra nessa página.',
      cor: '#8B5CF6',
      codigo: `<script>\n  v4track('checkout', {\n    valor: 189.90  // exemplo — troque pelo valor real do carrinho\n  })\n</script>`,
    },
    {
      titulo: '2. Compra — cole na página de pedido confirmado',
      onde: 'Ex: "Pedido realizado com sucesso" / "Obrigado pela compra" — a página que só carrega depois do pagamento aprovado.',
      cor: '#F59E0B',
      codigo: `<script>\n  v4track('compra', {\n    email: 'cliente@email.com',      // exemplo — e-mail real do pedido\n    valor: 189.90,                    // exemplo — valor real do pedido\n    produto: 'Nome do Produto',       // exemplo — nome real do produto\n    transactionId: 'PEDIDO123'        // id real do pedido — evita contar 2x\n  })\n</script>`,
    },
  ]
}

function BlocoCodigo({ codigo, cor }: { codigo: string; cor: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        margin: 0, padding: '12px 14px', borderRadius: 8, fontSize: 11.5,
        fontFamily: 'monospace', color: 'var(--t2)', background: 'var(--bg-base)',
        border: '1px solid var(--br)', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre',
      }}>{codigo}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
        style={{
          position: 'absolute', top: 8, right: 8,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: copiado ? 'rgba(16,185,129,.12)' : 'var(--bg-c)',
          border: `1px solid ${copiado ? '#10B981' : 'var(--br)'}`,
          color: copiado ? '#10B981' : cor, cursor: 'pointer',
        }}
      >
        {copiado ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  )
}

export default function GuiaInstalacaoModal({ onClose }: { onClose: () => void }) {
  const passos = montarPassos()

  // Sem isso, a página por baixo rolava junto com o modal aberto.
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
            borderRadius: 14, padding: 26, background: 'var(--bg-c)', border: '1px solid var(--br)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
              Instalar Checkout e Compra
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 20px', lineHeight: 1.6 }}>
            O snippet já rastreia page_view sozinho, mas checkout e compra precisam desse código colado na página certa do site — sem isso, esses dois continuam aparecendo zerados mesmo com venda real acontecendo.
          </p>

          {/* Passos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {passos.map((p) => (
              <div key={p.titulo}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: p.cor, margin: '0 0 3px' }}>{p.titulo}</p>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.5 }}>{p.onde}</p>
                <BlocoCodigo codigo={p.codigo} cor={p.cor} />
              </div>
            ))}
          </div>

          {/* Alternativa automática */}
          <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 9, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
            <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
              <b style={{ color: '#10B981' }}>Mais confiável pra Compra:</b> se o e-commerce (Shopify/Loja Integrada) estiver conectado
              nesta página, toda venda real já vira <code style={{ color: '#10B981' }}>compra</code> automaticamente via webhook — sem
              precisar colar nada no site. O código manual acima é só pra quando isso não é uma opção, ou pra Checkout (que não tem
              webhook automático em nenhuma plataforma ainda).
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
