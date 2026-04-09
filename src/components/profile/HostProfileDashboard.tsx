'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { HostDashboardData } from '@/lib/profile/types';

type HostView = 'overview' | 'operations' | 'fleet' | 'growth';

const money = (value: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value || 0);
const compactPercent = (value: number) => `${Math.round(value || 0)}%`;
const shortDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
function actionTone(status: string): { bg: string; color: string } {
  if (status === 'pending') return { bg: 'rgba(245,158,11,0.12)', color: '#d97706' };
  if (['confirmed', 'active', 'completed', 'approved', 'paid'].includes(status)) return { bg: 'rgba(16,185,129,0.12)', color: '#059669' };
  return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' };
}

function computeProfileStrength(data: HostDashboardData): number {
  const checks = [
    Boolean(data.hostProfile?.displayName || data.user.fullName),
    Boolean(data.hostProfile?.about),
    Boolean(data.user.phoneVerified),
    Boolean(data.user.emailVerified),
    Boolean(data.hostProfile?.instantBookingEnabled),
    data.analytics.totals.fleetCount > 0,
    data.recentReviews.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function computeHostCommandCenter(data: HostDashboardData): Array<{ title: string; description: string; tone: string }> {
  const items: Array<{ title: string; description: string; tone: string }> = [];
  if (data.pendingBookings.length > 0) {
    const s = data.pendingBookings.length > 1 ? 's' : '';
    items.push({ title: `${data.pendingBookings.length} booking request${s} waiting`, description: 'Fast approvals lift conversion and improve search placement.', tone: '#d97706' });
  }
  if ((data.hostProfile?.responseRate || 0) < 90) {
    items.push({ title: 'Response rate can be stronger', description: 'Reply speed affects trust, rank, and host eligibility.', tone: '#2563eb' });
  }
  if ((data.hostProfile?.pendingPayoutAmount || 0) > 0) {
    items.push({ title: `${money(data.hostProfile?.pendingPayoutAmount || 0)} in pending payouts`, description: 'Keep handoffs smooth so Stripe releases transfers on schedule.', tone: '#059669' });
  }
  if (items.length === 0) {
    items.push({ title: 'Your host operation is running smoothly', description: 'Focus next on pricing, conversion, and repeat guests.', tone: '#059669' });
  }
  return items.slice(0, 3);
}

function Metric({ label, value, sub }: Readonly<{ label: string; value: string; sub: string }>) {
  return (
    <div className="card-flat" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{value}</div>
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

function ToggleRow({ label, description, checked, onChange }: Readonly<{ label: string; description: string; checked: boolean; onChange: (value: boolean) => void }>) {
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

function ViewSwitch({ value, onChange }: Readonly<{ value: HostView; onChange: (next: HostView) => void }>) {
  const views: Array<{ id: HostView; label: string; description: string }> = [
    { id: 'overview', label: 'Overview', description: 'Health, revenue, host readiness' },
    { id: 'operations', label: 'Operations', description: 'Bookings, chats, service control' },
    { id: 'fleet', label: 'Fleet', description: 'Vehicles, utilization, pricing posture' },
    { id: 'growth', label: 'Growth', description: 'Reviews, payouts, AI insights' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
      {views.map((view) => (
        <button key={view.id} onClick={() => onChange(view.id)} className="card-flat" style={{ padding: 16, textAlign: 'left', borderColor: value === view.id ? 'rgba(59,130,246,0.35)' : 'var(--color-border)', background: value === view.id ? 'linear-gradient(135deg, rgba(29,78,216,0.18), rgba(16,185,129,0.10))' : 'var(--color-surface)', cursor: 'pointer' }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{view.label}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{view.description}</div>
        </button>
      ))}
    </div>
  );
}

function BookingCard({ booking, isPending, onDecision }: Readonly<{ booking: any; isPending: boolean; onDecision: (id: string, decision: 'confirm' | 'decline') => void }>) {
  const tone = actionTone(booking.status);
  return (
    <div className="card-flat" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{booking.car?.make} {booking.car?.model} - {booking.guest?.fullName || 'Guest'}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{shortDate(booking.startDate)} to {shortDate(booking.endDate)} - {booking.tripDays} day(s)</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{booking.bookingReference} - Guest trust {booking.guest?.trustScore || 0} - Licence {booking.guest?.driverLicenceStatus || 'pending'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{money(booking.totalAmount)}</div>
          <div style={{ marginTop: 6, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700 }}>{booking.status}</div>
        </div>
      </div>
      {booking.status === 'pending' ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" disabled={isPending} onClick={() => onDecision(booking.id, 'confirm')}>Accept</button>
          <button className="btn btn-danger btn-sm" disabled={isPending} onClick={() => onDecision(booking.id, 'decline')}>Decline</button>
        </div>
      ) : null}
    </div>
  );
}

export default function HostProfileDashboard({ data }: Readonly<{ data: HostDashboardData }>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [view, setView] = useState<HostView>('overview');
  const [hostForm, setHostForm] = useState({ display_name: data.hostProfile?.displayName || data.user.fullName, about: data.hostProfile?.about || '', instant_booking_enabled: Boolean(data.hostProfile?.instantBookingEnabled) });

  const mutate = async (url: string, options: RequestInit, successMessage: string) => {
    setMessage('');
    try {
      const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(payload.error || 'Something went wrong.');
      setMessage(successMessage);
      startTransition(() => router.refresh());
    } catch {
      setMessage('Network issue detected. Please try again.');
    }
  };

  const totalLiveBookings = data.pendingBookings.length + data.upcomingBookings.length + data.activeBookings.length;
  const profileStrength = useMemo(() => computeProfileStrength(data), [data]);
  const commandCenter = useMemo(() => computeHostCommandCenter(data), [data]);

  const handleBookingDecision = (bookingId: string, decision: 'confirm' | 'decline') =>
    mutate(`/api/host/bookings/${bookingId}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason: decision === 'decline' ? 'Declined from host command center' : undefined }) }, decision === 'confirm' ? 'Booking confirmed.' : 'Booking declined.');

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 8 }}>Host command center</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em' }}>{data.hostProfile?.displayName || data.user.fullName}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {data.hostProfile?.superhostStatus ? <span className="rounded" style={{ background: 'rgba(29,78,216,0.12)', color: '#1d4ed8', padding: '8px 12px', fontSize: 13, fontWeight: 800 }}>Superhost</span> : null}
            <span className="rounded" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>Trust score {data.user.trustScore}/100</span>
            <span className="rounded" style={{ background: 'rgba(29,78,216,0.14)', color: '#60a5fa', padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>Profile strength {profileStrength}%</span>
            <span className="rounded" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 12px', fontSize: 13 }}>Response rate {compactPercent(data.hostProfile?.responseRate || 0)}</span>
          </div>
        </div>
        <button className="btn btn-secondary" disabled={isPending} onClick={() => router.refresh()}>Refresh live data</button>
      </div>

      {message ? <div className="card-flat" style={{ marginBottom: 20, padding: '14px 18px', color: message.toLowerCase().includes('wrong') || message.toLowerCase().includes('issue') ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>{message}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        <Metric label="Monthly revenue" value={money(data.analytics.totals.totalRevenue)} sub={`${data.analytics.totals.totalConfirmedBookings} confirmed bookings`} />
        <Metric label="Fleet" value={String(data.analytics.totals.fleetCount)} sub={`${data.analytics.totals.activeVehicleCount} active or bookable`} />
        <Metric label="Views to bookings" value={compactPercent(data.analytics.totals.conversionRate)} sub={`${data.analytics.totals.totalViews} views tracked`} />
        <Metric label="Pending payout" value={money(data.hostProfile?.pendingPayoutAmount || 0)} sub={`${data.payouts.length} payout records`} />
      </div>

      <ViewSwitch value={view} onChange={setView} />

      {view === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Command center" title="Operational priorities" description="A top-tier host dashboard should make bottlenecks visible before they become support issues." />
              <div style={{ display: 'grid', gap: 12 }}>
                {commandCenter.map((item) => <div key={item.title} className="card-flat" style={{ padding: 16, borderLeft: `4px solid ${item.tone}` }}><div style={{ fontWeight: 800, marginBottom: 4 }}>{item.title}</div><div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{item.description}</div></div>)}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Service lane" title="Bookings needing attention" description="Pending requests, scheduled trips, and live handoffs should all be manageable from one place." />
              <div style={{ display: 'grid', gap: 14 }}>
                {[...data.pendingBookings, ...data.upcomingBookings, ...data.activeBookings].slice(0, 8).map((booking) => <BookingCard key={booking.id} booking={booking} isPending={isPending} onDecision={handleBookingDecision} />)}
                {totalLiveBookings === 0 ? <div className="card-flat" style={{ padding: 18, color: 'var(--color-text-3)' }}>No bookings are in motion right now.</div> : null}
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Performance" title="Host quality signals" description="The best host systems expose the metrics that shape search rank, trust, and repeat rate." />
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Acceptance rate', compactPercent(data.hostProfile?.acceptanceRate || 0)],
                  ['Completion rate', compactPercent(data.hostProfile?.completionRate || 0)],
                  ['On-time rate', compactPercent(data.hostProfile?.onTimeRate || 0)],
                  ['Response time', `${data.hostProfile?.responseTimeMinutes || 0} min`],
                  ['Hosted trips', String(data.hostProfile?.hostedTripCount || 0)],
                  ['Live bookings', String(totalLiveBookings)],
                ].map(([label, value]) => <div key={label} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Brand" title="Host profile and pricing posture" description="Your identity, listing responsiveness, and booking friction all work together." />
              <div style={{ display: 'grid', gap: 12 }}>
                <div><label className="label">Display name</label><input className="input" value={hostForm.display_name} onChange={(event) => setHostForm((current) => ({ ...current, display_name: event.target.value }))} /></div>
                <div><label className="label">About</label><textarea className="input" rows={5} value={hostForm.about} onChange={(event) => setHostForm((current) => ({ ...current, about: event.target.value }))} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '12px 0' }}>
                  <div><div style={{ fontWeight: 700 }}>Instant booking</div><div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Let highly qualified guests confirm without manual approval.</div></div>
                  <button className={`toggle ${hostForm.instant_booking_enabled ? 'on' : ''}`} onClick={() => setHostForm((current) => ({ ...current, instant_booking_enabled: !current.instant_booking_enabled }))} aria-label="Toggle instant booking" />
                </div>
                <button className="btn btn-primary" disabled={isPending} onClick={() => mutate('/api/host/settings', { method: 'PATCH', body: JSON.stringify(hostForm) }, 'Host settings updated.')}>Save host settings</button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {view === 'operations' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          <section className="card">
            <SectionTitle eyebrow="Operations" title="Booking pipeline" description="Approval work, active service, and host intervention should all live in one operational lane." />
            <div style={{ display: 'grid', gap: 14 }}>
              {[...data.pendingBookings, ...data.upcomingBookings, ...data.activeBookings].map((booking) => <BookingCard key={booking.id} booking={booking} isPending={isPending} onDecision={handleBookingDecision} />)}
              {totalLiveBookings === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>No host-side bookings yet.</div> : null}
            </div>
          </section>

          <div style={{ display: 'grid', gap: 20 }}>
            <section className="card">
              <SectionTitle eyebrow="Messaging" title="Guest conversations" description="Unread booking threads and service risk should be obvious at a glance." />
              <div style={{ display: 'grid', gap: 12 }}>
                {data.conversations.map((conversation) => <div key={conversation.id} className="card-flat" style={{ padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><div style={{ fontWeight: 800 }}>{conversation.guest?.full_name || conversation.guest?.fullName || 'Guest'}</div><div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>{conversation.car?.make} {conversation.car?.model} - {conversation.unreadCount} unread</div></div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{shortDate(conversation.lastMessageAt)}</div></div><div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>{conversation.lastMessage?.body || 'No messages yet.'}</div></div>)}
                {data.conversations.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Guest-host chat threads will appear here.</div> : null}
              </div>
            </section>

            <section className="card">
              <SectionTitle eyebrow="Preferences" title="Host notifications" description="Booking requests and guest communication should reach you through the right channels." />
              <ToggleRow label="Push booking requests" description="Immediate alerts when a new request enters the queue." checked={Boolean(data.notificationPreferences?.pushHostBookingRequests)} onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ push_host_booking_requests: value }) }, 'Notification preferences updated.')} />
              <ToggleRow label="Trip emails" description="Booking confirmations, changes, and lifecycle updates." checked={Boolean(data.notificationPreferences?.emailTripUpdates)} onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ email_trip_updates: value }) }, 'Notification preferences updated.')} />
              <ToggleRow label="SMS security alerts" description="Urgent account and fraud protection alerts." checked={Boolean(data.notificationPreferences?.smsSecurityAlerts)} onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ sms_security_alerts: value }) }, 'Notification preferences updated.')} />
              <ToggleRow label="Push messages" description="Real-time guest chat and coordination alerts." checked={Boolean(data.notificationPreferences?.pushMessages)} onChange={(value) => mutate('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ push_messages: value }) }, 'Notification preferences updated.')} />
            </section>
          </div>
        </div>
      ) : null}

      {view === 'fleet' ? (
        <section className="card">
          <SectionTitle eyebrow="Fleet intelligence" title="Vehicles, performance, and pricing posture" description="Hosts need conversion, utilization, and listing quality in one surface." />
          <div style={{ display: 'grid', gap: 12 }}>
            {data.analytics.perCar.map((entry) => <div key={entry.car.id} className="card-flat" style={{ padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}><div><div style={{ fontWeight: 800 }}>{entry.car.make} {entry.car.model}</div><div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{entry.car.location_name} - {money(entry.car.price_daily)}/day - Rating {entry.car.avg_rating || 'New'}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800 }}>{money(entry.totalRevenue)}</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>30d revenue</div></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, fontSize: 12 }}><div><strong>{entry.totalViews}</strong><div style={{ color: 'var(--color-text-muted)' }}>Views</div></div><div><strong>{entry.totalBookingRequests}</strong><div style={{ color: 'var(--color-text-muted)' }}>Requests</div></div><div><strong>{entry.totalConfirmedBookings}</strong><div style={{ color: 'var(--color-text-muted)' }}>Confirmed</div></div><div><strong>{compactPercent(entry.conversionRate)}</strong><div style={{ color: 'var(--color-text-muted)' }}>Conversion</div></div><div><strong>{compactPercent(entry.avgUtilizationRate)}</strong><div style={{ color: 'var(--color-text-muted)' }}>Utilization</div></div><div><strong>{entry.car.available ? 'Live' : 'Blocked'}</strong><div style={{ color: 'var(--color-text-muted)' }}>Availability</div></div></div></div>)}
            {data.analytics.perCar.length === 0 ? <div className="card-flat" style={{ padding: 16, color: 'var(--color-text-3)' }}>Fleet analytics will populate after listings go live and traffic lands.</div> : null}
          </div>
        </section>
      ) : null}

      {view === 'growth' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          <section className="card">
            <SectionTitle eyebrow="Growth" title="Payouts and guest sentiment" description="Revenue quality is a combination of clean payouts, strong reviews, and repeatable service standards." />
            <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
              {data.payouts.slice(0, 6).map((payout) => { const tone = actionTone(payout.status); return <div key={payout.id} className="card-flat" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><div style={{ fontWeight: 800 }}>{money(payout.amount)}</div><div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Available {shortDate(payout.available_on || payout.created_at)}</div></div><div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 700, height: 'fit-content' }}>{payout.status}</div></div>; })}
              {data.payouts.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Payouts will appear after Stripe Connect transfers are created.</div> : null}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {data.recentReviews.map((review) => <div key={review.id} className="card-flat" style={{ padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ fontWeight: 800 }}>{review.reviewer?.full_name || review.reviewer?.fullName || 'Guest'}</div><div style={{ color: '#f59e0b', fontWeight: 700 }}>{review.rating}/5</div></div><div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 8 }}>{review.body || 'No written feedback.'}</div></div>)}
              {data.recentReviews.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>Reviews from completed trips will show here.</div> : null}
            </div>
          </section>

          <section className="card">
            <SectionTitle eyebrow="AI layer" title="Insights and next-best actions" description="What makes GlideGo feel ahead of Turo is not just data volume, but actionability." />
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {data.aiInsights.map((insight) => <div key={insight.id} className="card-flat" style={{ padding: 14 }}><div style={{ fontWeight: 800 }}>{insight.title}</div><div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 6 }}>{insight.summary}</div>{insight.recommendation ? <div style={{ fontSize: 12, color: 'var(--color-primary-dark)', marginTop: 8 }}>{insight.recommendation}</div> : null}</div>)}
              {data.aiInsights.length === 0 ? <div className="card-flat" style={{ padding: 14, color: 'var(--color-text-3)' }}>AI insight rows can be populated by scheduled jobs that score pricing, response speed, and conversion risk.</div> : null}
            </div>
            <div className="card-flat" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Growth summary</div>
              <div style={{ fontSize: 26, fontWeight: 900, margin: '6px 0' }}>{money(data.hostProfile?.totalEarnings || data.analytics.totals.totalRevenue)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Blend payout health, review quality, conversion, and service speed into one operator view.</div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
