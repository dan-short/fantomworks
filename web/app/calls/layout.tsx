import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { countByStatus } from '@/lib/data'
import { NavTabs } from '@/components/NavTabs'
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
    <div className="flex h-dvh flex-col bg-stone-50 text-stone-900">
      {!isSupabaseConfigured && (
        <div className="shrink-0 bg-amber-100 text-amber-800 text-xs px-4 py-1.5 text-center border-b border-amber-200">
          Dev mode — running on seed data. Set Supabase env vars to connect the real database.
        </div>
      )}

      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-stone-900">FantomWorks</span>
            <span className="text-sm text-stone-400">Call Log</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {email && <span className="text-stone-500">{email}</span>}
            <form action={signOut}>
              <button className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <NavTabs counts={counts} />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
