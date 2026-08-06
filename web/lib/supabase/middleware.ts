import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabasePublishableKey, isSupabaseConfigured } from './config'
import { safeNext } from '../auth-redirect'
import { hostRootPath } from '../host-routing'

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

  const path = request.nextUrl.pathname
  const rootPath = hostRootPath(request.headers.get('host'), path)

  const withHostRewrite = (response: NextResponse) => {
    if (!rootPath) return response
    const url = request.nextUrl.clone()
    url.pathname = rootPath
    const rewritten = NextResponse.rewrite(url, { request })
    response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie))
    return rewritten
  }

  if (!isSupabaseConfigured) return withHostRewrite(supabaseResponse)

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

  const effectivePath = rootPath ?? path
  const isPublic =
    effectivePath.startsWith('/login') ||
    effectivePath.startsWith('/auth') ||
    effectivePath.startsWith('/submit') ||
    effectivePath.startsWith('/confirm')

  if (!user && !isPublic) {
    if (hasAuthCookie(request) && isTransientAuthFailure(error)) {
      return withHostRewrite(supabaseResponse)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const next = safeNext(path + request.nextUrl.search)
    if (next) url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  return withHostRewrite(supabaseResponse)
}
