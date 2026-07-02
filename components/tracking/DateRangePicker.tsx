'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DateRange {
  start: Date
  end: Date
  label: string
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT   = ['D','S','T','Q','Q','S','S']

function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isBetween(d: Date, s: Date, e: Date) { return d > s && d < e }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function fmt(d: Date) { return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }
function fmtShort(d: Date) { return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` }

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Hoje',          key: 'today', range: () => { const t = today(); return { start: t, end: t } } },
  { label: 'Ontem',         key: 'ontem', range: () => { const t = addDays(today(),-1); return { start: t, end: t } } },
  { label: 'Últimos 7 dias',  key: '7d',  range: () => ({ start: addDays(today(),-6),  end: today() }) },
  { label: 'Últimos 30 dias', key: '30d', range: () => ({ start: addDays(today(),-29), end: today() }) },
  { label: 'Últimos 90 dias', key: '90d', range: () => ({ start: addDays(today(),-89), end: today() }) },
  { label: 'Personalizado',   key: 'custom', range: () => ({ start: addDays(today(),-29), end: today() }) },
]

// ── Calendar month grid ───────────────────────────────────────────────────────
function CalMonth({
  year, month, selectStart, selectEnd, hoverDate,
  onDayClick, onDayHover, onPrev, onNext, showPrev, showNext,
}: {
  year: number; month: number
  selectStart: Date | null; selectEnd: Date | null; hoverDate: Date | null
  onDayClick: (d: Date) => void; onDayHover: (d: Date) => void
  onPrev: () => void; onNext: () => void; showPrev: boolean; showNext: boolean
}) {
  const firstDow = new Date(year, month, 1).getDay()
  const totalDays = daysInMonth(year, month)
  const cells: (Date | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const rangeEnd = selectEnd ?? hoverDate

  return (
    <div style={{ width: 228 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={onPrev} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--br)', background: 'none', cursor: showPrev ? 'pointer' : 'default', opacity: showPrev ? 1 : 0, color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{MONTHS_PT[month]} {year}</span>
        <button onClick={onNext} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--br)', background: 'none', cursor: showNext ? 'pointer' : 'default', opacity: showNext ? 1 : 0, color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Day-of-week row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 3 }}>
        {DAYS_PT.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px 0' }}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const isStart    = selectStart ? sameDay(date, selectStart) : false
          const isEnd      = rangeEnd    ? sameDay(date, rangeEnd)    : false
          const inRange    = selectStart && rangeEnd && selectStart < rangeEnd ? isBetween(date, selectStart, rangeEnd) : false
          const isToday    = sameDay(date, today())
          const isSelected = isStart || isEnd

          return (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              {inRange && <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,16,46,.10)' }} />}
              {isSelected && selectStart && rangeEnd && !sameDay(selectStart, rangeEnd) && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: '50%', left: isStart ? '50%' : 0, background: 'rgba(200,16,46,.10)' }} />
              )}
              <button onClick={() => onDayClick(date)} onMouseEnter={() => onDayHover(date)}
                style={{
                  position: 'relative', zIndex: 1, width: 28, height: 28, borderRadius: '50%',
                  fontSize: 11.5, cursor: 'pointer', border: 'none',
                  background: isSelected ? 'var(--red)' : isToday ? 'rgba(200,16,46,.15)' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? 'var(--red)' : 'var(--t2)',
                  fontWeight: isSelected ? 700 : 400, outline: 'none', transition: 'background .12s',
                }}>
                {date.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen]             = useState(false)
  const [activeKey, setActiveKey]   = useState('30d')
  const [showCal, setShowCal]       = useState(false)
  const [selectStart, setSelectStart] = useState<Date | null>(null)
  const [selectEnd,   setSelectEnd]   = useState<Date | null>(null)
  const [hoverDate,   setHoverDate]   = useState<Date | null>(null)
  const [pickingEnd,  setPickingEnd]  = useState(false)

  const [viewYear,  setViewYear]  = useState(() => { const m = new Date().getMonth(); return m === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear() })
  const [viewMonth, setViewMonth] = useState(() => { const m = new Date().getMonth(); return m === 0 ? 11 : m - 1 })

  const rightMonth = viewMonth === 11 ? 0  : viewMonth + 1
  const rightYear  = viewMonth === 11 ? viewYear + 1 : viewYear

  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setShowCal(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Sync pick state with current value when opening
  const handleOpen = () => {
    setSelectStart(value.start)
    setSelectEnd(value.end)
    setPickingEnd(false)
    setOpen((o) => !o)
  }

  const applyPreset = useCallback((key: string) => {
    if (key === 'custom') {
      setActiveKey('custom')
      setShowCal(true)
      setSelectStart(null)
      setSelectEnd(null)
      setPickingEnd(false)
      return
    }
    const p = PRESETS.find((x) => x.key === key)!
    const { start, end } = p.range()
    setActiveKey(key)
    setShowCal(false)
    onChange({ start, end, label: p.label })
    setOpen(false)
  }, [onChange])

  const handleDayClick = useCallback((date: Date) => {
    if (!pickingEnd || !selectStart) {
      setSelectStart(date); setSelectEnd(null); setPickingEnd(true)
    } else {
      const s = date < selectStart ? date : selectStart
      const e = date < selectStart ? selectStart : date
      setSelectStart(s); setSelectEnd(e); setPickingEnd(false)
    }
  }, [pickingEnd, selectStart])

  const handleApply = useCallback(() => {
    if (!selectStart || !selectEnd) return
    const label = `${fmtShort(selectStart)} – ${fmtShort(selectEnd)}`
    onChange({ start: selectStart, end: selectEnd, label })
    setOpen(false); setShowCal(false)
  }, [selectStart, selectEnd, onChange])

  const handleCancel = useCallback(() => {
    setShowCal(false)
    setActiveKey(value.label === PRESETS.find(p => p.label === value.label)?.label ? activeKey : '30d')
    setOpen(false)
  }, [value, activeKey])

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  // Trigger button label
  const triggerLabel = activeKey === 'custom' && value.label.includes('/')
    ? value.label
    : PRESETS.find(p => p.key === activeKey)?.label ?? value.label

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: open ? 'rgba(200,16,46,.08)' : 'var(--bg-c)',
          border: `1px solid ${open ? 'var(--red)' : 'var(--br)'}`,
          borderRadius: 8, cursor: 'pointer', transition: 'all .18s',
          color: open ? 'var(--red)' : 'var(--t2)',
        }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (!open) { el.style.borderColor = 'rgba(200,16,46,.5)'; el.style.color = 'var(--t1)' } }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (!open) { el.style.borderColor = 'var(--br)'; el.style.color = 'var(--t2)' } }}
      >
        {/* Calendar icon */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>{triggerLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={11} height={11} style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12,
          zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,.65)',
          display: 'flex', animation: 'drpDrop .18s cubic-bezier(.22,1,.36,1)',
          overflow: 'hidden',
        }}>
          <style>{`@keyframes drpDrop { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }`}</style>

          {/* Left: preset list */}
          <div style={{ width: 176, borderRight: showCal ? '1px solid var(--br)' : 'none', padding: '8px 0', flexShrink: 0 }}>
            <div style={{ padding: '6px 14px 8px', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)' }}>
              Período
            </div>
            {PRESETS.map(({ key, label }) => {
              const isActive = activeKey === key
              return (
                <button key={key} onClick={() => applyPreset(key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 14px',
                    fontSize: 12.5, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: isActive ? 'rgba(200,16,46,.10)' : 'transparent',
                    color: isActive ? 'var(--red)' : 'var(--t2)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background .12s, color .12s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-ch)'; el.style.color = 'var(--t1)' } }}
                  onMouseLeave={(e) => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--t2)' } }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isActive && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                    )}
                    {!isActive && <span style={{ width: 6, height: 6, flexShrink: 0 }} />}
                    {label}
                  </span>
                  {key === 'custom' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={11} height={11} style={{ opacity: 0.4 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: calendar (only when Personalizado selected) */}
          {showCal && (
            <div style={{ padding: 18 }}>
              {/* Hint */}
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 14, textAlign: 'center' }}>
                {!selectStart || pickingEnd ? (pickingEnd ? 'Selecione a data final' : 'Selecione a data inicial') : 'Clique em Aplicar para confirmar'}
              </div>

              {/* Two months */}
              <div style={{ display: 'flex', gap: 24 }} onMouseLeave={() => setHoverDate(null)}>
                <CalMonth
                  year={viewYear} month={viewMonth}
                  selectStart={selectStart} selectEnd={selectEnd} hoverDate={hoverDate}
                  onDayClick={handleDayClick} onDayHover={setHoverDate}
                  onPrev={prevMonth} onNext={() => {}} showPrev showNext={false}
                />
                <div style={{ width: 1, background: 'var(--br)', flexShrink: 0 }} />
                <CalMonth
                  year={rightYear} month={rightMonth}
                  selectStart={selectStart} selectEnd={selectEnd} hoverDate={hoverDate}
                  onDayClick={handleDayClick} onDayHover={setHoverDate}
                  onPrev={() => {}} onNext={nextMonth} showPrev={false} showNext
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--br)' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {selectStart && selectEnd
                    ? `${Math.round((selectEnd.getTime() - selectStart.getTime()) / 86400000) + 1} dias`
                    : selectStart ? 'Selecione a data final' : 'Selecione a data inicial'}
                </span>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={handleCancel}
                    style={{ padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'none', border: '1px solid var(--br)', color: 'var(--t2)', transition: 'border-color .15s' }}>
                    Cancelar
                  </button>
                  <button onClick={handleApply} disabled={!selectStart || !selectEnd}
                    style={{ padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: selectStart && selectEnd ? 'pointer' : 'not-allowed', background: selectStart && selectEnd ? 'var(--red)' : 'rgba(200,16,46,.3)', border: 'none', color: '#fff', transition: 'background .15s' }}>
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
