-- Notifications for every portal, not just students and teachers:
--   teacher  <- a student submits / resubmits homework
--   student  <- a new exam is scheduled, an exam result is published,
--               their support request is resolved
--   admin    <- new registrations, finance confirming a registration fee,
--               new support requests
--   board    <- new support requests
--   finance  <- new student registrations awaiting the registration fee
-- As in 0038, rows come from triggers so no code path can forget to notify.

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('message', 'homework', 'graded', 'reopened', 'submission', 'exam', 'result', 'support', 'payment', 'registration')
);

-- Fan a notification out to every active member of the given roles, with a
-- per-role link (roles without a link entry get null).
create or replace function public.notify_roles(
  p_roles public.user_role[],
  p_kind text,
  p_title text,
  p_body text,
  p_links jsonb,
  p_actor uuid
)
returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  select p.id, p_kind, p_title, p_body, p_links ->> p.role::text, p_actor
  from public.profiles p
  where p.role = any (p_roles) and p.status = 'active' and p.id is distinct from p_actor;
$$;

-- Internal helper for the triggers below — never callable through the API.
revoke execute on function public.notify_roles(public.user_role[], text, text, text, jsonb, uuid) from public, anon, authenticated;

-- Teacher: "<student> submitted homework".
create or replace function public.notify_homework_submitted()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_student text;
  v_title text;
  v_teacher uuid;
begin
  select name into v_student from public.profiles where id = new.student_id;
  select h.title, h.teacher_id into v_title, v_teacher from public.homework h where h.id = new.homework_id;
  if v_teacher is null then
    return new;
  end if;
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  values (
    v_teacher,
    'submission',
    coalesce(v_student, 'A student') || case when tg_op = 'UPDATE' then ' resubmitted homework' else ' submitted homework' end,
    v_title,
    '/teacher/homework',
    new.student_id
  );
  return new;
end;
$$;

create trigger homework_submissions_notify
  after insert or update of text_answer, video_url, audio_url on public.homework_submissions
  for each row execute function public.notify_homework_submitted();

-- Students: a new exam or test is scheduled for their classroom.
create or replace function public.notify_exam_scheduled()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body, link)
  select cs.student_id,
         'exam',
         'New ' || lower(new.exam_type) || ': ' || new.title,
         'Scheduled for ' || to_char(new.scheduled_at at time zone 'Asia/Riyadh', 'DD Mon YYYY, HH24:MI'),
         '/student/progress'
  from public.classroom_students cs
  where cs.classroom_id = new.classroom_id;
  return new;
end;
$$;

create trigger exams_notify after insert on public.exams
  for each row execute function public.notify_exam_scheduled();

-- Student: their exam result is published (or corrected).
create or replace function public.notify_exam_result()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  if tg_op = 'UPDATE' and new.marks is not distinct from old.marks then
    return new;
  end if;
  select title into v_title from public.exams where id = new.exam_id;
  insert into public.notifications (user_id, kind, title, body, link)
  values (
    new.student_id,
    'result',
    'Exam result: ' || coalesce(v_title, 'exam'),
    'Marks: ' || trim(to_char(new.marks, 'FM999999990.##')),
    '/student/progress'
  );
  return new;
end;
$$;

create trigger exam_results_notify after insert or update of marks on public.exam_results
  for each row execute function public.notify_exam_result();

-- Admin + board: a new support request. Submitter: it was resolved.
create or replace function public.notify_support_request()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_roles(
      array['admin', 'board']::public.user_role[],
      'support',
      'Support request from ' || new.submitted_by_name || ' (' || new.submitted_by_role::text || ')',
      new.subject,
      jsonb_build_object('admin', '/admin/messages', 'board', '/board/messages'),
      new.submitted_by
    );
  elsif new.status = 'resolved' and old.status is distinct from 'resolved' and new.submitted_by is not null then
    insert into public.notifications (user_id, kind, title, body, link, actor_id)
    values (
      new.submitted_by,
      'support',
      'Support request resolved: ' || new.subject,
      new.resolution_note,
      '/' || new.submitted_by_role::text || '/chat',
      new.resolved_by
    );
  end if;
  return new;
end;
$$;

create trigger complaints_notify after insert or update of status on public.complaints
  for each row execute function public.notify_support_request();

-- Admin: finance confirmed a student's registration fee — ready to approve.
create or replace function public.notify_registration_fee_paid()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if new.period <> 'registration' or new.status <> 'paid' or old.status = 'paid' then
    return new;
  end if;
  select name into v_name from public.profiles where id = new.student_id;
  perform public.notify_roles(
    array['admin']::public.user_role[],
    'payment',
    'Registration fee confirmed: ' || coalesce(v_name, 'student'),
    'Finance confirmed the payment — ready for your approval.',
    jsonb_build_object('admin', '/admin/registrations/student'),
    null
  );
  return new;
end;
$$;

create trigger fee_invoices_registration_paid_notify after update of status on public.fee_invoices
  for each row execute function public.notify_registration_fee_paid();

-- Admin (+ finance for students): a new registration came in.
create or replace function public.notify_new_registration()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'pending' or new.role not in ('student', 'teacher') then
    return new;
  end if;
  perform public.notify_roles(
    array['admin']::public.user_role[],
    'registration',
    'New ' || new.role::text || ' registration: ' || new.name,
    case when new.role = 'student' then 'Waiting for finance to confirm the registration fee.' else 'Waiting for your review.' end,
    jsonb_build_object('admin', '/admin/registrations/' || new.role::text),
    null
  );
  if new.role = 'student' then
    perform public.notify_roles(
      array['finance']::public.user_role[],
      'registration',
      'New student registration: ' || new.name,
      'Confirm the registration fee once it is paid.',
      jsonb_build_object('finance', '/finance/ledger'),
      null
    );
  end if;
  return new;
end;
$$;

create trigger profiles_registration_notify after insert on public.profiles
  for each row execute function public.notify_new_registration();
