import { NextRequest, NextResponse } from 'next/server';
import { getStripe, toCents } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, totalAmount, customerEmail, customerName, skipDatabase } = await req.json();

    if (!bookingId || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: toCents(totalAmount),
      currency: 'aud',
      receipt_email: customerEmail || null,
      metadata: {
        bookingId,
        customerName: customerName || 'Customer',
        type: 'rental_charge',
      },
      description: `Car Rental - Booking #${bookingId}`,
    });

    if (!skipDatabase) {
      await getSupabase().from('payments').insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        status: 'pending',
        type: 'rental',
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Payment Intent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
