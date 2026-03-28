import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const requestedNext = searchParams.get('next') ?? '/'
  const requestedRole = searchParams.get('role')
  const next = requestedNext.startsWith('/') ? requestedNext : '/'
  const selectedRole = requestedRole === 'host' ? 'host' : 'guest'

  if (error) {
    const message = errorDescription || error || 'Authentication failed'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const user = data.user
      if (user) {
        const metadataRole =
          user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'host'
            ? user.user_metadata.role
            : 'guest'

        const role = metadataRole === 'admin' ? 'admin' : selectedRole === 'host' ? 'host' : metadataRole

        await supabase.from('users').upsert(
          {
            id: user.id,
            email: user.email || '',
            full_name:
              typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0
                ? user.user_metadata.full_name.trim()
                : typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
                  ? user.user_metadata.name.trim()
                  : user.email?.split('@')[0] || 'User',
            role,
            promo_credits: 20,
          },
          { onConflict: 'id' }
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const fallbackMessage = errorDescription || 'Authentication could not be completed. Please try again.'
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(fallbackMessage)}`)
}
