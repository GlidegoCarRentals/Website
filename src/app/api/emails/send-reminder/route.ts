import { NextRequest, NextResponse } from 'next/server';
import { sendReminderEmail } from '@/lib/email';

// This route is called by a cron job (Vercel Cron) every day at 9am
// It sends reminders to all customers with pickups tomorrow
export async function POST(req: NextRequest) {
  try {
    // Verify this is called by cron or admin (basic auth)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'glidego-cron-2026';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { booking } = body;

    if (!booking?.customerEmail || !booking?.bookingId) {
      return NextResponse.json({ error: 'Missing booking data' }, { status: 400 });
    }

    const result = await sendReminderEmail(booking);
    return NextResponse.json({ success: true, result });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Reminder Email API] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — Vercel Cron calls this at 9am daily
// vercel.json: { "crons": [{ "path": "/api/emails/send-reminder", "schedule": "0 23 * * *" }] }
export async function GET(req: NextRequest) {
  try {
    // Verify Vercel cron request
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production: query Supabase for bookings with pickup = tomorrow
    // For now: return success skeleton
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`[Cron] Running reminder job for ${tomorrowStr}`);

    // Placeholder: Supabase bookings query will be connected when the bookings table is ready.
    // Implementation will query bookings with pickup_date = tomorrowStr and status = 'confirmed',
    // then call sendReminderEmail for each matching booking.

    return NextResponse.json({ 
      success: true, 
      message: `Reminder job ran for ${tomorrowStr}`,
      note: 'Connect Supabase query to activate real reminders'
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Reminder Cron] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
