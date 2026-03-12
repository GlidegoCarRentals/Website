import { NextRequest, NextResponse } from 'next/server';
import { stripe, BOND_AMOUNT, toCents } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, customBondAmount, customerEmail } = await req.json();

    if (!bookingId || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bondAmount = customBondAmount ? toCents(customBondAmount) : BOND_AMOUNT;

    const bondIntent = await stripe.paymentIntents.create({
      amount: bondAmount,
      currency: 'aud',
      capture_method: 'manual',
      receipt_email: customerEmail,
      metadata: { bookingId, type: 'bond' },
      description: `Bond Hold - Booking #${bookingId}`,
    });

    await supabase.from('payments').insert({
      booking_id: bookingId,
      stripe_payment_intent_id: bondIntent.id,
      amount: bondAmount / 100,
      status: 'authorized',
      type: 'bond',
    });

    await supabase.from('bookings')
      .update({ bond_status: 'authorized', bond_intent_id: bondIntent.id })
      .eq('id', bookingId);

    return NextResponse.json({
      clientSecret: bondIntent.client_secret,
      bondIntentId: bondIntent.id,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
