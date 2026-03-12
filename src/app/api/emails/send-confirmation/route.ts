import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation, sendPaymentReceipt } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, booking, payment } = body;

    if (type === 'booking_confirmation') {
      if (!booking?.customerEmail || !booking?.bookingId) {
        return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
      }
      const result = await sendBookingConfirmation(booking);
      return NextResponse.json({ success: true, result });
    }

    if (type === 'payment_receipt') {
      if (!payment?.customerEmail || !payment?.bookingId) {
        return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
      }
      const result = await sendPaymentReceipt(payment);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (err: any) {
    console.error('[Email API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
