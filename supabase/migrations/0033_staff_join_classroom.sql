-- Admin and board can now join any classroom's live session to observe.
-- They get the meeting link straight away: no attendance row (attendance is
-- student/teacher only), and none of the student-only join locks apply.
create or replace function public.join_classroom(p_classroom_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_classroom public.classrooms;
  v_today date := (now() at time zone 'Asia/Riyadh')::date;
  v_incomplete_homework int;
  v_override_id uuid;
  v_locked boolean;
begin
  select role into v_role from public.profiles where id = v_uid and status = 'active';
  if v_role is null then
    raise exception 'not authorized';
  end if;

  select * into v_classroom from public.classrooms where id = p_classroom_id;
  if v_classroom is null then
    raise exception 'classroom not found';
  end if;

  if v_role in ('admin', 'board') then
    return jsonb_build_object('locked', false, 'meeting_link', v_classroom.meeting_link);
  end if;

  if v_role = 'teacher' then
    if v_classroom.teacher_id <> v_uid then
      raise exception 'not authorized for this classroom';
    end if;

    if v_classroom.teacher_joined_at is null
       or (v_classroom.teacher_joined_at at time zone 'Asia/Riyadh')::date <> v_today then
      update public.classrooms
        set teacher_joined_at = now(), join_locked_override = null
        where id = p_classroom_id;
      v_classroom.teacher_joined_at := now();
    end if;

  elsif v_role = 'student' then
    if not exists (
      select 1 from public.classroom_students
      where classroom_id = p_classroom_id and student_id = v_uid
    ) then
      raise exception 'not enrolled in this classroom';
    end if;

    if v_classroom.join_locked_override is true then
      v_locked := true;
    elsif v_classroom.join_locked_override is false then
      v_locked := false;
    else
      v_locked := v_classroom.teacher_joined_at is not null
        and (v_classroom.teacher_joined_at at time zone 'Asia/Riyadh')::date = v_today
        and now() - v_classroom.teacher_joined_at > interval '20 minutes';
    end if;

    if v_locked then
      return jsonb_build_object('locked', true, 'reason', 'join_window_closed');
    end if;

    select count(*) into v_incomplete_homework
    from public.homework h
    where h.classroom_id = p_classroom_id
      and h.due_date < now()
      and not exists (
        select 1 from public.homework_submissions s
        where s.homework_id = h.id and s.student_id = v_uid
      );

    if v_incomplete_homework > 0 then
      select id into v_override_id
      from public.homework_lock_overrides
      where classroom_id = p_classroom_id and student_id = v_uid
      order by created_at desc
      limit 1;

      if v_override_id is null then
        return jsonb_build_object('locked', true, 'reason', 'homework_incomplete');
      end if;

      delete from public.homework_lock_overrides where id = v_override_id;
    end if;

  else
    raise exception 'not authorized for this classroom';
  end if;

  insert into public.attendance (classroom_id, user_id, role, date)
  values (p_classroom_id, v_uid, v_role::text::public.attendance_role, v_today)
  on conflict (classroom_id, user_id, date) do nothing;

  return jsonb_build_object('locked', false, 'meeting_link', v_classroom.meeting_link);
end;
$$;
