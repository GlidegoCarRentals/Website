// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data.user) {
      // Upsert user profile in our users table
      const { error: upsertError } = await supabase.from('users').upsert(
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
          role: 'guest', // Default role
          email_verified: data.user.email_confirmed_at ? true : false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      )

      if (upsertError) {
        console.error('Profile upsert error:', upsertError)
        // Don't fail auth just because profile upsert failed
      }
    }

    // Redirect to the requested page or account
    const redirectTo = next.startsWith('/') ? next : '/account'
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
