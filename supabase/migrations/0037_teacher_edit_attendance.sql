-- Teachers can correct attendance by hand (mark a student present or
-- absent for a date). Attendance was previously only ever written by
-- join_classroom(); this keeps writes behind a checked function instead of
-- opening a broad RLS write policy.
create or replace function public.set_attendance(
  p_classroom_id uuid,
  p_student_id uuid,
  p_date date,
  p_present boolean
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.classrooms
    where id = p_classroom_id and teacher_id = auth.uid()
  ) or not public.is_active_role('teacher') then
    raise exception 'not authorized for this classroom';
  end if;

  if not exists (
    select 1 from public.classroom_students
    where classroom_id = p_classroom_id and student_id = p_student_id
  ) then
    raise exception 'student not enrolled';
  end if;

  if p_present then
    insert into public.attendance (classroom_id, user_id, role, date)
    values (p_classroom_id, p_student_id, 'student', p_date)
    on conflict (classroom_id, user_id, date) do nothing;
  else
    delete from public.attendance
    where classroom_id = p_classroom_id and user_id = p_student_id and date = p_date;
  end if;
end;
$$;

grant execute on function public.set_attendance(uuid, uuid, date, boolean) to authenticated;
