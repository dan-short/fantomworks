'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { STATUS_VIEWS } from '@/lib/types'

export function NavTabs({ counts }: { counts: Record<string, number> }) {
  const sp = useSearchParams()
  const view = sp.get('view') ?? 'new'
  return (
    <nav className="mt-3 flex flex-wrap gap-1">
      {STATUS_VIEWS.map((v) => {
        const active = v.key === view
        return (
          <Link
            key={v.key}
            href={`/calls?view=${v.key}`}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {v.label}
            <span
              className={`ml-1.5 text-xs ${active ? 'text-neutral-500' : 'text-neutral-500'}`}
            >
              {counts[v.key] ?? 0}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
