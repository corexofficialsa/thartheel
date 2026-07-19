-- all buckets are private; every read happens through a short-lived signed
-- URL generated server-side after the same authorization check as the row
-- (see lib/supabase/storage.ts), never a public bucket URL.
insert into storage.buckets (id, name, public)
values
  ('admission-documents', 'admission-documents', false),
  ('homework-submissions', 'homework-submissions', false),
  ('teaching-notes', 'teaching-notes', false),
  ('halaqa-visit-reports', 'halaqa-visit-reports', false)
on conflict (id) do nothing;

-- path convention: {bucket}/{owner_profile_id}/... so storage policies can
-- scope by path prefix as a second layer under the signed-URL gate.

create policy admission_documents_owner_rw on storage.objects for all
  using (bucket_id = 'admission-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'admission-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy admission_documents_admin_read on storage.objects for select
  using (bucket_id = 'admission-documents' and public.is_active_role('admin'));

create policy homework_submissions_student_rw on storage.objects for all
  using (bucket_id = 'homework-submissions' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'homework-submissions' and (storage.foldername(name))[1] = auth.uid()::text);

create policy homework_submissions_teacher_read on storage.objects for select
  using (bucket_id = 'homework-submissions' and public.is_active_role('teacher'));

create policy teaching_notes_read_all on storage.objects for select
  using (bucket_id = 'teaching-notes' and auth.role() = 'authenticated');

create policy teaching_notes_teacher_write on storage.objects for insert
  with check (bucket_id = 'teaching-notes' and (public.is_active_role('teacher') or public.is_active_role('admin')));

create policy halaqa_reports_admin_rw on storage.objects for all
  using (bucket_id = 'halaqa-visit-reports' and public.is_active_role('admin'))
  with check (bucket_id = 'halaqa-visit-reports' and public.is_active_role('admin'));

create policy halaqa_reports_board_read on storage.objects for select
  using (bucket_id = 'halaqa-visit-reports' and public.is_active_role('board'));
