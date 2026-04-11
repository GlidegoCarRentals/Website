import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendBookingConfirmation,
  sendPaymentReceipt,
  sendCancellationEmail,
  sendAdminAlert,
} from '@/lib/email';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// ─────────────────────────────────────────────
// Event handlers — one function per event type
// ─────────────────────────────────────────────

async function handlePaymentSucceeded(pi: any) {
  const meta = pi.metadata || {};
  if (!meta.bookingId || meta.type !== 'rental_charge') return;

  const db = getSupabase();
  await db.from('payments').update({ status: 'paid' }).eq('stripe_payment_intent_id', pi.id);
  await db.from('bookings').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', meta.bookingId);

  const { data: booking } = await db.from('bookings').select('*').eq('id', meta.bookingId).single();

  const emailData = {
    bookingId:       booking?.id            || meta.bookingId,
    customerName:    booking?.customer_name  || meta.customerName  || 'Valued Customer',
    customerEmail:   booking?.customer_email || meta.customerEmail || '',
    carName:         booking?.car_name       || meta.carName       || 'Your Vehicle',
    carCategory:     booking?.car_category   || meta.carCategory   || 'Car',
    pickupLocation:  booking?.pickup_location || meta.pickupLocation || 'As confirmed',
    returnLocation:  booking?.return_location || meta.returnLocation || 'As confirmed',
    pickupDate:      booking?.pickup_date    || meta.pickupDate    || '',
    returnDate:      booking?.return_date    || meta.returnDate    || '',
    days:            Number(booking?.days    || meta.days          || 1),
    totalAmount:     pi.amount / 100,
    bondAmount:      Number(meta.bondAmount  || 500),
    hostName:        booking?.host_name      || 'GlideGo Team',
  };

  if (!emailData.customerEmail) return;
  await sendBookingConfirmation(emailData);
  await sendPaymentReceipt({
    customerName:    emailData.customerName,
    customerEmail:   emailData.customerEmail,
    bookingId:       emailData.bookingId,
    carName:         emailData.carName,
    amount:          pi.amount / 100,
    bondAmount:      emailData.bondAmount,
    paymentMethod:   'Credit / Debit Card',
    paymentDate:     new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }),
    stripePaymentId: pi.id,
  });
}

async function handlePaymentFailed(pi: any) {
  const meta = pi.metadata || {};
  if (meta.bookingId) {
    const db = getSupabase();
    await db.from('payments').update({ status: 'failed' }).eq('stripe_payment_intent_id', pi.id);
    await db.from('bookings').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', meta.bookingId);
  }
  await sendAdminAlert(
    `⚠️ Payment Failed — ${meta.carName || 'Unknown Car'}`,
    `Payment of $${pi.amount / 100} failed.<br/>Customer: ${meta.customerName || 'Unknown'} (${meta.customerEmail || '-'})<br/>Car: ${meta.carName || '-'}<br/>Error: ${pi.last_payment_error?.message || 'Unknown'}`
  );
}

async function handleChargeRefunded(charge: any) {
  const refundAmount = charge.amount_refunded / 100;
  const db = getSupabase();
  await db.from('payments').update({ status: 'refunded' }).eq('stripe_payment_intent_id', charge.payment_intent);

  const { data: payment } = await db.from('payments').select('booking_id').eq('stripe_payment_intent_id', charge.payment_intent).single();
  if (payment?.booking_id) {
    const { data: booking } = await db.from('bookings').select('*').eq('id', payment.booking_id).single();
    if (booking?.customer_email) {
      await sendCancellationEmail({
        customerName:  booking.customer_name  || 'Customer',
        customerEmail: booking.customer_email,
        bookingId:     booking.id,
        carName:       booking.car_name       || 'Vehicle',
        pickupDate:    booking.pickup_date    || '',
        totalAmount:   charge.amount / 100,
        refundAmount,
      });
    }
  }
  await sendAdminAlert(`💸 Refund $${refundAmount}`, `Refund processed for payment ${charge.payment_intent}`);
}

async function handleDisputeCreated(dispute: any) {
  await sendAdminAlert(
    `🚨 DISPUTE — $${dispute.amount / 100} — URGENT`,
    `Dispute raised for $${dispute.amount / 100}. Charge: ${dispute.charge}. Reason: ${dispute.reason}. Respond within 7 days!`
  );
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? '');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature error';
    console.error('Webhook signature error:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Event: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object);
      break;
    default:
      console.log(`[Webhook] Unhandled: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
