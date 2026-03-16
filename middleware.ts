import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Session refresh karo
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes list
  const protectedRoutes = [
    '/dashboard',
    '/bookings',
    '/host',
    '/admin',
    '/profile',
    '/settings',
  ]

  // Check karo kya current path protected hai
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Logged out hai aur protected route pe ja raha hai
  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in hai aur login/signup pe ja raha hai
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// Yeh batata hai middleware kahan kahan chalega
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/host/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
}
