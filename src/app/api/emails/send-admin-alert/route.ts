import { NextRequest, NextResponse } from 'next/server';
import { sendAdminAlert, sendTripCompleteEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === 'admin_alert') {
      const { subject, message } = body;
      if (!subject || !message) {
        return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 });
      }
      const result = await sendAdminAlert(subject, message);
      return NextResponse.json({ success: true, result });
    }

    if (type === 'trip_complete') {
      const { tripData } = body;
      if (!tripData?.customerEmail || !tripData?.bookingId) {
        return NextResponse.json({ error: 'Missing trip data' }, { status: 400 });
      }
      const result = await sendTripCompleteEmail(tripData);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid type. Use: admin_alert | trip_complete' }, { status: 400 });

  } catch (err: any) {
    console.error('[Admin Alert API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
