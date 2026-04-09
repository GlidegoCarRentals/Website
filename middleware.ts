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

function isRouteType(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route))
}

function checkAuthRoutes(pathname: string, user: unknown, userError: unknown, request: NextRequest): NextResponse | null {
  if (isRouteType(pathname, AUTH_ROUTES) && user && !userError) {
    return NextResponse.redirect(new URL('/account', request.url))
  }
  return null
}

async function checkProtectedRoutes(
  pathname: string,
  user: unknown,
  userError: unknown,
  request: NextRequest,
): Promise<NextResponse | null> {
  const isProtected = isRouteType(pathname, PROTECTED_ROUTES)
  const isHostRoute = isRouteType(pathname, HOST_ROUTES)
  const isAdminRoute = isRouteType(pathname, ADMIN_ROUTES)

  if ((isProtected || isHostRoute || isAdminRoute) && (!user || userError)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  return null
}

async function checkHostRole(pathname: string, user: unknown, supabase: any, request: NextRequest): Promise<NextResponse | null> {
  if (!isRouteType(pathname, HOST_ROUTES) || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, email_verified')
    .eq('id', (user as any).id)
    .single()

  if (profileError || !profile) {
    return NextResponse.redirect(new URL('/account', request.url))
  }

  if (profile.role !== 'host' && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/become-host', request.url))
  }

  return null
}

async function checkAdminRole(pathname: string, user: unknown, supabase: any, request: NextRequest): Promise<NextResponse | null> {
  if (!isRouteType(pathname, ADMIN_ROUTES) || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', (user as any).id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return null
}

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

  // Check auth routes
  const authCheck = checkAuthRoutes(pathname, user, userError, request)
  if (authCheck) return authCheck

  // Check protected routes
  const protectedCheck = await checkProtectedRoutes(pathname, user, userError, request)
  if (protectedCheck) return protectedCheck

  // Check host routes
  const hostCheck = await checkHostRole(pathname, user, supabase, request)
  if (hostCheck) return hostCheck

  // Check admin routes
  const adminCheck = await checkAdminRole(pathname, user, supabase, request)
  if (adminCheck) return adminCheck

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
