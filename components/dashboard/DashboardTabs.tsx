'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Tracking',   slug: 'tracking'   },
  { label: 'UTMs',       slug: 'utms'       },
  { label: 'Jornada',   slug: 'jornada'    },
  { label: 'Conversões', slug: 'conversoes' },
]

export default function DashboardTabs({ clienteId }: { clienteId: string }) {
  const pathname = usePathname()

  return (
    <div className="relative flex items-center mb-[20px]" style={{ borderBottom: '1px solid var(--border)' }}>
      {TABS.map(({ label, slug }) => {
        const href   = `/clientes/${clienteId}/${slug}`
        const active = pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={slug}
            href={href}
            className={[
              'px-4 py-[9px] text-[13px] font-[500] select-none',
              'border-b-[2px] mb-[-1px] transition-colors duration-[180ms]',
              active
                ? 'text-[#C8102E] border-[#C8102E]'
                : 'text-[--text-3] border-transparent hover:text-[--text-1]',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
