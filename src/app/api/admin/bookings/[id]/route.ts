import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

async function ensureAdmin() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Please sign in first.' }, { status: 401 }) };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };

  return { supabase };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ('error' in auth) return auth.error;
  const { id } = await context.params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.booking_status !== undefined) updates.booking_status = body.booking_status;
  if (body.payment_status !== undefined) updates.payment_status = body.payment_status;
  if (body.bond_status !== undefined) updates.bond_status = body.bond_status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, booking: data });
}
