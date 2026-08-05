'use client'

import { use } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import PlaceholderEmConstrucao from '@/components/tracking/PlaceholderEmConstrucao'
import { useCliente } from '@/lib/data/partners'

export default function CopiesPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente } = useCliente(clienteId)

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Copies</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Geração e organização de copies de anúncio deste cliente
          </p>
        </div>
        <PlaceholderEmConstrucao
          titulo="Em construção"
          descricao="Aqui vão entrar as soluções de copy para os anúncios deste cliente — ainda não há nada configurado."
        />
      </main>
    </>
  )
}
