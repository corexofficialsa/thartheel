-- Teacher<->board chat (conversation_type 'teacher_board') has existed since
-- the schema was first created, but there was never a matching RLS policy
-- letting a teacher actually see board profiles — only the reverse
-- (profiles_select_board_teachers). The board contact list on the teacher
-- chat page was silently empty because of this, not a bug in the chat UI.
create policy profiles_select_teacher_board on public.profiles for select
  using (public.is_active_role('teacher') and role = 'board');
