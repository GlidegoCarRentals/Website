-- ============================================================
-- Fix: handle_new_user trigger
-- Run this in Supabase SQL Editor to fix the "Error updating user" issue
-- ============================================================

-- Step 1: Create/replace the function that syncs auth.users → public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    promo_credits,
    email_verified,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    ),
    coalesce(new.raw_user_meta_data->>'role', 'guest'),
    20,
    new.email_confirmed_at is not null,
    now(),
    now()
  )
  on conflict (id) do update set
    email       = excluded.email,
    updated_at  = now();
  return new;
end;
$$ language plpgsql security definer;

-- Step 2: Drop and recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Step 3: Ensure RLS allows the trigger (security definer handles this, but just in case)
-- Allow users to read and update their own row
alter table public.users enable row level security;

-- Policy: users can read their own row
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Policy: users can update their own row
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Policy: service role can do everything (for triggers)
drop policy if exists "Service role full access" on public.users;
create policy "Service role full access"
  on public.users for all
  using (auth.role() = 'service_role');
