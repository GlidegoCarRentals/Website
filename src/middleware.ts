import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Routes jo sirf logged-in users dekh sakte hain
const PROTECTED_ROUTES = [
  '/host',
  '/account',
  '/booking',
];

// Routes jo sirf logged-OUT users dekh sakte hain (login page)
const AUTH_ROUTES = ['/login'];

// Routes jo sirf admin dekh sakta hai
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check karo kya yeh protected route hai
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r));

  if (!isProtected && !isAdmin) return NextResponse.next();

  // Supabase session check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const accessToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${supabaseUrl?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;

  // Token nahi hai → login pe bhejo
  if (!accessToken) {
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
