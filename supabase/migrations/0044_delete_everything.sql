-- Deleting teachers and user-created records.

-- 1. Teacher deletion must not fail or silently destroy student history.
--    granted_by was NOT NULL yet "on delete set null", so deleting any
--    teacher who ever granted a lock override errored out.
alter table public.homework_lock_overrides alter column granted_by drop not null;

--    Progress reports describe the student; keep them when their author
--    teacher is deleted instead of cascading them away.
alter table public.progress_reports alter column teacher_id drop not null;
alter table public.progress_reports drop constraint progress_reports_teacher_id_fkey;
alter table public.progress_reports
  add constraint progress_reports_teacher_id_fkey
  foreign key (teacher_id) references public.profiles(id) on delete set null;

-- 2. Support requests: admin/board can delete any; the submitter can
--    withdraw their own while it's still open.
create policy complaints_delete_staff on public.complaints for delete
  using (public.is_active_role('admin') or public.is_active_role('board'));
create policy complaints_delete_own_open on public.complaints for delete
  using (submitted_by = auth.uid() and status = 'open');

-- 3. Chat: senders can delete their own messages. Replica identity full
--    lets realtime tell open chats which message disappeared.
create policy messages_delete_own on public.messages for delete
  using (sender_id = auth.uid());
alter table public.messages replica identity full;

-- 4. Homework: a student can withdraw their own submission while it's
--    still ungraded and before the due date (the same window in which
--    they could resubmit).
create policy homework_submissions_delete_own on public.homework_submissions for delete
  using (
    student_id = auth.uid()
    and not exists (select 1 from public.homework_grades g where g.submission_id = homework_submissions.id)
    and exists (select 1 from public.homework h where h.id = homework_submissions.homework_id and h.due_date > now())
  );
