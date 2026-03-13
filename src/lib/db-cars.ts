// ============================================================
// GlideGo — DB Cars Library
// Fetches cars from Supabase, falls back to static data
// ============================================================

import { supabase } from './auth-context';
import { CARS } from './cars';

export type DbCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  fuel_type: string;
  transmission: string;
  seats: number;
  price_daily: number;
  price_weekly: number;
  location_name: string;
  description: string;
  features: string[];
  photos: string[];
  avg_rating: number;
  total_trips: number;
  available: boolean;
  status: string;
  slug: string;
  colour: string;
  min_age_years: number;
  deposit_amount: number;
  glidego_verified: boolean;
  host_id: string;
  // Joined from users table
  host_name?: string;
  host_email?: string;
  host_avatar?: string;
  is_superhost?: boolean;
};

// Convert DB car to the format the UI expects (matching CARS structure)
export function dbCarToUiCar(car: DbCar) {
  const fuelColorMap: Record<string, string> = {
    'Hybrid': '#16a34a',
    'Electric': '#2563eb',
    'Petrol': '#6b7280',
    'Diesel': '#6b7280',
    'PHEV': '#16a34a',
  };

  const categoryMap: Record<string, string> = {
    'Toyota': { 'Camry': 'Compact', 'RAV4 Hybrid': 'SUV', 'RAV4': 'SUV' }['default'] || 'Compact',
    'Tesla': 'Luxury',
    'BMW': 'SUV',
    'Mercedes-Benz': 'Luxury',
    'Hyundai': 'Economy',
    'Ford': 'Van',
    'Kia': 'Compact',
  };

  const name = `${car.make} ${car.model}`;
  const photo = Array.isArray(car.photos) && car.photos.length > 0
    ? car.photos[0]
    : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80';

  const hostInitials = car.host_name
    ? car.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GG';

  return {
    id: car.id, // UUID string from DB
    name,
    category: getCategoryForCar(car.make, car.model),
    fuel: car.fuel_type,
    year: car.year,
    seats: car.seats,
    transmission: car.transmission,
    price: car.price_daily,
    weeklyPrice: car.price_weekly || Math.round(car.price_daily * 6.5),
    rating: car.avg_rating || 4.5,
    trips: car.total_trips || 0,
    available: car.available,
    badge: getCategoryForCar(car.make, car.model),
    fuelBadge: car.fuel_type,
    fuelColor: fuelColorMap[car.fuel_type] || '#6b7280',
    image: photo,
    features: Array.isArray(car.features) ? car.features.slice(0, 3) : [],
    allFeatures: Array.isArray(car.features) ? car.features : [],
    description: car.description || '',
    location: car.location_name,
    slug: car.slug,
    colour: car.colour,
    deposit: car.deposit_amount,
    minAge: car.min_age_years,
    minDays: 1,
    glidego_verified: car.glidego_verified,
    specs: getSpecsForCar(car.make, car.model, car.fuel_type),
    included: ['Insurance Included', 'Unlimited KM in VIC', 'Free Cancellation', '24/7 Roadside Assist'],
    host: {
      name: car.host_name || 'GlideGo Host',
      avatar: hostInitials,
      rating: 4.9,
      trips: car.total_trips || 0,
      responseTime: '< 1 hour',
      joined: '2024',
    },
    reviews: [],
  };
}

function getCategoryForCar(make: string, model: string): string {
  const key = `${make} ${model}`.toLowerCase();
  if (key.includes('x5') || key.includes('rav4') || key.includes('gle')) return 'SUV';
  if (key.includes('ranger')) return 'Van';
  if (key.includes('tesla') || key.includes('mercedes') || key.includes('bmw')) return 'Luxury';
  if (key.includes('i30') || key.includes('hyundai')) return 'Economy';
  return 'Compact';
}

function getSpecsForCar(make: string, model: string, fuel: string) {
  // Fallback specs based on fuel type
  if (fuel === 'Electric') return { engine: 'Electric Motor', power: '300+ HP', torque: '450+ Nm', acceleration: '5.0s', topSpeed: '200 km/h', fuel: '18kWh/100km' };
  if (fuel === 'Hybrid') return { engine: 'Hybrid', power: '200+ HP', torque: '200+ Nm', acceleration: '8.0s', topSpeed: '180 km/h', fuel: '5.0L/100km' };
  if (fuel === 'Diesel') return { engine: 'Diesel', power: '200+ HP', torque: '450+ Nm', acceleration: '9.5s', topSpeed: '175 km/h', fuel: '8.5L/100km' };
  return { engine: 'Petrol', power: '150+ HP', torque: '200+ Nm', acceleration: '9.0s', topSpeed: '200 km/h', fuel: '7.0L/100km' };
}

// ============================================================
// Main fetch function — DB first, fallback to static
// ============================================================
export async function fetchCars(): Promise<ReturnType<typeof dbCarToUiCar>[]> {
  try {
    const { data, error } = await supabase
      .from('cars_with_host')
      .select('*')
      .eq('status', 'active')
      .order('total_trips', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No cars in DB');

    return data.map(dbCarToUiCar);
  } catch (err) {
    console.warn('DB fetch failed, using static data:', err);
    // Fallback to static cars.ts data
    return CARS as any;
  }
}

// Fetch single car by slug or id
export async function fetchCarBySlugOrId(slugOrId: string): Promise<ReturnType<typeof dbCarToUiCar> | null> {
  try {
    // Try UUID first
    const isUuid = /^[0-9a-f-]{36}$/.test(slugOrId);

    const query = supabase.from('cars_with_host').select('*');
    const { data, error } = isUuid
      ? await query.eq('id', slugOrId).single()
      : await query.eq('slug', slugOrId).single();

    if (error) throw error;
    if (!data) throw new Error('Car not found');

    return dbCarToUiCar(data);
  } catch {
    // Fallback: find in static data by numeric id or slug
    const numId = parseInt(slugOrId);
    const staticCar = CARS.find(c => c.id === numId) as any;
    return staticCar || null;
  }
}
