-- profiles_select_teacher_students (0009) only lets a teacher see a student
-- once that student is already enrolled in one of their classrooms — a
-- catch-22 that makes it impossible to ever enroll a *new* student, since
-- the "Add a student" picker on the classrooms page has nothing to show.
-- Mirrors the existing profiles_select_board_teachers policy (board sees
-- every teacher, unscoped) so teachers can see the active student roster to
-- pick from; the enrollment write itself stays gated to the teacher's own
-- classroom via classroom_students_teacher_write.
create policy profiles_select_teacher_all_students on public.profiles for select
  using (public.is_active_role('teacher') and role = 'student' and status = 'active');
