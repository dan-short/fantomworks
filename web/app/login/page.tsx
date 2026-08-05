import { DEFAULT_LANDING, safeNext } from '@/lib/auth-redirect'
import { LoginForm } from './login-form'

export default async function LoginPage(props: PageProps<'/login'>) {
  const { next } = await props.searchParams
  const destination = safeNext(typeof next === 'string' ? next : '') ?? DEFAULT_LANDING

  return (
    <main className="grid min-h-dvh place-items-center bg-stone-50 p-6 text-stone-900">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">FantomWorks</h1>
          <p className="text-sm text-stone-500">Call Log — staff sign in</p>
        </div>

        <LoginForm next={destination} />

        <p className="mt-6 text-center text-xs text-stone-400">
          Accounts are created by an administrator. No public sign-up.
        </p>
      </div>
    </main>
  )
}
