import { NextRequest, NextResponse } from 'next/server';
import { sendCancellationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerEmail, bookingId, carName, pickupDate, totalAmount, refundAmount, reason } = body;

    if (!customerEmail || !bookingId || !carName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sendCancellationEmail({
      customerName: customerName || 'Customer',
      customerEmail,
      bookingId,
      carName,
      pickupDate: pickupDate || '',
      totalAmount: Number(totalAmount) || 0,
      refundAmount: Number(refundAmount) || 0,
      reason,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[Cancel Email API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
