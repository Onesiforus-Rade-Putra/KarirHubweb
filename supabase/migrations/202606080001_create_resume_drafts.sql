create table if not exists public.resume_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  resume_data jsonb not null default '{}'::jsonb,
  generated_resume jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.resume_drafts enable row level security;

drop policy if exists "Users can read own resume draft" on public.resume_drafts;
create policy "Users can read own resume draft"
  on public.resume_drafts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own resume draft" on public.resume_drafts;
create policy "Users can create own resume draft"
  on public.resume_drafts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own resume draft" on public.resume_drafts;
create policy "Users can update own resume draft"
  on public.resume_drafts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own resume draft" on public.resume_drafts;
create policy "Users can delete own resume draft"
  on public.resume_drafts for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists set_resume_drafts_updated_at on public.resume_drafts;
create trigger set_resume_drafts_updated_at before update on public.resume_drafts
for each row execute function public.set_updated_at();
