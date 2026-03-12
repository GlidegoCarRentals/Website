import { Resend } from 'resend';
import {
  bookingConfirmationEmail,
  adminNewBookingEmail,
  reminderEmail,
  cancellationEmail,
  paymentReceiptEmail,
  tripCompleteEmail,
  type BookingData,
  type CancellationData,
  type PaymentData,
  type TripCompleteData,
} from './email-templates';

// Lazy init — only at runtime, NOT at build time. Fixes Vercel build crash.
let _resend: InstanceType<typeof Resend> | null = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn('[Email] RESEND_API_KEY not set — emails will be skipped');
      return null;
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = 'GlideGo <bookings@glidego.com.au>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@glidego.com.au';
const REPLY_TO = 'hello@glidego.com.au';

// ─── Helper ───────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.warn(`[Email] Skipped (no API key): "${subject}" → ${to}`);
    return { success: false, error: 'No API key configured' };
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      reply_to: REPLY_TO,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" → ${to}`, result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" → ${to}:`, err);
    return { success: false, error: err };
  }
}

// ─── 1. Booking Confirmation (customer + admin alert) ──────────────
export async function sendBookingConfirmation(booking: BookingData) {
  const { subject, html } = bookingConfirmationEmail(booking);
  const { subject: adminSubject, html: adminHtml } = adminNewBookingEmail({
    ...booking,
    customerEmail: booking.customerEmail,
  });

  const [customerResult, adminResult] = await Promise.all([
    sendEmail(booking.customerEmail, subject, html),
    sendEmail(ADMIN_EMAIL, adminSubject, adminHtml),
  ]);

  return { customer: customerResult, admin: adminResult };
}

// ─── 2. Payment Receipt ────────────────────────────────────────────
export async function sendPaymentReceipt(payment: PaymentData) {
  const { subject, html } = paymentReceiptEmail(payment);
  return sendEmail(payment.customerEmail, subject, html);
}

// ─── 3. Reminder (1 day before) ───────────────────────────────────
export async function sendReminderEmail(booking: BookingData) {
  const { subject, html } = reminderEmail(booking);
  return sendEmail(booking.customerEmail, subject, html);
}

// ─── 4. Cancellation ──────────────────────────────────────────────
export async function sendCancellationEmail(data: CancellationData) {
  const { subject, html } = cancellationEmail(data);
  const adminSubject = `Cancellation: ${data.carName} — #${data.bookingId.slice(-6).toUpperCase()}`;
  const adminHtml = `<p>Booking #${data.bookingId.slice(-6).toUpperCase()} for <b>${data.carName}</b> has been cancelled by ${data.customerName}. Refund: $${data.refundAmount}</p>`;

  const [customerResult, adminResult] = await Promise.all([
    sendEmail(data.customerEmail, subject, html),
    sendEmail(ADMIN_EMAIL, adminSubject, adminHtml),
  ]);

  return { customer: customerResult, admin: adminResult };
}

// ─── 5. Trip Complete + Bond Release ──────────────────────────────
export async function sendTripCompleteEmail(data: TripCompleteData) {
  const { subject, html } = tripCompleteEmail(data);
  return sendEmail(data.customerEmail, subject, html);
}

// ─── 6. Admin Alert only ──────────────────────────────────────────
export async function sendAdminAlert(subject: string, message: string) {
  return sendEmail(ADMIN_EMAIL, subject, `
    <div style="font-family:sans-serif;padding:24px;max-width:600px;margin:0 auto;">
      <h2 style="color:#0f172a;">${subject}</h2>
      <p style="color:#475569;line-height:1.7;">${message}</p>
      <p style="margin-top:20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://glidego.vercel.app'}/admin" style="background:#1d4ed8;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Open Admin Panel</a></p>
    </div>
  `);
}
