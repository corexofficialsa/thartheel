-- Inspection reports admins file after visiting a batch/classroom in person;
-- board gets read-only visibility per the Module A spec.
create table public.halaqa_visit_reports (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references public.classrooms(id) on delete set null,
  title text not null,
  notes text,
  file_url text,
  visited_at date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.halaqa_visit_reports enable row level security;

create policy halaqa_visit_reports_select on public.halaqa_visit_reports for select
  using (public.is_active_role('admin') or public.is_active_role('board'));

create policy halaqa_visit_reports_admin_write on public.halaqa_visit_reports for all
  using (public.is_active_role('admin'))
  with check (public.is_active_role('admin') and created_by = auth.uid());
