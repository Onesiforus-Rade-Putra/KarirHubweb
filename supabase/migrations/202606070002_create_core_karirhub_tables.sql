create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider_name text not null,
  provider_avatar text,
  category text not null check (category in ('cv-review', 'mock-interview', 'consulting')),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  price integer not null check (price >= 0),
  duration text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  company_logo text,
  location text not null,
  type text not null check (type in ('Full-time', 'Part-time', 'Remote', 'Contract', 'Internship')),
  salary_min integer not null default 0 check (salary_min >= 0),
  salary_max integer not null default 0 check (salary_max >= salary_min),
  description text not null,
  requirements text[] not null default '{}',
  benefits text[] not null default '{}',
  posted_date date not null default current_date,
  category text not null,
  applicants_count integer not null default 0 check (applicants_count >= 0),
  status text not null default 'aktif' check (status in ('aktif', 'draft', 'ditutup')),
  recruiter_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  service_title text not null,
  service_price integer not null check (service_price >= 0),
  requirements text,
  status text not null default 'Baru' check (status in ('Baru', 'Sedang Diproses', 'Selesai', 'Dibatalkan')),
  result_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  item_title text not null,
  category text not null check (category in ('service', 'premium')),
  price integer not null check (price >= 0),
  status text not null default 'Pending' check (status in ('Berhasil', 'Pending', 'Gagal')),
  payment_method text,
  va_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_name text not null,
  candidate_title text,
  candidate_email text not null,
  candidate_rating numeric(2,1) not null default 0,
  candidate_experience integer not null default 0,
  status text not null default 'Baru' check (status in ('Baru', 'Shortlisted', 'Interview', 'Diterima', 'Ditolak')),
  resume_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table if not exists public.ai_photo_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  style text not null,
  source_image_url text,
  result_image_url text,
  status text not null default 'generated' check (status in ('requested', 'generated', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or transaction_id is not null)
);

alter table public.services enable row level security;
alter table public.jobs enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.applications enable row level security;
alter table public.ai_photo_requests enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services"
  on public.services for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Anyone can read active jobs" on public.jobs;
create policy "Anyone can read active jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'aktif');

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own transactions" on public.transactions;
create policy "Users can create own transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own applications" on public.applications;
create policy "Users can read own applications"
  on public.applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own applications" on public.applications;
create policy "Users can create own applications"
  on public.applications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own ai photo requests" on public.ai_photo_requests;
create policy "Users can read own ai photo requests"
  on public.ai_photo_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own ai photo requests" on public.ai_photo_requests;
create policy "Users can create own ai photo requests"
  on public.ai_photo_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own reviews" on public.reviews;
create policy "Users can read own reviews"
  on public.reviews for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create reviews for own paid orders or transactions" on public.reviews;
create policy "Users can create reviews for own paid orders or transactions"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.orders o
        where o.id = reviews.order_id and o.user_id = auth.uid()
      )
      or exists (
        select 1 from public.transactions t
        where t.id = reviews.transaction_id and t.user_id = auth.uid() and t.status = 'Berhasil'
      )
    )
  );

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at before update on public.applications
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_photo_requests_updated_at on public.ai_photo_requests;
create trigger set_ai_photo_requests_updated_at before update on public.ai_photo_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.increment_job_applicants(job_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.jobs
  set applicants_count = applicants_count + 1,
      updated_at = now()
  where id = job_uuid;
$$;

insert into public.services (title, provider_name, provider_avatar, category, rating, reviews_count, price, duration, description, active)
values
  ('Review CV ATS Profesional', 'KarirHub Career Lab', 'KH', 'cv-review', 4.9, 142, 150000, '2 Hari Pengerjaan', 'Analisis struktur CV, kata kunci ATS, dan saran perbaikan untuk meningkatkan peluang lolos screening.', true),
  ('Mock Interview 1-on-1', 'KarirHub Interview Coach', 'IC', 'mock-interview', 4.8, 89, 350000, '60 Menit Sesi Langsung', 'Simulasi wawancara sesuai target posisi dengan feedback jawaban, komunikasi, dan strategi follow-up.', true),
  ('Career Coaching Roadmap', 'KarirHub Career Coach', 'CC', 'consulting', 5.0, 215, 500000, '90 Menit Konsultasi', 'Sesi pemetaan karir, prioritas skill, dan rencana aksi untuk fresh graduate maupun career switcher.', true),
  ('Optimasi LinkedIn Recruiter-Friendly', 'KarirHub Branding Specialist', 'LS', 'consulting', 4.7, 76, 220000, '3 Hari Pengerjaan', 'Perbaikan headline, about section, experience, dan keyword LinkedIn agar lebih mudah ditemukan recruiter.', true),
  ('Template CV ATS Siap Pakai', 'KarirHub Template Studio', 'TS', 'cv-review', 4.6, 58, 49000, 'Instan', 'Template CV ATS-friendly dalam format editable beserta contoh penulisan bullet achievement.', true)
on conflict do nothing;

insert into public.jobs (title, company, company_logo, location, type, salary_min, salary_max, description, requirements, benefits, posted_date, category, applicants_count, status)
values
  ('Frontend Developer Intern', 'PT Digital Talenta Indonesia', 'DT', 'Jakarta Selatan (Hybrid)', 'Internship', 2500000, 4500000, 'Membantu pengembangan antarmuka React untuk produk web Karir dan HR Tech.', array['Mahasiswa tingkat akhir atau fresh graduate', 'Memahami React, TypeScript, HTML, dan CSS', 'Memiliki portofolio web sederhana'], array['Mentoring engineer senior', 'Sertifikat magang', 'Hybrid working'], current_date - interval '5 days', 'Software Engineering', 0, 'aktif'),
  ('UI/UX Designer Junior', 'PT Kreatif Nusantara Solusindo', 'KN', 'Bandung / Remote', 'Remote', 6000000, 9000000, 'Membuat wireframe, prototype, dan UI untuk aplikasi mobile serta dashboard internal.', array['Menguasai Figma', 'Memahami user flow dan design system', 'Memiliki portofolio minimal 2 studi kasus'], array['Jam kerja fleksibel', 'Design review mingguan', 'Budget belajar'], current_date - interval '4 days', 'Design', 0, 'aktif'),
  ('Software Engineer Fresh Graduate', 'PT Teknologi Maju Bersama', 'TM', 'Jakarta Pusat', 'Full-time', 8000000, 12000000, 'Program entry-level untuk membangun layanan backend dan frontend dengan praktik engineering modern.', array['Fresh graduate S1 Informatika atau setara', 'Memahami salah satu bahasa pemrograman', 'Mau belajar cloud dan database'], array['Program onboarding 3 bulan', 'Asuransi kesehatan', 'Career path jelas'], current_date - interval '3 days', 'Software Engineering', 0, 'aktif'),
  ('Data Analyst Intern', 'PT Data Analitika Global', 'DA', 'Jakarta Barat', 'Internship', 2500000, 4000000, 'Mendukung analisis data, dashboard KPI, dan laporan insight untuk tim produk.', array['Memahami SQL dasar', 'Terbiasa Excel atau spreadsheet', 'Nilai tambah jika bisa Python'], array['Akses dataset nyata', 'Mentoring analyst senior', 'Surat rekomendasi'], current_date - interval '2 days', 'Data Science', 0, 'aktif'),
  ('Product Manager Associate', 'PT Produk Cerdas Nusantara', 'PC', 'Yogyakarta (Hybrid)', 'Full-time', 9000000, 14000000, 'Mendukung product discovery, penulisan PRD, koordinasi sprint, dan analisis metrik produk.', array['Memahami agile dan product lifecycle', 'Komunikasi lintas tim baik', 'Terbiasa membuat dokumen produk'], array['Coaching PM senior', 'Lingkungan produk digital', 'Hybrid working'], current_date - interval '1 day', 'Product Management', 0, 'aktif')
on conflict do nothing;
