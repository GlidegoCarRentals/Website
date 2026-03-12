import { NextRequest, NextResponse } from 'next/server';
import { stripe, toCents } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, action, damageAmount } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings').select('bond_intent_id').eq('id', bookingId).single();

    if (error || !booking?.bond_intent_id) {
      return NextResponse.json({ error: 'Booking or bond not found' }, { status: 404 });
    }

    if (action === 'release') {
      await stripe.paymentIntents.cancel(booking.bond_intent_id);
      await supabase.from('bookings').update({ bond_status: 'released' }).eq('id', bookingId);
      return NextResponse.json({ message: 'Bond released successfully' });
    }

    if (action === 'capture') {
      if (!damageAmount) return NextResponse.json({ error: 'Damage amount required' }, { status: 400 });
      await stripe.paymentIntents.capture(booking.bond_intent_id, { amount_to_capture: toCents(damageAmount) });
      await supabase.from('bookings').update({ bond_status: 'captured', damage_charge: damageAmount }).eq('id', bookingId);
      return NextResponse.json({ message: `Bond captured: $${damageAmount} AUD` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
