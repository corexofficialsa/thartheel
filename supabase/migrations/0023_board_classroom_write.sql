-- Board previously had read-only access to classrooms/classroom_students
-- (classrooms_select_admin_board, classroom_students_select_admin_board).
-- Board now also assigns approved teachers/students to classrooms, so it
-- needs the same write access admin already has.

create policy classrooms_board_write on public.classrooms for all
  using (public.is_active_role('board')) with check (public.is_active_role('board'));

create policy classroom_students_board_write on public.classroom_students for all
  using (public.is_active_role('board')) with check (public.is_active_role('board'));
