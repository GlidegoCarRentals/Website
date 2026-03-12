'use client';

import { useState } from 'react';

interface Booking {
  id: string;
  customer: string;
  email: string;
  phone: string;
  vehicle: string;
  pickup: string;
  return: string;
  days: number;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  bondStatus: 'authorized' | 'released' | 'captured' | 'pending';
}

const sampleBookings: Booking[] = [
  { id: 'BK001', customer: 'John Smith', email: 'john@example.com', phone: '0412 345 678', vehicle: 'Toyota Camry', pickup: '2025-03-10', return: '2025-03-15', days: 5, amount: 445, status: 'confirmed', paymentStatus: 'paid', bondStatus: 'authorized' },
  { id: 'BK002', customer: 'Sarah Johnson', email: 'sarah@example.com', phone: '0423 456 789', vehicle: 'Mazda CX-5', pickup: '2025-03-12', return: '2025-03-14', days: 2, amount: 218, status: 'pending', paymentStatus: 'pending', bondStatus: 'pending' },
  { id: 'BK003', customer: 'Mike Wilson', email: 'mike@example.com', phone: '0434 567 890', vehicle: 'Hyundai i30', pickup: '2025-03-08', return: '2025-03-10', days: 2, amount: 138, status: 'completed', paymentStatus: 'paid', bondStatus: 'released' },
  { id: 'BK004', customer: 'Emma Davis', email: 'emma@example.com', phone: '0445 678 901', vehicle: 'Tesla Model 3', pickup: '2025-03-15', return: '2025-03-22', days: 7, amount: 1043, status: 'confirmed', paymentStatus: 'paid', bondStatus: 'authorized' },
];

const statusColors = { confirmed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700' };
const paymentColors = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600' };
const bondColors = { authorized: 'bg-blue-100 text-blue-700', released: 'bg-green-100 text-green-700', captured: 'bg-red-100 text-red-700', pending: 'bg-gray-100 text-gray-600' };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => b.customer.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()) || b.vehicle.toLowerCase().includes(search.toLowerCase()));

  const handleStatusChange = (id: string, status: Booking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleRefund = (id: string) => {
    if (confirm('Issue refund for this booking? This cannot be undone.')) {
      setBookings(bookings.map(b => b.id === id ? { ...b, paymentStatus: 'refunded', status: 'cancelled' } : b));
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Customer', 'Email', 'Phone', 'Vehicle', 'Pickup', 'Return', 'Days', 'Amount (AUD)', 'Status', 'Payment', 'Bond'];
    const rows = bookings.map(b => [b.id, b.customer, b.email, b.phone, b.vehicle, b.pickup, b.return, b.days, b.amount, b.status, b.paymentStatus, b.bondStatus]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glidego-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalRevenue = filtered.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} bookings · ${totalRevenue.toLocaleString()} AUD revenue</p>
        </div>
        <button onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          📥 Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, ID or vehicle..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Booking ID', 'Customer', 'Vehicle', 'Dates', 'Amount', 'Status', 'Payment', 'Bond', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-blue-600 font-semibold">{b.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{b.customer}</div>
                    <div className="text-gray-400 text-xs">{b.email}</div>
                    <div className="text-gray-400 text-xs">{b.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-medium">{b.vehicle}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    <div>{b.pickup}</div>
                    <div>→ {b.return}</div>
                    <div className="text-gray-400">{b.days} days</div>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">${b.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <select value={b.status} onChange={e => handleStatusChange(b.id, e.target.value as Booking['status'])}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-full border-0 cursor-pointer ${statusColors[b.status]}`}>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1.5 rounded-full ${paymentColors[b.paymentStatus]}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1.5 rounded-full ${bondColors[b.bondStatus]}`}>
                      {b.bondStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {b.paymentStatus === 'paid' && (
                      <button onClick={() => handleRefund(b.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg">
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>No bookings found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
