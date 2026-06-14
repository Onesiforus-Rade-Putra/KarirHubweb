create table if not exists public.seller_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.user_profiles(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_holder_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_withdrawals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.user_profiles(id) on delete cascade,
  payout_account_id uuid references public.seller_payout_accounts(id) on delete set null,
  amount integer not null check (amount > 0),
  status text not null default 'pending',
  note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'seller_withdrawals_status_check'
      and conrelid = 'public.seller_withdrawals'::regclass
  ) then
    alter table public.seller_withdrawals
      add constraint seller_withdrawals_status_check
      check (status in ('pending', 'approved', 'rejected', 'paid'));
  end if;
end $$;

create index if not exists seller_payout_accounts_seller_id_idx on public.seller_payout_accounts(seller_id);
create index if not exists seller_withdrawals_seller_id_idx on public.seller_withdrawals(seller_id);
create index if not exists seller_withdrawals_status_idx on public.seller_withdrawals(status);
create index if not exists seller_withdrawals_requested_at_idx on public.seller_withdrawals(requested_at);

alter table public.seller_payout_accounts enable row level security;
alter table public.seller_withdrawals enable row level security;

drop policy if exists "Sellers can read own payout accounts" on public.seller_payout_accounts;
create policy "Sellers can read own payout accounts"
  on public.seller_payout_accounts for select
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can create own payout accounts" on public.seller_payout_accounts;
create policy "Sellers can create own payout accounts"
  on public.seller_payout_accounts for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can update own payout accounts" on public.seller_payout_accounts;
create policy "Sellers can update own payout accounts"
  on public.seller_payout_accounts for update
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

drop policy if exists "Sellers can delete own payout accounts" on public.seller_payout_accounts;
create policy "Sellers can delete own payout accounts"
  on public.seller_payout_accounts for delete
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can read own withdrawals" on public.seller_withdrawals;
create policy "Sellers can read own withdrawals"
  on public.seller_withdrawals for select
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can create own withdrawals" on public.seller_withdrawals;
create policy "Sellers can create own withdrawals"
  on public.seller_withdrawals for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop trigger if exists set_seller_payout_accounts_updated_at on public.seller_payout_accounts;
create trigger set_seller_payout_accounts_updated_at before update on public.seller_payout_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_seller_withdrawals_updated_at on public.seller_withdrawals;
create trigger set_seller_withdrawals_updated_at before update on public.seller_withdrawals
for each row execute function public.set_updated_at();
