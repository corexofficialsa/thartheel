-- Leaderboard score previously ignored homework grades entirely (only
-- attendance + exam marks), so a teacher grading homework had no visible
-- effect on it. Adds average homework grade the same way avg exam marks
-- already factors in — unweighted, since the grading scale is whatever the
-- teacher chooses (no fixed max in homework_grades).
create or replace function public.top_student_leaderboard()
returns table(profile_id uuid, name text, score numeric)
language sql stable security definer set search_path = public as $$
  select
    p.id as profile_id,
    p.name,
    (coalesce(a.attendance_count, 0) * 2 + coalesce(e.avg_marks, 0) + coalesce(h.avg_grade, 0)) as score
  from public.profiles p
  left join (
    select user_id, count(*) as attendance_count
    from public.attendance
    where role = 'student' and date >= (current_date - 30)
    group by user_id
  ) a on a.user_id = p.id
  left join (
    select student_id, avg(marks) as avg_marks
    from public.exam_results
    group by student_id
  ) e on e.student_id = p.id
  left join (
    select s.student_id, avg(g.grade) as avg_grade
    from public.homework_grades g
    join public.homework_submissions s on s.id = g.submission_id
    where g.grade is not null
    group by s.student_id
  ) h on h.student_id = p.id
  where p.role = 'student' and p.status = 'active'
  order by score desc, p.name asc
  limit 3;
$$;
