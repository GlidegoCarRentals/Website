import { supabase } from './auth-context';

export type UiBooking = {
  id: string;
  guest: string;
  customer: string;
  email: string;
  phone: string;
  car: string;
  vehicle: string;
  pickup: string;
  return: string;
  days: number;
  amount: number;
  bond: number;
  status: string;
  bookingStatus: string;
  paymentStatus: string;
  bondStatus: string;
  requested: string;
  avatar: string;
  licenceVerified: boolean;
  rating: number | null;
  trips: number;
};

function formatDate(value?: string | null) {
  if (!value) return 'TBD';
  return new Date(value).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function mapBooking(row: any): UiBooking {
  const customer = row.customer_name || 'Customer';
  const vehicle = row.car_name || 'Vehicle';
  return {
    id: String(row.id),
    guest: customer,
    customer,
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    car: vehicle,
    vehicle,
    pickup: formatDate(row.pickup_date),
    return: formatDate(row.return_date),
    days: Number(row.days || 0),
    amount: Number(row.total_amount || 0),
    bond: Number(row.bond_amount || 0),
    status: row.booking_status || row.status || 'pending',
    bookingStatus: row.booking_status || row.status || 'pending',
    paymentStatus: row.payment_status || 'pending',
    bondStatus: row.bond_status || 'pending',
    requested: formatDate(row.created_at),
    avatar: initials(customer || 'GG'),
    licenceVerified: Boolean(row.licence_verified ?? true),
    rating: null,
    trips: Number(row.total_trips || 0),
  };
}

const FALLBACK_BOOKINGS: UiBooking[] = [
  { id:'BK-001', guest:'Alex Johnson', customer:'Alex Johnson', email:'alex@example.com', phone:'0400 111 111', car:'Tesla Model 3', vehicle:'Tesla Model 3', pickup:'14 Mar 2026', return:'17 Mar 2026', days:3, amount:507, bond:500, status:'confirmed', bookingStatus:'confirmed', paymentStatus:'paid', bondStatus:'authorized', requested:'10 Mar 2026', avatar:'AJ', licenceVerified:true, rating:4.9, trips:12 },
  { id:'BK-002', guest:'Priya Singh', customer:'Priya Singh', email:'priya@example.com', phone:'0400 222 222', car:'Toyota Camry', vehicle:'Toyota Camry', pickup:'16 Mar 2026', return:'18 Mar 2026', days:2, amount:218, bond:300, status:'pending', bookingStatus:'pending', paymentStatus:'pending', bondStatus:'pending', requested:'10 Mar 2026', avatar:'PS', licenceVerified:true, rating:4.7, trips:6 },
];

export async function fetchHostBookings(hostId: string): Promise<UiBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_BOOKINGS;
    return data.map(mapBooking);
  } catch (error) {
    console.warn('Host bookings fetch failed, using fallback:', error);
    return FALLBACK_BOOKINGS;
  }
}

export async function fetchAdminBookings(): Promise<UiBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_BOOKINGS;
    return data.map(mapBooking);
  } catch (error) {
    console.warn('Admin bookings fetch failed, using fallback:', error);
    return FALLBACK_BOOKINGS;
  }
}

export async function fetchHostMessages(hostId: string) {
  const bookings = await fetchHostBookings(hostId);

  return bookings.slice(0, 6).map((booking, index) => ({
    id: index + 1,
    guest: booking.customer,
    car: booking.vehicle,
    avatar: booking.avatar,
    unread: booking.status === 'pending' ? 1 : 0,
    lastTime: booking.requested,
    lastMsg: booking.status === 'pending' ? 'Hi, is pickup confirmed?' : 'Thanks, booking confirmed.',
    messages: [
      { id: 1, from: 'guest', text: 'Hi, I wanted to confirm the trip details.', time: '9:00 AM', date: 'Today' },
      { id: 2, from: 'host', text: `Booking ${booking.id} is on track for ${booking.pickup}.`, time: '9:15 AM', date: 'Today' },
    ],
  }));
}

export async function fetchHostEarnings(hostId: string) {
  const bookings = await fetchHostBookings(hostId);
  const paid = bookings.filter((booking) => booking.paymentStatus === 'paid');
  const totalEarned = paid.reduce((sum, booking) => sum + booking.amount, 0);

  return {
    totalEarned,
    monthEarned: totalEarned,
    pendingPayout: Math.round(totalEarned * 0.2),
    avgPerTrip: paid.length ? Math.round(totalEarned / paid.length) : 0,
    payouts: paid.map((booking) => ({
      date: booking.requested,
      amount: Math.round(booking.amount * 0.8),
      status: 'paid',
      method: 'Primary Bank Account',
      trips: booking.days,
    })),
    vehicleBreakdown: paid.slice(0, 4).map((booking) => ({
      name: booking.vehicle,
      earn: Math.round(booking.amount * 0.8),
    })),
    monthlyData: paid.slice(0, 6).map((booking, index) => ({
      month: `M${index + 1}`,
      earnings: Math.round(booking.amount * 0.8),
      bookings: 1,
    })),
  };
}
