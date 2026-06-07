alter table public.services
  add column if not exists seller_id uuid references public.user_profiles(id) on delete set null;

alter table public.services
  add column if not exists status text not null default 'active';

alter table public.orders
  add column if not exists order_status text not null default 'pending';

alter table public.orders
  add column if not exists seller_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'services_status_check'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_status_check check (status in ('active', 'inactive'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_order_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_order_status_check check (order_status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled'));
  end if;
end $$;

update public.services
set status = case when active then 'active' else 'inactive' end
where status is null or status not in ('active', 'inactive');

update public.orders
set order_status = case
  when status = 'Baru' then 'pending'
  when status = 'Sedang Diproses' then 'in_progress'
  when status = 'Selesai' then 'completed'
  when status = 'Dibatalkan' then 'cancelled'
  else order_status
end
where order_status is null or order_status = 'pending';

create index if not exists services_seller_id_idx on public.services(seller_id);
create index if not exists services_status_idx on public.services(status);
create index if not exists orders_service_id_idx on public.orders(service_id);
create index if not exists orders_order_status_idx on public.orders(order_status);

drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services"
  on public.services for select
  to anon, authenticated
  using (active = true and status = 'active');

drop policy if exists "Sellers can read own services" on public.services;
create policy "Sellers can read own services"
  on public.services for select
  to authenticated
  using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can create own services" on public.services;
create policy "Sellers can create own services"
  on public.services for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can update own services" on public.services;
create policy "Sellers can update own services"
  on public.services for update
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

drop policy if exists "Sellers can read orders for own services" on public.orders;
create policy "Sellers can read orders for own services"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from public.services s
      join public.user_profiles p on p.id = auth.uid()
      where s.id = orders.service_id
        and s.seller_id = auth.uid()
        and p.role = 'seller'
    )
  );

drop policy if exists "Sellers can update orders for own services" on public.orders;
create policy "Sellers can update orders for own services"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1
      from public.services s
      join public.user_profiles p on p.id = auth.uid()
      where s.id = orders.service_id
        and s.seller_id = auth.uid()
        and p.role = 'seller'
    )
  )
  with check (
    exists (
      select 1
      from public.services s
      join public.user_profiles p on p.id = auth.uid()
      where s.id = orders.service_id
        and s.seller_id = auth.uid()
        and p.role = 'seller'
    )
  );
