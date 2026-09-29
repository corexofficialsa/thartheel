-- 0044's withdraw policy read homework_grades directly, whose own RLS reads
-- homework_submissions back — Postgres rejected every delete with "infinite
-- recursion detected in policy". Do the checks in a security-definer helper
-- that bypasses those nested policies.
create or replace function public.submission_withdrawable(p_submission_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    not exists (select 1 from public.homework_grades g where g.submission_id = p_submission_id)
    and exists (
      select 1 from public.homework_submissions s join public.homework h on h.id = s.homework_id
      where s.id = p_submission_id and h.due_date > now()
    );
$$;

revoke execute on function public.submission_withdrawable(uuid) from public, anon;
grant execute on function public.submission_withdrawable(uuid) to authenticated;

drop policy homework_submissions_delete_own on public.homework_submissions;
create policy homework_submissions_delete_own on public.homework_submissions for delete
  using (student_id = auth.uid() and public.submission_withdrawable(id));
