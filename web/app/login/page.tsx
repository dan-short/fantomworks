'use client'
import { useActionState } from 'react'
import { signIn, type LoginState } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {})

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-950 text-neutral-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">FantomWorks</h1>
          <p className="text-sm text-neutral-400">Call Log — staff sign in</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-neutral-400 mb-1">
              Username or email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="office"
              required
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-neutral-400 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2 text-sm font-medium hover:bg-white disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Accounts are created by an administrator. No public sign-up.
        </p>
      </div>
    </main>
  )
}
