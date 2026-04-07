import { NextRequest, NextResponse } from 'next/server';
import { lookupRego } from '@/lib/rego/provider';

const REGO_PATTERN = /^[A-Z0-9]{2,8}$/;
const COLORS = ['White', 'Black', 'Silver', 'Blue', 'Red', 'Grey'];

// Demo vehicle catalog for fallback mock — no hardcoded CARS dependency
const MOCK_VEHICLES = [
  { make: 'Toyota',    model: 'Camry',    fuel: 'Hybrid',   transmission: 'Automatic', seats: 5 },
  { make: 'Tesla',     model: 'Model 3',  fuel: 'Electric', transmission: 'Automatic', seats: 5 },
  { make: 'BMW',       model: 'X5',       fuel: 'Petrol',   transmission: 'Automatic', seats: 7 },
  { make: 'Hyundai',   model: 'i30',      fuel: 'Petrol',   transmission: 'Automatic', seats: 5 },
  { make: 'Mercedes',  model: 'GLE 300d', fuel: 'Diesel',   transmission: 'Automatic', seats: 7 },
  { make: 'Ford',      model: 'Ranger',   fuel: 'Diesel',   transmission: 'Automatic', seats: 5 },
  { make: 'Kia',       model: 'EV6',      fuel: 'Electric', transmission: 'Automatic', seats: 5 },
  { make: 'Toyota',    model: 'RAV4',     fuel: 'Hybrid',   transmission: 'Automatic', seats: 5 },
];

function hashCode(value: string) {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export async function GET(request: NextRequest) {
  const rego = request.nextUrl.searchParams.get('rego')?.trim().toUpperCase() || '';

  if (!REGO_PATTERN.test(rego)) {
    return NextResponse.json({ error: 'Enter a valid registration plate.' }, { status: 400 });
  }

  const liveResult = await lookupRego(rego);
  if (liveResult) {
    return NextResponse.json(liveResult);
  }

  const seed = hashCode(rego);
  const sample = MOCK_VEHICLES[seed % MOCK_VEHICLES.length];
  const year = 2021 + (seed % 4);
  const color = COLORS[seed % COLORS.length];

  return NextResponse.json({
    rego,
    source: 'demo',
    confidence: 0.62,
    data: {
      make: sample.make,
      model: sample.model,
      year,
      color,
      fuel: sample.fuel,
      transmission: sample.transmission,
      seats: String(sample.seats),
    },
  });
}
