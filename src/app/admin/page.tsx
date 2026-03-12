import Link from 'next/link';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Bookings', value: '71', change: '+12%', icon: '📅', color: 'blue', href: '/admin/bookings' },
    { label: 'Total Revenue', value: '$29,000', change: '+18%', icon: '💰', color: 'green', href: '/admin/revenue' },
    { label: 'Active Vehicles', value: '6', change: '', icon: '🚗', color: 'purple', href: '/admin/vehicles' },
    { label: 'This Month', value: '$6,100', change: '+17%', icon: '📈', color: 'orange', href: '/admin/revenue' },
  ];

  const quickActions = [
    { href: '/admin/vehicles', icon: '🚗', title: 'Manage Vehicles', desc: 'Add, edit, update status', color: 'blue' },
    { href: '/admin/bookings', icon: '📅', title: 'View Bookings', desc: 'Manage all reservations', color: 'green' },
    { href: '/admin/revenue', icon: '💰', title: 'Revenue Report', desc: 'Track earnings & export CSV', color: 'purple' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              {stat.change && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="text-4xl mb-4">{action.icon}</div>
            <div className="font-bold text-gray-900 text-lg mb-1">{action.title}</div>
            <div className="text-gray-500 text-sm">{action.desc}</div>
            <div className="mt-4 text-blue-600 text-sm font-medium">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
