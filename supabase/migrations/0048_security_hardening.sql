-- Security hardening, part 1 (safe to apply while the previous app version
-- is still live). Part 2 (0049) locks down what the old version still uses.

-- 1. SECURITY DEFINER functions: nothing is meant for signed-out callers.
--    Each RPC below already checks auth.uid() / is_active_role() inside;
--    revoking anon is defense in depth. is_active_role and
--    is_teacher_of_classroom stay executable: RLS policies call them as the
--    querying role, and they only ever describe the caller.
revoke execute on function public.approve_profile(uuid) from public, anon;
revoke execute on function public.reject_profile(uuid, text) from public, anon;
revoke execute on function public.remove_profile(uuid, text) from public, anon;
revoke execute on function public.join_classroom(uuid) from public, anon;
revoke execute on function public.open_classroom_conversation(uuid) from public, anon;
revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.set_attendance(uuid, uuid, date, boolean) from public, anon;
revoke execute on function public.set_classroom_join_lock(uuid, boolean) from public, anon;
revoke execute on function public.submit_complaint(text, text) from public, anon;
revoke execute on function public.submission_withdrawable(uuid) from public, anon;
-- Returned student names and scores to anyone, signed in or not.
revoke execute on function public.top_student_leaderboard() from public, anon;
grant execute on function public.top_student_leaderboard() to authenticated;

-- Trigger functions are never called directly; triggers keep firing.
revoke execute on function public.enforce_homework_submission_rules() from public, anon, authenticated;
revoke execute on function public.notify_exam_result() from public, anon, authenticated;
revoke execute on function public.notify_exam_scheduled() from public, anon, authenticated;
revoke execute on function public.notify_homework_graded() from public, anon, authenticated;
revoke execute on function public.notify_homework_reopened() from public, anon, authenticated;
revoke execute on function public.notify_homework_submitted() from public, anon, authenticated;
revoke execute on function public.notify_new_homework() from public, anon, authenticated;
revoke execute on function public.notify_new_message() from public, anon, authenticated;
revoke execute on function public.notify_new_registration() from public, anon, authenticated;
revoke execute on function public.notify_registration_fee_paid() from public, anon, authenticated;
revoke execute on function public.notify_support_request() from public, anon, authenticated;

-- Unused by the app; let any signed-in user rewrite their own name/phone.
drop function if exists public.update_my_contact_info(text, text, text);

-- Mutable search_path on a function is a hijacking vector.
alter function public.chat_link_for(public.user_role) set search_path = public;

-- The login lookup moves server-side (service role) in this release; the
-- anon grant is revoked in 0049 once the new version is live.
grant execute on function public.resolve_login_identifier(text) to service_role;

-- 2. Students could read every teacher's full profile (phone, address…).
--    They only need their own classrooms' teachers (chat, classes).
drop policy profiles_select_student_teachers on public.profiles;
create policy profiles_select_student_teachers on public.profiles for select using (
  public.is_active_role('student') and role = 'teacher' and exists (
    select 1 from public.classrooms c
    join public.classroom_students cs on cs.classroom_id = c.id
    where c.teacher_id = profiles.id and cs.student_id = auth.uid()
  )
);

-- 3. Teachers' "enroll a student" list: names and emails only, instead of
--    read access to every student's full profile (that broad policy is
--    dropped in 0049, once the new version uses this function).
create or replace function public.enrollable_students()
returns table (id uuid, name text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.email from public.profiles p
  where p.role = 'student' and p.status = 'active'
    and (public.is_active_role('teacher') or public.is_active_role('admin') or public.is_active_role('board'))
  order by p.name;
$$;
revoke execute on function public.enrollable_students() from public, anon;
grant execute on function public.enrollable_students() to authenticated;

-- 4. Rate limiting for logins, registrations, password resets, chat and
--    support requests. Server-only: no policies, no client grants.
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  hit_at timestamptz not null default now()
);
create index rate_limit_hits_key_time on public.rate_limit_hits (key, hit_at);
alter table public.rate_limit_hits enable row level security;

-- Records one attempt for p_key and returns false once p_max attempts fall
-- inside the last p_window_seconds. The advisory lock makes concurrent
-- requests for the same key count exactly.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.rate_limit_hits
    where key = p_key and hit_at < now() - make_interval(secs => p_window_seconds);
  if random() < 0.02 then
    delete from public.rate_limit_hits where hit_at < now() - interval '1 day';
  end if;
  select count(*) into v_count from public.rate_limit_hits where key = p_key;
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- 5. Upload size limits per bucket (matching what the app accepts). Only
--    sizes: browsers label recordings with codec parameters
--    ("audio/webm;codecs=opus"), so a strict MIME allowlist could reject
--    legitimate uploads. 50 MB is the plan's global maximum.
update storage.buckets set file_size_limit = 10485760 where id in ('registration-recitations', 'admission-documents');
update storage.buckets set file_size_limit = 52428800 where id = 'homework-submissions';
update storage.buckets set file_size_limit = 26214400 where id in ('teaching-notes', 'halaqa-visit-reports');

-- 6. Homework recordings: any teacher could read every student's files.
--    Limit to teachers of a classroom the student is enrolled in, plus admin.
drop policy homework_submissions_teacher_read on storage.objects;
create policy homework_submissions_teacher_read on storage.objects for select using (
  bucket_id = 'homework-submissions' and (
    public.is_active_role('admin') or (
      public.is_active_role('teacher') and exists (
        select 1 from public.classroom_students cs
        join public.classrooms c on c.id = cs.classroom_id
        where c.teacher_id = auth.uid() and cs.student_id::text = (storage.foldername(name))[1]
      )
    )
  )
);
