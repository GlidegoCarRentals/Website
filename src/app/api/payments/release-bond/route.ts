import { NextRequest, NextResponse } from 'next/server';
import { getStripe, toCents } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, action, damageAmount } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: booking, error } = await getSupabase()
      .from('bookings').select('bond_intent_id').eq('id', bookingId).single();

    if (error || !booking?.bond_intent_id) {
      return NextResponse.json({ error: 'Booking or bond not found' }, { status: 404 });
    }

    if (action === 'release') {
      await getStripe().paymentIntents.cancel(booking.bond_intent_id);
      await getSupabase().from('bookings').update({ bond_status: 'released' }).eq('id', bookingId);
      return NextResponse.json({ message: 'Bond released successfully' });
    }

    if (action === 'capture') {
      if (!damageAmount) return NextResponse.json({ error: 'Damage amount required' }, { status: 400 });
      await getStripe().paymentIntents.capture(booking.bond_intent_id, { amount_to_capture: toCents(damageAmount) });
      await getSupabase().from('bookings').update({ bond_status: 'captured', damage_charge: damageAmount }).eq('id', bookingId);
      return NextResponse.json({ message: `Bond captured: $${damageAmount} AUD` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
