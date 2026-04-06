import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/account',
  '/booking',
  '/payment-success',
]

// Routes that require HOST role
const HOST_ROUTES = [
  '/host/dashboard',
  '/host/add-vehicle',
  '/host/edit-vehicle',
  '/host/bookings',
  '/host/earnings',
  '/host/messages',
  '/host/settings',
]

// Routes that require ADMIN role
const ADMIN_ROUTES = ['/admin']

// Routes that logged-in users should NOT access
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — CRITICAL: must be called before any auth checks
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ─── 1. AUTH ROUTES: redirect logged-in users away from login/signup ───
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user && !userError) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
    return response
  }

  // ─── 2. PROTECTED ROUTES: redirect unauthenticated users to login ───
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  const isHostRoute = HOST_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))

  if ((isProtected || isHostRoute || isAdminRoute) && (!user || userError)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ─── 3. HOST ROUTES: check host role ───
  if (isHostRoute && user) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, email_verified')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      // Profile not found — redirect to account to complete setup
      return NextResponse.redirect(new URL('/account', request.url))
    }

    if (profile.role !== 'host' && profile.role !== 'admin') {
      // Not a host — redirect to become-host page
      return NextResponse.redirect(new URL('/become-host', request.url))
    }

    // ⚠️ DO NOT block hosts for email verification — just show a banner
    // Blocking here causes the redirect loop you were experiencing
  }

  // ─── 4. ADMIN ROUTES: check admin role ───
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, fonts, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)',
  ],
}
