-- Note: repeated string literals are idiomatic in SQL migrations and cannot use constants
begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('guest', 'host', 'admin');
create type public.verification_status as enum ('not_started', 'pending', 'approved', 'rejected', 'expired');
create type public.booking_status as enum (
  'draft',
  'pending',
  'awaiting_payment',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'declined',
  'expired',
  'disputed',
  'no_show'
);
create type public.payment_status as enum (
  'requires_payment_method',
  'pending',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
  'disputed',
  'voided'
);
create type public.payout_status as enum ('pending', 'in_transit', 'paid', 'failed', 'cancelled');
create type public.message_sender_type as enum ('guest', 'host', 'system');
create type public.review_target_type as enum ('host', 'guest', 'car');
create type public.wallet_entry_type as enum (
  'promo_credit',
  'referral_reward',
  'manual_adjustment',
  'booking_credit',
  'refund',
  'debit'
);
create type public.device_verification_type as enum ('email', 'phone', 'driver_licence', 'identity');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'host' then 'host'::public.app_role
    when new.raw_user_meta_data ->> 'role' = 'admin' then 'admin'::public.app_role
    else 'guest'::public.app_role
  end;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    avatar_url,
    email_verified,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    requested_role,
    new.raw_user_meta_data ->> 'avatar_url',
    new.email_confirmed_at is not null,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    email_verified = excluded.email_verified,
    updated_at = timezone('utc', now());

  insert into public.guest_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.host_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_security_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_payment_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.referral_codes (user_id, code)
  values (
    new.id,
    upper('GLIDE' || substr(replace(new.id::text, '-', ''), 1, 6))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  avatar_url text,
  role public.app_role not null default 'guest',
  bio text,
  locale text default 'en-AU',
  timezone text default 'Australia/Melbourne',
  city text,
  state_region text,
  country_code text default 'AU',
  date_of_birth date,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  identity_status public.verification_status not null default 'not_started',
  driver_licence_status public.verification_status not null default 'not_started',
  trust_score integer not null default 50 check (trust_score between 0 and 100),
  risk_level smallint not null default 0 check (risk_level between 0 and 5),
  stripe_customer_id text,
  stripe_connect_account_id text,
  total_trips integer not null default 0,
  host_trips integer not null default 0,
  total_reviews integer not null default 0,
  average_rating numeric(3,2),
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.guest_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  emergency_contact_name text,
  emergency_contact_phone text,
  default_pickup_notes text,
  referral_code_used text,
  referral_completed_count integer not null default 0,
  wallet_balance numeric(10,2) not null default 0,
  lifetime_spend numeric(12,2) not null default 0,
  last_booking_at timestamptz,
  behaviour_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.host_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  about text,
  response_rate numeric(5,2) not null default 100,
  response_time_minutes integer not null default 60,
  acceptance_rate numeric(5,2) not null default 100,
  completion_rate numeric(5,2) not null default 100,
  on_time_rate numeric(5,2) not null default 100,
  superhost_status boolean not null default false,
  instant_booking_enabled boolean not null default false,
  hosted_trip_count integer not null default 0,
  total_earnings numeric(12,2) not null default 0,
  pending_payout_amount numeric(12,2) not null default 0,
  ai_insights_enabled boolean not null default true,
  performance_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  email_trip_updates boolean not null default true,
  email_marketing boolean not null default false,
  email_promotions boolean not null default true,
  sms_trip_updates boolean not null default true,
  sms_security_alerts boolean not null default true,
  push_trip_updates boolean not null default true,
  push_messages boolean not null default true,
  push_host_booking_requests boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_security_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  two_factor_enabled boolean not null default false,
  login_alerts boolean not null default true,
  session_timeout_minutes integer not null default 1440,
  last_password_reset_at timestamptz,
  active_session_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_wallets (
  user_id uuid primary key references public.users(id) on delete cascade,
  balance numeric(10,2) not null default 0,
  promo_credit_balance numeric(10,2) not null default 0,
  referral_credit_balance numeric(10,2) not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid,
  type public.wallet_entry_type not null,
  amount numeric(10,2) not null,
  balance_after numeric(10,2),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_codes (
  user_id uuid primary key references public.users(id) on delete cascade,
  code text not null unique,
  total_uses integer not null default 0,
  converted_uses integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  code text not null,
  reward_granted boolean not null default false,
  reward_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (referrer_user_id, referred_user_id)
);

create table if not exists public.user_payment_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id text,
  default_payment_method_id text,
  billing_name text,
  billing_email text,
  billing_phone text,
  billing_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_payment_method_id text not null unique,
  brand text,
  last4 text,
  exp_month smallint,
  exp_year smallint,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  verification_type public.device_verification_type not null,
  status public.verification_status not null default 'pending',
  storage_path text not null,
  mime_type text,
  file_size_bytes integer,
  extracted_data jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score_delta integer not null,
  reason text not null,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_behaviour_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_name text not null,
  subject_type text,
  subject_id uuid,
  session_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.users(id) on delete restrict,
  host_id uuid not null references public.users(id) on delete restrict,
  car_id uuid not null references public.cars(id) on delete restrict,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  booking_reference text generated always as ('GG-' || upper(substr(replace(id::text, '-', ''), 1, 8))) stored,
  start_date timestamptz not null,
  end_date timestamptz not null,
  pickup_location text,
  return_location text,
  trip_days integer not null default 1,
  subtotal_amount numeric(10,2) not null default 0,
  discounts_amount numeric(10,2) not null default 0,
  wallet_credit_amount numeric(10,2) not null default 0,
  fees_amount numeric(10,2) not null default 0,
  protection_amount numeric(10,2) not null default 0,
  taxes_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  guest_payout_amount numeric(10,2),
  host_earnings_amount numeric(10,2) not null default 0,
  platform_fee_amount numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 0,
  stripe_payment_intent_id text,
  stripe_payment_method_id text,
  stripe_transfer_id text,
  check_in_completed_at timestamptz,
  check_out_completed_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid references public.users(id),
  cancelled_at timestamptz,
  dispute_opened_at timestamptz,
  no_show_reported_at timestamptz,
  timeline jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_status public.booking_status,
  new_status public.booking_status not null,
  changed_by uuid references public.users(id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booking_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  host_id uuid not null references public.users(id) on delete cascade,
  start_date timestamptz not null,
  end_date timestamptz not null,
  source text not null default 'manual',
  booking_id uuid references public.bookings(id) on delete cascade,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  stripe_refund_id text,
  amount numeric(10,2) not null,
  currency text not null default 'AUD',
  status public.payment_status not null default 'pending',
  type text not null default 'rental',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  stripe_transfer_id text,
  stripe_payout_id text,
  amount numeric(10,2) not null,
  currency text not null default 'AUD',
  status public.payout_status not null default 'pending',
  available_on timestamptz,
  paid_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  guest_id uuid not null references public.users(id) on delete cascade,
  host_id uuid not null references public.users(id) on delete cascade,
  car_id uuid references public.cars(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (booking_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  sender_type public.message_sender_type not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewee_id uuid references public.users(id) on delete cascade,
  car_id uuid references public.cars(id) on delete cascade,
  target_type public.review_target_type not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  private_feedback text,
  host_response text,
  host_responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.favourites (
  user_id uuid not null references public.users(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, car_id)
);

create table if not exists public.host_vehicle_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  activity_date date not null,
  view_count integer not null default 0,
  search_impressions integer not null default 0,
  booking_requests integer not null default 0,
  confirmed_bookings integer not null default 0,
  completed_bookings integer not null default 0,
  revenue_amount numeric(10,2) not null default 0,
  utilization_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (car_id, activity_date)
);

create table if not exists public.host_ai_insights (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  insight_type text not null,
  title text not null,
  summary text not null,
  recommendation text,
  score numeric(5,2),
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.fraud_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  signal_type text not null,
  severity smallint not null default 1 check (severity between 1 and 5),
  score numeric(6,2) not null default 0,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_trust_score on public.users(trust_score desc);
create index if not exists idx_bookings_guest_status on public.bookings(guest_id, status, start_date desc);
create index if not exists idx_bookings_host_status on public.bookings(host_id, status, start_date desc);
create index if not exists idx_bookings_car_dates on public.bookings(car_id, start_date, end_date);
create index if not exists idx_booking_blocks_car_dates on public.booking_calendar_blocks(car_id, start_date, end_date);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at desc);
create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id, created_at desc);
create index if not exists idx_reviews_car on public.reviews(car_id, created_at desc);
create index if not exists idx_wallet_transactions_user_created on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_saved_payment_methods_user on public.saved_payment_methods(user_id, created_at desc);
create index if not exists idx_payouts_host_status on public.payouts(host_id, status, created_at desc);
create index if not exists idx_host_analytics_host_date on public.host_vehicle_analytics_daily(host_id, activity_date desc);
create index if not exists idx_fraud_signals_user on public.fraud_signals(user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists set_guest_profiles_updated_at on public.guest_profiles;
create trigger set_guest_profiles_updated_at before update on public.guest_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists set_host_profiles_updated_at on public.host_profiles;
create trigger set_host_profiles_updated_at before update on public.host_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists set_notification_prefs_updated_at on public.user_notification_preferences;
create trigger set_notification_prefs_updated_at before update on public.user_notification_preferences
for each row execute function public.touch_updated_at();

drop trigger if exists set_security_settings_updated_at on public.user_security_settings;
create trigger set_security_settings_updated_at before update on public.user_security_settings
for each row execute function public.touch_updated_at();

drop trigger if exists set_payment_profiles_updated_at on public.user_payment_profiles;
create trigger set_payment_profiles_updated_at before update on public.user_payment_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at before update on public.bookings
for each row execute function public.touch_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
for each row execute function public.touch_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews
for each row execute function public.touch_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.guest_profiles enable row level security;
alter table public.host_profiles enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.user_security_settings enable row level security;
alter table public.user_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.user_payment_profiles enable row level security;
alter table public.saved_payment_methods enable row level security;
alter table public.verification_documents enable row level security;
alter table public.user_trust_events enable row level security;
alter table public.user_behaviour_events enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.booking_calendar_blocks enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.favourites enable row level security;
alter table public.host_vehicle_analytics_daily enable row level security;
alter table public.host_ai_insights enable row level security;
alter table public.fraud_signals enable row level security;

create policy "users can read own profile" on public.users
for select using (auth.uid() = id);

create policy "users can update own profile" on public.users
for update using (auth.uid() = id)
with check (auth.uid() = id and role = public.users.role);

create policy "users can read own guest profile" on public.guest_profiles
for select using (auth.uid() = user_id);

create policy "users can update own guest profile" on public.guest_profiles
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "hosts can read own host profile" on public.host_profiles
for select using (auth.uid() = user_id);

create policy "hosts can update own host profile" on public.host_profiles
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own notification preferences" on public.user_notification_preferences
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own security settings" on public.user_security_settings
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read own wallet" on public.user_wallets
for select using (auth.uid() = user_id);

create policy "users can read own wallet transactions" on public.wallet_transactions
for select using (auth.uid() = user_id);

create policy "users can read own referral code" on public.referral_codes
for select using (auth.uid() = user_id);

create policy "users can read own referrals" on public.referrals
for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

create policy "users can manage own payment profile" on public.user_payment_profiles
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own saved payment methods" on public.saved_payment_methods
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read own verification docs" on public.verification_documents
for select using (auth.uid() = user_id);

create policy "users can insert own verification docs" on public.verification_documents
for insert with check (auth.uid() = user_id);

create policy "users can read own trust events" on public.user_trust_events
for select using (auth.uid() = user_id);

create policy "users can insert own behaviour events" on public.user_behaviour_events
for insert with check (auth.uid() = user_id);

create policy "users can read own behaviour events" on public.user_behaviour_events
for select using (auth.uid() = user_id);

create policy "booking participants can read bookings" on public.bookings
for select using (auth.uid() = guest_id or auth.uid() = host_id);

create policy "guests can create bookings" on public.bookings
for insert with check (auth.uid() = guest_id);

create policy "booking participants can update bookings" on public.bookings
for update using (auth.uid() = guest_id or auth.uid() = host_id)
with check (auth.uid() = guest_id or auth.uid() = host_id);

create policy "booking participants can read booking status history" on public.booking_status_history
for select using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.guest_id = auth.uid() or b.host_id = auth.uid())
  )
);

create policy "hosts can manage booking blocks" on public.booking_calendar_blocks
for all using (auth.uid() = host_id)
with check (auth.uid() = host_id);

create policy "booking participants can read payments" on public.payments
for select using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.guest_id = auth.uid() or b.host_id = auth.uid())
  )
);

create policy "hosts can read own payouts" on public.payouts
for select using (auth.uid() = host_id);

create policy "conversation participants can read conversations" on public.conversations
for select using (auth.uid() = guest_id or auth.uid() = host_id);

create policy "conversation participants can read messages" on public.messages
for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.guest_id = auth.uid() or c.host_id = auth.uid())
  )
);

create policy "conversation participants can send messages" on public.messages
for insert with check (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.guest_id = auth.uid() or c.host_id = auth.uid())
  )
  and auth.uid() = sender_id
);

create policy "review participants can read reviews" on public.reviews
for select using (
  auth.uid() = reviewer_id
  or auth.uid() = reviewee_id
  or exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.guest_id = auth.uid() or b.host_id = auth.uid())
  )
);

create policy "booking participants can create reviews" on public.reviews
for insert with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.guest_id = auth.uid() or b.host_id = auth.uid())
      and b.status = 'completed'
  )
);

create policy "review owners can update review" on public.reviews
for update using (auth.uid() = reviewer_id or auth.uid() = reviewee_id)
with check (auth.uid() = reviewer_id or auth.uid() = reviewee_id);

create policy "users can manage own favourites" on public.favourites
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "hosts can read own analytics" on public.host_vehicle_analytics_daily
for select using (auth.uid() = host_id);

create policy "hosts can read own ai insights" on public.host_ai_insights
for select using (auth.uid() = host_id);

create policy "users can read own fraud signals" on public.fraud_signals
for select using (auth.uid() = user_id);

commit;
