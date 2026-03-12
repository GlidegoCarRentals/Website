// ═══════════════════════════════════════════════
// GLIDEGO EMAIL TEMPLATES — All scenarios
// ═══════════════════════════════════════════════

const BASE_STYLES = `
  body { margin:0; padding:0; background:#f1f5f9; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
  .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
  .card { background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#1d4ed8 0%,#059669 100%); padding:36px 40px; text-align:center; }
  .header-logo { font-size:28px; font-weight:900; color:white; letter-spacing:-0.5px; }
  .header-tagline { color:rgba(255,255,255,0.75); font-size:13px; margin-top:6px; }
  .body { padding:36px 40px; }
  .greeting { font-size:22px; font-weight:700; color:#0f172a; margin-bottom:8px; }
  .subtext { color:#64748b; font-size:15px; line-height:1.7; margin-bottom:28px; }
  .booking-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:24px; }
  .booking-title { font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:0.1em; margin-bottom:16px; }
  .booking-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9; }
  .booking-row:last-child { border-bottom:none; }
  .booking-label { font-size:13px; color:#64748b; }
  .booking-value { font-size:13px; font-weight:700; color:#0f172a; text-align:right; }
  .highlight-box { background:linear-gradient(135deg,#eff6ff,#f0fdf4); border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin-bottom:24px; text-align:center; }
  .highlight-amount { font-size:32px; font-weight:900; color:#1d4ed8; }
  .highlight-label { font-size:13px; color:#64748b; margin-top:4px; }
  .btn { display:inline-block; background:linear-gradient(135deg,#1d4ed8,#059669); color:white!important; text-decoration:none; font-size:15px; font-weight:700; padding:14px 32px; border-radius:10px; margin:8px 4px; }
  .btn-outline { display:inline-block; background:transparent; color:#1d4ed8!important; text-decoration:none; font-size:15px; font-weight:700; padding:13px 32px; border-radius:10px; border:2px solid #1d4ed8; margin:8px 4px; }
  .steps { margin-bottom:24px; }
  .step { display:flex; gap:14px; align-items:flex-start; padding:12px 0; border-bottom:1px solid #f1f5f9; }
  .step:last-child { border-bottom:none; }
  .step-num { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#1d4ed8,#059669); color:white; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .step-text { font-size:14px; color:#374151; line-height:1.6; }
  .step-title { font-weight:700; color:#0f172a; margin-bottom:2px; }
  .alert-box { background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px 20px; margin-bottom:20px; }
  .alert-title { font-size:14px; font-weight:700; color:#dc2626; margin-bottom:4px; }
  .alert-text { font-size:13px; color:#7f1d1d; line-height:1.6; }
  .success-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px 20px; margin-bottom:20px; }
  .success-icon { font-size:40px; text-align:center; margin-bottom:12px; }
  .divider { border:none; border-top:1px solid #f1f5f9; margin:24px 0; }
  .footer { background:#f8fafc; padding:24px 40px; text-align:center; border-top:1px solid #f1f5f9; }
  .footer-text { font-size:12px; color:#94a3b8; line-height:1.8; }
  .footer-links { margin-top:8px; }
  .footer-links a { color:#64748b; text-decoration:none; font-size:12px; margin:0 8px; }
  .social-row { margin-top:12px; }
  .tag { display:inline-block; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin:0 3px; }
  .tag-green { background:#f0fdf4; color:#15803d; }
  .tag-red { background:#fef2f2; color:#dc2626; }
  .car-hero { background:linear-gradient(135deg,#e0f2fe,#dcfce7); padding:20px; text-align:center; border-radius:10px; margin-bottom:20px; }
  .car-emoji { font-size:64px; }
  .car-name { font-size:18px; font-weight:800; color:#0f172a; margin-top:8px; }
  .car-cat { font-size:12px; color:#64748b; margin-top:2px; }
`;

function htmlWrap(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>GlideGo</title>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">🚗 GlideGo</div>
      <div class="header-tagline">Melbourne's #1 Car Rental</div>
    </div>
    ${content}
  </div>
  <div style="text-align:center;margin-top:20px;">
    <p style="font-size:12px;color:#94a3b8;">© 2026 GlideGo Car Rentals Pty Ltd · ABN 12 345 678 901</p>
    <p style="font-size:12px;color:#94a3b8;">Level 2, 390 Collins Street, Melbourne VIC 3000</p>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────
// 1. BOOKING CONFIRMATION → Customer
// ─────────────────────────────────────────────────────
export interface BookingData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  carName: string;
  carCategory: string;
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  returnDate: string;
  days: number;
  totalAmount: number;
  bondAmount: number;
  hostName: string;
  hostPhone?: string;
}

export function bookingConfirmationEmail(b: BookingData) {
  const subject = `✅ Booking Confirmed — ${b.carName} | GlideGo #${b.bookingId.slice(-6).toUpperCase()}`;
  const html = htmlWrap(`
    <div class="body">
      <div class="success-icon">🎉</div>
      <div class="greeting">You're all set, ${b.customerName}!</div>
      <p class="subtext">Your booking is confirmed. Get ready to hit the road — here's everything you need to know.</p>

      <div class="car-hero">
        <div class="car-emoji">🚗</div>
        <div class="car-name">${b.carName}</div>
        <div class="car-cat">${b.carCategory} · ${b.days} day${b.days > 1 ? 's' : ''}</div>
      </div>

      <div class="booking-box">
        <div class="booking-title">BOOKING DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Booking Reference', `#${b.bookingId.slice(-6).toUpperCase()}`],
            ['Vehicle', b.carName],
            ['Pickup Location', b.pickupLocation],
            ['Return Location', b.returnLocation],
            ['Pickup Date', b.pickupDate],
            ['Return Date', b.returnDate],
            ['Duration', `${b.days} day${b.days > 1 ? 's' : ''}`],
            ['Your Host', b.hostName],
            ...(b.hostPhone ? [['Host Contact', b.hostPhone]] : []),
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="highlight-box">
        <div class="highlight-amount">$${b.totalAmount.toLocaleString()}</div>
        <div class="highlight-label">Total paid · Bond $${b.bondAmount} (refunded after trip)</div>
      </div>

      <div class="steps">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:14px;">📋 What happens next?</div>
        ${[
          { title: 'Check your details', text: 'Review your booking info above. If anything looks wrong, contact us immediately.' },
          { title: 'Get directions ready', text: `Head to ${b.pickupLocation} on ${b.pickupDate}. The host will meet you there.` },
          { title: 'Bring your licence', text: 'You must present a valid Australian or international driver\'s licence at pickup.' },
          { title: 'Enjoy the ride!', text: 'Return the car to the agreed location on time with the same fuel level.' },
        ].map((s, i) => `
          <div class="step">
            <div class="step-num">${i + 1}</div>
            <div class="step-text">
              <div class="step-title">${s.title}</div>
              ${s.text}
            </div>
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <p style="font-size:13px;color:#64748b;text-align:center;line-height:1.7;">
        Need to make changes? Contact us at least 24 hours before pickup.<br/>
        <strong style="color:#0f172a;">📞 (03) 9600 1234 · ✉️ hello@glidego.com.au</strong>
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">
        <span class="tag">✓ Free Cancellation</span>
        <span class="tag tag-green">✓ 24/7 Support</span>
        <span class="tag">✓ Insured</span>
      </p>
      <p class="footer-text" style="margin-top:12px;">Questions? Reply to this email or call (03) 9600 1234</p>
    </div>
  `, `Your ${b.carName} is booked for ${b.pickupDate}!`);
  return { subject, html };
}

// ─────────────────────────────────────────────────────
// 2. ADMIN ALERT → New Booking
// ─────────────────────────────────────────────────────
export function adminNewBookingEmail(b: BookingData & { customerEmail: string; customerPhone?: string }) {
  const subject = `🔔 New Booking #${b.bookingId.slice(-6).toUpperCase()} — ${b.carName} · $${b.totalAmount}`;
  const html = htmlWrap(`
    <div class="body">
      <div class="greeting">New Booking Received!</div>
      <p class="subtext">A new booking just came in. Review the details below and confirm availability.</p>

      <div class="highlight-box">
        <div class="highlight-amount">$${b.totalAmount.toLocaleString()}</div>
        <div class="highlight-label">Booking #${b.bookingId.slice(-6).toUpperCase()} · ${b.days} day${b.days > 1 ? 's' : ''}</div>
      </div>

      <div class="booking-box">
        <div class="booking-title">CUSTOMER</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Name', b.customerName],
            ['Email', b.customerEmail],
            ...(b.customerPhone ? [['Phone', b.customerPhone]] : []),
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="booking-box">
        <div class="booking-title">BOOKING</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Vehicle', b.carName],
            ['Category', b.carCategory],
            ['Pickup', b.pickupLocation],
            ['Return', b.returnLocation],
            ['Pickup Date', b.pickupDate],
            ['Return Date', b.returnDate],
            ['Days', `${b.days}`],
            ['Total', `$${b.totalAmount.toLocaleString()}`],
            ['Bond', `$${b.bondAmount}`],
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="text-align:center;margin-top:8px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://glidego.vercel.app'}/admin/bookings" class="btn">View in Dashboard →</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">GlideGo Admin Notification · <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://glidego.vercel.app'}/admin">Open Admin Panel</a></p>
    </div>
  `, `New booking from ${b.customerName} for ${b.carName}`);
  return { subject, html };
}

// ─────────────────────────────────────────────────────
// 3. REMINDER EMAIL → 1 Day Before
// ─────────────────────────────────────────────────────
export function reminderEmail(b: BookingData) {
  const subject = `⏰ Reminder: Your ${b.carName} pickup is TOMORROW — GlideGo`;
  const html = htmlWrap(`
    <div class="body">
      <div style="text-align:center;font-size:48px;margin-bottom:16px;">⏰</div>
      <div class="greeting" style="text-align:center;">Pickup Tomorrow, ${b.customerName}!</div>
      <p class="subtext" style="text-align:center;">Just a friendly reminder — your ${b.carName} is ready and waiting for you tomorrow.</p>

      <div class="booking-box">
        <div class="booking-title">YOUR TRIP TOMORROW</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Vehicle', b.carName],
            ['Pickup Location', b.pickupLocation],
            ['Pickup Date', b.pickupDate],
            ['Return Date', b.returnDate],
            ['Host', b.hostName],
            ...(b.hostPhone ? [['Host Phone', b.hostPhone]] : []),
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:10px;">📋 Checklist for tomorrow:</div>
        ${['Valid driver\'s licence (mandatory)', 'Arrive on time at pickup location', 'Check the car before driving — note any existing damage', 'Fuel level on pickup — return at same level', 'Emergency contact: (03) 9600 1234'].map(item => `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#78350f;padding:4px 0;">
            <span style="color:#d97706;">☑</span> ${item}
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <p style="font-size:13px;color:#64748b;text-align:center;line-height:1.7;">
        Need to cancel or modify? Do it now to avoid fees.<br/>
        <strong style="color:#0f172a;">📞 (03) 9600 1234</strong>
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">Safe travels! The GlideGo Team 🚗</p>
    </div>
  `, `Reminder: ${b.carName} pickup tomorrow at ${b.pickupLocation}`);
  return { subject, html };
}

// ─────────────────────────────────────────────────────
// 4. CANCELLATION EMAIL → Customer
// ─────────────────────────────────────────────────────
export interface CancellationData {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  carName: string;
  pickupDate: string;
  totalAmount: number;
  refundAmount: number;
  reason?: string;
}

export function cancellationEmail(c: CancellationData) {
  const subject = `❌ Booking Cancelled — ${c.carName} | Refund $${c.refundAmount} | GlideGo`;
  const html = htmlWrap(`
    <div class="body">
      <div style="text-align:center;font-size:48px;margin-bottom:16px;">❌</div>
      <div class="greeting" style="text-align:center;">Booking Cancelled</div>
      <p class="subtext" style="text-align:center;">
        Hi ${c.customerName}, your booking for <strong>${c.carName}</strong> has been cancelled.
        ${c.reason ? `Reason: ${c.reason}` : ''}
      </p>

      <div class="booking-box">
        <div class="booking-title">CANCELLED BOOKING</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Booking Reference', `#${c.bookingId.slice(-6).toUpperCase()}`],
            ['Vehicle', c.carName],
            ['Scheduled Pickup', c.pickupDate],
            ['Amount Paid', `$${c.totalAmount.toLocaleString()}`],
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      ${c.refundAmount > 0 ? `
      <div class="highlight-box">
        <div class="highlight-amount" style="color:#15803d;">$${c.refundAmount.toLocaleString()}</div>
        <div class="highlight-label">Refund amount · 3–5 business days to your card</div>
      </div>
      <div class="success-box">
        <p style="font-size:13px;color:#166534;margin:0;line-height:1.7;">
          ✅ Your refund of <strong>$${c.refundAmount.toLocaleString()}</strong> has been initiated.<br/>
          It will appear on your original payment method within 3–5 business days.
        </p>
      </div>
      ` : `
      <div class="alert-box">
        <div class="alert-title">No Refund Applicable</div>
        <div class="alert-text">This booking was cancelled outside the free cancellation window. No refund will be issued.</div>
      </div>
      `}

      <hr class="divider"/>
      <p style="font-size:14px;font-weight:700;color:#0f172a;text-align:center;margin-bottom:12px;">Looking for another car?</p>
      <div style="text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://glidego.vercel.app'}/#fleet" class="btn">Browse Our Fleet →</a>
      </div>

      <hr class="divider"/>
      <p style="font-size:13px;color:#64748b;text-align:center;line-height:1.7;">
        Questions about your cancellation?<br/>
        <strong style="color:#0f172a;">📞 (03) 9600 1234 · ✉️ hello@glidego.com.au</strong>
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">We hope to see you again soon · The GlideGo Team 🚗</p>
    </div>
  `, `Your ${c.carName} booking has been cancelled`);
  return { subject, html };
}

// ─────────────────────────────────────────────────────
// 5. PAYMENT RECEIPT → Customer
// ─────────────────────────────────────────────────────
export interface PaymentData {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  carName: string;
  amount: number;
  bondAmount: number;
  paymentMethod: string;
  paymentDate: string;
  stripePaymentId: string;
}

export function paymentReceiptEmail(p: PaymentData) {
  const subject = `🧾 Payment Receipt — $${p.amount} | GlideGo Booking #${p.bookingId.slice(-6).toUpperCase()}`;
  const html = htmlWrap(`
    <div class="body">
      <div style="text-align:center;font-size:48px;margin-bottom:16px;">🧾</div>
      <div class="greeting" style="text-align:center;">Payment Successful!</div>
      <p class="subtext" style="text-align:center;">Thank you, ${p.customerName}. Here's your official receipt from GlideGo.</p>

      <div class="highlight-box">
        <div class="highlight-amount">$${p.amount.toLocaleString()}</div>
        <div class="highlight-label">Payment received on ${p.paymentDate}</div>
      </div>

      <div class="booking-box">
        <div class="booking-title">PAYMENT DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Receipt Number', `REC-${p.bookingId.slice(-6).toUpperCase()}`],
            ['Booking Reference', `#${p.bookingId.slice(-6).toUpperCase()}`],
            ['Vehicle', p.carName],
            ['Payment Date', p.paymentDate],
            ['Payment Method', p.paymentMethod],
            ['Transaction ID', p.stripePaymentId.slice(0, 20) + '...'],
            ['Rental Amount', `$${(p.amount - 0).toLocaleString()}`],
            ['Bond (pre-auth)', `$${p.bondAmount}`],
            ['Total Charged', `$${p.amount.toLocaleString()}`],
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
        <p style="font-size:13px;color:#166534;margin:0;line-height:1.6;">
          🔒 Payment processed securely via Stripe. Your card details are never stored on our servers.<br/>
          Bond of <strong>$${p.bondAmount}</strong> will be released after successful return.
        </p>
      </div>

      <hr class="divider"/>
      <p style="font-size:12px;color:#94a3b8;text-align:center;line-height:1.7;">
        This is an official tax invoice. ABN: 12 345 678 901<br/>
        GlideGo Car Rentals Pty Ltd · Level 2, 390 Collins Street, Melbourne VIC 3000
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">Keep this email as your payment record · GlideGo 🚗</p>
    </div>
  `, `Payment of $${p.amount} received for ${p.carName}`);
  return { subject, html };
}

// ─────────────────────────────────────────────────────
// 6. TRIP COMPLETE + BOND RELEASE → Customer
// ─────────────────────────────────────────────────────
export interface TripCompleteData {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  carName: string;
  pickupDate: string;
  returnDate: string;
  bondAmount: number;
  deductedAmount?: number;
  reviewLink?: string;
}

export function tripCompleteEmail(t: TripCompleteData) {
  const released = t.bondAmount - (t.deductedAmount || 0);
  const subject = `🏁 Trip Complete — Bond $${released} Released | GlideGo`;
  const html = htmlWrap(`
    <div class="body">
      <div style="text-align:center;font-size:48px;margin-bottom:16px;">🏁</div>
      <div class="greeting" style="text-align:center;">Trip Complete, ${t.customerName}!</div>
      <p class="subtext" style="text-align:center;">Thanks for choosing GlideGo. We hope you had a great time with the ${t.carName}.</p>

      <div class="booking-box">
        <div class="booking-title">TRIP SUMMARY</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['Booking Reference', `#${t.bookingId.slice(-6).toUpperCase()}`],
            ['Vehicle', t.carName],
            ['Pickup Date', t.pickupDate],
            ['Return Date', t.returnDate],
            ['Bond Held', `$${t.bondAmount}`],
            ...(t.deductedAmount ? [['Damage Deduction', `-$${t.deductedAmount}`]] : []),
            ['Bond Released', `$${released}`],
          ].map(([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:${value.startsWith('-') ? '#dc2626' : '#0f172a'};text-align:right;">${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="highlight-box">
        <div class="highlight-amount" style="color:#15803d;">$${released}</div>
        <div class="highlight-label">Bond released · 3–5 business days to your card</div>
      </div>

      ${t.deductedAmount ? `
      <div class="alert-box">
        <div class="alert-title">Damage Deduction Applied</div>
        <div class="alert-text">A deduction of $${t.deductedAmount} was applied for damage. Contact us if you have questions.</div>
      </div>
      ` : ''}

      <hr class="divider"/>
      <p style="font-size:15px;font-weight:700;color:#0f172a;text-align:center;margin-bottom:8px;">How was your experience?</p>
      <p style="font-size:13px;color:#64748b;text-align:center;margin-bottom:16px;">Your feedback helps us improve and helps other renters make great choices.</p>
      <div style="text-align:center;">
        <a href="${t.reviewLink || 'https://glidego.vercel.app'}" class="btn">Leave a Review ⭐</a>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://glidego.vercel.app'}/#fleet" class="btn-outline">Book Again →</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">Thank you for choosing GlideGo · See you next time! 🚗</p>
    </div>
  `, `Trip complete — bond of $${released} released`);
  return { subject, html };
}
