create type public.complaint_status as enum ('open', 'in_review', 'resolved');

-- submitted_by_name/role are snapshotted at submission time (not looked up
-- live via a join) so a complaint stays legible even if the submitter is
-- later removed from the academy — the same reasoning as the on delete set
-- null below, instead of cascade.
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_by_name text not null,
  submitted_by_role public.user_role not null check (submitted_by_role in ('student', 'teacher')),
  subject text not null,
  description text not null,
  status public.complaint_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

-- Submitters can track the status of their own complaints.
create policy complaints_select_own on public.complaints for select
  using (submitted_by = auth.uid());

-- Admin and board handle every complaint (same oversight level board already
-- has elsewhere: removing teachers/students, approving visit reports).
create policy complaints_select_staff on public.complaints for select
  using (public.is_active_role('admin') or public.is_active_role('board'));

create policy complaints_update_staff on public.complaints for update
  using (public.is_active_role('admin') or public.is_active_role('board'))
  with check (public.is_active_role('admin') or public.is_active_role('board'));

-- No insert policy: rows are only ever created via submit_complaint() below,
-- the same "gate creation through a security-definer function" pattern
-- start_conversation() uses, so submitted_by_name/role can't be spoofed by a
-- client posting directly to the table with a mismatched name.
create or replace function public.submit_complaint(p_subject text, p_description text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_name text;
  v_id uuid;
begin
  select role, name into v_role, v_name from public.profiles where id = v_uid and status = 'active';

  if v_role is null or v_role not in ('student', 'teacher') then
    raise exception 'only students and teachers can submit complaints';
  end if;

  if trim(coalesce(p_subject, '')) = '' or trim(coalesce(p_description, '')) = '' then
    raise exception 'subject and description are required';
  end if;

  insert into public.complaints (submitted_by, submitted_by_name, submitted_by_role, subject, description)
  values (v_uid, v_name, v_role, trim(p_subject), trim(p_description))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_complaint(text, text) to authenticated;
