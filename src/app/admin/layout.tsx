'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🚗</div>
            <h1 className="text-2xl font-bold text-gray-900">Checking Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">GlideGo Admin Panel</p>
          </div>
          <div className="space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500 text-center">
              {isLoading ? 'Authenticating your session...' : 'Redirecting...'}
            </p>
          </div>
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
          <button onClick={() => logout()}
            className="text-sm text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
