-- Repair auth confirmation and OAuth profile sync failures.
-- Apply this in Supabase SQL Editor or via `supabase db push`.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_role text;
  resolved_full_name text;
begin
  normalized_role := case
    when new.raw_user_meta_data->>'role' in ('host', 'admin') then new.raw_user_meta_data->>'role'
    else 'guest'
  end;

  resolved_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'User'
  );

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
    coalesce(new.email, ''),
    resolved_full_name,
    normalized_role,
    20,
    new.email_confirmed_at is not null,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.users.full_name),
    role = case
      when excluded.role in ('guest', 'host', 'admin') then excluded.role
      else public.users.role
    end,
    email_verified = excluded.email_verified,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "Service role full access" on public.users;
create policy "Service role full access"
  on public.users for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
