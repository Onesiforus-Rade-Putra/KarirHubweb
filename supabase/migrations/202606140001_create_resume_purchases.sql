create table if not exists public.resume_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  resume_draft_id uuid not null references public.resume_drafts(id) on delete cascade,
  amount integer not null default 29000 check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_provider text not null default 'development-simulator',
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_purchases_user_id_idx on public.resume_purchases(user_id);
create index if not exists resume_purchases_resume_draft_id_idx on public.resume_purchases(resume_draft_id);

alter table public.resume_purchases enable row level security;

drop policy if exists "Users can read own resume purchases" on public.resume_purchases;
create policy "Users can read own resume purchases"
  on public.resume_purchases for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own resume purchases" on public.resume_purchases;
create policy "Users can create own resume purchases"
  on public.resume_purchases for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own resume purchases" on public.resume_purchases;
create policy "Users can update own resume purchases"
  on public.resume_purchases for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_resume_purchases_updated_at on public.resume_purchases;
create trigger set_resume_purchases_updated_at before update on public.resume_purchases
for each row execute function public.set_updated_at();
