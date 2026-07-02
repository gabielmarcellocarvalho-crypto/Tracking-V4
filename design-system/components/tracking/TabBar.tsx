'use client'

import { useState, useRef, useEffect } from 'react'

export interface TabBarProps {
  tabs: string[]
  defaultTab?: number
  onChange?: (index: number, label: string) => void
}

export default function TabBar({ tabs, defaultTab = 0, onChange }: TabBarProps) {
  const [active, setActive] = useState(defaultTab)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = tabRefs.current[active]
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth })
    }
  }, [active])

  const handleClick = (i: number) => {
    setActive(i)
    onChange?.(i, tabs[i])
  }

  return (
    <div
      className="relative flex items-center mb-[20px]"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab}
          ref={(el) => { tabRefs.current[i] = el }}
          onClick={() => handleClick(i)}
          className={[
            'px-4 py-[9px] text-[13px] font-[500] cursor-pointer select-none',
            'transition-colors duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)]',
            'border-b-[2px] mb-[-1px] bg-transparent',
            i === active
              ? 'text-[#F97316] border-transparent'
              : 'text-[--text-3] border-transparent hover:text-[--text-1]',
          ].join(' ')}
        >
          {tab}
        </button>
      ))}

      {/* Animated underline indicator */}
      <span
        className="absolute bottom-[-1px] h-[2px] bg-[#F97316] rounded-full transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
    </div>
  )
}
