'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { fetchHostBookings } from '@/lib/db-bookings';

const BOOKINGS_DATA = [
  { id:'BK-001', guest:'Alex Johnson', avatar:'AJ', car:'Tesla Model 3', pickup:'14 Mar 2026', return:'17 Mar 2026', days:3, amount:507, bond:500, status:'confirmed', licenceVerified:true, rating:4.9, trips:12, requested:'10 Mar 2026' },
  { id:'BK-002', guest:'Priya Singh', avatar:'PS', car:'Toyota Camry', pickup:'16 Mar 2026', return:'18 Mar 2026', days:2, amount:218, bond:300, status:'pending', licenceVerified:true, rating:4.7, trips:6, requested:'10 Mar 2026' },
  { id:'BK-003', guest:'James Russo', avatar:'JR', car:'BMW X5', pickup:'20 Mar 2026', return:'25 Mar 2026', days:5, amount:1195, bond:1000, status:'confirmed', licenceVerified:true, rating:5.0, trips:28, requested:'9 Mar 2026' },
  { id:'BK-004', guest:'Emma Liu', avatar:'EL', car:'Ford Ranger', pickup:'25 Mar 2026', return:'01 Apr 2026', days:7, amount:1113, bond:500, status:'upcoming', licenceVerified:false, rating:null, trips:0, requested:'11 Mar 2026' },
  { id:'BK-005', guest:'Sam Torres', avatar:'ST', car:'Toyota Camry', pickup:'05 Feb 2026', return:'07 Feb 2026', days:2, amount:218, bond:300, status:'completed', licenceVerified:true, rating:4.8, trips:18, requested:'01 Feb 2026' },
];

export default function HostBookingsPage() {
  const { user, isLoading } = useAuth();
  const [bookings, setBookings] = useState(BOOKINGS_DATA);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<typeof BOOKINGS_DATA[0] | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    fetchHostBookings(user.id)
      .then((data) => {
        const next = data.map((booking) => ({
          id: booking.id,
          guest: booking.guest,
          avatar: booking.avatar,
          car: booking.car,
          pickup: booking.pickup,
          return: booking.return,
          days: booking.days,
          amount: booking.amount,
          bond: booking.bond,
          status: booking.bookingStatus,
          licenceVerified: booking.licenceVerified,
          rating: booking.rating,
          trips: booking.trips,
          requested: booking.requested,
        }));
        if (next.length) setBookings(next as typeof BOOKINGS_DATA);
      })
      .catch(() => setLoadError('Bookings could not be loaded.'));
  }, [isLoading, user]);

  const changeStatus = (id: string, status: string) => {
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  };

  const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fffbeb', color: '#d97706', label: 'Pending' },
    confirmed: { bg: '#f0fdf4', color: '#15803d', label: 'Confirmed' },
    upcoming: { bg: '#eff6ff', color: '#1d4ed8', label: 'Upcoming' },
    completed: { bg: '#f8fafc', color: '#64748b', label: 'Completed' },
    cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
  };

  const filtered = bookings.filter(b => tab === 'all' || b.status === tab);
  const counts = Object.fromEntries(['pending','confirmed','upcoming','completed'].map(s => [s, bookings.filter(b => b.status === s).length]));

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .booking-row { display: grid; grid-template-columns: 60px 1fr 130px 90px 90px 110px 160px; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f8fafc; cursor: pointer; transition: background 0.15s; }
        .booking-row:hover { background: #f8fafc; }
        .tab-btn { padding: 9px 18px; border: none; background: transparent; font-size: 13px; font-weight: 600; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { color: #0f172a; border-bottom-color: #1d4ed8; }
        .action-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; transition: all 0.18s; }
        .side-panel { width: 340px; background: white; border-left: 1px solid #f1f5f9; overflow-y: auto; flex-shrink: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#0a0f1e', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/host/dashboard"><Image src="/logo.png" alt="GlideGo" width={95} height={22} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} /></Link>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>/</span>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Bookings</span>
        {counts.pending > 0 && <div style={{ background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{counts.pending} need action</div>}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 54px)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '0 28px', display: 'flex', gap: 4 }}>
            {[['all','All'], ['pending','Pending'], ['confirmed','Confirmed'], ['upcoming','Upcoming'], ['completed','Completed']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)} className={`tab-btn ${tab === v ? 'active' : ''}`}>
                {l} {counts[v] ? <span style={{ background: v === 'pending' ? '#ef4444' : '#e2e8f0', color: v === 'pending' ? 'white' : '#64748b', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20, marginLeft: 4 }}>{counts[v]}</span> : null}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {loadError && <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{loadError}</div>}
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 90px 90px 110px 160px', gap: 14, padding: '11px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Guest', 'Booking', 'Dates', 'Days', 'Total', 'Status', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>

              {filtered.map(b => {
                const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                return (
                  <div key={b.id} className="booking-row" role="button" tabIndex={0} onClick={() => setSelected(b)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(b); } }} style={{ background: selected?.id === b.id ? '#f8fafc' : undefined }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${b.status === 'pending' ? '#d97706' : '#1d4ed8'},${b.status === 'pending' ? '#f59e0b' : '#059669'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>{b.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{b.guest}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>🚗 {b.car} · #{b.id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{b.pickup}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>→ {b.return}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{b.days}d</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>${b.amount}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, background: sc.bg, color: sc.color, display: 'inline-block' }}>{sc.label}</span>
                    <div role="group" style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      {b.status === 'pending' && <>
                        <button className="action-btn" onClick={() => changeStatus(b.id, 'confirmed')} style={{ background: '#f0fdf4', color: '#15803d' }}>✓ Accept</button>
                        <button className="action-btn" onClick={() => changeStatus(b.id, 'cancelled')} style={{ background: '#fef2f2', color: '#dc2626' }}>✕</button>
                      </>}
                      {b.status === 'confirmed' && <button className="action-btn" onClick={() => setSelected(b)} style={{ background: '#eff6ff', color: '#1d4ed8' }}>Details</button>}
                      {b.status === 'completed' && <button className="action-btn" style={{ background: '#f5f3ff', color: '#7c3aed' }}>Review</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {selected && (
          <div className="side-panel">
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Booking Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Guest info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white' }}>{selected.avatar}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{selected.guest}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {selected.rating ? `⭐ ${selected.rating} · ` : ''}{selected.trips} trips
                    {selected.licenceVerified ? ' · ✅ Verified' : ' · ⚠️ Unverified'}
                  </div>
                </div>
              </div>

              {/* Trip details */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>TRIP DETAILS</div>
                {[
                  ['Vehicle', selected.car],
                  ['Booking ID', selected.id],
                  ['Pickup', selected.pickup],
                  ['Return', selected.return],
                  ['Duration', `${selected.days} days`],
                  ['Requested', selected.requested],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Payment */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>PAYMENT</div>
                {[
                  ['Rental Total', `$${selected.amount}`],
                  ['Bond (Pre-auth)', `$${selected.bond}`],
                  ['Your Earnings', `$${Math.round(selected.amount * 0.8)}`],
                  ['Platform Fee', `$${Math.round(selected.amount * 0.2)}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: k === 'Your Earnings' ? '#059669' : '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.status === 'pending' && (
                  <>
                    <button onClick={() => changeStatus(selected.id, 'confirmed')} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#1d4ed8,#059669)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer' }}>✓ Accept Booking</button>
                    <button onClick={() => changeStatus(selected.id, 'cancelled')} style={{ width: '100%', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>✕ Decline</button>
                  </>
                )}
                <Link href={`/host/messages`} style={{ display: 'block', textAlign: 'center', padding: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>💬 Message Guest</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
