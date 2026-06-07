alter table public.jobs
  add column if not exists recruiter_id uuid references public.user_profiles(id) on delete set null;

alter table public.jobs
  add column if not exists status text not null default 'aktif';

alter table public.applications
  add column if not exists application_status text not null default 'submitted';

alter table public.applications
  add column if not exists recruiter_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'applications_application_status_check'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint applications_application_status_check
      check (application_status in ('submitted', 'reviewed', 'interview', 'accepted', 'rejected'));
  end if;
end $$;

update public.applications
set application_status = case
  when status = 'Baru' then 'submitted'
  when status = 'Shortlisted' then 'reviewed'
  when status = 'Interview' then 'interview'
  when status = 'Diterima' then 'accepted'
  when status = 'Ditolak' then 'rejected'
  else application_status
end
where application_status is null or application_status = 'submitted';

create index if not exists jobs_recruiter_id_idx on public.jobs(recruiter_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_application_status_idx on public.applications(application_status);

drop policy if exists "Anyone can read active jobs" on public.jobs;
create policy "Anyone can read active jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'aktif');

drop policy if exists "Recruiters can read own jobs" on public.jobs;
create policy "Recruiters can read own jobs"
  on public.jobs for select
  to authenticated
  using (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'recruiter'
    )
  );

drop policy if exists "Recruiters can create own jobs" on public.jobs;
create policy "Recruiters can create own jobs"
  on public.jobs for insert
  to authenticated
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'recruiter'
    )
  );

drop policy if exists "Recruiters can update own jobs" on public.jobs;
create policy "Recruiters can update own jobs"
  on public.jobs for update
  to authenticated
  using (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'recruiter'
    )
  )
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'recruiter'
    )
  );

drop policy if exists "Recruiters can read applications for own jobs" on public.applications;
create policy "Recruiters can read applications for own jobs"
  on public.applications for select
  to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      join public.user_profiles p on p.id = auth.uid()
      where j.id = applications.job_id
        and j.recruiter_id = auth.uid()
        and p.role = 'recruiter'
    )
  );

drop policy if exists "Recruiters can update applications for own jobs" on public.applications;
create policy "Recruiters can update applications for own jobs"
  on public.applications for update
  to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      join public.user_profiles p on p.id = auth.uid()
      where j.id = applications.job_id
        and j.recruiter_id = auth.uid()
        and p.role = 'recruiter'
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      join public.user_profiles p on p.id = auth.uid()
      where j.id = applications.job_id
        and j.recruiter_id = auth.uid()
        and p.role = 'recruiter'
    )
  );
