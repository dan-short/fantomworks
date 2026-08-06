'use client'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { signIn, type LoginState } from './actions'
import { clearSavedLogin, readSavedLogin, saveLogin } from '@/lib/saved-login'

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {})
  const [autoSigningIn, setAutoSigningIn] = useState(false)
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    const saved = readSavedLogin()
    if (!saved) return
    setAutoSigningIn(true)
    const fd = new FormData()
    fd.set('next', next)
    fd.set('email', saved.email)
    fd.set('password', saved.password)
    startTransition(() => formAction(fd))
  }, [next, formAction])

  useEffect(() => {
    if (!state.error) return
    if (/invalid/i.test(state.error)) clearSavedLogin()
    setAutoSigningIn(false)
  }, [state.error])

  if (autoSigningIn) {
    return (
      <p className="py-8 text-center text-sm text-stone-500" role="status">
        Signing you back in…
      </p>
    )
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget)
        const email = String(fd.get('email') ?? '').trim()
        const password = String(fd.get('password') ?? '')
        if (email && password) saveLogin({ email, password })
      }}
      className="space-y-4"
    >
      <input type="hidden" name="next" value={next} />
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
  )
}
