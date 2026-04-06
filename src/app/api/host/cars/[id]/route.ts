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

async function authorizeCarAccess(carId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Please sign in first.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || (profile.role !== 'host' && profile.role !== 'admin')) {
    return { error: NextResponse.json({ error: 'Only hosts can manage vehicles.' }, { status: 403 }) };
  }

  const query = supabase.from('cars').select('id, host_id, status, available, price_daily').eq('id', carId);
  const { data: car } = profile.role === 'admin'
    ? await query.maybeSingle()
    : await query.eq('host_id', user.id).maybeSingle();

  if (!car) {
    return { error: NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 }) };
  }

  return { supabase, user, profile, car };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authorizeCarAccess(id);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.price_daily !== undefined) {
    const price = Number(body.price_daily);
    if (!Number.isFinite(price) || price < 20) {
      return NextResponse.json({ error: 'Daily price must be at least $20.' }, { status: 400 });
    }
    updates.price_daily = price;
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(['active', 'maintenance', 'inactive']);
    if (!allowed.has(status)) {
      return NextResponse.json({ error: 'Invalid vehicle status.' }, { status: 400 });
    }
    updates.status = status;
    updates.available = status === 'active';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('cars')
    .update(updates)
    .eq('id', id)
    .select('id, price_daily, status, available')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, car: data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authorizeCarAccess(id);
  if ('error' in auth) return auth.error;

  const { error } = await auth.supabase.from('cars').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
