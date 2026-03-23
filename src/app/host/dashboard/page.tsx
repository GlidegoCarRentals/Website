'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const SIDEBAR_ITEMS = [
  { icon: '◈', label: 'Overview', id: 'overview' },
  { icon: '⊞', label: 'My Vehicles', href: '/host/vehicles', id: 'vehicles' },
  { icon: '◷', label: 'Bookings', href: '/host/bookings', id: 'bookings', badge: 2 },
  { icon: '◎', label: 'Messages', href: '/host/messages', id: 'messages', badge: 3 },
  { icon: '◈', label: 'Earnings', href: '/host/earnings', id: 'earnings' },
  { icon: '☆', label: 'Reviews', id: 'reviews' },
  { icon: '⚙', label: 'Settings', href: '/host/settings', id: 'settings' },
];

const BOOKINGS = [
  { id: 'BK-2401', car: 'Tesla Model 3', guest: 'Alex Johnson', guestAvatar: 'AJ', pickup: 'Mar 14', ret: 'Mar 17', days: 3, amount: 507, status: 'confirmed' },
  { id: 'BK-2402', car: 'Toyota Camry', guest: 'Priya Sharma', guestAvatar: 'PS', pickup: 'Mar 16', ret: 'Mar 18', days: 2, amount: 218, status: 'pending' },
  { id: 'BK-2403', car: 'BMW X5', guest: 'James Richardson', guestAvatar: 'JR', pickup: 'Mar 20', ret: 'Mar 25', days: 5, amount: 1195, status: 'confirmed' },
  { id: 'BK-2404', car: 'Ford Ranger', guest: 'Emma Liu', guestAvatar: 'EL', pickup: 'Mar 25', ret: 'Apr 1', days: 7, amount: 1113, status: 'upcoming' },
  { id: 'BK-2405', car: 'Kia EV6', guest: 'Tom Wright', guestAvatar: 'TW', pickup: 'Mar 12', ret: 'Mar 13', days: 1, amount: 109, status: 'completed' },
];

const MESSAGES = [
  { id: 1, from: 'Alex Johnson', avatar: 'AJ', car: 'Tesla Model 3', msg: 'Hi! What time can I pick up tomorrow?', time: '2h ago', unread: true, online: true },
  { id: 2, from: 'Priya Sharma', avatar: 'PS', car: 'Toyota Camry', msg: 'Can I get early pickup at 7am?', time: '5h ago', unread: true, online: false },
  { id: 3, from: 'James Richardson', avatar: 'JR', car: 'BMW X5', msg: 'Amazing car! Will book again ★★★★★', time: '1d ago', unread: false, online: false },
  { id: 4, from: 'Emma Liu', avatar: 'EL', car: 'Ford Ranger', msg: 'Do you include a tow bar adapter?', time: '2d ago', unread: false, online: true },
];

const EARNINGS_DATA = [
  { month: 'Oct', amount: 1840 },
  { month: 'Nov', amount: 2210 },
  { month: 'Dec', amount: 3150 },
  { month: 'Jan', amount: 2680 },
  { month: 'Feb', amount: 2940 },
  { month: 'Mar', amount: 2340 },
];

const VEHICLE_STATS = [
  { car: 'Tesla Model 3', trips: 24, earnings: 3576, rating: 4.9, utilization: 78 },
  { car: 'Toyota Camry', trips: 18, earnings: 1602, rating: 4.7, utilization: 62 },
  { car: 'BMW X5', trips: 11, earnings: 2189, rating: 5.0, utilization: 45 },
];

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#dcfce7', color: '#15803d', label: 'Confirmed' },
  pending:   { bg: '#fef9c3', color: '#a16207', label: 'Pending' },
  upcoming:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  completed: { bg: '#f1f5f9', color: '#64748b', label: 'Completed' },
};

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
function KpiCard({ stat, surface, accent, muted, text }: any) {
  return (
    <div className="sc" style={{ background: surface }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 24 }}>{stat.icon}</div>
        {stat.trend && (
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 20 }}>
            {stat.trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, letterSpacing: '-1px', marginBottom: 4 }}>{stat.value}</div>
      <div style={{ fontSize: 11, color: muted }}>{stat.label}</div>
      <div style={{ fontSize: 10, color: muted, marginTop: 3, opacity: 0.7 }}>{stat.sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Booking Row
// ─────────────────────────────────────────────
function BookingRow({ b, border, text, muted, accent, dm }: any) {
  const s = STATUS_CFG[b.status];
  return (
    <tr className="brow" style={{ borderBottom: `1px solid ${border}`, transition: 'background 0.15s' }}>
      <td style={{ padding: '10px 7px', fontSize: 10, fontWeight: 700, color: muted }}>{b.id}</td>
      <td style={{ padding: '10px 7px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white', flexShrink: 0 }}>{b.guestAvatar}</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: text, whiteSpace: 'nowrap' }}>{b.guest}</span>
        </div>
      </td>
      <td style={{ padding: '10px 7px', fontSize: 11, color: text, whiteSpace: 'nowrap' }}>{b.car}</td>
      <td style={{ padding: '10px 7px' }}>
        <div style={{ fontSize: 10, color: text, whiteSpace: 'nowrap' }}>{b.pickup} → {b.ret}</div>
        <div style={{ fontSize: 9, color: muted }}>{b.days} days</div>
      </td>
      <td style={{ padding: '10px 7px', fontSize: 12, fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>${b.amount}</td>
      <td style={{ padding: '10px 7px' }}>
        <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{s.label}</span>
      </td>
      <td style={{ padding: '10px 7px' }}>
        {b.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="abtn" style={{ background: 'rgba(16,185,129,0.15)', color: accent, padding: '4px 9px', fontSize: 10 }}>✓</button>
            <button className="abtn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 9px', fontSize: 10 }}>✕</button>
          </div>
        ) : (
          <button className="abtn" style={{ background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: muted, padding: '4px 9px', fontSize: 10 }}>View</button>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Vehicle Performance Card
// ─────────────────────────────────────────────
function VehicleCard({ v, dm, text, muted, accent, accentBlue, border }: any) {
  return (
    <div style={{ padding: '12px 14px', background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 12, border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{v.car}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: accent }}>${v.earnings.toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: muted }}>{v.trips} trips</span>
        <span style={{ fontSize: 10, color: '#f59e0b' }}>★ {v.rating}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: dm ? 'rgba(255,255,255,0.07)' : '#e2e8f0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${v.utilization}%`, background: `linear-gradient(90deg,${accent},${accentBlue})`, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: accent, minWidth: 32 }}>{v.utilization}%</span>
      </div>
      <div style={{ fontSize: 9, color: muted, marginTop: 3 }}>Utilization rate</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Theme Helper
// ─────────────────────────────────────────────
function useTheme(darkMode: boolean) {
  const dm = darkMode;
  return {
    dm,
    bg:      dm ? '#070d1a' : '#f0f4f8',
    surface: dm ? '#0d1528' : '#ffffff',
    border:  dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text:    dm ? '#f1f5f9' : '#0f172a',
    muted:   dm ? '#64748b' : '#94a3b8',
    accent:  '#10b981',
  };
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function HostDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(true);
  const [chatOpen, setChatOpen] = useState<number | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const { dm, bg, surface, border, text, muted, accent } = useTheme(darkMode);

  useEffect(() => {
    if (!user) router.push('/login?redirect=/host/dashboard');
  }, [user, router]);

  if (!user) return null;
  const accentBlue = '#3b82f6';
  const maxE = Math.max(...EARNINGS_DATA.map(e => e.amount));
  const sideW = sidebarOpen ? 250 : 64;

  const kpiStats = [
    { label: 'Total Earnings', value: '$14,287', sub: '+$2,340 this month', icon: '💰', color: accent, trend: '+18%' },
    { label: 'Active Bookings', value: '4', sub: '2 pending approval', icon: '◷', color: accentBlue, trend: '+2' },
    { label: 'Overall Rating', value: `${user.rating || 4.97}★`, sub: '312 total reviews', icon: '★', color: '#f59e0b', trend: '+0.02' },
    { label: 'Vehicles Listed', value: '3', sub: '100% utilization', icon: '⊞', color: '#8b5cf6', trend: '' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, fontFamily: "'Syne','Inter',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:4px}
        .sl{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:500;transition:all 0.2s;cursor:pointer;border:none;width:100%;text-align:left;background:transparent}
        .sl:hover{background:rgba(16,185,129,0.08);color:#10b981}
        .sl.act{background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(59,130,246,0.1));color:#10b981;font-weight:700}
        .sc{border:1px solid ${border};border-radius:20px;padding:22px;transition:transform 0.2s,box-shadow 0.2s}
        .sc:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.15)}
        .abtn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;border:none;font-family:'Syne',sans-serif}
        .ci{background:${dm ? 'rgba(255,255,255,0.06)' : '#f1f5f9'};border:1px solid ${border};border-radius:12px;padding:9px 12px;font-size:13px;color:${text};outline:none;font-family:'Inter',sans-serif;width:100%}
        .ci:focus{border-color:#10b981}
        .brow:hover{background:${dm ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fadeIn 0.3s ease}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .pls{animation:pulse 2s infinite}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: sideW, background: surface, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ padding: '18px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 34, height: 34, borderRadius: 10, background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: text, fontSize: 14 }}>
            {sidebarOpen ? '←' : '→'}
          </button>
          {sidebarOpen && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: accent }}>GlideGo</div>
              <div style={{ fontSize: 10, color: muted }}>Host Portal</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if (item.href) router.push(item.href); }}
              className={`sl ${activeTab === item.id ? 'act' : ''}`}
              style={{ color: activeTab === item.id ? accent : muted, marginBottom: 2 }}
              title={!sidebarOpen ? item.label : ''}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>
                  {item.badge && <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>{item.badge}</span>}
                </>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '10px 8px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: accent, fontWeight: 600 }}>★ {user.rating || 4.97} · All-Star Host</div>
              </div>
            </div>
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', margin: '0 auto' }}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, marginLeft: sideW, transition: 'margin-left 0.3s', minHeight: '100vh', overflow: 'auto' }}>

        {/* TOP BAR */}
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(20px)' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Good morning, {user.name.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 11, color: muted, marginTop: 2 }}>Tue 10 March 2026 · Melbourne, VIC</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setDarkMode(!dm)} style={{ width: 40, height: 22, borderRadius: 11, background: dm ? 'linear-gradient(135deg,#1d4ed8,#059669)' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3, left: dm ? 21 : 3, transition: 'left 0.25s' }} />
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 38, height: 38, borderRadius: 12, background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: text, position: 'relative' }}>
                🔔<span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: '#ef4444', borderRadius: '50%' }} className="pls" />
              </button>
              {notifOpen && (
                <div className="fi" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 14, width: 280, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 100 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: text }}>Notifications</div>
                  {[
                    { icon: '💰', msg: 'New booking — Tesla Model 3 from Alex J.', time: '2m ago', dot: true },
                    { icon: '★', msg: 'James R. left a 5-star review!', time: '1h ago', dot: true },
                    { icon: '💬', msg: 'New message from Priya S.', time: '3h ago', dot: false },
                    { icon: '📅', msg: 'BMW X5 pickup tomorrow 9am', time: '6h ago', dot: false },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < 3 ? `1px solid ${border}` : 'none', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: text, lineHeight: 1.5 }}>{n.msg}</div>
                        <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{n.time}</div>
                      </div>
                      {n.dot && <div style={{ width: 7, height: 7, borderRadius: '50%', background: accentBlue, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/" style={{ padding: '7px 14px', background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${border}`, borderRadius: 10, fontSize: 11, fontWeight: 600, color: muted, textDecoration: 'none' }}>← Back to Site</Link>
          </div>
        </div>

        <div style={{ padding: 28 }} className="fi">
          {/* KPI STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
            {kpiStats.map((stat, i) => (
              <KpiCard key={i} stat={stat} surface={surface} accent={accent} muted={muted} text={text} />
            ))}
          </div>

          {/* CHART + MESSAGES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Earnings Chart */}
            <div className="sc" style={{ background: surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Earnings Overview</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Last 6 months · AUD</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['6M', '1Y', 'All'].map(t => (
                    <button key={t} className="abtn" style={{ background: t === '6M' ? 'rgba(16,185,129,0.1)' : 'transparent', color: t === '6M' ? accent : muted, padding: '5px 12px', fontSize: 10 }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
                {EARNINGS_DATA.map((d, i) => {
                  const pct = (d.amount / maxE) * 100;
                  const isLast = i === EARNINGS_DATA.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ fontSize: 9, color: muted }}>${(d.amount / 1000).toFixed(1)}k</div>
                      <div style={{ width: '100%', height: `${pct}%`, minHeight: 8, borderRadius: '5px 5px 0 0', background: isLast ? `linear-gradient(180deg,${accent},#059669)` : dm ? 'rgba(255,255,255,0.07)' : '#e2e8f0', position: 'relative', transition: 'height 0.5s' }}>
                        {isLast && <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', background: accent, color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>Now</div>}
                      </div>
                      <div style={{ fontSize: 9, color: muted }}>{d.month}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                {[{ label: 'Avg/month', val: '$2,527' }, { label: 'Best month', val: '$3,150' }, { label: 'YTD Total', val: '$14,287' }].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '10px 12px', background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: text }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="sc" style={{ background: surface, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Messages</div>
                <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>3 new</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {MESSAGES.map(msg => (
                  <button key={msg.id} onClick={() => setChatOpen(chatOpen === msg.id ? null : msg.id)} style={{ display: 'flex', gap: 9, padding: '9px 10px', background: msg.unread ? (dm ? 'rgba(59,130,246,0.08)' : '#eff6ff') : 'transparent', borderRadius: 11, border: `1px solid ${msg.unread ? (dm ? 'rgba(59,130,246,0.15)' : '#bfdbfe') : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white' }}>{msg.avatar}</div>
                      {msg.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, background: accent, borderRadius: '50%', border: `2px solid ${surface}` }} />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: text }}>{msg.from}</span>
                        <span style={{ fontSize: 10, color: muted }}>{msg.time}</span>
                      </div>
                      <div style={{ fontSize: 10, color: muted }}>{msg.car}</div>
                      <div style={{ fontSize: 10, color: text, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>{msg.msg}</div>
                    </div>
                    {msg.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: accentBlue, flexShrink: 0, marginTop: 5 }} />}
                  </button>
                ))}
              </div>
              {chatOpen && (
                <div className="fi" style={{ marginTop: 10, padding: 10, background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 10, border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} className="ci" placeholder="Quick reply..." style={{ fontSize: 12 }} />
                    <button onClick={() => { setChatMsg(''); setChatOpen(null); }} className="abtn" style={{ background: `linear-gradient(135deg,${accentBlue},#059669)`, color: 'white', whiteSpace: 'nowrap', padding: '7px 14px' }}>Send</button>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                    {["Yes, 8am works! 👍", "I'll send details shortly", "Thanks for booking! 🚗"].map(qr => (
                      <button key={qr} onClick={() => setChatMsg(qr)} style={{ padding: '3px 9px', background: dm ? 'rgba(255,255,255,0.06)' : '#e2e8f0', border: 'none', borderRadius: 20, fontSize: 9, color: muted, cursor: 'pointer' }}>{qr}</button>
                    ))}
                  </div>
                </div>
              )}
              <Link href="/host/messages" style={{ display: 'block', textAlign: 'center', padding: 9, marginTop: 10, background: 'rgba(16,185,129,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: accent, textDecoration: 'none' }}>View all messages →</Link>
            </div>
          </div>

          {/* BOOKINGS + VEHICLE PERFORMANCE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="sc" style={{ background: surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Bookings</div>
                <Link href="/host/bookings" style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.1)', color: accent, borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>View All</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {['ID', 'Guest', 'Vehicle', 'Dates', 'Amount', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ fontSize: 9, fontWeight: 700, color: muted, textAlign: 'left', padding: '0 7px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BOOKINGS.map(b => (
                      <BookingRow key={b.id} b={b} border={border} text={text} muted={muted} accent={accent} dm={dm} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sc" style={{ background: surface }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Vehicle Performance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {VEHICLE_STATS.map((v, i) => (
                  <VehicleCard key={i} v={v} dm={dm} text={text} muted={muted} accent={accent} accentBlue={accentBlue} border={border} />
                ))}
              </div>
              <Link href="/host/add-vehicle" style={{ display: 'block', textAlign: 'center', padding: 9, marginTop: 12, background: 'rgba(16,185,129,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: accent, textDecoration: 'none' }}>+ Add New Vehicle</Link>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="sc" style={{ background: surface }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
              {[
                { icon: '➕', label: 'Add Vehicle', href: '/host/add-vehicle', color: accent },
                { icon: '📅', label: 'Block Dates', href: '/host/vehicles', color: accentBlue },
                { icon: '💸', label: 'Set Pricing', href: '/host/vehicles', color: '#8b5cf6' },
                { icon: '📊', label: 'Analytics', href: '/host/earnings', color: '#f59e0b' },
                { icon: '★', label: 'Reviews', href: '/reviews', color: '#ec4899' },
                { icon: '🔧', label: 'Settings', href: '/host/settings', color: '#64748b' },
              ].map((a, i) => (
                <Link key={i} href={a.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '16px 10px', background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 12, border: `1px solid ${border}`, textDecoration: 'none', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: a.color, textAlign: 'center' }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
