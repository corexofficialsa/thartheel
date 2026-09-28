-- Homework rules, enforced in the database so they hold regardless of UI:
--   * the teacher picks which answer modes (text/audio/video) are accepted
--   * no submission (first or re-) after the due date
--   * no resubmission once the teacher has graded it
--   * the teacher can grant a specific student a one-time resubmission,
--     which lifts both blocks for that student's next save

alter table public.homework add column allowed_modes text[] not null default '{text,audio,video}'
  check (array_length(allowed_modes, 1) >= 1 and allowed_modes <@ array['text', 'audio', 'video']);

create table public.homework_resubmit_grants (
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (homework_id, student_id)
);

alter table public.homework_resubmit_grants enable row level security;

create policy resubmit_grants_select_own on public.homework_resubmit_grants for select
  using (student_id = auth.uid());
create policy resubmit_grants_teacher on public.homework_resubmit_grants for all
  using (exists (select 1 from public.homework h where h.id = homework_resubmit_grants.homework_id and h.teacher_id = auth.uid()))
  with check (exists (select 1 from public.homework h where h.id = homework_resubmit_grants.homework_id and h.teacher_id = auth.uid()));

create or replace function public.enforce_homework_submission_rules()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_homework public.homework;
  v_has_grant boolean;
begin
  -- An upsert that hits an existing row fires this BEFORE INSERT first and
  -- then BEFORE UPDATE on the conflict path; leave all checks (and consuming
  -- a grant) to the UPDATE pass so a grant isn't used up twice.
  if tg_op = 'INSERT' and exists (
    select 1 from public.homework_submissions
    where homework_id = new.homework_id and student_id = new.student_id
  ) then
    return new;
  end if;

  select * into v_homework from public.homework where id = new.homework_id;

  if (new.text_answer is not null and not ('text' = any(v_homework.allowed_modes)))
     or (new.audio_url is not null and not ('audio' = any(v_homework.allowed_modes)))
     or (new.video_url is not null and not ('video' = any(v_homework.allowed_modes))) then
    raise exception 'mode_not_allowed';
  end if;

  select exists (
    select 1 from public.homework_resubmit_grants
    where homework_id = new.homework_id and student_id = new.student_id
  ) into v_has_grant;

  if v_has_grant then
    delete from public.homework_resubmit_grants
      where homework_id = new.homework_id and student_id = new.student_id;
    return new;
  end if;

  if now() > v_homework.due_date then
    raise exception 'past_due';
  end if;

  if tg_op = 'UPDATE' and exists (select 1 from public.homework_grades where submission_id = new.id) then
    raise exception 'already_graded';
  end if;

  return new;
end;
$$;

create trigger homework_submission_rules
  before insert or update on public.homework_submissions
  for each row execute function public.enforce_homework_submission_rules();
