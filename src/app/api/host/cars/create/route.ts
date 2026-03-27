import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CreateCarPayload = {
  title?: string;
  rego?: string;
  regoState?: string;

  make: string;
  model: string;
  year: number | string;
  colour: string;
  category: string; // UI "category" maps to DB body_type

  fuel: string; // UI fuel maps to DB fuel_type
  transmission: string; // UI maps to DB transmission
  seats: number | string;
  engine?: string;

  description: string;
  features: string[];
  photos: string[];

  pricePerDay: number | string;
  weeklyDiscount: number | string;
  monthlyDiscount: number | string;
  bondAmount: number | string;

  location: string; // UI location name maps to DB location_name

  minDays: number | string;
  minAge: number | string;

  instantBook: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number | string;
};

function toNumber(v: unknown, fallback: number) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeRego(rego?: string) {
  if (!rego) return null;
  const normalized = rego.replace(/[\s-]/g, '').toUpperCase();
  return normalized || null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Session cookies updates are handled by `middleware.ts` already.
            // For this API route we only need to read the current session.
            void cookiesToSet;
          },
        },
      }
    );

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreateCarPayload;
    if (!body?.make?.trim() || !body?.model?.trim()) {
      return NextResponse.json({ error: 'Make and model are required.' }, { status: 400 });
    }

    // Ensure user is a host (defense-in-depth; RLS should also enforce this).
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'host' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Host access required' }, { status: 403 });
    }

    const year = toNumber(body.year, new Date().getFullYear());
    const seats = toNumber(body.seats, 5);
    const priceDaily = toNumber(body.pricePerDay, 0);
    const weeklyDiscount = toNumber(body.weeklyDiscount, 10);
    const monthlyDiscount = toNumber(body.monthlyDiscount, 20);

    // Current UI treats discounts as % off, not absolute weekly/monthly prices.
    const priceWeekly = Math.round(priceDaily * 7 * (1 - weeklyDiscount / 100));
    const priceMonthly = Math.round(priceDaily * 30 * (1 - monthlyDiscount / 100));

    const depositAmount = toNumber(body.bondAmount, 500);
    const minDays = toNumber(body.minDays, 1);
    const minAge = toNumber(body.minAge, 21);
    const deliveryFee = toNumber(body.deliveryFee, 0);

    const features = Array.isArray(body.features) ? body.features : [];
    const photos = Array.isArray(body.photos) ? body.photos : [];
    const rego = normalizeRego(body.rego);

    if (photos.length === 0) {
      return NextResponse.json({ error: 'Please add at least one photo URL.' }, { status: 400 });
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Please add a vehicle description.' }, { status: 400 });
    }

    if (priceDaily < 10) {
      return NextResponse.json({ error: 'Daily price must be at least $10.' }, { status: 400 });
    }

    if (year < 1990 || year > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Please enter a valid vehicle year.' }, { status: 400 });
    }

    if (!body.location) {
      return NextResponse.json({ error: 'Missing location' }, { status: 400 });
    }

    const title = body.title?.trim() || `${body.make.trim()} ${body.model.trim()}`;

    const slug = slugify(`${title}-${body.location}-${year}-${crypto.randomUUID().slice(0, 8)}`);

    const insertPayload: Record<string, any> = {
      host_id: user.id,
      rego,
      rego_state: body.regoState || null,

      make: body.make.trim(),
      model: body.model.trim(),
      year,
      colour: body.colour?.trim() || null,

      body_type: body.category,
      engine: body.engine || 'Auto (mock) engine',
      transmission: body.transmission,
      fuel_type: body.fuel,

      seats,
      doors: 4,

      price_daily: priceDaily,
      price_weekly: priceWeekly,
      price_monthly: priceMonthly,

      weekend_multiplier: 1.0,
      surge_enabled: false,

      min_days: minDays,
      max_days: 90,
      min_age_years: minAge,
      deposit_amount: depositAmount,

      advance_notice_hrs: 24,
      instant_book: body.instantBook,

      protection_basic: 15,
      protection_standard: 29,
      protection_premium: 49,

      location_name: body.location,
      address: null,
      latitude: null,
      longitude: null,

      delivery_available: body.deliveryAvailable,
      delivery_fee: deliveryFee,
      delivery_radius_km: 10,

      photos,
      tour_video_url: null,
      features,

      title,
      description: body.description.trim(),
      house_rules: null,

      status: 'active',
      available: true,
      glidego_verified: false,
      featured: false,
      slug,
    };

    const { data, error } = await supabase.from('cars').insert(insertPayload).select('*').single();
    if (error) {
      const status = error.code === '23505' ? 409 : 500;
      const message = error.code === '23505'
        ? 'A vehicle with this registration or slug already exists.'
        : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ success: true, carId: data?.id || null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
