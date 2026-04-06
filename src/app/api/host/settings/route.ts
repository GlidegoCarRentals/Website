import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Host access required' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.instant_booking_enabled === 'boolean') {
    updates.instant_booking_enabled = body.instant_booking_enabled;
  }
  if (typeof body.about === 'string') {
    updates.about = body.about.trim();
  }
  if (typeof body.display_name === 'string') {
    updates.display_name = body.display_name.trim();
  }

  const { error } = await supabase
    .from('host_profiles')
    .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
