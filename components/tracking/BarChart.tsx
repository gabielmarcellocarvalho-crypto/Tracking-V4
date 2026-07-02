'use client'

import type { ChartDay } from '@/lib/demo-data'

export default function BarChart({ data }: { data: ChartDay[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <div>
      <div className="flex items-end gap-[6px] h-[110px]">
        {data.map((d) => {
          const revH = (d.revenue / maxRevenue) * 100
          const invH = (d.investment / maxRevenue) * 100
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center">
              <div className="flex items-end gap-[3px] w-full" style={{ height: 100 }}>
                <div className="flex-1 rounded-t-[4px] cursor-pointer transition-all duration-[180ms] hover:brightness-125 origin-bottom" style={{ height: `${revH}%`, background: 'linear-gradient(to top, #10B981, #34D399)' }} title={`Receita: R$${d.revenue.toLocaleString('pt-BR')}`} />
                <div className="flex-1 rounded-t-[4px] cursor-pointer transition-all duration-[180ms] hover:brightness-125 origin-bottom" style={{ height: `${invH}%`, background: '#F97316', opacity: 0.6 }} title={`Investimento: R$${d.investment.toLocaleString('pt-BR')}`} />
              </div>
              <span className="text-[9.5px] text-[--text-3] mt-[5px]">{d.day}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-[14px] mt-[10px]">
        <div className="flex items-center gap-[5px] text-[11px] text-[--text-3]">
          <span className="w-[9px] h-[9px] rounded-[2px] bg-[#10B981] shrink-0" /> Receita
        </div>
        <div className="flex items-center gap-[5px] text-[11px] text-[--text-3]">
          <span className="w-[9px] h-[9px] rounded-[2px] shrink-0" style={{ background: '#F97316', opacity: 0.7 }} /> Investimento
        </div>
      </div>
    </div>
  )
}
