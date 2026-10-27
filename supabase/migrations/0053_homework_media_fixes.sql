-- 1. Teachers couldn't open any student's homework recording. The 0048
--    policy wrote (storage.foldername(name)) inside a subquery that joins
--    public.classrooms — which has its own `name` column — so `name`
--    resolved to the classroom's name, never the file path, and the check
--    always failed (admins still passed via their own branch). Qualify it.
drop policy homework_submissions_teacher_read on storage.objects;
create policy homework_submissions_teacher_read on storage.objects for select using (
  bucket_id = 'homework-submissions' and (
    public.is_active_role('admin') or (
      public.is_active_role('teacher') and exists (
        select 1 from public.classroom_students cs
        join public.classrooms c on c.id = cs.classroom_id
        where c.teacher_id = auth.uid() and cs.student_id::text = (storage.foldername(objects.name))[1]
      )
    )
  )
);

-- 2. Teachers can attach an image to a homework (homework.attachment_url
--    holds the object path). Path convention: {teacher_id}/{random}.{ext}.
insert into storage.buckets (id, name, public, file_size_limit)
values ('homework-attachments', 'homework-attachments', false, 8388608)
on conflict (id) do nothing;

create policy homework_attachments_teacher_rw on storage.objects for all
  using (
    bucket_id = 'homework-attachments' and public.is_active_role('teacher')
    and (storage.foldername(objects.name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'homework-attachments' and public.is_active_role('teacher')
    and (storage.foldername(objects.name))[1] = auth.uid()::text
  );

create policy homework_attachments_read on storage.objects for select using (
  bucket_id = 'homework-attachments' and (
    public.is_active_role('admin') or public.is_active_role('board') or exists (
      select 1 from public.homework h
      join public.classroom_students cs on cs.classroom_id = h.classroom_id
      where h.attachment_url = objects.name and cs.student_id = auth.uid()
    ) or exists (
      -- the classroom's current teacher, if it was reassigned since posting
      select 1 from public.homework h
      join public.classrooms c on c.id = h.classroom_id
      where h.attachment_url = objects.name and c.teacher_id = auth.uid()
    )
  )
);

-- 3. Reason a teacher gives when letting a student into class despite
--    missing homework (homework_lock_overrides) — keep it bounded like the
--    other free-text columns (0049).
alter table public.homework_lock_overrides
  add constraint homework_lock_overrides_reason_len check (char_length(reason) <= 500);
