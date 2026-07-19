-- ============================================================
-- Enable RLS everywhere. Trust-sensitive writes (attendance,
-- approvals, grades, chat participants) have NO client-facing
-- insert/update policy at all — they only happen through the
-- SECURITY DEFINER RPCs in 0008_functions.sql, which run as the
-- migration owner and bypass RLS on the tables they touch.
-- ============================================================

alter table public.centers enable row level security;
alter table public.levels enable row level security;
alter table public.batches enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.admission_documents enable row level security;
alter table public.campaign_leads enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.attendance enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.homework_grades enable row level security;
alter table public.homework_lock_overrides enable row level security;
alter table public.syllabus_tracks enable row level security;
alter table public.student_milestones enable row level security;
alter table public.progress_reports enable row level security;
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;
alter table public.teaching_notes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.finance_records enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.caution_deposits enable row level security;
alter table public.budgets enable row level security;
alter table public.salary_allocations enable row level security;
alter table public.notifications_log enable row level security;

-- ---------- reference data (public read, admin write) ----------

create policy centers_select_all on public.centers for select using (auth.role() = 'authenticated');
create policy centers_admin_write on public.centers for all using (public.is_active_role('admin')) with check (public.is_active_role('admin'));

create policy levels_select_all on public.levels for select using (true);
create policy levels_admin_write on public.levels for all using (public.is_active_role('admin')) with check (public.is_active_role('admin'));

create policy batches_select_all on public.batches for select using (auth.role() = 'authenticated');
create policy batches_admin_write on public.batches for all using (public.is_active_role('admin')) with check (public.is_active_role('admin'));

-- ---------- profiles ----------
-- no insert/update policy: registration goes through the service-role
-- Server Action; role/status/approval changes go through the RPCs above.

create policy profiles_select_self on public.profiles for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select using (public.is_active_role('admin'));
create policy profiles_select_board_teachers on public.profiles for select
  using (public.is_active_role('board') and role = 'teacher');
create policy profiles_select_teacher_students on public.profiles for select
  using (
    public.is_active_role('teacher') and role = 'student'
    and exists (
      select 1 from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );

-- ---------- audit log: admin/board read-only ----------

create policy audit_log_select on public.audit_log for select
  using (public.is_active_role('admin') or public.is_active_role('board'));

-- ---------- admission documents ----------

create policy admission_docs_select_own on public.admission_documents for select using (profile_id = auth.uid());
create policy admission_docs_select_admin on public.admission_documents for select using (public.is_active_role('admin'));
create policy admission_docs_insert_own on public.admission_documents for insert with check (profile_id = auth.uid());

-- ---------- campaign leads: admin only ----------

create policy campaign_leads_admin on public.campaign_leads for all
  using (public.is_active_role('admin')) with check (public.is_active_role('admin'));

-- ---------- classrooms ----------

create policy classrooms_select_enrolled_student on public.classrooms for select
  using (exists (select 1 from public.classroom_students cs where cs.classroom_id = classrooms.id and cs.student_id = auth.uid()));
create policy classrooms_select_own_teacher on public.classrooms for select using (teacher_id = auth.uid());
create policy classrooms_select_admin_board on public.classrooms for select
  using (public.is_active_role('admin') or public.is_active_role('board'));
create policy classrooms_teacher_write on public.classrooms for all
  using (teacher_id = auth.uid() and public.is_active_role('teacher'))
  with check (teacher_id = auth.uid() and public.is_active_role('teacher'));
create policy classrooms_admin_write on public.classrooms for all
  using (public.is_active_role('admin')) with check (public.is_active_role('admin'));

-- ---------- classroom_students ----------

create policy classroom_students_select_own on public.classroom_students for select using (student_id = auth.uid());
create policy classroom_students_select_teacher on public.classroom_students for select
  using (exists (select 1 from public.classrooms c where c.id = classroom_students.classroom_id and c.teacher_id = auth.uid()));
create policy classroom_students_select_admin_board on public.classroom_students for select
  using (public.is_active_role('admin') or public.is_active_role('board'));
create policy classroom_students_admin_write on public.classroom_students for all
  using (public.is_active_role('admin')) with check (public.is_active_role('admin'));
create policy classroom_students_teacher_write on public.classroom_students for all
  using (exists (select 1 from public.classrooms c where c.id = classroom_students.classroom_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_students.classroom_id and c.teacher_id = auth.uid()));

-- ---------- attendance: select only, all writes via join_classroom() ----------

create policy attendance_select_own on public.attendance for select using (user_id = auth.uid());
create policy attendance_select_teacher on public.attendance for select
  using (exists (select 1 from public.classrooms c where c.id = attendance.classroom_id and c.teacher_id = auth.uid()));
create policy attendance_select_admin_board on public.attendance for select
  using (public.is_active_role('admin') or public.is_active_role('board'));

-- ---------- homework ----------

create policy homework_select_enrolled on public.homework for select
  using (exists (select 1 from public.classroom_students cs where cs.classroom_id = homework.classroom_id and cs.student_id = auth.uid()));
create policy homework_select_teacher on public.homework for select using (teacher_id = auth.uid());
create policy homework_select_admin on public.homework for select using (public.is_active_role('admin'));
create policy homework_teacher_write on public.homework for all
  using (teacher_id = auth.uid() and public.is_active_role('teacher'))
  with check (teacher_id = auth.uid() and public.is_active_role('teacher'));

-- ---------- homework submissions (student-owned content only) ----------

create policy submissions_select_own on public.homework_submissions for select using (student_id = auth.uid());
create policy submissions_select_teacher on public.homework_submissions for select
  using (exists (
    select 1 from public.homework h where h.id = homework_submissions.homework_id and h.teacher_id = auth.uid()
  ));
create policy submissions_select_admin on public.homework_submissions for select using (public.is_active_role('admin'));
create policy submissions_insert_own on public.homework_submissions for insert
  with check (student_id = auth.uid() and public.is_active_role('student'));
create policy submissions_update_own on public.homework_submissions for update
  using (student_id = auth.uid() and public.is_active_role('student'))
  with check (student_id = auth.uid());

-- ---------- homework grades (teacher-owned; students read only) ----------

create policy grades_select_student on public.homework_grades for select
  using (exists (select 1 from public.homework_submissions s where s.id = homework_grades.submission_id and s.student_id = auth.uid()));
create policy grades_select_teacher on public.homework_grades for select
  using (exists (
    select 1 from public.homework_submissions s join public.homework h on h.id = s.homework_id
    where s.id = homework_grades.submission_id and h.teacher_id = auth.uid()
  ));
create policy grades_teacher_write on public.homework_grades for all
  using (exists (
    select 1 from public.homework_submissions s join public.homework h on h.id = s.homework_id
    where s.id = homework_grades.submission_id and h.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.homework_submissions s join public.homework h on h.id = s.homework_id
    where s.id = homework_grades.submission_id and h.teacher_id = auth.uid()
  ));

-- ---------- homework lock overrides (teacher/admin grant, all can read own) ----------

create policy lock_overrides_select_own on public.homework_lock_overrides for select using (student_id = auth.uid());
create policy lock_overrides_select_teacher on public.homework_lock_overrides for select
  using (exists (select 1 from public.classrooms c where c.id = homework_lock_overrides.classroom_id and c.teacher_id = auth.uid()));
create policy lock_overrides_teacher_insert on public.homework_lock_overrides for insert
  with check (
    granted_by = auth.uid()
    and exists (select 1 from public.classrooms c where c.id = homework_lock_overrides.classroom_id and c.teacher_id = auth.uid())
  );
create policy lock_overrides_admin_insert on public.homework_lock_overrides for insert
  with check (granted_by = auth.uid() and public.is_active_role('admin'));

-- ---------- academics ----------

create policy syllabus_tracks_select_all on public.syllabus_tracks for select using (true);

create policy milestones_select_own on public.student_milestones for select using (student_id = auth.uid());
create policy milestones_select_teacher on public.student_milestones for select using (public.is_active_role('teacher'));
create policy milestones_select_admin_board on public.student_milestones for select
  using (public.is_active_role('admin') or public.is_active_role('board'));
create policy milestones_teacher_write on public.student_milestones for all
  using (public.is_active_role('teacher')) with check (public.is_active_role('teacher') and recorded_by = auth.uid());

create policy progress_reports_select_own on public.progress_reports for select using (student_id = auth.uid());
create policy progress_reports_select_teacher on public.progress_reports for select using (teacher_id = auth.uid());
create policy progress_reports_select_admin_board on public.progress_reports for select
  using (public.is_active_role('admin') or public.is_active_role('board'));
create policy progress_reports_teacher_write on public.progress_reports for all
  using (teacher_id = auth.uid() and public.is_active_role('teacher'))
  with check (teacher_id = auth.uid() and public.is_active_role('teacher'));

create policy exams_select_enrolled on public.exams for select
  using (exists (select 1 from public.classroom_students cs where cs.classroom_id = exams.classroom_id and cs.student_id = auth.uid()));
create policy exams_select_teacher on public.exams for select
  using (exists (select 1 from public.classrooms c where c.id = exams.classroom_id and c.teacher_id = auth.uid()));
create policy exams_select_admin on public.exams for select using (public.is_active_role('admin'));
create policy exams_teacher_write on public.exams for all
  using (exists (select 1 from public.classrooms c where c.id = exams.classroom_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = exams.classroom_id and c.teacher_id = auth.uid()));

create policy exam_results_select_own on public.exam_results for select using (student_id = auth.uid() and published_at is not null);
create policy exam_results_select_teacher on public.exam_results for select
  using (exists (select 1 from public.exams e join public.classrooms c on c.id = e.classroom_id where e.id = exam_results.exam_id and c.teacher_id = auth.uid()));
create policy exam_results_select_admin on public.exam_results for select using (public.is_active_role('admin'));
create policy exam_results_teacher_write on public.exam_results for all
  using (exists (select 1 from public.exams e join public.classrooms c on c.id = e.classroom_id where e.id = exam_results.exam_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.exams e join public.classrooms c on c.id = e.classroom_id where e.id = exam_results.exam_id and c.teacher_id = auth.uid()));

create policy teaching_notes_select_all on public.teaching_notes for select using (auth.role() = 'authenticated');
create policy teaching_notes_teacher_write on public.teaching_notes for all
  using (public.is_active_role('teacher') or public.is_active_role('admin'))
  with check (uploaded_by = auth.uid());

-- ---------- chat ----------

create policy conversations_select_participant on public.conversations for select
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversations.id and cp.user_id = auth.uid()));

create policy participants_select_own on public.conversation_participants for select using (user_id = auth.uid());

create policy messages_select_participant on public.messages for select
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()));
create policy messages_insert_participant on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid())
  );

-- ---------- finance ----------

create policy finance_records_select on public.finance_records for select
  using (public.is_active_role('finance') or public.is_active_role('board') or public.is_active_role('admin'));
create policy finance_records_write on public.finance_records for all
  using (public.is_active_role('finance')) with check (public.is_active_role('finance') and created_by = auth.uid());

create policy fee_invoices_select_own on public.fee_invoices for select using (student_id = auth.uid());
create policy fee_invoices_select_staff on public.fee_invoices for select
  using (public.is_active_role('finance') or public.is_active_role('board') or public.is_active_role('admin'));
create policy fee_invoices_write on public.fee_invoices for all
  using (public.is_active_role('finance')) with check (public.is_active_role('finance'));

create policy caution_deposits_select_own on public.caution_deposits for select using (student_id = auth.uid());
create policy caution_deposits_select_staff on public.caution_deposits for select
  using (public.is_active_role('finance') or public.is_active_role('board') or public.is_active_role('admin'));
create policy caution_deposits_write on public.caution_deposits for all
  using (public.is_active_role('finance')) with check (public.is_active_role('finance'));

create policy budgets_select on public.budgets for select
  using (public.is_active_role('finance') or public.is_active_role('board') or public.is_active_role('admin'));
create policy budgets_write on public.budgets for all
  using (public.is_active_role('finance')) with check (public.is_active_role('finance'));

create policy salary_allocations_select_own on public.salary_allocations for select using (profile_id = auth.uid());
create policy salary_allocations_select_staff on public.salary_allocations for select
  using (public.is_active_role('finance') or public.is_active_role('board') or public.is_active_role('admin'));
create policy salary_allocations_write on public.salary_allocations for all
  using (public.is_active_role('finance')) with check (public.is_active_role('finance'));

-- ---------- notifications log: read-only for admin, all writes via lib/notify server code ----------

create policy notifications_log_select_admin on public.notifications_log for select using (public.is_active_role('admin'));
