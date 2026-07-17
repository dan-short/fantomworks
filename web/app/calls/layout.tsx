import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { countByStatus } from '@/lib/data'
import { STATUS_VIEWS } from '@/lib/types'
import { signOut } from '../login/actions'

export default async function CallsLayout({ children }: { children: React.ReactNode }) {
  const counts = await countByStatus()

  let email: string | null = null
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    email = user?.email ?? null
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/15 text-amber-300 text-xs px-4 py-1.5 text-center border-b border-amber-500/20">
          Dev mode — running on seed data. Set Supabase env vars to connect the real database.
        </div>
      )}

      <header className="border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight">FantomWorks</span>
            <span className="text-neutral-500 text-sm">Call Log</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {email && <span className="text-neutral-400">{email}</span>}
            <form action={signOut}>
              <button className="text-neutral-400 hover:text-neutral-100">Sign out</button>
            </form>
          </div>
        </div>

        <nav className="mt-3 flex flex-wrap gap-1">
          {STATUS_VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/calls?view=${v.key}`}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {v.label}
              <span className="ml-1.5 text-xs text-neutral-500">{counts[v.key] ?? 0}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="p-4">{children}</main>
    </div>
  )
}
