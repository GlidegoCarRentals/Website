import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/host', '/account', '/booking'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r));

  if (!isProtected && !isAdmin) return NextResponse.next();

  // Check ALL cookies for any Supabase auth token
  const cookies = request.cookies.getAll();
  const hasAuthToken = cookies.some(c =>
    c.name.includes('auth-token') ||
    c.name.includes('access-token') ||
    c.name.startsWith('sb-') ||
    c.name.includes('supabase')
  );

  if (!hasAuthToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/host/:path*',
    '/account/:path*',
    '/booking/:path*',
    '/admin/:path*',
  ],
};
