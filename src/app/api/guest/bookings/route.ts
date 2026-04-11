import { requireAuthenticatedUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireAuthenticatedUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { supabase, user } = auth

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      status,
      start_date,
      end_date,
      trip_days,
      total_amount,
      pickup_location,
      return_location,
      cars:car_id (
        id,
        make,
        model,
        photos,
        location_name,
        price_daily,
        status
      )
    `)
    .eq('guest_id', user.id)
    .order('start_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const bookings = (data || []).map((row: any) => ({
    id: row.id,
    bookingReference: row.booking_reference,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    tripDays: Number(row.trip_days || 0),
    totalAmount: Number(row.total_amount || 0),
    pickupLocation: row.pickup_location,
    returnLocation: row.return_location,
    car: row.cars ? {
      id: row.cars.id,
      make: row.cars.make,
      model: row.cars.model,
      photos: Array.isArray(row.cars.photos) ? row.cars.photos : [],
      locationName: row.cars.location_name,
      priceDaily: row.cars.price_daily,
      status: row.cars.status,
    } : null,
  }))

  return NextResponse.json({ bookings })
}
