'use client'

import { use, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import VisaoGeralGrowthPack from '@/components/midia/VisaoGeralGrowthPack'

type Aba = 'visao-geral' | 'plano-midia'

function PlanoMidiaPlaceholder() {
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
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      </span>
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Em construção</p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '8px 0 0', lineHeight: 1.6 }}>
          Planejamento de mídia por inserção/campanha (orçamento, forecast de funil) — ainda não implementado.
        </p>
      </div>
    </div>
  )
}

export default function MidiaPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const [aba, setAba] = useState<Aba>('visao-geral')

  const abaBtn = (key: Aba): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: aba === key ? 'var(--red)' : 'transparent',
    color: aba === key ? '#fff' : 'var(--t2)',
  })

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="text-[18px] font-bold text-[--text-1]">Gestor de Mídia</h2>
            <p className="text-[12.5px] text-[--text-3] mt-1">
              Growth Pack e planejamento de mídia deste cliente
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, background: 'var(--bg-c)', border: '1px solid var(--br)' }}>
            <button onClick={() => setAba('visao-geral')} style={abaBtn('visao-geral')}>Visão Geral</button>
            <button onClick={() => setAba('plano-midia')} style={abaBtn('plano-midia')}>Plano de Mídia</button>
          </div>
        </div>

        {aba === 'visao-geral'
          ? <VisaoGeralGrowthPack clienteId={clienteId} clienteTipo={cliente?.tipo} isDemo={isDemo} />
          : <PlanoMidiaPlaceholder />}
      </main>
    </>
  )
}
