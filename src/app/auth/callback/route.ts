// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

function redirectWithError(origin: string, message: string) {
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(message)}`
  )
}

function redirectVerified(origin: string) {
  return NextResponse.redirect(
    `${origin}/account?message=${encodeURIComponent('Email verified successfully! Welcome to GlideGo.')}`
  )
}

async function markEmailVerified(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('users')
    .update({ email_verified: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
}

async function handlePkceToken(supabase: SupabaseClient, tokenHash: string, origin: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(tokenHash)
  if (error || !data.user) return null
  await markEmailVerified(supabase, data.user.id)
  return redirectVerified(origin)
}

async function handleTokenHash(
  supabase: SupabaseClient,
  tokenHash: string,
  type: EmailOtpType,
  origin: string,
) {
  const { data, error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (verifyError) {
    console.error('verifyOtp error:', verifyError.message, 'token_hash:', tokenHash, 'type:', type)

    if (tokenHash.startsWith('pkce_')) {
      const pkceResult = await handlePkceToken(supabase, tokenHash, origin)
      if (pkceResult) return pkceResult
    }

    return redirectWithError(origin, 'Email verification failed. The link may have expired. Please request a new one.')
  }

  if (data.user) {
    await markEmailVerified(supabase, data.user.id)
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  return redirectVerified(origin)
}

async function handleCodeExchange(
  supabase: SupabaseClient,
  code: string,
  next: string,
  origin: string,
) {
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return redirectWithError(origin, exchangeError.message)
  }

  if (data.user) {
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/account'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return redirectWithError(origin, errorDescription ?? error)
  }

  const supabase = await createClient()

  if (token_hash && type) {
    return handleTokenHash(supabase, token_hash, type, origin)
  }

  if (code) {
    return handleCodeExchange(supabase, code, next, origin)
  }

  return redirectWithError(origin, 'Invalid verification link. Please try again.')
}
