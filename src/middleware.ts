// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/account', '/booking', '/payment-success', '/favourites', '/checkout']
const HOST_ONLY = ['/host/dashboard', '/host/add-vehicle', '/host/edit-vehicle', '/host/bookings', '/host/earnings', '/host/messages', '/host/settings', '/host/vehicles']
const ADMIN_ONLY = ['/admin']
const AUTH_PAGES = ['/login', '/signup', '/forgot-password']

function classifyRoute(pathname: string) {
  return {
    isAuthPage: AUTH_PAGES.some(p => pathname.startsWith(p)),
    isProtected: PROTECTED.some(p => pathname.startsWith(p)),
    isHostRoute: HOST_ONLY.some(p => pathname.startsWith(p)),
    isAdminRoute: ADMIN_ONLY.some(p => pathname.startsWith(p)),
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = new URL('/login', request.url)
  url.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(url)
}

async function checkRoleAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  requiredRoles: string[],
  fallbackUrl: string,
  request: NextRequest,
): Promise<NextResponse | null> {
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()
  if (!requiredRoles.includes(profile?.role)) {
    return NextResponse.redirect(new URL(fallbackUrl, request.url))
  }
  return null
}

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
  const route = classifyRoute(pathname)

  // Logged-in users away from auth pages
  if (route.isAuthPage) {
    return user ? NextResponse.redirect(new URL('/account', request.url)) : response
  }

  // Not logged in → login
  if ((route.isProtected || route.isHostRoute || route.isAdminRoute) && !user) {
    return redirectToLogin(request, pathname)
  }

  // Host routes → check role
  if (route.isHostRoute && user) {
    const redirect = await checkRoleAccess(supabase, user.id, ['host', 'admin'], '/become-host', request)
    if (redirect) return redirect
  }

  // Admin routes → check role
  if (route.isAdminRoute && user) {
    const redirect = await checkRoleAccess(supabase, user.id, ['admin'], '/', request)
    if (redirect) return redirect
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)'],
}
