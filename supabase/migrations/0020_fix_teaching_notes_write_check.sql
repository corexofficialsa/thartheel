-- teaching_notes_teacher_write's WITH CHECK only verified `uploaded_by =
-- auth.uid()`, never re-asserting the role that USING checks — unlike every
-- other "for all" policy in 0009_rls_policies.sql, which all re-assert
-- role/ownership in both clauses. Since WITH CHECK is what actually governs
-- INSERT (USING doesn't apply to a row that doesn't exist yet), this meant
-- *any* authenticated user — not just teachers/admins — could insert a row
-- into teaching_notes, as long as they tagged themselves as the uploader.
-- The actual file bytes were still safe (teaching_notes_teacher_write on
-- storage.objects already required teacher/admin), but the metadata row
-- (title, file_url, level_id) was not.
drop policy teaching_notes_teacher_write on public.teaching_notes;
create policy teaching_notes_teacher_write on public.teaching_notes for all
  using (public.is_active_role('teacher') or public.is_active_role('admin'))
  with check ((public.is_active_role('teacher') or public.is_active_role('admin')) and uploaded_by = auth.uid());
