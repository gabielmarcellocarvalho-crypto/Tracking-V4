import type { FunnelStep } from '@/lib/mock-data'

export interface FunnelChartProps {
  steps: FunnelStep[]
}

export default function FunnelChart({ steps }: FunnelChartProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-[10px]">
          {/* Label */}
          <span className="text-[11.5px] text-[--text-2] w-[72px] shrink-0">
            {step.label}
          </span>

          {/* Bar track */}
          <div
            className="flex-1 h-[7px] rounded-[4px] overflow-hidden"
            style={{ background: 'var(--bg-base)' }}
          >
            <div
              className="h-full rounded-[4px] transition-all duration-[800ms] ease-out"
              style={{
                width: `${step.percentage}%`,
                background: step.color,
              }}
            />
          </div>

          {/* Count */}
          <span className="text-[12px] font-semibold text-[--text-1] w-[52px] text-right shrink-0">
            {step.count.toLocaleString('pt-BR')}
          </span>

          {/* Percentage */}
          <span className="text-[10.5px] text-[--text-3] w-[34px] text-right shrink-0">
            {step.percentage}%
          </span>
        </div>
      ))}
    </div>
  )
}
