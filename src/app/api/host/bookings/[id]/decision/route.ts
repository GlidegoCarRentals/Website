import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const decision = body?.decision;

  if (!['confirm', 'decline'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, host_id, status')
    .eq('id', id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.host_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const nextStatus = decision === 'confirm' ? 'confirmed' : 'declined';
  const { error } = await supabase
    .from('bookings')
    .update({
      status: nextStatus,
      cancelled_at: decision === 'decline' ? new Date().toISOString() : null,
      cancellation_reason: decision === 'decline' ? body.reason || 'Declined by host' : null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from('booking_status_history').insert({
    booking_id: id,
    old_status: booking.status,
    new_status: nextStatus,
    changed_by: user.id,
    reason: body.reason || null,
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
