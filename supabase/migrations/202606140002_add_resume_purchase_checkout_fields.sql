alter table public.resume_purchases
  add column if not exists package_id text not null default 'pdf-html' check (package_id in ('pdf', 'pdf-html', 'all')),
  add column if not exists formats text[] not null default array['pdf','html']::text[],
  add column if not exists admin_fee integer not null default 0 check (admin_fee >= 0),
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists expires_at timestamptz;

create index if not exists resume_purchases_status_idx on public.resume_purchases(status);
