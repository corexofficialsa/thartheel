-- Only admin/board create classrooms now (classrooms_admin_write /
-- classrooms_board_write already cover that). classrooms_teacher_write was
-- "for all", which meant a teacher could still INSERT/DELETE a classroom by
-- calling the API directly even after the UI form was removed. Replaced
-- with update-only: a teacher keeps full control over their own classrooms
-- (meeting link, join lock, roster) but can no longer create or delete one.
drop policy classrooms_teacher_write on public.classrooms;

create policy classrooms_teacher_update_own on public.classrooms for update
  using (teacher_id = auth.uid() and public.is_active_role('teacher'))
  with check (teacher_id = auth.uid() and public.is_active_role('teacher'));
