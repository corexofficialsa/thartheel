-- Admin/board student-progress views show each student's average homework
-- grade; homework_grades only had student/teacher read policies.
create policy grades_select_admin_board on public.homework_grades for select
  using (public.is_active_role('admin') or public.is_active_role('board'));
