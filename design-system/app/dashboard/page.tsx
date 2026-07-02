'use client'

import { useState } from 'react'
import Sidebar from '@/components/tracking/Sidebar'
import Header from '@/components/tracking/Header'
import KPICard from '@/components/tracking/KPICard'
import TabBar from '@/components/tracking/TabBar'
import SourceChipsGroup from '@/components/tracking/SourceChip'
import FunnelChart from '@/components/tracking/FunnelChart'
import BarChart from '@/components/tracking/BarChart'
import LeadsTable from '@/components/tracking/LeadsTable'
import {
  kpiData,
  funnelData,
  chartData,
  leadsData,
  sourceChips,
  type Lead,
} from '@/lib/mock-data'

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState(1) // default: 30d

  const periods = ['7d', '30d', '90d']

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar clienteId="klubi" />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 256 }}>
        <Header clienteName="Klubi" />

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'var(--bg-base)' }}
        >
          {/* Source chips */}
          <SourceChipsGroup
            chips={sourceChips}
            onChange={(id, active) => {
              // TODO: filtrar dados por fonte
              console.log('Chip toggled:', id, active)
            }}
          />

          {/* Section header + date filter */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[--text-1]">Visão Geral</h2>
              <p className="text-[12px] text-[--text-3] mt-[2px]">
                Dados consolidados — últimos {periods[activePeriod]}
              </p>
            </div>

            {/* Date period pills */}
            <div
              className="flex gap-[2px] p-[3px] rounded-[8px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {periods.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(i)}
                  className="px-[13px] py-[5px] rounded-[6px] text-[12px] font-[500] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    background: i === activePeriod ? '#F97316' : 'transparent',
                    color: i === activePeriod ? '#fff' : 'var(--text-3)',
                  }}
                  onMouseEnter={(e) => {
                    if (i !== activePeriod) {
                      e.currentTarget.style.color = 'var(--text-1)'
                      e.currentTarget.style.background = 'var(--bg-card-h)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (i !== activePeriod) {
                      e.currentTarget.style.color = 'var(--text-3)'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-[14px] mb-[22px]">
            {kpiData.map((kpi) => (
              <KPICard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Tabs */}
          <TabBar
            tabs={['Tracking', 'UTMs', 'Jornada', 'Conversões']}
            onChange={(_, label) => {
              // TODO: renderizar conteúdo da tab selecionada
              console.log('Tab:', label)
            }}
          />

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-[14px] mb-[20px]">
            {/* Bar chart card */}
            <div
              className="rounded-[12px] p-[18px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-[14px] font-semibold text-[--text-1] mb-[3px]">
                Performance por Dia
              </h3>
              <p className="text-[11.5px] text-[--text-3] mb-[14px]">
                Investimento vs. Receita — últimos 7 dias
              </p>
              <BarChart data={chartData} />
            </div>

            {/* Funnel card */}
            <div
              className="rounded-[12px] p-[18px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-[14px] font-semibold text-[--text-1] mb-[3px]">
                Funil de Conversão
              </h3>
              <p className="text-[11.5px] text-[--text-3] mb-[14px]">
                Jornada consolidada — Meta + Google + GA4
              </p>
              <FunnelChart steps={funnelData} />
            </div>
          </div>

          {/* Leads table */}
          <LeadsTable
            leads={leadsData}
            onViewJourney={(lead: Lead) => {
              // TODO: navegar para /clientes/klubi/jornada?leadId={lead.id}
              console.log('View journey for lead:', lead.id)
            }}
          />
        </main>
      </div>
    </div>
  )
}
