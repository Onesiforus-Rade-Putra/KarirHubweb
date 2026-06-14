create table if not exists public.seller_profiles (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  photo_url text,
  full_name text not null default '',
  tagline text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_specializations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  specialization text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  position text not null,
  company text not null,
  start_date text,
  end_date text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  issuer text not null,
  year text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  description text,
  link text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiter_company_profiles (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  logo_url text,
  company_name text not null default '',
  industry text,
  company_size text,
  company_email text,
  phone text,
  website text,
  about text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruiter_company_benefits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  benefit text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiter_office_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  address text,
  city text,
  office_type text not null default 'Branch Office' check (office_type in ('Head Office', 'Branch Office')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiter_team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  position text,
  email text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.seller_profiles enable row level security;
alter table public.seller_specializations enable row level security;
alter table public.seller_experiences enable row level security;
alter table public.seller_certificates enable row level security;
alter table public.seller_portfolios enable row level security;
alter table public.recruiter_company_profiles enable row level security;
alter table public.recruiter_company_benefits enable row level security;
alter table public.recruiter_office_locations enable row level security;
alter table public.recruiter_team_members enable row level security;

create index if not exists seller_specializations_user_id_idx on public.seller_specializations(user_id);
create index if not exists seller_experiences_user_id_idx on public.seller_experiences(user_id);
create index if not exists seller_certificates_user_id_idx on public.seller_certificates(user_id);
create index if not exists seller_portfolios_user_id_idx on public.seller_portfolios(user_id);
create index if not exists recruiter_company_benefits_user_id_idx on public.recruiter_company_benefits(user_id);
create index if not exists recruiter_office_locations_user_id_idx on public.recruiter_office_locations(user_id);
create index if not exists recruiter_team_members_user_id_idx on public.recruiter_team_members(user_id);

drop policy if exists "Users manage own seller profile" on public.seller_profiles;
create policy "Users manage own seller profile" on public.seller_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own seller specializations" on public.seller_specializations;
create policy "Users manage own seller specializations" on public.seller_specializations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own seller experiences" on public.seller_experiences;
create policy "Users manage own seller experiences" on public.seller_experiences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own seller certificates" on public.seller_certificates;
create policy "Users manage own seller certificates" on public.seller_certificates for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own seller portfolios" on public.seller_portfolios;
create policy "Users manage own seller portfolios" on public.seller_portfolios for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own recruiter company profile" on public.recruiter_company_profiles;
create policy "Users manage own recruiter company profile" on public.recruiter_company_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own recruiter benefits" on public.recruiter_company_benefits;
create policy "Users manage own recruiter benefits" on public.recruiter_company_benefits for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own recruiter office locations" on public.recruiter_office_locations;
create policy "Users manage own recruiter office locations" on public.recruiter_office_locations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own recruiter team members" on public.recruiter_team_members;
create policy "Users manage own recruiter team members" on public.recruiter_team_members for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_seller_profiles_updated_at on public.seller_profiles;
create trigger set_seller_profiles_updated_at before update on public.seller_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_recruiter_company_profiles_updated_at on public.recruiter_company_profiles;
create trigger set_recruiter_company_profiles_updated_at before update on public.recruiter_company_profiles
for each row execute function public.set_updated_at();
