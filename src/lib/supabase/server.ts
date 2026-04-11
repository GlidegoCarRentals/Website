import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}

export async function createClient() {
  return createServerSupabaseClient();
}

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

/**
 * Fetches the authenticated user + their role from the users table.
 * Returns null for both if not signed in.
 * Use this in every API route handler to enforce RBAC at the API layer.
 */
export async function requireRole(
  allowedRoles: Array<'guest' | 'host' | 'admin'>,
): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; userId: string; role: string }
  | { ok: false; response: ReturnType<typeof import('next/server').NextResponse.json> }
> {
  const { NextResponse } = await import('next/server');
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? '';
  if (!allowedRoles.includes(role as 'guest' | 'host' | 'admin')) {
    return { ok: false, response: NextResponse.json({ error: 'Access denied.' }, { status: 403 }) };
  }

  return { ok: true, supabase, userId: user.id, role };
}
