'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { HostDashboardData } from '@/lib/profile/types';

function money(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function compactPercent(value: number) {
  return `${Math.round(value || 0)}%`;
}

function shortDate(value: string | null | undefined) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function actionTone(status: string) {
  if (status === 'pending') return { bg: 'rgba(245,158,11,0.12)', color: '#d97706' };
  if (['confirmed', 'active', 'completed'].includes(status)) return { bg: 'rgba(16,185,129,0.12)', color: '#059669' };
  return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' };
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-flat" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function HostProfileDashboard({ data }: { data: HostDashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [hostForm, setHostForm] = useState({
    display_name: data.hostProfile?.displayName || data.user.fullName,
    about: data.hostProfile?.about || '',
    instant_booking_enabled: Boolean(data.hostProfile?.instantBookingEnabled),
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 8 }}>Host command center</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em' }}>
            {data.hostProfile?.displayName || data.user.fullName}
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {data.hostProfile?.superhostStatus ? (
              <span className="rounded" style={{ background: 'rgba(29,78,216,0.12)', color: '#1d4ed8', padding: '8px 12px', fontSize: 13, fontWeight: 800 }}>
                Superhost
              </span>
            ) : null}
            <span className="rounded" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>
              Trust score {data.user.trustScore}/100
            </span>
            <span className="rounded" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 12px', fontSize: 13 }}>
              Response rate {compactPercent(data.hostProfile?.responseRate || 0)}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => router.refresh()}>
          Refresh live data
        </button>
      </div>

      {message ? (
        <div className="card-flat" style={{ marginBottom: 20, padding: '14px 18px', color: message.toLowerCase().includes('wrong') ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
        <Metric label="Monthly revenue" value={money(data.analytics.totals.totalRevenue)} sub={`${data.analytics.totals.totalConfirmedBookings} confirmed bookings`} />
        <Metric label="Fleet" value={String(data.analytics.totals.fleetCount)} sub={`${data.analytics.totals.activeVehicleCount} active or bookable`} />
        <Metric label="Views to bookings" value={compactPercent(data.analytics.totals.conversionRate)} sub={`${data.analytics.totals.totalViews} views tracked`} />
        <Metric label="Pending payout" value={money(data.hostProfile?.pendingPayoutAmount || 0)} sub={`${data.payouts.length} payout records`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Booking management</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Hosts can accept, decline, and monitor the full operational state of each trip.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[...data.pendingBookings, ...data.upcomingBookings.slice(0, 4), ...data.activeBookings.slice(0, 2)].map((booking) => {
                const tone = actionTone(booking.status);
                return (
                  <div key={booking.id} className="card-flat" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>
                          {booking.car?.make} {booking.car?.model} · {booking.guest?.fullName}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                          {shortDate(booking.startDate)} to {shortDate(booking.endDate)} · {booking.tripDays} day(s)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {booking.bookingReference} · Guest trust {booking.guest?.trustScore || 0} · Licence {booking.guest?.driverLicenceStatus || 'pending'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{money(booking.totalAmount)}</div>
                        <div style={{ marginTop: 6, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>
                          {booking.status}
                        </div>
                      </div>
                    </div>
                    {booking.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={isPending}
                          onClick={() => mutate(`/api/host/bookings/${booking.id}/decision`, { method: 'POST', body: JSON.stringify({ decision: 'confirm' }) }, 'Booking confirmed.')}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={isPending}
                          onClick={() => mutate(`/api/host/bookings/${booking.id}/decision`, { method: 'POST', body: JSON.stringify({ decision: 'decline', reason: 'Declined from host dashboard' }) }, 'Booking declined.')}
                        >
                          Decline
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {data.pendingBookings.length + data.upcomingBookings.length + data.activeBookings.length === 0 ? (
                <div className="card-flat" style={{ padding: 18, color: 'var(--color-text-3)' }}>No host-side bookings yet.</div>
              ) : null}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Fleet and analytics</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {data.analytics.perCar.map((entry) => (
                <div key={entry.car.id} className="card-flat" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{entry.car.make} {entry.car.model}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                        {entry.car.location_name} · {money(entry.car.price_daily)}/day · Rating {entry.car.avg_rating || 'New'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }}>{money(entry.totalRevenue)}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>30d revenue</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, fontSize: 12 }}>
                    <div><strong>{entry.totalViews}</strong><div style={{ color: 'var(--color-text-muted)' }}>Views</div></div>
                    <div><strong>{entry.totalBookingRequests}</strong><div style={{ color: 'var(--color-text-muted)' }}>Requests</div></div>
                    <div><strong>{entry.totalConfirmedBookings}</strong><div style={{ color: 'var(--color-text-muted)' }}>Confirmed</div></div>
                    <div><strong>{compactPercent(entry.conversionRate)}</strong><div style={{ color: 'var(--color-text-muted)' }}>Conversion</div></div>
                  </div>
                </div>
              ))}
              {data.analytics.perCar.length === 0 ? <div className="card-flat" style={{ padding: 16, color: 'var(--color-text-3)' }}>Fleet analytics will populate after listings go live and traffic lands.</div> : null}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Messaging and reviews</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent conversations</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.conversations.map((conversation) => (
                    <div key={conversation.id} className="card-flat" style={{ padding: 14 }}>
                      <div style={{ fontWeight: 800 }}>{conversation.guest?.full_name || conversation.guest?.fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>
                        {conversation.car?.make} {conversation.car?.model} · {conversation.unreadCount} unread
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                        {conversation.lastMessage?.body || 'No messages yet.'}
                      </div>
                    </div>
                  ))}
                  {data.conversations.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Guest-host chat threads will appear here.</div> : null}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent reviews</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.recentReviews.map((review) => (
                    <div key={review.id} className="card-flat" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>{review.reviewer?.full_name || review.reviewer?.fullName}</div>
                        <div style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(review.rating)}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 8 }}>{review.body || 'No written feedback.'}</div>
                    </div>
                  ))}
                  {data.recentReviews.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Reviews from completed trips will show here.</div> : null}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Host profile and pricing controls</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="label">Display name</label>
                <input className="input" value={hostForm.display_name} onChange={(event) => setHostForm((current) => ({ ...current, display_name: event.target.value }))} />
              </div>
              <div>
                <label className="label">About</label>
                <textarea className="input" rows={5} value={hostForm.about} onChange={(event) => setHostForm((current) => ({ ...current, about: event.target.value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Instant booking</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Let qualified guests confirm without manual approval.</div>
                </div>
                <button
                  className={`toggle ${hostForm.instant_booking_enabled ? 'on' : ''}`}
                  onClick={() => setHostForm((current) => ({ ...current, instant_booking_enabled: !current.instant_booking_enabled }))}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={isPending}
                onClick={() => mutate('/api/host/settings', { method: 'PATCH', body: JSON.stringify(hostForm) }, 'Host settings updated.')}
              >
                Save host settings
              </button>
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Operational health</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Acceptance rate', compactPercent(data.hostProfile?.acceptanceRate || 0)],
                ['Completion rate', compactPercent(data.hostProfile?.completionRate || 0)],
                ['On-time rate', compactPercent(data.hostProfile?.onTimeRate || 0)],
                ['Response time', `${data.hostProfile?.responseTimeMinutes || 0} min`],
              ].map(([label, value]) => (
                <div key={label} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Stripe payouts</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {data.payouts.slice(0, 6).map((payout) => (
                <div key={payout.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{money(payout.amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Available {shortDate(payout.available_on || payout.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: payout.status === 'paid' ? 'var(--color-primary-dark)' : 'var(--color-text-3)' }}>
                    {payout.status}
                  </div>
                </div>
              ))}
              {data.payouts.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Payouts will appear after Stripe Connect transfers are created.</div> : null}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>AI performance insights</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {data.aiInsights.map((insight) => (
                <div key={insight.id} className="card-flat" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>{insight.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 6 }}>{insight.summary}</div>
                  {insight.recommendation ? <div style={{ fontSize: 12, color: 'var(--color-primary-dark)', marginTop: 8 }}>{insight.recommendation}</div> : null}
                </div>
              ))}
              {data.aiInsights.length === 0 ? (
                <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>
                  AI insight rows can be populated by scheduled jobs that score pricing, response speed, and conversion risk.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
