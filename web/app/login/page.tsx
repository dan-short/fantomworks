'use client'
import { useActionState } from 'react'
import { signIn, type LoginState } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {})

  return (
    <main className="grid min-h-dvh place-items-center bg-stone-50 p-6 text-stone-900">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">FantomWorks</h1>
          <p className="text-sm text-stone-500">Call Log — staff sign in</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-stone-600">
              Username or email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="office"
              required
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-stone-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-400">
          Accounts are created by an administrator. No public sign-up.
        </p>
      </div>
    </main>
  )
}
