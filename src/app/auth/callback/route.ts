// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/account'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors passed in URL
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  const supabase = await createClient()

  // ── PATH 1: Email confirmation (token_hash) ──────────────────
  // This is used for: email verification, password reset, magic links
  if (token_hash && type) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (verifyError) {
      console.error('OTP verify error:', verifyError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          'Email verification failed. The link may have expired. Please request a new one.'
        )}`
      )
    }

    if (data.user) {
      // Update email_verified in our users table
      await supabase
        .from('users')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id)

      // For password recovery, redirect to reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
    }

    // Email verified — redirect to account with success message
    return NextResponse.redirect(
      `${origin}/account?message=${encodeURIComponent('Email verified successfully! Welcome to GlideGo.')}`
    )
  }

  // ── PATH 2: OAuth code exchange (Google login) ───────────────
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data.user) {
      // Upsert profile for Google OAuth users
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            '',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture ||
            null,
          role: 'guest',
          email_verified: true, // Google accounts are pre-verified
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      )
    }

    const redirectTo = next.startsWith('/') ? next : '/account'
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // No code or token_hash — redirect to login
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid verification link. Please try again.')}`
  )
}
