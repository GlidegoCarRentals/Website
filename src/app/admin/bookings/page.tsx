'use client';

import { useEffect, useState } from 'react';
import { fetchAdminBookings } from '@/lib/db-bookings';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminBookings()
      .then((data) => setBookings(data))
      .catch(() => setError('Bookings could not be loaded.'));
  }, []);

  const filtered = bookings
    .filter((booking) => filter === 'all' || booking.bookingStatus === filter)
    .filter((booking) => booking.customer.toLowerCase().includes(search.toLowerCase()) || booking.id.toLowerCase().includes(search.toLowerCase()) || booking.vehicle.toLowerCase().includes(search.toLowerCase()));

  const updateBooking = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Booking update failed.');
    return result.booking;
  };

  const handleStatusChange = async (id: string, bookingStatus: string) => {
    try {
      const updated = await updateBooking(id, { booking_status: bookingStatus });
      setBookings((items) => items.map((booking) => booking.id === id ? { ...booking, bookingStatus: updated.booking_status, status: updated.booking_status } : booking));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The booking status could not be updated.');
    }
  };

  const handleRefund = async (id: string) => {
    try {
      const updated = await updateBooking(id, { booking_status: 'cancelled', payment_status: 'refunded' });
      setBookings((items) => items.map((booking) => booking.id === id ? { ...booking, bookingStatus: updated.booking_status, status: updated.booking_status, paymentStatus: updated.payment_status } : booking));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The refund could not be processed.');
    }
  };

  const totalRevenue = filtered.filter((booking) => booking.paymentStatus === 'paid').reduce((sum, booking) => sum + booking.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} bookings · ${totalRevenue.toLocaleString()} AUD revenue</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <label htmlFor="booking-search" className="sr-only">Search bookings</label>
        <input
          id="booking-search"
          type="text"
          placeholder="Search by name, ID or vehicle..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === item ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Booking ID', 'Customer', 'Vehicle', 'Dates', 'Amount', 'Status', 'Payment', 'Bond', 'Actions'].map((heading) => (
                  <th key={heading} className="text-left px-5 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-blue-600 font-semibold">{booking.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{booking.customer}</div>
                    <div className="text-gray-400 text-xs">{booking.email}</div>
                    <div className="text-gray-400 text-xs">{booking.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-medium">{booking.vehicle}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    <div>{booking.pickup}</div>
                    <div>→ {booking.return}</div>
                    <div className="text-gray-400">{booking.days} days</div>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">${booking.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <select value={booking.bookingStatus} onChange={(event) => handleStatusChange(booking.id, event.target.value)} aria-label={`Status for booking ${booking.id}`} className="text-xs font-semibold px-2 py-1.5 rounded-full border border-gray-200 cursor-pointer">
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs font-semibold px-2 py-1.5 rounded-full bg-gray-100 text-gray-700">{booking.paymentStatus}</span></td>
                  <td className="px-5 py-4"><span className="text-xs font-semibold px-2 py-1.5 rounded-full bg-gray-100 text-gray-700">{booking.bondStatus}</span></td>
                  <td className="px-5 py-4">
                    {booking.paymentStatus === 'paid' && <button onClick={() => handleRefund(booking.id)} className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg">Refund</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-2">📭</div><p>No bookings found</p></div>}
        </div>
      </div>
    </div>
  );
}
