import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Supabase auth cookie check karo
  const token =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('supabase-auth-token')?.value ||
    req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/bookings',
    '/host',
    '/admin',
    '/profile',
    '/settings',
  ]

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Logged out + protected route = login pe bhejo
  if (isProtected && !token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/host/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
}
