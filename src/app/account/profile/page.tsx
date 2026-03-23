'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '@/lib/auth-context';
import { CARS } from '@/lib/cars';

const TABS = ['Profile', 'Bookings', 'Favourites', 'Licence', 'Promos', 'Settings'];

const MY_BOOKINGS = [
  { id: 'BK-1901', car: 'Tesla Model 3', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80', pickup: 'Mar 14, 2026', ret: 'Mar 17, 2026', days: 3, amount: 507, status: 'upcoming', location: 'Melbourne CBD' },
  { id: 'BK-1756', car: 'BMW X5', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80', pickup: 'Feb 20, 2026', ret: 'Feb 22, 2026', days: 2, amount: 398, status: 'completed', location: 'Tullamarine', reviewLeft: false },
  { id: 'BK-1603', car: 'Toyota RAV4', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80', pickup: 'Jan 10, 2026', ret: 'Jan 15, 2026', days: 5, amount: 695, status: 'completed', location: 'Frankston', reviewLeft: true },
];

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  upcoming:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  active:    { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  completed: { bg: '#f1f5f9', color: '#64748b', label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

// ─────────────────────────────────────────────
// Profile Tab
// ─────────────────────────────────────────────
function ProfileTab({ user, dm, surface2, border, text, muted, accent, updateUser }: any) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');

  const fields = [
    { label: 'Full Name', val: name, setter: setName },
    { label: 'Phone', val: phone, setter: setPhone },
    { label: 'Email', val: user.email, setter: () => {} },
    { label: 'Location', val: 'Melbourne, VIC', setter: () => {} },
  ];

  return (
    <div className="fi card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Personal Information</div>
        <button onClick={() => setEditMode(!editMode)} style={{ padding: '7px 16px', background: editMode ? 'rgba(16,185,129,0.1)' : dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${editMode ? accent : border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: editMode ? accent : muted, cursor: 'pointer' }}>
          {editMode ? '✓ Save' : '✏️ Edit'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fields.map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
            {editMode
              ? <input value={f.val} onChange={e => f.setter(e.target.value)} className="inp" />
              : <div style={{ fontSize: 14, fontWeight: 500, color: text, padding: '9px 12px', background: dm ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: 10, border: `1px solid ${border}` }}>{f.val}</div>
            }
          </div>
        ))}
      </div>
      {editMode && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => { updateUser({ name, phone }); setEditMode(false); }} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Save Changes
          </button>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${border}`, marginTop: 24, paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['Email notifications', true], ['SMS reminders', true], ['Promotional offers', false], ['Trip updates', true]].map(([label, on]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: text }}>{String(label)}</span>
              <div style={{ width: 38, height: 21, borderRadius: 11, background: on ? 'linear-gradient(135deg,#1d4ed8,#059669)' : (dm ? 'rgba(255,255,255,0.1)' : '#e2e8f0'), cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', width: 15, height: 15, borderRadius: '50%', background: 'white', top: 3, left: on ? 20 : 3, transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bookings Tab
// ─────────────────────────────────────────────
function BookingsTab({ accent, muted, text, border }: any) {
  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {MY_BOOKINGS.map(b => {
        const s = STATUS_CFG[b.status];
        return (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <img src={b.image} alt={b.car} style={{ width: 100, height: 70, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{b.car}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>📍 {b.location} · {b.id}</div>
                    <div style={{ fontSize: 12, color: text, marginTop: 5 }}>{b.pickup} → {b.ret} <span style={{ color: muted }}>({b.days} days)</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>${b.amount}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, padding: '3px 9px', borderRadius: 20, marginTop: 6, display: 'inline-block' }}>{s.label}</span>
                  </div>
                </div>
                {b.status === 'completed' && !b.reviewLeft && (
                  <button style={{ marginTop: 10, padding: '7px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#f59e0b', cursor: 'pointer' }}>
                    ★ Leave a Review
                  </button>
                )}
                {b.status === 'upcoming' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: accent, cursor: 'pointer' }}>View Details</button>
                    <button style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Favourites Tab
// ─────────────────────────────────────────────
function FavouritesTab({ favCars, accent, muted, border, toggleFavourite }: any) {
  if (favCars.length === 0) {
    return (
      <div className="card fi" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No favourites yet</div>
        <div style={{ fontSize: 13, color: muted, marginBottom: 20 }}>Tap the heart on any car to save it here</div>
        <Link href="/" style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Browse Cars</Link>
      </div>
    );
  }

  return (
    <div className="fi" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
      {favCars.map((car: any) => (
        <div key={car.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative' }}>
            <img src={car.image} alt={car.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            <button onClick={() => toggleFavourite(String(car.id))} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', fontSize: 16 }}>❤️</button>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{car.name}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{car.category} · {car.fuel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: accent }}>${car.price}<span style={{ fontSize: 10, fontWeight: 400, color: muted }}>/day</span></span>
              <Link href={`/cars/${car.id}`} style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', borderRadius: 9, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Book Now</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Licence Tab
// ─────────────────────────────────────────────
function LicenceTab({ user, accent, muted, border, dm }: any) {
  const [licenceStep, setLicenceStep] = useState(0);

  if (user.licenceUploaded) {
    return (
      <div className="fi card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: accent, marginBottom: 6 }}>Licence Verified!</div>
        <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>Your driver licence has been verified.</div>
        <div style={{ display: 'inline-flex', gap: 12, padding: '14px 24px', background: dm ? 'rgba(16,185,129,0.07)' : '#dcfce7', borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ fontSize: 12, color: muted }}>Verified since:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>Jan 2024</span>
        </div>
      </div>
    );
  }

  const steps = ['Upload Front', 'Upload Back', 'Selfie', 'Verified'];
  const stepIcons = ['🪪', '📄', '🤳'];

  return (
    <div className="fi card">
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Driver Licence Verification</div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {steps.map((step, i) => (
          <div key={step} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= licenceStep ? 'linear-gradient(135deg,#10b981,#059669)' : dm ? 'rgba(255,255,255,0.08)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 12, fontWeight: 700, color: i <= licenceStep ? 'white' : muted }}>{i + 1}</div>
            <div style={{ fontSize: 10, color: i <= licenceStep ? accent : muted, fontWeight: i <= licenceStep ? 600 : 400 }}>{step}</div>
          </div>
        ))}
      </div>
      {licenceStep < 3 && (
        <div style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ width: '100%', maxWidth: 320, margin: '0 auto', aspectRatio: '16/9', background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 16, border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{stepIcons[licenceStep]}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: muted }}>Click or drag to upload {licenceStep === 0 ? 'front' : licenceStep === 1 ? 'back' : 'selfie'}</span>
            <span style={{ fontSize: 11, color: muted }}>JPG, PNG · Max 10MB</span>
          </div>
          <button onClick={() => setLicenceStep(prev => Math.min(prev + 1, 3))} style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {licenceStep === 2 ? 'Submit for Verification' : 'Next Step →'}
          </button>
        </div>
      )}
      {licenceStep === 3 && (
        <div style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Under Review</div>
          <div style={{ fontSize: 13, color: muted }}>We are verifying your licence. Usually takes 5–10 minutes.</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Promos Tab
// ─────────────────────────────────────────────
function PromosTab({ user, accent, muted, border, dm, updateUser }: any) {
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');

  const applyPromo = () => {
    const codes: Record<string, number> = { 'GLIDEGO10': 10, 'NEWUSER20': 20, 'AUSSIE15': 15 };
    const disc = codes[promoCode.toUpperCase()];
    if (disc) {
      updateUser({ promoCredits: (user.promoCredits || 0) + disc });
      setPromoMsg(`🎉 $${disc} credit added!`);
      setPromoCode('');
    } else {
      setPromoMsg('❌ Invalid promo code');
    }
    setTimeout(() => setPromoMsg(''), 3000);
  };

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💰 Your Credits</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1, padding: 20, background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.08))', borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>${user.promoCredits || 0}</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>Available Credits</div>
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted }}>Enter Promo Code:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. GLIDEGO10" className="inp" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }} />
              <button onClick={applyPromo} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Apply</button>
            </div>
            {promoMsg && <div style={{ fontSize: 12, fontWeight: 600, color: promoMsg.includes('🎉') ? accent : '#ef4444' }}>{promoMsg}</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎁 Referral Program</div>
        <div style={{ padding: 16, background: 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(59,130,246,0.04))', borderRadius: 12, border: '1px solid rgba(16,185,129,0.15)', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Your referral code:</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '10px 14px', background: dm ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 10, fontSize: 15, fontWeight: 800, color: accent, letterSpacing: '0.15em', border: `1px solid ${border}` }}>GLIDE-{user.id.slice(-4).toUpperCase()}</div>
            <button style={{ padding: '9px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: accent, cursor: 'pointer' }}>Copy 📋</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[{ val: '$20', label: 'You earn per referral', color: '#8b5cf6' }, { val: '$10', label: 'Friend gets on signup', color: accent }].map(item => (
            <div key={item.label} style={{ padding: 14, background: dm ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 12, border: `1px solid ${border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────
function SettingsTab({ user, accent, muted, border, dm, text }: any) {
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirm1) return;
    const confirm2 = window.confirm('FINAL WARNING: All your bookings, reviews and data will be deleted forever. Continue?');
    if (!confirm2) return;
    try {
      await supabase.from('users').update({
        full_name: 'Deleted User',
        email: `deleted_${user.id}@glidego.com`,
        phone: null,
        avatar_url: null,
      }).eq('id', user.id);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      alert('Error deleting account. Please contact support.');
    }
  };

  const handleResendVerification = async () => {
    await supabase.auth.resend({ type: 'signup', email: user.email });
    alert('Verification email sent! Check your inbox.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Email Verification */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📧 Email Verification</div>
        {user.verified ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
            <div style={{ fontSize: 24 }}>✅</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>Email Verified</div>
              <div style={{ fontSize: 12, color: muted }}>{user.email}</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 24 }}>⚠️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>Email Not Verified</div>
                <div style={{ fontSize: 12, color: muted }}>Verify your email to unlock bookings</div>
              </div>
            </div>
            <button onClick={handleResendVerification} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Resend Verification Email
            </button>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔒 Change Password</div>
        <a href="/reset-password" style={{ display: 'block', width: '100%', padding: 12, background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: text, border: `1px solid ${border}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
          Send Password Reset Link →
        </a>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: dm ? 'rgba(239,68,68,0.04)' : '#fff5f5' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>⚠️ Danger Zone</div>
        <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>Once you delete your account, all your data will be permanently removed. This cannot be undone.</div>
        <button onClick={handleDeleteAccount} style={{ padding: '11px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#ef4444', cursor: 'pointer' }}>
          Delete My Account
        </button>
      </div>
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
    bg:       dm ? '#070d1a' : '#f0f4f8',
    surface:  dm ? '#0d1528' : '#ffffff',
    surface2: dm ? '#111d35' : '#f8fafc',
    border:   dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text:     dm ? '#f1f5f9' : '#0f172a',
    muted:    dm ? '#64748b' : '#94a3b8',
    accent:   '#10b981',
  };
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AccountProfile() {
  const { user, updateUser, toggleFavourite, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Profile');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (!user) router.push('/login?redirect=/account/profile');
  }, [user, router]);

  if (!user) return null;

  const { dm, bg, surface, surface2, border, text, muted, accent } = useTheme(darkMode);

  const favCars = CARS.filter(c => user.favourites?.includes(String(c.id)));

  const sharedProps = { user, dm, surface, surface2, border, text, muted, accent, updateUser };

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Syne','Inter',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:4px}
        .inp{background:${surface2};border:1px solid ${border};border-radius:10px;padding:9px 12px;font-size:13px;color:${text};outline:none;font-family:'Inter',sans-serif;width:100%}
        .inp:focus{border-color:#10b981}
        .tbtn{padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'Syne',sans-serif;transition:all 0.2s}
        .card{background:${surface};border:1px solid ${border};border-radius:18px;padding:22px}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi 0.3s ease}
      `}</style>

      {/* HEADER */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, textDecoration: 'none' }}>←</Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>My Account</h1>
            <p style={{ fontSize: 11, color: muted }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setDarkMode(!dm)} style={{ width: 40, height: 22, borderRadius: 11, background: dm ? 'linear-gradient(135deg,#1d4ed8,#059669)' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3, left: dm ? 21 : 3, transition: 'left 0.25s' }} />
          </button>
          <button onClick={() => { logout(); router.push('/'); }} style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>
        {/* Profile Header */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: user.verified ? accent : '#f59e0b', border: `3px solid ${surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
              {user.verified ? '✓' : '!'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: muted }}>📍 Melbourne, VIC</span>
              <span style={{ fontSize: 12, color: muted }}>🗓️ Member since {user.joinedDate}</span>
              <span style={{ fontSize: 12, color: muted }}>🚗 {user.trips} trips</span>
              {user.rating && <span style={{ fontSize: 12, color: '#f59e0b' }}>★ {user.rating} rating</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: user.verified ? '✅' : '⚠️', label: user.verified ? 'ID Verified' : 'Verify ID', color: user.verified ? accent : '#f59e0b' },
              { icon: user.licenceUploaded ? '🪪' : '📤', label: user.licenceUploaded ? 'Licence OK' : 'Upload Licence', color: user.licenceUploaded ? accent : '#f59e0b' },
              { icon: '💰', label: `$${user.promoCredits || 0} Credits`, color: '#8b5cf6' },
            ].map(b => (
              <div key={b.label} style={{ padding: '10px 14px', background: dm ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, border: `1px solid ${border}`, textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: b.color }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', padding: '4px 0' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="tbtn" style={{ background: activeTab === tab ? `linear-gradient(135deg,${accent},#059669)` : (dm ? 'rgba(255,255,255,0.04)' : '#f1f5f9'), color: activeTab === tab ? 'white' : muted, whiteSpace: 'nowrap' }}>{tab}</button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Profile' && <ProfileTab {...sharedProps} />}
        {activeTab === 'Bookings' && <BookingsTab accent={accent} muted={muted} text={text} border={border} />}
        {activeTab === 'Favourites' && <FavouritesTab favCars={favCars} accent={accent} muted={muted} border={border} toggleFavourite={toggleFavourite} />}
        {activeTab === 'Licence' && <LicenceTab user={user} accent={accent} muted={muted} border={border} dm={dm} />}
        {activeTab === 'Promos' && <PromosTab {...sharedProps} />}
        {activeTab === 'Settings' && <SettingsTab user={user} accent={accent} muted={muted} border={border} dm={dm} text={text} />}
      </div>
    </div>
  );
}
