// ============================================================
// GlideGo — DB Cars Library
// Fetches cars from Supabase cars table
// Actual schema columns verified 2025-04-07
// ============================================================

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ─────────────────────────────────────────────
// DB type — matches actual Supabase cars table
// ─────────────────────────────────────────────
export type DbCar = {
  id: string;
  host_id: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  body_type: string;
  rego: string | null;
  rego_state: string | null;
  rego_verified: boolean | null;
  engine: string | null;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number | null;
  price_daily: number;
  price_weekly: number | null;
  price_monthly: number | null;
  deposit_amount: number;
  min_days: number;
  min_age_years: number;
  max_days: number | null;
  instant_book: boolean;
  delivery_available: boolean;
  delivery_fee: number;
  delivery_radius_km: number | null;
  location_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  features: string[];
  title: string | null;
  description: string;
  house_rules: string | null;
  avg_rating: number;
  total_reviews: number;
  total_trips: number;
  total_views: number | null;
  available: boolean;
  status: string;
  glidego_verified: boolean | null;
  featured: boolean | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  // Joined from users table
  host_name?: string;
  host_avatar?: string;
};

// ─────────────────────────────────────────────
// Fuel colour map
// ─────────────────────────────────────────────
const FUEL_COLORS: Record<string, string> = {
  'Hybrid':                '#16a34a',
  'Electric':              '#2563eb',
  'Plug-in Hybrid (PHEV)': '#16a34a',
  'Petrol':                '#6b7280',
  'Diesel':                '#6b7280',
};

// ─────────────────────────────────────────────
// Category detection from make/model
// ─────────────────────────────────────────────
function getCategory(make: string, model: string): string {
  const key = `${make} ${model}`.toLowerCase();
  if (key.includes('x5') || key.includes('rav4') || key.includes('gle') ||
      key.includes('ev6') || key.includes('x-trail') || key.includes('suv')) return 'SUV';
  if (key.includes('ranger') || key.includes('hilux') || key.includes('triton')) return 'Van';
  if (key.includes('tesla') || key.includes('mercedes') || key.includes('bmw') || key.includes('audi')) return 'Luxury';
  if (key.includes('i30') || key.includes('yaris') || key.includes('swift') || key.includes('polo')) return 'Economy';
  if (key.includes('corolla') || key.includes('camry') || key.includes('mazda3')) return 'Compact';
  return 'Compact';
}

// ─────────────────────────────────────────────
// Specs from fuel type
// ─────────────────────────────────────────────
function getSpecs(fuel: string, engine: string | null) {
  if (fuel === 'Electric')
    return { engine: engine || 'Electric Motor', power: '300+ HP', torque: '450+ Nm', acceleration: '5.0s', topSpeed: '200 km/h', fuel: '18kWh/100km' };
  if (fuel === 'Hybrid' || fuel === 'Plug-in Hybrid (PHEV)')
    return { engine: engine || 'Hybrid', power: '200+ HP', torque: '200+ Nm', acceleration: '8.0s', topSpeed: '180 km/h', fuel: '5.0L/100km' };
  if (fuel === 'Diesel')
    return { engine: engine || 'Diesel', power: '200+ HP', torque: '450+ Nm', acceleration: '9.5s', topSpeed: '175 km/h', fuel: '8.5L/100km' };
  return { engine: engine || 'Petrol', power: '150+ HP', torque: '200+ Nm', acceleration: '9.0s', topSpeed: '200 km/h', fuel: '7.0L/100km' };
}

// ─────────────────────────────────────────────
// Convert DB row → UI car shape
// ─────────────────────────────────────────────
export function dbCarToUiCar(car: DbCar) {
  const name  = car.title || `${car.make} ${car.model}`;
  const photo = Array.isArray(car.photos) && car.photos.length > 0
    ? car.photos[0]
    : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80';

  const hostInitials = car.host_name
    ? car.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GG';

  return {
    // Identity
    id:           car.id,
    name,
    category:     getCategory(car.make, car.model),
    // Specs
    fuel:         car.fuel_type,
    fuel_type:    car.fuel_type,
    year:         car.year,
    seats:        car.seats,
    doors:        car.doors,
    transmission: car.transmission,
    colour:       car.colour,
    engine:       car.engine,
    // Pricing
    price:        Number(car.price_daily),
    weeklyPrice:  car.price_weekly ? Number(car.price_weekly) : Math.round(Number(car.price_daily) * 6.5),
    monthlyPrice: car.price_monthly ? Number(car.price_monthly) : null,
    deposit:      Number(car.deposit_amount),
    minAge:       car.min_age_years,
    minDays:      car.min_days,
    maxDays:      car.max_days,
    // Status
    available:    car.available,
    status:       car.status,
    featured:     car.featured ?? false,
    glidego_verified: car.glidego_verified ?? false,
    // Display
    badge:        getCategory(car.make, car.model),
    fuelBadge:    car.fuel_type,
    fuelColor:    FUEL_COLORS[car.fuel_type] ?? '#6b7280',
    image:        photo,
    photos:       Array.isArray(car.photos) ? car.photos : [photo],
    // Features
    features:     Array.isArray(car.features) ? car.features.slice(0, 3) : [],
    allFeatures:  Array.isArray(car.features) ? car.features : [],
    description:  car.description ?? '',
    houseRules:   car.house_rules ?? '',
    // Location
    location:     car.location_name,
    address:      car.address,
    latitude:     car.latitude,
    longitude:    car.longitude,
    // Stats
    rating:        Number(car.avg_rating) || 4.5,
    trips:         car.total_trips ?? 0,
    reviews_count: car.total_reviews ?? 0,
    views:         car.total_views ?? 0,
    // Options
    instant_book:       car.instant_book,
    delivery_available: car.delivery_available,
    delivery_fee:       Number(car.delivery_fee),
    delivery_radius_km: car.delivery_radius_km,
    // Specs object
    specs: getSpecs(car.fuel_type, car.engine),
    included: ['Insurance Included', 'Unlimited KM in VIC', 'Free Cancellation', '24/7 Roadside Assist'],
    // Host
    host: {
      name:         car.host_name ?? 'GlideGo Host',
      avatar:       car.host_avatar ?? hostInitials,
      initials:     hostInitials,
      rating:       4.9,
      trips:        car.total_trips ?? 0,
      responseTime: '< 1 hour',
      joined:       '2024',
    },
    reviews: [],
    // Raw host_id for booking insert
    host_id: car.host_id,
    // Slug
    slug: car.slug,
  };
}

// ─────────────────────────────────────────────
// SELECT columns — only real schema columns
// ─────────────────────────────────────────────
const CARS_SELECT = `
  id, host_id, make, model, year, colour, body_type, engine,
  rego, rego_state, rego_verified,
  transmission, fuel_type, seats, doors,
  price_daily, price_weekly, price_monthly, deposit_amount,
  min_days, min_age_years, max_days,
  instant_book, delivery_available, delivery_fee, delivery_radius_km,
  location_name, address, latitude, longitude,
  photos, features, title, description, house_rules,
  avg_rating, total_reviews, total_trips, total_views,
  available, status, glidego_verified, featured, slug,
  created_at, updated_at,
  users!host_id (
    full_name,
    avatar_url
  )
`.trim();

// Flatten the joined users row into the car object
function flattenHost(car: any): DbCar {
  const host = car.users ?? {};
  return {
    ...car,
    host_name:   host.full_name  ?? null,
    host_avatar: host.avatar_url ?? null,
    users:       undefined,
  };
}

// ─────────────────────────────────────────────
// fetchCars — all available cars
// ─────────────────────────────────────────────
export async function fetchCars(): Promise<ReturnType<typeof dbCarToUiCar>[]> {
  const { data, error } = await supabase
    .from('cars')
    .select(CARS_SELECT)
    .eq('available', true)
    .eq('status', 'active')
    .order('total_trips', { ascending: false });

  if (error) {
    console.error('[fetchCars] Supabase error:', error.message);
    return [];
  }

  return (data ?? []).map(flattenHost).map(dbCarToUiCar);
}

// ─────────────────────────────────────────────
// fetchCarById — single car by UUID
// ─────────────────────────────────────────────
export async function fetchCarById(id: string): Promise<ReturnType<typeof dbCarToUiCar> | null> {
  const { data, error } = await supabase
    .from('cars')
    .select(CARS_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbCarToUiCar(flattenHost(data));
}

// ─────────────────────────────────────────────
// fetchCarBySlugOrId — for /cars/[id] route
// ─────────────────────────────────────────────
export async function fetchCarBySlugOrId(idOrSlug: string): Promise<ReturnType<typeof dbCarToUiCar> | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) return fetchCarById(idOrSlug);

  // Try slug lookup
  const { data, error } = await supabase
    .from('cars')
    .select(CARS_SELECT)
    .eq('slug', idOrSlug)
    .single();

  if (error || !data) return null;
  return dbCarToUiCar(flattenHost(data));
}

// ─────────────────────────────────────────────
// fetchCarsByHostId — host's own cars
// ─────────────────────────────────────────────
export async function fetchCarsByHostId(hostId: string): Promise<ReturnType<typeof dbCarToUiCar>[]> {
  const { data, error } = await supabase
    .from('cars')
    .select(CARS_SELECT)
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchCarsByHostId] Supabase error:', error.message);
    return [];
  }

  return (data ?? []).map(flattenHost).map(dbCarToUiCar);
}

// ─────────────────────────────────────────────
// fetchHostCars — alias, used by host dashboard
// ─────────────────────────────────────────────
export async function fetchHostCars(hostId: string) {
  const cars = await fetchCarsByHostId(hostId);
  return cars.map(c => ({
    ...c,
    displayStatus: c.status === 'active' && c.available
      ? 'active'
      : c.status === 'maintenance'
      ? 'maintenance'
      : 'inactive',
    host_id: hostId,
  }));
}

// ─────────────────────────────────────────────
// updateCarPrice
// ─────────────────────────────────────────────
export async function updateCarPrice(carId: string, newPrice: number): Promise<boolean> {
  const { error } = await supabase
    .from('cars')
    .update({ price_daily: newPrice, updated_at: new Date().toISOString() })
    .eq('id', carId);
  return !error;
}

// ─────────────────────────────────────────────
// updateCarStatus
// ─────────────────────────────────────────────
export async function updateCarStatus(carId: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('cars')
    .update({
      status,
      available: status === 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', carId);
  return !error;
}

// ─────────────────────────────────────────────
// deleteCarById — soft delete via status
// ─────────────────────────────────────────────
export async function deleteCarById(carId: string): Promise<boolean> {
  const { error } = await supabase
    .from('cars')
    .update({ status: 'inactive', available: false, updated_at: new Date().toISOString() })
    .eq('id', carId);
  return !error;
}
