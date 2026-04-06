// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/account'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors in URL
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  const supabase = await createClient()

  // ── PATH 1: token_hash (email verification, password recovery) ──
  // Supabase sends token_hash for email OTP flows (including PKCE tokens)
  if (token_hash && type) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (verifyError) {
      console.error('verifyOtp error:', verifyError.message, 'token_hash:', token_hash, 'type:', type)

      // PKCE tokens starting with 'pkce_' need exchangeCodeForSession instead
      // This handles the case where Supabase sends a PKCE token in token_hash
      if (token_hash.startsWith('pkce_')) {
        const { data: pkceData, error: pkceError } = await supabase.auth.exchangeCodeForSession(token_hash)

        if (!pkceError && pkceData.user) {
          await supabase
            .from('users')
            .update({ email_verified: true, updated_at: new Date().toISOString() })
            .eq('id', pkceData.user.id)

          return NextResponse.redirect(
            `${origin}/account?message=${encodeURIComponent('Email verified successfully! Welcome to GlideGo.')}`
          )
        }
      }

      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Email verification failed. The link may have expired. Please request a new one.')}`
      )
    }

    if (data.user) {
      await supabase
        .from('users')
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    // Password recovery → reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    return NextResponse.redirect(
      `${origin}/account?message=${encodeURIComponent('Email verified successfully! Welcome to GlideGo.')}`
    )
  }

  // ── PATH 2: code (Google OAuth + PKCE code exchange) ──
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data.user) {
      // Upsert profile for OAuth users
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
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
    }

    const redirectTo = next.startsWith('/') ? next : '/account'
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // No valid params
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid verification link. Please try again.')}`
  )
}
