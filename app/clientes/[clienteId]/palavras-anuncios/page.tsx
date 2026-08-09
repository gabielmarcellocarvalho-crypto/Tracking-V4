'use client'

import { use } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import PalavrasAnuncios from '@/components/midia/PalavrasAnuncios'

export default function PalavrasAnunciosPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} clienteId={isDemo ? undefined : clienteId} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Palavras & Anúncios</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Monte campanhas de Google Ads (palavras-chave, anúncios e recursos) deste cliente
          </p>
        </div>
        <PalavrasAnuncios clienteId={clienteId} isDemo={isDemo} />
      </main>
    </>
  )
}
