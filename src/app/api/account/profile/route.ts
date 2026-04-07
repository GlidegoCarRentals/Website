import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { isMissingSchemaError } from '@/lib/supabase/errors';

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const userUpdates: Record<string, unknown> = {};
  const guestProfileUpdates: Record<string, unknown> = {};

  if (typeof body.fullName === 'string') userUpdates.full_name = body.fullName.trim();
  if (typeof body.phone === 'string') userUpdates.phone = body.phone.trim();
  if (typeof body.bio === 'string') userUpdates.bio = body.bio.trim();
  if (typeof body.avatarUrl === 'string') userUpdates.avatar_url = body.avatarUrl.trim();
  if (typeof body.emergencyContactName === 'string') {
    guestProfileUpdates.emergency_contact_name = body.emergencyContactName.trim();
  }
  if (typeof body.emergencyContactPhone === 'string') {
    guestProfileUpdates.emergency_contact_phone = body.emergencyContactPhone.trim();
  }
  if (typeof body.defaultPickupNotes === 'string') {
    guestProfileUpdates.default_pickup_notes = body.defaultPickupNotes.trim();
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error } = await supabase.from('users').update(userUpdates).eq('id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (Object.keys(guestProfileUpdates).length > 0) {
    const { error } = await supabase
      .from('guest_profiles')
      .upsert({ user_id: user.id, ...guestProfileUpdates }, { onConflict: 'user_id' });

    if (error && !isMissingSchemaError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
