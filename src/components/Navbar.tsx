'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

// ─────────────────────────────────────────────
// Helper — nav colors based on state
// ─────────────────────────────────────────────
function useNavColors(darkMode: boolean) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = pathname === '/';
  const isTransparent = isHome && !scrolled;

  const navBg = scrolled
    ? darkMode ? 'rgba(10,15,30,0.97)' : 'rgba(255,255,255,0.97)'
    : isHome ? 'transparent' : darkMode ? '#0a0f1e' : 'white';

  const textCol = isTransparent ? 'rgba(255,255,255,0.9)' : darkMode ? 'rgba(255,255,255,0.85)' : '#374151';
  const borderCol = scrolled ? (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : 'transparent';

  return { scrolled, isHome, isTransparent, navBg, textCol, borderCol };
}

// ─────────────────────────────────────────────
// Dark Mode Toggle Button
// ─────────────────────────────────────────────
function DarkModeToggle({ darkMode, onToggle }: { darkMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={darkMode ? 'Light mode' : 'Dark mode'}
      style={{
        width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.3s', flexShrink: 0,
        background: darkMode ? 'linear-gradient(135deg,#1d4ed8,#059669)' : '#e2e8f0',
      }}
    >
      <div style={{
        position: 'absolute', width: 16, height: 16, borderRadius: '50%',
        background: 'white', top: 3, left: darkMode ? 19 : 3,
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────
// Desktop Nav Links
// ─────────────────────────────────────────────
function DesktopLinks({ textCol, userRole }: { textCol: string; userRole?: string }) {
  const links = [
    { href: '/#fleet', label: 'Browse Cars' },
    { href: '/fleet', label: 'All Fleet' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#why-glidego', label: 'Why GlideGo' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }} className="desktop-nav">
      {links.map(l => (
        <Link key={l.href} href={l.href} className="nav-link-item" style={{ color: textCol }}>{l.label}</Link>
      ))}
      {userRole === 'host' && (
        <Link href="/host/dashboard" className="nav-link-item" style={{ color: '#34d399', fontWeight: 700 }}>Host Portal</Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile Dropdown
// ─────────────────────────────────────────────
function ProfileDropdown({ darkMode, user, onClose, onLogout }: {
  darkMode: boolean;
  user: any;
  onClose: () => void;
  onLogout: () => void;
}) {
  const dropBg = darkMode ? '#0f1b35' : 'white';
  const dropBorder = darkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9';
  const dividerCol = darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9';

  return (
    <div className="profile-dropdown" style={{ background: dropBg, border: `1px solid ${dropBorder}` }}>
      <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${dividerCol}`, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? 'white' : '#0f172a' }}>{user.name}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{user.email}</div>
        {user.promoCredits ? (
          <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 3 }}>
            💰 ${user.promoCredits} credits
          </div>
        ) : null}
      </div>

      <Link href="/account/profile" className="drop-item" onClick={onClose}>👤 My Account</Link>
      <Link href="/account/profile" className="drop-item" onClick={onClose}>📅 My Bookings</Link>
      <Link href="/account/profile" className="drop-item" onClick={onClose}>❤️ Favourites</Link>

      {user.role === 'host' && (
        <>
          <Link href="/host/dashboard" className="drop-item" onClick={onClose}>🏠 Host Dashboard</Link>
          <Link href="/host/add-vehicle" className="drop-item" onClick={onClose}>➕ Add Vehicle</Link>
        </>
      )}

      <div style={{ borderTop: `1px solid ${dividerCol}`, marginTop: 6, paddingTop: 6 }}>
        <button onClick={onLogout} className="drop-item" style={{ color: '#ef4444' }}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Auth Buttons (logged in / logged out)
// ─────────────────────────────────────────────
function AuthSection({ darkMode, textCol, isTransparent }: {
  darkMode: boolean;
  textCol: string;
  isTransparent: boolean;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    router.push('/');
  };

  if (user) {
    return (
      <div ref={profileRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 40, padding: '6px 14px 6px 6px', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1d4ed8,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {user.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: textCol, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name.split(' ')[0]}
          </span>
          <span style={{ color: textCol, fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>

        {profileOpen && (
          <ProfileDropdown
            darkMode={darkMode}
            user={user}
            onClose={() => setProfileOpen(false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Link
        href="/login"
        style={{
          fontSize: 14, fontWeight: 600, color: textCol, textDecoration: 'none',
          padding: '8px 16px', borderRadius: 10,
          border: `1px solid ${isTransparent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          transition: 'all 0.2s',
        }}
      >
        Sign In
      </Link>
      <Link
        href="/login?mode=signup"
        style={{
          fontSize: 14, fontWeight: 700, color: 'white', textDecoration: 'none',
          padding: '8px 18px', borderRadius: 10,
          background: 'linear-gradient(135deg,#1d4ed8,#059669)',
          boxShadow: '0 4px 14px rgba(29,78,216,0.3)',
        }}
      >
        Get Started
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile Menu
// ─────────────────────────────────────────────
function MobileMenu({ darkMode, onClose }: { darkMode: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();

  const baseLinks = [
    { href: '/#fleet', label: '🚗 Browse Cars' },
    { href: '/fleet', label: '🗂️ All Fleet' },
    { href: '/#how-it-works', label: '💡 How It Works' },
  ];

  const authLinks = user
    ? [{ href: '/account/profile', label: '👤 My Account' }, { href: '/account/profile#bookings', label: '📅 My Bookings' }]
    : [{ href: '/login', label: '🔒 Sign In' }, { href: '/login?mode=signup', label: '✨ Get Started' }];

  const hostLinks = user?.role === 'host'
    ? [{ href: '/host/dashboard', label: '🏠 Host Portal' }, { href: '/host/add-vehicle', label: '➕ Add Vehicle' }]
    : [];

  const allLinks = [...baseLinks, ...authLinks, ...hostLinks];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
        background: darkMode ? '#0a0f1e' : 'white', zIndex: 100,
        padding: 24, boxShadow: '-20px 0 60px rgba(0,0,0,0.2)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Image src="/logo.png" priority alt="GlideGo" width={100} height={23} style={{ objectFit: 'contain', filter: darkMode ? 'brightness(1.2)' : 'none' }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: darkMode ? 'white' : '#374151' }}>✕</button>
        </div>

        {user && (
          <div style={{ padding: 14, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: darkMode ? 'white' : '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user.role} · {user.trips || 0} trips</div>
          </div>
        )}

        {allLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: 'block', padding: '13px 16px', fontSize: 15, fontWeight: 500,
              color: darkMode ? 'rgba(255,255,255,0.8)' : '#374151',
              textDecoration: 'none', borderRadius: 10, marginBottom: 4, transition: 'background 0.15s',
            }}
          >
            {item.label}
          </Link>
        ))}

        {user && (
          <button
            onClick={() => { logout(); onClose(); }}
            style={{
              display: 'block', width: '100%', padding: '13px 16px', fontSize: 15,
              fontWeight: 500, color: '#ef4444', background: 'none', border: 'none',
              textAlign: 'left', borderRadius: 10, cursor: 'pointer', marginTop: 8,
            }}
          >
            🚪 Sign Out
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Navbar Component
// ─────────────────────────────────────────────
export default function Navbar({ darkMode = false, onDarkModeToggle }: NavbarProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { navBg, textCol, borderCol, isTransparent } = useNavColors(darkMode);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: all 0.3s; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); font-family: 'Inter', sans-serif; }
        .nav-link-item { font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; padding: 6px 2px; }
        .nav-link-item:hover { color: #34d399 !important; }
        .profile-dropdown { position: absolute; top: calc(100% + 10px); right: 0; border-radius: 16px; padding: 8px; min-width: 220px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: dropIn 0.18s ease; }
        @keyframes dropIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
        .drop-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; transition: background 0.15s; border: none; background: transparent; width: 100%; color: inherit; }
        .drop-item:hover { background: rgba(0,0,0,0.05); }
        .hamburger-line { width: 22px; height: 2px; border-radius: 2px; transition: all 0.3s; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>

      <nav className="navbar" style={{ background: navBg, borderBottom: `1px solid ${borderCol}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image
              src="/logo.png" priority alt="GlideGo" width={120} height={28}
              style={{ objectFit: 'contain', filter: isTransparent || darkMode ? 'brightness(1.2)' : 'none' }}
            />
          </Link>

          {/* Desktop Links */}
          <DesktopLinks textCol={textCol} userRole={user?.role} />

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {onDarkModeToggle && <DarkModeToggle darkMode={darkMode} onToggle={onDarkModeToggle} />}
            <AuthSection darkMode={darkMode} textCol={textCol} isTransparent={isTransparent} />

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              className="hamburger"
            >
              {[0, 1, 2].map(i => <div key={i} className="hamburger-line" style={{ background: textCol }} />)}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && <MobileMenu darkMode={darkMode} onClose={() => setMenuOpen(false)} />}
    </>
  );
}
