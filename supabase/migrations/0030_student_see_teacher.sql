-- A student could never actually see a teacher's profile row — only the
-- reverse (profiles_select_teacher_all_students) existed. That silently
-- broke the teacher's name everywhere a student's client reads it: the
-- "Message your teacher" chat contact, and now the sender name on messages
-- in a classroom's group chat (showed "Unknown"). Mirrors the existing
-- teacher-sees-students grant.
create policy profiles_select_student_teachers on public.profiles for select
  using (public.is_active_role('student') and role = 'teacher');
