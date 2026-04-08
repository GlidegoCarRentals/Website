'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { GuestDashboardData } from '@/lib/profile/types';

type GuestView = 'overview' | 'trips' | 'finance' | 'security';

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

function StatCard({ label, value, sub }: Readonly<{ label: string; value: string; sub: string }>) {
  return (
    <div className="card-flat" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: Readonly<{ eyebrow?: string; title: string; description: string }>) {
  return (
    <div style={{ marginBottom: 18 }}>
      {eyebrow ? <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{eyebrow}</div> : null}
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{description}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: Readonly<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}>) {
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

function ViewSwitch({
  value,
  onChange,
}: Readonly<{
  value: GuestView;
  onChange: (next: GuestView) => void;
}>) {
  const views: Array<{ id: GuestView; label: string; description: string }> = [
    { id: 'overview', label: 'Overview', description: 'Readiness, trust, next actions' },
    { id: 'trips', label: 'Trips', description: 'Upcoming, active, history' },
    { id: 'finance', label: 'Finance', description: 'Wallet, cards, billing' },
    { id: 'security', label: 'Security', description: 'Profile, alerts, sessions' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          className="card-flat"
          style={{
            padding: 16,
            textAlign: 'left',
            borderColor: value === view.id ? 'rgba(59,130,246,0.35)' : 'var(--color-border)',
            background: value === view.id ? 'linear-gradient(135deg, rgba(29,78,216,0.18), rgba(16,185,129,0.10))' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{view.label}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{view.description}</div>
        </button>
      ))}
    </div>
  );
}

function BookingCard({ booking, emphasis }: Readonly<{ booking: any; emphasis?: 'primary' | 'muted' }>) {
  const tone = statusTone(booking.status);

  return (
    <div
      className="card-flat"
      style={{
        padding: 18,
        background: emphasis === 'primary'
          ? 'linear-gradient(135deg, rgba(29,78,216,0.12), rgba(16,185,129,0.08))'
          : 'var(--color-surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 78, height: 58, borderRadius: 14, overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
            {booking.car?.photos?.[0] ? (
              <Image
                src={booking.car.photos[0]}
                alt={`${booking.car.make} ${booking.car.model}`}
                width={78}
                height={58}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {booking.car?.make} {booking.car?.model}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 3 }}>
              {shortDate(booking.startDate)} to {shortDate(booking.endDate)} - {booking.tripDays} day(s)
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 5 }}>
              {booking.bookingReference} - {booking.pickupLocation || booking.car?.locationName || 'Pickup TBC'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{money(booking.totalAmount)}</div>
          <div style={{ marginTop: 8, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>
            {booking.status}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestProfileDashboard({ data }: Readonly<{ data: GuestDashboardData }>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [view, setView] = useState<GuestView>('overview');
  const [profileForm, setProfileForm] = useState({
    fullName: data.user.fullName || '',
    phone: data.user.phone || '',
    city: data.user.city || '',
    emergencyContactName: data.guestProfile?.emergencyContactName || '',
    emergencyContactPhone: data.guestProfile?.emergencyContactPhone || '',
  });

  const trustLabel = useMemo(() => {
    if (data.user.trustScore >= 85) return 'Elite';
    if (data.user.trustScore >= 70) return 'Trusted';
    if (data.user.trustScore >= 55) return 'Verified';
    return 'Building';
  }, [data.user.trustScore]);

  const driverLicenceStatus = data.user.driverLicenceStatus || 'not_started';
  const favouriteCars = (data.favourites || []).filter((entry) => entry?.car?.id);
  const reviewItems = data.reviews || [];
  const paymentMethods = data.paymentMethods || [];
  const paymentHistory = data.paymentHistory || [];
  const walletTransactions = data.walletTransactions || [];
  const trustEvents = data.trustEvents || [];
  const allTrips = [
    ...data.activeTrips.map((booking) => ({ ...booking, lane: 'Active trip' })),
    ...data.upcomingTrips.map((booking) => ({ ...booking, lane: 'Upcoming' })),
    ...data.pastTrips.map((booking) => ({ ...booking, lane: 'History' })),
    ...data.cancelledTrips.map((booking) => ({ ...booking, lane: 'Cancelled' })),
  ];

  const profileCompleteness = useMemo(() => {
    const checks = [
      Boolean(data.user.fullName),
      Boolean(data.user.phone),
      Boolean(data.user.emailVerified),
      Boolean(data.user.phoneVerified),
      driverLicenceStatus === 'approved',
      Boolean(data.guestProfile?.emergencyContactName),
      Boolean(paymentMethods.length),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data, driverLicenceStatus, paymentMethods.length]);

  const commandCenter = useMemo(() => {
    const items = [];

    if (driverLicenceStatus !== 'approved') {
      items.push({
        title: 'Finish licence verification',
        description: 'Complete driver approval to unlock instant approvals and reduce manual review.',
        tone: '#d97706',
      });
    }

    if (!data.user.phoneVerified) {
      items.push({
        title: 'Verify your phone number',
        description: 'SMS trip alerts and urgent host coordination work better when your number is verified.',
        tone: '#2563eb',
      });
    }

    if (data.upcomingTrips.length > 0) {
      items.push({
        title: `You have ${data.upcomingTrips.length} upcoming trip${data.upcomingTrips.length > 1 ? 's' : ''}`,
        description: 'Review pickup details and host instructions before your next trip starts.',
        tone: '#059669',
      });
    }

    if (items.length === 0) {
      items.push({
        title: 'You are trip-ready',
        description: 'Your account is in strong shape. Keep building trust with smooth trips and detailed reviews.',
        tone: '#059669',
      });
    }

    return items.slice(0, 3);
  }, [data.upcomingTrips.length, data.user.phoneVerified, driverLicenceStatus]);

  const mutate = async (url: string, options: RequestInit, successMessage: string) => {
    setMessage('');
    try {
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
    } catch {
      setMessage('Network issue detected. Please try again.');
    }
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
              Trust score {data.user.trustScore}/100 - {trustLabel}
            </span>
            <span className="rounded" style={{ background: 'rgba(29,78,216,0.14)', color: '#60a5fa', padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>
              Profile completeness {profileCompleteness}%
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/reset-password" className="btn btn-ghost">Password reset</Link>
          <button className="btn btn-secondary" disabled={isPending} onClick={() => router.refresh()}>Refresh live data</button>
        </div>
      </div>

      {message ? (
        <div className="card-flat" style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--color-surface)', color: message.toLowerCase().includes('error') ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Upcoming trips" value={String(data.upcomingTrips.length + data.activeTrips.length)} sub="Live trip orchestration" />
        <StatCard label="Lifetime spend" value={money(data.guestProfile?.lifetimeSpend || 0)} sub="Trips, protection, fees" />
        <StatCard label="Wallet" value={money(data.wallet?.balance || 0)} sub={`${money(data.wallet?.promoCreditBalance || 0)} promo credits`} />
        <StatCard label="Saved cards" value={String(paymentMethods.length)} sub={`${paymentHistory.length} recent transactions`} />
      </div>

      <ViewSwitch value={view} onChange={setView} />

      {view === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Command center" title="Trip readiness" description="A world-class renter dashboard should surface what matters before something breaks." />
              <div style={{ display: 'grid', gap: 12 }}>
                {commandCenter.map((item) => (
                  <div key={item.title} className="card-flat" style={{ padding: 16, borderLeft: `4px solid ${item.tone}` }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Trust layer" title="Verification and trust" description="Identity, licence, contactability, and behavior signals shape eligibility and risk." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                {[
                  { label: 'Email', value: data.user.emailVerified ? 'Verified' : 'Pending', status: data.user.emailVerified ? 'approved' : 'pending' },
                  { label: 'Phone', value: data.user.phoneVerified ? 'Verified' : 'Pending', status: data.user.phoneVerified ? 'approved' : 'pending' },
                  { label: 'Driver licence', value: driverLicenceStatus.replaceAll('_', ' '), status: driverLicenceStatus },
                  { label: 'Trust tier', value: trustLabel, status: data.user.trustScore >= 70 ? 'approved' : 'pending' },
                ].map((item) => {
                  const tone = statusTone(item.status);
                  return (
                    <div key={item.label} className="card-flat" style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, textTransform: 'capitalize' }}>{item.value}</div>
                      <div style={{ marginTop: 10, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Next trip" title="Upcoming and active bookings" description="Critical trip details stay front and center, including pickup context, status, and amount." />
              <div style={{ display: 'grid', gap: 14 }}>
                {[...data.activeTrips, ...data.upcomingTrips].slice(0, 4).map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} emphasis={index === 0 ? 'primary' : 'muted'} />
                ))}
                {data.activeTrips.length + data.upcomingTrips.length === 0 ? (
                  <div className="card-flat" style={{ padding: 18, color: 'var(--color-text-3)' }}>
                    No upcoming trips yet. Once bookings are created they will appear here with real-time state.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Personal layer" title="Identity snapshot" description="The essentials hosts and support teams rely on during urgent trip moments." />
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Full name', data.user.fullName],
                  ['Email', data.user.email],
                  ['Phone', data.user.phone || 'Add phone number'],
                  ['City', data.user.city || 'Not set'],
                  ['Emergency contact', data.guestProfile?.emergencyContactName || 'Not set'],
                ].map(([label, value]) => (
                  <div key={label} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Savings" title="Wallet and referrals" description="Rewards, promo credits, and referral-led growth should feel like part of the travel product." />
              <div className="card-flat" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Available balance</div>
                <div style={{ fontSize: 28, fontWeight: 900, margin: '6px 0' }}>{money(data.wallet?.balance || 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                  Promo credits {money(data.wallet?.promoCreditBalance || 0)} - Referral credits {money(data.wallet?.referralCreditBalance || 0)}
                </div>
              </div>
              <div className="card-flat" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Referral performance</div>
                <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{data.guestProfile?.referralCompletedCount || 0} successful referrals</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Rewards, wallet credits, and growth loops should all converge inside one account surface.</div>
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Taste profile" title="Saved cars and reviews" description="Your profile should learn from what you save, book, and review." />
              <div style={{ display: 'grid', gap: 12 }}>
                {favouriteCars.slice(0, 3).map((entry) => (
                  <div key={entry.car.id} className="card-flat" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{entry.car.make} {entry.car.model}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{entry.car.location_name} - {money(entry.car.price_daily)}/day</div>
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
                {reviewItems.slice(0, 2).map((review) => (
                  <div key={review.id} className="card-flat" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontWeight: 800 }}>{review.title || `${review.target_type} review`}</div>
                      <div style={{ color: '#f59e0b', fontWeight: 700 }}>{review.rating}/5</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{review.body || 'No written feedback provided.'}</div>
                  </div>
                ))}
                {favouriteCars.length === 0 && reviewItems.length === 0 ? (
                  <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>
                    Save cars, take trips, and leave reviews to unlock GlideGo recommendations.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {view === 'trips' ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card">
            <SectionTitle eyebrow="Trips" title="Trip timeline" description="Every reservation should be legible at a glance, from pending approval to completed and reviewed." />
            <div style={{ display: 'grid', gap: 14 }}>
              {allTrips.map((booking) => (
                <div key={booking.id}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{booking.lane}</div>
                  <BookingCard booking={booking} />
                </div>
              ))}
              {allTrips.length === 0 ? <div className="card-flat" style={{ padding: 18, color: 'var(--color-text-3)' }}>No trips yet.</div> : null}
            </div>
          </section>
        </div>
      ) : null}

      {view === 'finance' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          <section className="card">
            <SectionTitle eyebrow="Finance" title="Wallet and billing" description="Credits, payment methods, and charge history should feel trustworthy and transparent." />
            <div className="card-flat" style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Current wallet</div>
              <div style={{ fontSize: 30, fontWeight: 900, margin: '6px 0' }}>{money(data.wallet?.balance || 0)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                Promo {money(data.wallet?.promoCreditBalance || 0)} - Referral {money(data.wallet?.referralCreditBalance || 0)}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{method.brand || 'Card'} ending {method.last4}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Expires {method.exp_month}/{method.exp_year}</div>
                  </div>
                  {method.is_default ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-dark)' }}>Default</span> : null}
                </div>
              ))}
              {paymentMethods.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>No saved cards on file yet.</div> : null}
            </div>
          </section>

          <section className="card">
            <SectionTitle eyebrow="Ledger" title="Transactions and rewards" description="A modern account center should show both travel payments and value recovery events." />
            <div style={{ display: 'grid', gap: 12 }}>
              {paymentHistory.slice(0, 6).map((payment) => (
                <div key={payment.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{payment.bookings?.booking_reference || payment.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{shortDate(payment.created_at)} - {payment.status}</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{money(payment.amount)}</div>
                </div>
              ))}
              {walletTransactions.slice(0, 6).map((entry) => (
                <div key={entry.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{entry.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{shortDate(entry.created_at)} - {entry.type}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: Number(entry.amount || 0) >= 0 ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
                    {Number(entry.amount || 0) > 0 ? '+' : ''}{money(Number(entry.amount || 0))}
                  </div>
                </div>
              ))}
              {paymentHistory.length === 0 && walletTransactions.length === 0 ? (
                <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>No financial activity yet.</div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {view === 'security' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          <section className="card">
            <SectionTitle eyebrow="Security" title="Personal information" description="Critical account identity should be editable, reviewable, and support-friendly." />
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

          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Preferences" title="Notifications and sessions" description="Communication settings and session alerts belong in the core trust stack." />
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
                Active sessions: <strong>{data.security?.activeSessionCount || 0}</strong> - Last password reset: <strong>{shortDate(data.security?.lastPasswordResetAt)}</strong>
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Trust log" title="Trust event history" description="A next-generation account should explain why trust changes, not hide it." />
              <div style={{ display: 'grid', gap: 10 }}>
                {trustEvents.map((event) => (
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
                {trustEvents.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Trust events will appear here as GlideGo validates identity, payments, and trip behavior.</div> : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
