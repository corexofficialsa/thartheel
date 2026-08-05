-- milestones_select_teacher was the one outlier among the teacher-facing
-- select policies in 0009_rls_policies.sql: every sibling policy (attendance,
-- homework, submissions, grades, progress_reports, exams, exam_results)
-- scopes to "students enrolled in one of my classrooms" — this one let any
-- active teacher read every student's Qur'an-memorization milestone
-- progress, not just their own students'.
drop policy milestones_select_teacher on public.student_milestones;
create policy milestones_select_teacher on public.student_milestones for select
  using (
    public.is_active_role('teacher')
    and exists (
      select 1 from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_id = student_milestones.student_id and c.teacher_id = auth.uid()
    )
  );
