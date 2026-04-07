import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { isMissingSchemaError } from '@/lib/supabase/errors';

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const notificationUpdates: Record<string, boolean> = {};
  const securityUpdates: Record<string, boolean | number> = {};

  const notificationKeys = [
    'email_trip_updates',
    'email_marketing',
    'email_promotions',
    'sms_trip_updates',
    'sms_security_alerts',
    'push_trip_updates',
    'push_messages',
    'push_host_booking_requests',
  ];

  notificationKeys.forEach((key) => {
    if (typeof body[key] === 'boolean') {
      notificationUpdates[key] = body[key];
    }
  });

  if (typeof body.two_factor_enabled === 'boolean') {
    securityUpdates.two_factor_enabled = body.two_factor_enabled;
  }
  if (typeof body.login_alerts === 'boolean') {
    securityUpdates.login_alerts = body.login_alerts;
  }

  if (Object.keys(notificationUpdates).length > 0) {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({ user_id: user.id, ...notificationUpdates }, { onConflict: 'user_id' });

    if (error && !isMissingSchemaError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (Object.keys(securityUpdates).length > 0) {
    const { error } = await supabase
      .from('user_security_settings')
      .upsert({ user_id: user.id, ...securityUpdates }, { onConflict: 'user_id' });

    if (error && !isMissingSchemaError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
