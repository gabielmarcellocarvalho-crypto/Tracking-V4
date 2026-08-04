'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { DateRange } from '@/components/tracking/DateRangePicker'

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function periodoPadrao(): DateRange {
  const end = new Date(); end.setHours(0, 0, 0, 0)
  const start = addDays(end, -29)
  return { start, end, label: 'Últimos 30 dias' }
}

interface DateRangeContextValue {
  range: DateRange
  setRange: (range: DateRange) => void
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

// Período compartilhado entre todas as páginas de um mesmo cliente — trocar
// aqui reflete em Performance, Tracking, Gestor de Mídia etc. ao mesmo tempo.
export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<DateRange>(periodoPadrao)
  const value = useMemo(() => ({ range, setRange }), [range])
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange precisa ser usado dentro de <DateRangeProvider>')
  return ctx
}
