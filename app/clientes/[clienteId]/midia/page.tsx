'use client'

import { use } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'

export default function MidiaPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente } = useCliente(clienteId)

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Gestor de Mídia</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Soluções de apoio ao gestor de tráfego para este cliente
          </p>
        </div>

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
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>

          <div style={{ maxWidth: 420 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
              Em construção
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '8px 0 0', lineHeight: 1.6 }}>
              Aqui vão entrar as soluções para os problemas do dia a dia do gestor de tráfego
              deste cliente — geração de copies, criativos e outros materiais de apoio.
              Ainda não há nada configurado.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
