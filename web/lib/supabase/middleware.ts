import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabasePublishableKey, isSupabaseConfigured } from './config'

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
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic =
    path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/submit')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
