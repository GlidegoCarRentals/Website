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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? '');
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Event: ${event.type}`);

  switch (event.type) {

    case 'payment_intent.succeeded': {
      const pi = event.data.object as any;
      const meta = pi.metadata || {};

      if (meta.bookingId && meta.type === 'rental_charge') {
        await getSupabase().from('payments').update({ status: 'succeeded' }).eq('stripe_payment_intent_id', pi.id);
        await getSupabase().from('bookings').update({ payment_status: 'paid', booking_status: 'confirmed' }).eq('id', meta.bookingId);

        const { data: booking } = await getSupabase().from('bookings').select('*').eq('id', meta.bookingId).single();

        const emailData = {
          bookingId: booking?.id || meta.bookingId,
          customerName: booking?.customer_name || meta.customerName || 'Valued Customer',
          customerEmail: booking?.customer_email || meta.customerEmail || '',
          carName: booking?.car_name || meta.carName || 'Your Vehicle',
          carCategory: booking?.car_category || meta.carCategory || 'Car',
          pickupLocation: booking?.pickup_location || meta.pickupLocation || 'As confirmed',
          returnLocation: booking?.return_location || meta.returnLocation || 'As confirmed',
          pickupDate: booking?.pickup_date || meta.pickupDate || '',
          returnDate: booking?.return_date || meta.returnDate || '',
          days: Number(booking?.days || meta.days || 1),
          totalAmount: pi.amount / 100,
          bondAmount: Number(meta.bondAmount || 500),
          hostName: booking?.host_name || 'GlideGo Team',
        };

        if (emailData.customerEmail) {
          await sendBookingConfirmation(emailData);
          await sendPaymentReceipt({
            customerName: emailData.customerName,
            customerEmail: emailData.customerEmail,
            bookingId: emailData.bookingId,
            carName: emailData.carName,
            amount: pi.amount / 100,
            bondAmount: emailData.bondAmount,
            paymentMethod: 'Credit / Debit Card',
            paymentDate: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }),
            stripePaymentId: pi.id,
          });
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as any;
      const meta = pi.metadata || {};
      if (meta.bookingId) {
        await getSupabase().from('payments').update({ status: 'failed' }).eq('stripe_payment_intent_id', pi.id);
        await getSupabase().from('bookings').update({ payment_status: 'failed', booking_status: 'cancelled' }).eq('id', meta.bookingId);
      }
      await sendAdminAlert(
        `⚠️ Payment Failed — ${meta.carName || 'Unknown Car'}`,
        `Payment of $${pi.amount / 100} failed.<br/>Customer: ${meta.customerName || 'Unknown'} (${meta.customerEmail || '-'})<br/>Car: ${meta.carName || '-'}<br/>Error: ${pi.last_payment_error?.message || 'Unknown'}`
      );
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as any;
      const refundAmount = charge.amount_refunded / 100;
      await getSupabase().from('payments').update({ status: 'refunded' }).eq('stripe_payment_intent_id', charge.payment_intent);

      const { data: payment } = await getSupabase().from('payments').select('booking_id').eq('stripe_payment_intent_id', charge.payment_intent).single();
      if (payment?.booking_id) {
        const { data: booking } = await getSupabase().from('bookings').select('*').eq('id', payment.booking_id).single();
        if (booking?.customer_email) {
          await sendCancellationEmail({
            customerName: booking.customer_name || 'Customer',
            customerEmail: booking.customer_email,
            bookingId: booking.id,
            carName: booking.car_name || 'Vehicle',
            pickupDate: booking.pickup_date || '',
            totalAmount: charge.amount / 100,
            refundAmount,
          });
        }
      }
      await sendAdminAlert(`💸 Refund $${refundAmount}`, `Refund processed for payment ${charge.payment_intent}`);
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as any;
      await sendAdminAlert(
        `🚨 DISPUTE — $${dispute.amount / 100} — URGENT`,
        `Dispute raised for $${dispute.amount / 100}. Charge: ${dispute.charge}. Reason: ${dispute.reason}. Respond within 7 days!`
      );
      break;
    }

    default:
      console.log(`[Webhook] Unhandled: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
