'use client'

import { useState } from 'react'

export interface SourceChipData {
  id: string
  label: string
  color: string
  defaultOn?: boolean
}

export function SourceChip({ id, label, color, defaultOn = false, onChange }: SourceChipData & { onChange?: (id: string, active: boolean) => void }) {
  const [on, setOn] = useState(defaultOn)
  const toggle = () => { const next = !on; setOn(next); onChange?.(id, next) }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-[7px] px-[14px] py-[7px] rounded-full text-[12px] font-[500] cursor-pointer select-none transition-all duration-[180ms] hover:-translate-y-[1px]"
      style={{ background: 'var(--bg-card)', border: `1px solid ${on ? color : 'var(--border)'}`, color: on ? color : 'var(--text-2)' }}
    >
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: on ? color : 'var(--text-3)' }} />
      {label}
    </button>
  )
}

export default function SourceChipsGroup({ chips, onChange }: { chips: SourceChipData[]; onChange?: (id: string, active: boolean) => void }) {
  return (
    <div className="flex gap-[8px] flex-wrap mb-[20px]">
      {chips.map((chip) => <SourceChip key={chip.id} {...chip} onChange={onChange} />)}
    </div>
  )
}
