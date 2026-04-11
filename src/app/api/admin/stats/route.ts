import { requireRole } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireRole(['admin'])
  if (!auth.ok) return (auth as { response: ReturnType<typeof NextResponse.json> }).response

  const { supabase } = auth

  const [usersRes, bookingsRes, paymentsRes] = await Promise.all([
    supabase.from('users').select('role'),
    supabase.from('bookings').select('status, total_amount'),
    supabase.from('payments').select('amount, status'),
  ])

  const users = usersRes.data || []
  const bookings = bookingsRes.data || []
  const payments = paymentsRes.data || []

  const stats = {
    totalUsers: users.length,
    totalGuests: users.filter(u => u.role === 'guest').length,
    totalHosts: users.filter(u => u.role === 'host').length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => b.status === 'active').length,
    totalRevenue: payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }

  return NextResponse.json(stats)
}
