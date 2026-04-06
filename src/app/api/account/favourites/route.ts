import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { carId } = await request.json();
  if (!carId) return NextResponse.json({ error: 'carId is required' }, { status: 400 });

  const { error } = await supabase.from('favourites').upsert({ user_id: user.id, car_id: carId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { carId } = await request.json();
  if (!carId) return NextResponse.json({ error: 'carId is required' }, { status: 400 });

  const { error } = await supabase.from('favourites').delete().eq('user_id', user.id).eq('car_id', carId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
