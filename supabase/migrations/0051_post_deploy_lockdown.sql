-- Security hardening, part 2. Apply ONLY after the release containing the
-- server-side login lookup and enrollable_students() is live (the previous
-- version still needed both of these).

-- Mapped any username to its email for signed-out visitors (user/email
-- enumeration). Login now resolves it with the service role.
revoke execute on function public.resolve_login_identifier(text) from public, anon, authenticated;

-- Let every teacher read every active student's full profile (phone,
-- address…). Teachers now see their own classrooms' students
-- (profiles_select_teacher_students) and the enroll list via
-- enrollable_students() (names and emails only).
drop policy if exists profiles_select_teacher_all_students on public.profiles;
