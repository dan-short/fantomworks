import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabasePublishableKey, isSupabaseConfigured } from './config'
import { safeNext } from '../auth-redirect'

function hasAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
}

function isTransientAuthFailure(error: { name?: string; status?: number } | null) {
  if (!error) return false
  if (error.name === 'AuthRetryableFetchError') return true
  if (error.status === undefined) return true
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!isSupabaseConfigured) return supabaseResponse

  const supabase = createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/submit') ||
    path.startsWith('/confirm')

  if (!user && !isPublic) {
    if (hasAuthCookie(request) && isTransientAuthFailure(error)) {
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const next = safeNext(path + request.nextUrl.search)
    if (next) url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
