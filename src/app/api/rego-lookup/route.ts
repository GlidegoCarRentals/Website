import { NextRequest, NextResponse } from 'next/server';

type MockCarDetails = {
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: string;
  engine: string;
  transmission: string;
  fuelType: string;
  odometerKm: number;
  stolenCheck: { status: string; message: string };
  encumbranceCheck: { status: string; message: string };
  nevdisData: { status: string; checkedAt: string };
  confidence: { level: string; score: number };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const regoRaw = body?.rego;
    const normalizeRego = (raw: string) => raw.replace(/[\s-]/g, '').trim().toUpperCase();
    const rego = typeof regoRaw === 'string' ? normalizeRego(regoRaw) : '';

    if (!rego) {
      return NextResponse.json({ error: 'Missing required field: rego' }, { status: 400 });
    }

    // Keep the same lightweight format heuristic as the UI.
    const isValidFormat =
      /^[A-Z0-9]{3,8}$/.test(rego) && /[A-Z]/.test(rego) && /\d/.test(rego);

    if (!isValidFormat) {
      return NextResponse.json({ error: 'Invalid rego format' }, { status: 400 });
    }

    // Mock lookup logic (deterministic based on rego string).
    const catalog: Array<Pick<MockCarDetails, 'make' | 'model' | 'color'>> = [
      { make: 'Toyota', model: 'Camry', color: 'White' },
      { make: 'Honda', model: 'Civic', color: 'Silver' },
      { make: 'Mazda', model: 'CX-5', color: 'Black' },
      { make: 'Hyundai', model: 'i30', color: 'Blue' },
      { make: 'Kia', model: 'Sportage', color: 'Red' },
      { make: 'Volkswagen', model: 'Golf', color: 'Grey' },
    ];

    const seed =
      (rego.charCodeAt(0) || 0) +
      (rego.charCodeAt(rego.length - 1) || 0) +
      rego.length;
    const car = catalog[seed % catalog.length];

    // Keep within the add-vehicle page's year select options (2024 down to 2010).
    const year = 2010 + (seed % 15); // 2010-2024

    const bodyTypes = ['Economy', 'Compact', 'SUV', 'Luxury', 'Sports', 'Van', 'Electric', 'Ute'];
    const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'];
    const transmissions = ['Automatic', 'Manual'];

    const bodyType = bodyTypes[(seed + 1) % bodyTypes.length];
    const fuelType = fuelTypes[(seed + 2) % fuelTypes.length];
    const transmission = transmissions[(seed + 3) % transmissions.length];

    const engineMap: Record<string, string> = {
      Electric: 'Dual Motor Electric',
      Hybrid: '2.5L Hybrid',
      'Plug-in Hybrid': '1.5L PHEV Turbo',
      Diesel: '2.0L Turbo Diesel',
      Petrol: '2.0L Turbo Petrol',
    };
    const engine = engineMap[fuelType] || 'Auto (mock) engine';

    const odometerKm = 10000 + ((seed % 180000) + 1);

    const stolenFlag = seed % 13 === 0;
    const encFlag = seed % 17 === 0;

    const stolenCheck = stolenFlag
      ? { status: 'Flagged', message: 'Possible match in stolen vehicle signals (mock).' }
      : { status: 'Clear', message: 'No stolen-vehicle flags found (mock).' };

    const encumbranceCheck = encFlag
      ? { status: 'Flagged', message: 'Possible finance/encumbrance exists (mock).' }
      : { status: 'Clear', message: 'No finance/encumbrance flags found (mock).' };

    const nevdisStatus = stolenFlag || encFlag ? 'Needs review' : 'Compliant';
    const nevdisData = {
      status: nevdisStatus,
      checkedAt: new Date().toISOString().slice(0, 10),
    };

    const confidenceChoice = seed % 5;
    const confidence =
      confidenceChoice === 0
        ? { level: 'Verified', score: 0.95 }
        : confidenceChoice === 1 || confidenceChoice === 2
          ? { level: 'Partially Verified', score: 0.72 }
          : { level: 'Manual Entry', score: 0.45 };

    // NOTE: catalog entries are minimal; the rest is derived deterministically.
    return NextResponse.json({
      make: car.make,
      model: car.model,
      year,
      color: car.color,
      bodyType,
      engine,
      transmission,
      fuelType,
      odometerKm,
      stolenCheck,
      encumbranceCheck,
      nevdisData,
      confidence,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

