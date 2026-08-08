'use client'

import { use, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import VisaoGeralGrowthPack from '@/components/midia/VisaoGeralGrowthPack'
import PlanoMidia from '@/components/midia/PlanoMidia'

type Aba = 'visao-geral' | 'plano-midia'

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
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} clienteId={isDemo ? undefined : clienteId} />

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
          : <PlanoMidia clienteId={clienteId} clienteTipo={cliente?.tipo} isDemo={isDemo} />}
      </main>
    </>
  )
}
