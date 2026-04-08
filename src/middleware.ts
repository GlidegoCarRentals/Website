// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/account', '/booking', '/payment-success', '/favourites']
const HOST_ONLY = ['/host/dashboard', '/host/add-vehicle', '/host/edit-vehicle', '/host/bookings', '/host/earnings', '/host/messages', '/host/settings', '/host/vehicles']
const ADMIN_ONLY = ['/admin']
const AUTH_PAGES = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // Gracefully skip auth when Supabase env vars are missing (e.g. CI/Playwright)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Logged-in users away from auth pages
  if (AUTH_PAGES.some(p => pathname.startsWith(p))) {
    if (user) return NextResponse.redirect(new URL('/account', request.url))
    return response
  }

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isHostRoute = HOST_ONLY.some(p => pathname.startsWith(p))
  const isAdminRoute = ADMIN_ONLY.some(p => pathname.startsWith(p))

  // Not logged in → login
  if ((isProtected || isHostRoute || isAdminRoute) && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Host routes → check role
  if (isHostRoute && user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'host' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/become-host', request.url))
    }
  }

  // Admin routes → check role
  if (isAdminRoute && user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)'],
}
