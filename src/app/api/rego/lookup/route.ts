import { NextRequest, NextResponse } from 'next/server';
import { CARS } from '@/lib/cars';
import { lookupRego } from '@/lib/rego/provider';

const REGO_PATTERN = /^[A-Z0-9]{2,8}$/;
const COLORS = ['White', 'Black', 'Silver', 'Blue', 'Red', 'Grey'];

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
  const sample = CARS[seed % CARS.length];
  const year = Math.min(new Date().getFullYear(), Number(sample.year) + (seed % 2));
  const color = COLORS[seed % COLORS.length];

  return NextResponse.json({
    rego,
    source: 'fallback_catalog',
    confidence: 0.62,
    data: {
      make: sample.name.split(' ')[0],
      model: sample.name.split(' ').slice(1).join(' '),
      year,
      color,
      fuel: sample.fuel,
      transmission: sample.transmission,
      seats: String(sample.seats),
      category: sample.category,
    },
  });
}
