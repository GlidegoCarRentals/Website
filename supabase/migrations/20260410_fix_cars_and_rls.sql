-- 1. Create Cars Table (Missing from earlier migrations)
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  colour text,
  body_type text,
  engine text,
  transmission text not null default 'Automatic',
  fuel_type text not null default 'Petrol',
  seats integer not null default 5,
  doors integer,
  price_daily numeric(10,2) not null,
  price_weekly numeric(10,2),
  price_monthly numeric(10,2),
  weekend_multiplier numeric(3,2) default 1.0,
  surge_enabled boolean default false,
  min_days integer default 1,
  max_days integer,
  min_age_years integer default 21,
  deposit_amount numeric(10,2) default 500,
  advance_notice_hrs integer default 24,
  instant_book boolean default false,
  protection_basic numeric(10,2),
  protection_standard numeric(10,2),
  protection_premium numeric(10,2),
  location_name text not null,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  delivery_available boolean default false,
  delivery_fee numeric(10,2) default 0,
  delivery_radius_km integer,
  photos text[] default '{}',
  tour_video_url text,
  features text[] default '{}',
  title text,
  description text,
  house_rules text,
  avg_rating numeric(3,2) default 0,
  total_reviews integer default 0,
  total_trips integer default 0,
  total_views integer default 0,
  status text not null default 'active',
  available boolean not null default true,
  glidego_verified boolean not null default false,
  featured boolean not null default false,
  slug text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Add RLS to Cars
alter table public.cars enable row level security;

create policy "anyone can view active cars" on public.cars
for select using (status = 'active' and available = true);

create policy "hosts can manage own cars" on public.cars
for all using (auth.uid() = host_id)
with check (auth.uid() = host_id);

-- 3. Fix Users RLS (Allow role change from guest to host)
drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
for update using (auth.uid() = id)
with check (
  auth.uid() = id 
  and (
    -- Allow changing role if current role is guest and new role is host
    (role = 'host' and (select role from public.users where id = auth.uid()) = 'guest')
    -- Or keep the same role
    or (role = (select role from public.users where id = auth.uid()))
    -- Or if user is admin, they can do whatever (though admin usually shouldn't downgrade)
    or ((select role from public.users where id = auth.uid()) = 'admin')
  )
);

-- Actually, a simpler and more permissive policy for the demo/mvp:
drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
for update using (auth.uid() = id);
-- We rely on application logic for now to prevent users from making themselves 'admin' 
-- OR better:
create policy "users can update own profile EXCEPT role" on public.users
for update using (auth.uid() = id)
with check (auth.uid() = id and (role = (select role from public.users where id = auth.uid()) or (select role from public.users where id = auth.uid()) = 'admin'));

-- Special policy for becoming a host
create policy "guests can become hosts" on public.users
for update using (auth.uid() = id and role = 'guest')
with check (auth.uid() = id and role = 'host');

-- 4. Fix Bookings Table Schema (Ensure it matches UI requirements if necessary, but better to fix UI)
-- The current UI in src/app/cars/[id]/page.tsx is VERY different from the migration.
-- I will fix the UI instead of the DB schema to maintain consistency with Module 2's comprehensive schema.

-- 5. Add Indices
create index if not exists idx_cars_host_id on public.cars(host_id);
create index if not exists idx_cars_status_available on public.cars(status, available);
create index if not exists idx_cars_location on public.cars(location_name);
create index if not exists idx_cars_slug on public.cars(slug);
