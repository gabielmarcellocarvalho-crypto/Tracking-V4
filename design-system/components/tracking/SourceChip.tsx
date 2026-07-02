'use client'

import { useState } from 'react'

export interface SourceChipData {
  id: string
  label: string
  color: string
  defaultOn?: boolean
}

export interface SourceChipProps extends SourceChipData {
  onChange?: (id: string, active: boolean) => void
}

export function SourceChip({ id, label, color, defaultOn = false, onChange }: SourceChipProps) {
  const [on, setOn] = useState(defaultOn)

  const toggle = () => {
    const next = !on
    setOn(next)
    onChange?.(id, next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-[7px] px-[14px] py-[7px] rounded-full text-[12px] font-[500] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-[1px]"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${on ? color : 'var(--border)'}`,
        color: on ? color : 'var(--text-2)',
      }}
    >
      <span
        className="w-[7px] h-[7px] rounded-full shrink-0 transition-transform duration-[180ms]"
        style={{
          background: on ? color : 'var(--text-3)',
          transform: on ? 'scale(1)' : 'scale(0.85)',
        }}
      />
      {label}
    </button>
  )
}

// ─── SourceChipsGroup ─────────────────────────────────────────────────────────
export interface SourceChipsGroupProps {
  chips: SourceChipData[]
  onChange?: (id: string, active: boolean) => void
}

export default function SourceChipsGroup({ chips, onChange }: SourceChipsGroupProps) {
  return (
    <div className="flex gap-[8px] flex-wrap mb-[20px]">
      {chips.map((chip) => (
        <SourceChip key={chip.id} {...chip} onChange={onChange} />
      ))}
    </div>
  )
}
