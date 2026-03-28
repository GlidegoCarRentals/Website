'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { fetchHostEarnings } from '@/lib/db-bookings';

const FALLBACK_MONTHLY = [
  { month: 'Sep', earnings: 1240, bookings: 8 },
  { month: 'Oct', earnings: 1870, bookings: 12 },
  { month: 'Nov', earnings: 1540, bookings: 10 },
  { month: 'Dec', earnings: 2890, bookings: 19 },
  { month: 'Jan', earnings: 1980, bookings: 13 },
  { month: 'Feb', earnings: 2340, bookings: 15 },
];

const FALLBACK_PAYOUTS = [
  { date: '1 Mar 2026', amount: 2340, status: 'paid', method: 'Primary Bank Account', trips: 15 },
  { date: '1 Feb 2026', amount: 1980, status: 'paid', method: 'Primary Bank Account', trips: 13 },
];

const FALLBACK_BREAKDOWN = [
  { name: 'Tesla Model 3', pct: 38, earn: 887 },
  { name: 'BMW X5', pct: 29, earn: 679 },
  { name: 'Toyota Camry', pct: 21, earn: 491 },
];

export default function HostEarningsPage() {
  const { user, isLoading } = useAuth();
  const [period, setPeriod] = useState('6M');
  const [loadError, setLoadError] = useState('');
  const [monthlyData, setMonthlyData] = useState(FALLBACK_MONTHLY);
  const [payouts, setPayouts] = useState(FALLBACK_PAYOUTS);
  const [vehicleBreakdown, setVehicleBreakdown] = useState(FALLBACK_BREAKDOWN);
  const [stats, setStats] = useState({ totalEarned: 11860, monthEarned: 2340, pendingPayout: 1156, avgPerTrip: 156 });

  useEffect(() => {
    if (isLoading || !user) return;

    fetchHostEarnings(user.id)
      .then((data) => {
        setStats({
          totalEarned: data.totalEarned,
          monthEarned: data.monthEarned,
          pendingPayout: data.pendingPayout,
          avgPerTrip: data.avgPerTrip,
        });
        if (data.monthlyData.length) setMonthlyData(data.monthlyData as any);
        if (data.payouts.length) setPayouts(data.payouts as any);
        if (data.vehicleBreakdown.length) {
          const total = data.vehicleBreakdown.reduce((sum, item) => sum + item.earn, 0) || 1;
          setVehicleBreakdown(data.vehicleBreakdown.map((item) => ({
            ...item,
            pct: Math.round((item.earn / total) * 100),
          })) as any);
        }
      })
      .catch(() => setLoadError('Earnings load nahi ho paaye.'));
  }, [isLoading, user]);

  const maxEarnings = Math.max(...monthlyData.map((item) => item.earnings), 1);

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .bar { border-radius: 8px 8px 0 0; }
        .payout-row { display: grid; grid-template-columns: 1fr 100px 130px 80px; gap: 16px; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f8fafc; }
      `}</style>

      <div style={{ background: '#0a0f1e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/host/dashboard"><Image src="/logo.png" alt="GlideGo" width={100} height={23} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} /></Link>
          <Link href="/host/dashboard" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>/</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Earnings</span>
        </div>
        <button style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, padding: '9px 18px', color: '#34d399', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Add Bank Account
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {loadError && <div style={{ marginBottom: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{loadError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[{ label: 'Total Earned', val: `$${stats.totalEarned.toLocaleString()}`, sub: 'All time', icon: '💰', color: '#059669', bg: '#f0fdf4' }, { label: 'This Month', val: `$${stats.monthEarned.toLocaleString()}`, sub: 'Current estimate', icon: '📈', color: '#1d4ed8', bg: '#eff6ff' }, { label: 'Pending Payout', val: `$${stats.pendingPayout.toLocaleString()}`, sub: 'Upcoming payout', icon: '⏳', color: '#d97706', bg: '#fffbeb' }, { label: 'Avg Per Trip', val: `$${stats.avgPerTrip.toLocaleString()}`, sub: 'Current average', icon: '🚗', color: '#7c3aed', bg: '#f5f3ff' }].map((item) => <div key={item.label} className="card" style={{ padding: 22 }}><div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{item.icon}</div><div className="playfair" style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{item.val}</div><div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div><div style={{ fontSize: 11, color: item.color, fontWeight: 600, marginTop: 4 }}>{item.sub}</div></div>)}
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Monthly Earnings</h2>
              <div style={{ fontSize: 13, color: '#64748b' }}>Your earnings trend over time</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>{['3M', '6M', '1Y'].map((item) => <button key={item} onClick={() => setPeriod(item)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: period === item ? '#0f172a' : '#f8fafc', color: period === item ? 'white' : '#64748b' }}>{item}</button>)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180 }}>
            {monthlyData.map((item) => <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>${(item.earnings / 1000).toFixed(1)}k</div><div className="bar" style={{ width: '100%', height: `${(item.earnings / maxEarnings) * 130}px`, background: 'linear-gradient(to top,#1d4ed8,#059669)', minHeight: 20 }} /><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.month}</div></div>)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Payout History</h2>
            </div>
            <div style={{ padding: '12px 20px 8px', display: 'grid', gridTemplateColumns: '1fr 100px 130px 80px', gap: 16 }}>{['Date', 'Amount', 'Method', 'Trips'].map((heading) => <div key={heading} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{heading}</div>)}</div>
            {payouts.map((payout, index) => <div key={index} className="payout-row"><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{payout.date}</div><div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>${Number(payout.amount).toLocaleString()}</div><div style={{ fontSize: 12, color: '#64748b' }}>{payout.method}</div><div><span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>Paid</span></div></div>)}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>By Vehicle (30d)</h2>
            {vehicleBreakdown.map((vehicle) => <div key={vehicle.name} style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{vehicle.name}</span><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>${vehicle.earn}</span></div><div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${vehicle.pct}%`, background: 'linear-gradient(90deg,#1d4ed8,#059669)', borderRadius: 3 }} /></div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{vehicle.pct}% of total</div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
