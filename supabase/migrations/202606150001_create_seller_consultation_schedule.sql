create table if not exists public.seller_consultation_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.user_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  buyer_user_id uuid references public.user_profiles(id) on delete set null,
  client_name text not null,
  client_email text not null default '',
  service_title text not null,
  scheduled_date date,
  start_time text,
  end_time text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'rescheduled', 'completed', 'cancelled')),
  seller_notes text,
  rejection_reason text,
  meeting_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

create table if not exists public.seller_availability (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.user_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_consultation_sessions_seller_id_idx on public.seller_consultation_sessions(seller_id);
create index if not exists seller_consultation_sessions_order_id_idx on public.seller_consultation_sessions(order_id);
create index if not exists seller_consultation_sessions_service_id_idx on public.seller_consultation_sessions(service_id);
create index if not exists seller_consultation_sessions_status_idx on public.seller_consultation_sessions(status);
create index if not exists seller_consultation_sessions_scheduled_date_idx on public.seller_consultation_sessions(scheduled_date);
create index if not exists seller_availability_seller_id_idx on public.seller_availability(seller_id);

alter table public.seller_consultation_sessions enable row level security;
alter table public.seller_availability enable row level security;

drop policy if exists "Sellers can read own consultation sessions" on public.seller_consultation_sessions;
create policy "Sellers can read own consultation sessions"
  on public.seller_consultation_sessions for select
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can create own consultation sessions" on public.seller_consultation_sessions;
create policy "Sellers can create own consultation sessions"
  on public.seller_consultation_sessions for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can update own consultation sessions" on public.seller_consultation_sessions;
create policy "Sellers can update own consultation sessions"
  on public.seller_consultation_sessions for update
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  )
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can read own availability" on public.seller_availability;
create policy "Sellers can read own availability"
  on public.seller_availability for select
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can create own availability" on public.seller_availability;
create policy "Sellers can create own availability"
  on public.seller_availability for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can update own availability" on public.seller_availability;
create policy "Sellers can update own availability"
  on public.seller_availability for update
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  )
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop trigger if exists set_seller_consultation_sessions_updated_at on public.seller_consultation_sessions;
create trigger set_seller_consultation_sessions_updated_at before update on public.seller_consultation_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_seller_availability_updated_at on public.seller_availability;
create trigger set_seller_availability_updated_at before update on public.seller_availability
for each row execute function public.set_updated_at();
