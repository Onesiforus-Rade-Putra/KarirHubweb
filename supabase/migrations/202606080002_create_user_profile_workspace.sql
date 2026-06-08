create table if not exists public.user_profile_details (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  title text,
  location text,
  phone text,
  website text,
  about text,
  language text not null default 'id',
  region text not null default 'ID',
  email_notifications boolean not null default true,
  product_notifications boolean not null default false,
  payment_methods jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profile_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role text not null,
  company text not null,
  start_date text,
  end_date text,
  is_current boolean not null default false,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profile_educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  school text not null,
  degree text not null,
  period text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profile_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  issuer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profile_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  skill text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill)
);

create table if not exists public.user_cv_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  file_name text not null,
  file_size integer not null default 0,
  file_type text,
  storage_path text,
  download_url text,
  source text not null default 'local-metadata' check (source in ('supabase-storage', 'local-metadata')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profile_details enable row level security;
alter table public.user_profile_experiences enable row level security;
alter table public.user_profile_educations enable row level security;
alter table public.user_profile_certifications enable row level security;
alter table public.user_profile_skills enable row level security;
alter table public.user_cv_files enable row level security;

drop policy if exists "Users can manage own profile details" on public.user_profile_details;
create policy "Users can manage own profile details"
  on public.user_profile_details for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own profile experiences" on public.user_profile_experiences;
create policy "Users can manage own profile experiences"
  on public.user_profile_experiences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own profile educations" on public.user_profile_educations;
create policy "Users can manage own profile educations"
  on public.user_profile_educations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own profile certifications" on public.user_profile_certifications;
create policy "Users can manage own profile certifications"
  on public.user_profile_certifications for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own profile skills" on public.user_profile_skills;
create policy "Users can manage own profile skills"
  on public.user_profile_skills for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own cv files" on public.user_cv_files;
create policy "Users can manage own cv files"
  on public.user_cv_files for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_profile_experiences_user_id_idx on public.user_profile_experiences(user_id);
create index if not exists user_profile_educations_user_id_idx on public.user_profile_educations(user_id);
create index if not exists user_profile_certifications_user_id_idx on public.user_profile_certifications(user_id);
create index if not exists user_profile_skills_user_id_idx on public.user_profile_skills(user_id);
create index if not exists user_cv_files_user_id_idx on public.user_cv_files(user_id);

drop trigger if exists set_user_profile_details_updated_at on public.user_profile_details;
create trigger set_user_profile_details_updated_at before update on public.user_profile_details
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profile_experiences_updated_at on public.user_profile_experiences;
create trigger set_user_profile_experiences_updated_at before update on public.user_profile_experiences
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profile_educations_updated_at on public.user_profile_educations;
create trigger set_user_profile_educations_updated_at before update on public.user_profile_educations
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profile_certifications_updated_at on public.user_profile_certifications;
create trigger set_user_profile_certifications_updated_at before update on public.user_profile_certifications
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profile_skills_updated_at on public.user_profile_skills;
create trigger set_user_profile_skills_updated_at before update on public.user_profile_skills
for each row execute function public.set_updated_at();

drop trigger if exists set_user_cv_files_updated_at on public.user_cv_files;
create trigger set_user_cv_files_updated_at before update on public.user_cv_files
for each row execute function public.set_updated_at();
