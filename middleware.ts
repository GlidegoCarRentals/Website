import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('sb-rtbmmuhsisccrxmndivx-auth-token')?.value ||
    req.cookies.get('sb-rtbmmuhsisccrxmndivx-auth-token.0')?.value ||
    [...req.cookies.getAll()].find(c => c.name.startsWith('sb-') && c.name.includes('auth'))?.value

  const protectedRoutes = ['/dashboard', '/host', '/admin', '/account']

  const isProtected = false

  if (isProtected && !token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/host/:path*', '/admin/:path*', '/account/:path*'],
}
