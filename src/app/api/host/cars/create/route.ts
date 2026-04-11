import { requireRole } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Payload = {
  make?: string
  model?: string
  year?: number
  fuel_type?: string
  transmission?: string
  seats?: number
  colour?: string
  rego?: string
  description?: string
  features?: string[]
  photos?: string[]
  price_daily?: number
  price_weekly?: number
  location_name?: string
  min_days?: number
  min_age_years?: number
  instant_book?: boolean
  delivery_available?: boolean
  delivery_fee?: number
  deposit_amount?: number
  body_type?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function POST(request: Request) {
  const auth = await requireRole(['host', 'admin'])
  if (!auth.ok) return (auth as { response: ReturnType<typeof NextResponse.json> }).response

  const { supabase, userId: host_id } = auth

  const payload = (await request.json()) as Payload
  const make = payload.make?.trim()
  const model = payload.model?.trim()
  const rego = payload.rego?.trim().toUpperCase()
  const year = Number(payload.year)
  const priceDaily = Number(payload.price_daily)
  const seats = Number(payload.seats || 5)
  const minDays = Number(payload.min_days || 1)
  const minAge = Number(payload.min_age_years || 21)
  const deliveryFee = Number(payload.delivery_fee || 0)
  const depositAmount = Number(payload.deposit_amount || 0)
  const locationName = payload.location_name?.trim()

  if (!make || !model || !rego || !locationName) {
    return NextResponse.json({ error: 'Make, model, registration, and location are required.' }, { status: 400 })
  }

  if (!Number.isFinite(year) || year < 2000 || year > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Enter a valid vehicle year.' }, { status: 400 })
  }

  if (!Number.isFinite(priceDaily) || priceDaily < 20) {
    return NextResponse.json({ error: 'Daily price must be at least $20.' }, { status: 400 })
  }

  const baseSlug = slugify(`${make}-${model}-${rego}`)
  const slug = baseSlug || `vehicle-${Date.now()}`

  const insertPayload = {
    host_id,
    make,
    model,
    year,
    fuel_type: payload.fuel_type || 'Petrol',
    transmission: payload.transmission || 'Automatic',
    seats,
    colour: payload.colour?.trim() || null,
    description: payload.description?.trim() || '',
    features: Array.isArray(payload.features) ? payload.features : [],
    photos: Array.isArray(payload.photos) && payload.photos.length > 0
      ? payload.photos
      : ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80'],
    price_daily: priceDaily,
    price_weekly: Number.isFinite(Number(payload.price_weekly)) ? Number(payload.price_weekly) : Math.round(priceDaily * 6.5),
    location_name: locationName,
    min_days: minDays,
    min_age_years: minAge,
    instant_book: Boolean(payload.instant_book),
    delivery_available: Boolean(payload.delivery_available),
    delivery_fee: deliveryFee,
    deposit_amount: depositAmount,
    body_type: payload.body_type || null,
    status: 'active',
    available: true,
    glidego_verified: false,
    slug,
    title: `${make} ${model}`,
  }

  const { data, error } = await supabase
    .from('cars')
    .insert(insertPayload)
    .select('id, slug')
    .single()

  if (error) {
    const message = /duplicate/i.test(error.message)
      ? 'This registration or slug already exists. Please verify the vehicle details.'
      : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, car: data })
}
