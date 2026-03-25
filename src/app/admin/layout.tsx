'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // This runs only on the client (component is marked "use client").
    try {
      return localStorage.getItem('admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pathname = usePathname();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Wrong password! Default is: admin123');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🚗</div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-500 text-sm mt-1">GlideGo Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
              Login →
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">Default password: admin123</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/vehicles', label: '🚗 Vehicles' },
    { href: '/admin/bookings', label: '📅 Bookings' },
    { href: '/admin/revenue', label: '💰 Revenue' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="font-bold text-gray-900">GlideGo Admin</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">View Site ↗</Link>
          <button onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
