'use client'

import { use } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import Sidebar from '@/components/tracking/Sidebar'
import AgenteBubble from '@/components/tracking/AgenteBubble'
import { DateRangeProvider } from '@/lib/date-range-context'

export default function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = use(params)

  return (
    <AuthGuard>
      <DateRangeProvider>
        <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
          <Sidebar clienteId={clienteId} />
          <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 256 }}>
            {children}
          </div>
          <AgenteBubble clienteId={clienteId} />
        </div>
      </DateRangeProvider>
    </AuthGuard>
  )
}
