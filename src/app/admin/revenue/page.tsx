'use client';

const monthlyData = [
  { month: 'Oct 2024', revenue: 3200, bookings: 18 },
  { month: 'Nov 2024', revenue: 4100, bookings: 23 },
  { month: 'Dec 2024', revenue: 5800, bookings: 31 },
  { month: 'Jan 2025', revenue: 4600, bookings: 26 },
  { month: 'Feb 2025', revenue: 5200, bookings: 29 },
  { month: 'Mar 2025', revenue: 6100, bookings: 34 },
];

const vehicleData = [
  { name: 'Toyota Camry', revenue: 8900, bookings: 22, utilisation: 73 },
  { name: 'Hyundai i30', revenue: 6210, bookings: 21, utilisation: 68 },
  { name: 'Mazda CX-5', revenue: 9810, bookings: 20, utilisation: 65 },
  { name: 'Ford Ranger', revenue: 4080, bookings: 8, utilisation: 26 },
  { name: 'Tesla Model 3', revenue: 6000, bookings: 12, utilisation: 52 },
];

export default function RevenuePage() {
  const totalRevenue = vehicleData.reduce((sum, v) => sum + v.revenue, 0);
  const totalBookings = vehicleData.reduce((sum, v) => sum + v.bookings, 0);
  const avgPerBooking = Math.round(totalRevenue / totalBookings);
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));

  const exportCSV = () => {
    const headers = ['Month', 'Revenue (AUD)', 'Bookings'];
    const rows = monthlyData.map(m => [m.month, m.revenue, m.bookings]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glidego-revenue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">All time earnings overview</p>
        </div>
        <button onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          📥 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'AUD all time', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Bookings', value: totalBookings, sub: 'All time', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Per Booking', value: `$${avgPerBooking}`, sub: 'AUD average', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-medium mb-4 ${s.bg} ${s.color}`}>{s.sub}</div>
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-6 text-lg">Monthly Revenue</h2>
        <div className="flex items-end gap-3 h-48">
          {monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-gray-700">${(m.revenue / 1000).toFixed(1)}k</div>
              <div
                className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-xl transition-all cursor-default"
                style={{ height: `${(m.revenue / maxRevenue) * 160}px` }}
                title={`${m.month}: $${m.revenue.toLocaleString()} (${m.bookings} bookings)`}
              />
              <div className="text-xs text-gray-400 text-center leading-tight">
                <div>{m.month.split(' ')[0]}</div>
                <div className="text-gray-300">{m.bookings}bk</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per Vehicle Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Revenue Per Vehicle</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Vehicle', 'Revenue', 'Bookings', 'Avg/Booking', 'Utilisation'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicleData.sort((a, b) => b.revenue - a.revenue).map((v) => (
              <tr key={v.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{v.name}</td>
                <td className="px-6 py-4 font-bold text-green-600">${v.revenue.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-700">{v.bookings}</td>
                <td className="px-6 py-4 text-gray-700">${Math.round(v.revenue / v.bookings)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-16">
                      <div
                        className={`h-2 rounded-full ${v.utilisation > 60 ? 'bg-green-500' : v.utilisation > 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                        style={{ width: `${v.utilisation}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10">{v.utilisation}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
