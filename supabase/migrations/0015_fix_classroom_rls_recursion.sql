-- classrooms_select_enrolled_student (on classrooms) subqueries classroom_students,
-- and classroom_students_select_teacher/_teacher_write (on classroom_students)
-- subqueried classrooms right back — a genuine circular RLS dependency that
-- Postgres detects at plan time ("infinite recursion detected in policy for
-- relation classroom_students") for *any* query that pulls in both tables,
-- which happens on every profiles select via profiles_select_teacher_students.
--
-- Fix: give classroom_students' teacher-facing policies a security definer
-- helper (same pattern as is_active_role() in 0008_functions.sql) so checking
-- "is this classroom mine" no longer re-triggers classrooms' own RLS.

create or replace function public.is_teacher_of_classroom(p_classroom_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classrooms
    where id = p_classroom_id and teacher_id = auth.uid()
  );
$$;

grant execute on function public.is_teacher_of_classroom(uuid) to authenticated;

drop policy classroom_students_select_teacher on public.classroom_students;
create policy classroom_students_select_teacher on public.classroom_students for select
  using (public.is_teacher_of_classroom(classroom_id));

drop policy classroom_students_teacher_write on public.classroom_students;
create policy classroom_students_teacher_write on public.classroom_students for all
  using (public.is_teacher_of_classroom(classroom_id))
  with check (public.is_teacher_of_classroom(classroom_id));
