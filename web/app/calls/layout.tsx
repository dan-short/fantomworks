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
    <div className="flex h-dvh flex-col bg-neutral-950 text-neutral-100">
      {!isSupabaseConfigured && (
        <div className="shrink-0 bg-amber-500/15 text-amber-300 text-xs px-4 py-1.5 text-center border-b border-amber-500/20">
          Dev mode — running on seed data. Set Supabase env vars to connect the real database.
        </div>
      )}

      <header className="shrink-0 border-b border-neutral-800 px-4 py-3">
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

        <NavTabs counts={counts} />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
