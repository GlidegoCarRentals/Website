'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { GuestDashboardData } from '@/lib/profile/types';

function money(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function shortDate(value: string | null | undefined) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusTone(status: string) {
  if (['confirmed', 'active', 'completed', 'approved'].includes(status)) {
    return { bg: 'rgba(16,185,129,0.12)', color: '#059669' };
  }
  if (['pending', 'awaiting_payment'].includes(status)) {
    return { bg: 'rgba(245,158,11,0.12)', color: '#d97706' };
  }
  return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-flat" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--color-border)' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{description}</div>
      </div>
      <button className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} aria-label={label} />
    </div>
  );
}

export default function GuestProfileDashboard({ data }: { data: GuestDashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileForm, setProfileForm] = useState({
    fullName: data.user.fullName || '',
    phone: data.user.phone || '',
    city: data.user.city || '',
    emergencyContactName: data.guestProfile?.emergencyContactName || '',
    emergencyContactPhone: data.guestProfile?.emergencyContactPhone || '',
  });
  const [message, setMessage] = useState('');

  const trustLabel = useMemo(() => {
    if (data.user.trustScore >= 85) return 'Elite';
    if (data.user.trustScore >= 70) return 'Trusted';
    if (data.user.trustScore >= 55) return 'Verified';
    return 'Building';
  }, [data.user.trustScore]);

  const mutate = async (url: string, options: RequestInit, successMessage: string) => {
    setMessage('');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || 'Something went wrong.');
      return;
    }

    setMessage(successMessage);
    startTransition(() => router.refresh());
  };

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 8 }}>Guest account</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em' }}>{data.user.fullName}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <span className="rounded" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 12px', fontSize: 13 }}>
              Member since {shortDate(data.user.createdAt)}
            </span>
            <span className="rounded" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>
              Trust score {data.user.trustScore}/100 · {trustLabel}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/reset-password" className="btn btn-ghost">Password reset</Link>
          <button className="btn btn-secondary" onClick={() => router.refresh()}>Refresh live data</button>
        </div>
      </div>

      {message ? (
        <div className="card-flat" style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--color-surface)', color: message.toLowerCase().includes('wrong') ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Upcoming trips" value={String(data.upcomingTrips.length + data.activeTrips.length)} sub="Real-time booking state" />
        <StatCard label="Lifetime spend" value={money(data.guestProfile?.lifetimeSpend || 0)} sub="Trips, protection, and fees" />
        <StatCard label="Wallet" value={money(data.wallet?.balance || 0)} sub={`${money(data.wallet?.promoCreditBalance || 0)} promo credits`} />
        <StatCard label="Saved cards" value={String(data.paymentMethods.length)} sub={`${data.paymentHistory.length} recent transactions`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Trust and verification</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Identity, driver licence, contactability, and behavior signals all shape booking eligibility.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
              {[
                { label: 'Email', value: data.user.emailVerified ? 'Verified' : 'Pending', status: data.user.emailVerified ? 'approved' : 'pending' },
                { label: 'Phone', value: data.user.phoneVerified ? 'Verified' : 'Pending', status: data.user.phoneVerified ? 'approved' : 'pending' },
                { label: 'Driver licence', value: data.user.driverLicenceStatus.replace('_', ' '), status: data.user.driverLicenceStatus },
              ].map((item) => {
                const tone = statusTone(item.status);
                return (
                  <div key={item.label} className="card-flat" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{item.value}</div>
                    <div style={{ marginTop: 10, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Trips</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Every booking is connected to the database lifecycle: pending, confirmed, active, completed, or cancelled.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[...data.activeTrips, ...data.upcomingTrips, ...data.pastTrips.slice(0, 3), ...data.cancelledTrips.slice(0, 2)].map((booking) => {
                const tone = statusTone(booking.status);
                return (
                  <div key={booking.id} className="card-flat" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 72, height: 54, borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                        {booking.car?.photos?.[0] ? (
                          <Image
                            src={booking.car.photos[0]}
                            alt={`${booking.car.make} ${booking.car.model}`}
                            width={72}
                            height={54}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>
                          {booking.car?.make} {booking.car?.model}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                          {shortDate(booking.startDate)} to {shortDate(booking.endDate)} · {booking.tripDays} day(s)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          Host: {booking.host?.fullName || 'GlideGo host'} · {booking.bookingReference}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{money(booking.totalAmount)}</div>
                      <div style={{ marginTop: 6, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.upcomingTrips.length + data.activeTrips.length + data.pastTrips.length + data.cancelledTrips.length === 0 ? (
                <div className="card-flat" style={{ padding: 18, color: 'var(--color-text-3)' }}>No trips yet. Once bookings are created they’ll appear here with real-time state.</div>
              ) : null}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Favourites and reviews</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Saved cars</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.favourites.slice(0, 4).map((entry) => (
                    <div key={entry.car.id} className="card-flat" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{entry.car.make} {entry.car.model}</div>
                          <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                            {entry.car.location_name} · {money(entry.car.price_daily)}/day
                          </div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={isPending}
                          onClick={() => mutate('/api/account/favourites', { method: 'DELETE', body: JSON.stringify({ carId: entry.car.id }) }, 'Favourite removed.')}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.favourites.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>No favourites saved yet.</div> : null}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Reviews you’ve written</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.reviews.slice(0, 4).map((review) => (
                    <div key={review.id} className="card-flat" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontWeight: 800 }}>{review.title || `${review.target_type} review`}</div>
                        <div style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(review.rating)}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{review.body || 'No written feedback provided.'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>{shortDate(review.created_at)}</div>
                    </div>
                  ))}
                  {data.reviews.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Completed trips will unlock review prompts here.</div> : null}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Personal information</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="label">Full name</label>
                <input className="input" value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} />
              </div>
              <div>
                <label className="label">Emergency contact</label>
                <input className="input" value={profileForm.emergencyContactName} onChange={(event) => setProfileForm((current) => ({ ...current, emergencyContactName: event.target.value }))} />
              </div>
              <div>
                <label className="label">Emergency contact phone</label>
                <input className="input" value={profileForm.emergencyContactPhone} onChange={(event) => setProfileForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} />
              </div>
              <button
                className="btn btn-primary"
                disabled={isPending}
                onClick={() => mutate('/api/account/profile', { method: 'PATCH', body: JSON.stringify(profileForm) }, 'Profile updated.')}
              >
                Save profile
              </button>
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Wallet and referrals</h2>
            <div className="card-flat" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Available balance</div>
              <div style={{ fontSize: 28, fontWeight: 900, margin: '6px 0' }}>{money(data.wallet?.balance || 0)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                Promo credits {money(data.wallet?.promoCreditBalance || 0)} · Referral credits {money(data.wallet?.referralCreditBalance || 0)}
              </div>
            </div>
            <div className="card-flat" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Referral performance</div>
              <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{data.guestProfile?.referralCompletedCount || 0} successful referrals</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Shareable referral rewards and wallet adjustments land in the ledger below.</div>
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Payment and billing</h2>
            <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 16 }}>Stripe-backed payment methods and booking charges.</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {data.paymentMethods.map((method) => (
                <div key={method.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{method.brand || 'Card'} ending {method.last4}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Expires {method.exp_month}/{method.exp_year}</div>
                  </div>
                  {method.is_default ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-dark)' }}>Default</span> : null}
                </div>
              ))}
              {data.paymentMethods.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>No saved cards on file yet.</div> : null}
              {data.paymentHistory.slice(0, 4).map((payment) => (
                <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-3)' }}>
                  <span>{payment.bookings?.booking_reference || payment.type}</span>
                  <span>{money(payment.amount)} · {payment.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Notifications and security</h2>
            <ToggleRow
              label="Trip emails"
              description="Booking confirmations, reminders, and trip changes."
              checked={Boolean(data.notificationPreferences?.emailTripUpdates)}
              onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ email_trip_updates: value }) }, 'Notification preferences updated.')}
            />
            <ToggleRow
              label="SMS trip updates"
              description="Pickup reminders, host changes, and urgent alerts."
              checked={Boolean(data.notificationPreferences?.smsTripUpdates)}
              onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ sms_trip_updates: value }) }, 'Notification preferences updated.')}
            />
            <ToggleRow
              label="Push messages"
              description="Real-time chat notifications from hosts."
              checked={Boolean(data.notificationPreferences?.pushMessages)}
              onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ push_messages: value }) }, 'Notification preferences updated.')}
            />
            <ToggleRow
              label="Login alerts"
              description="Get alerted when a new session is created."
              checked={Boolean(data.security?.loginAlerts)}
              onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ login_alerts: value }) }, 'Security settings updated.')}
            />
            <div className="divider" />
            <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
              Active sessions: <strong>{data.security?.activeSessionCount || 0}</strong> · Last password reset: <strong>{shortDate(data.security?.lastPasswordResetAt)}</strong>
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Trust activity</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {data.trustEvents.map((event) => (
                <div key={event.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{event.reason}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{event.source}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: event.score_delta >= 0 ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
                    {event.score_delta > 0 ? '+' : ''}{event.score_delta}
                  </div>
                </div>
              ))}
              {data.trustEvents.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Trust events will appear here as GlideGo validates identity, payments, and trip behavior.</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
