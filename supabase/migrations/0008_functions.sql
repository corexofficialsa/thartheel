-- ============================================================
-- Helper functions used throughout RLS policies
-- ============================================================

create or replace function public.is_active_role(r public.user_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = r and status = 'active'
  );
$$;

-- ============================================================
-- Self-service profile edits (contact fields only — role/status
-- are never client-writable, see 0009_rls_policies.sql)
-- ============================================================

create or replace function public.update_my_contact_info(p_name text, p_phone text, p_whatsapp text)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
  set name = coalesce(p_name, name),
      phone = coalesce(p_phone, phone),
      whatsapp_number = coalesce(p_whatsapp, whatsapp_number),
      updated_at = now()
  where id = auth.uid();
$$;

-- ============================================================
-- Login identifier resolution (teachers log in by username,
-- students by email) — never reveals whether an account exists
-- beyond returning null for "not found".
-- ============================================================

create or replace function public.resolve_login_identifier(p_identifier text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where username = p_identifier or email = p_identifier
  limit 1;
$$;

-- ============================================================
-- Registration approval / rejection / removal
-- Auth-level ban is applied here directly (functions run as the
-- migration owner, which has privileges on auth.users) so a single
-- RPC call is enough — no separate service-role step needed.
-- ============================================================

create or replace function public.approve_profile(p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_role('admin') then
    raise exception 'not authorized';
  end if;

  update public.profiles set status = 'active', updated_at = now()
  where id = p_profile_id and status = 'pending';

  insert into public.audit_log (actor_id, action, target_table, target_id)
  values (auth.uid(), 'approve_profile', 'profiles', p_profile_id);
end;
$$;

create or replace function public.reject_profile(p_profile_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_role('admin') then
    raise exception 'not authorized';
  end if;

  update public.profiles set status = 'rejected', rejection_reason = p_reason, updated_at = now()
  where id = p_profile_id and status = 'pending';

  update auth.users set banned_until = 'infinity' where id = p_profile_id;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'reject_profile', 'profiles', p_profile_id, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.remove_profile(p_profile_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_role public.user_role;
begin
  select role into v_target_role from public.profiles where id = p_profile_id;

  if not (
    public.is_active_role('admin')
    or (public.is_active_role('board') and v_target_role = 'teacher')
  ) then
    raise exception 'not authorized';
  end if;

  update public.profiles set status = 'removed', rejection_reason = p_reason, updated_at = now()
  where id = p_profile_id;

  update auth.users set banned_until = 'infinity' where id = p_profile_id;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'remove_profile', 'profiles', p_profile_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- ============================================================
-- Attendance / join-classroom (atomic: authz + lock check + log + link)
-- ============================================================

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
begin
  select role into v_role from public.profiles where id = v_uid and status = 'active';
  if v_role is null then
    raise exception 'not authorized';
  end if;

  select * into v_classroom from public.classrooms where id = p_classroom_id;
  if v_classroom is null then
    raise exception 'classroom not found';
  end if;

  if v_role = 'teacher' then
    if v_classroom.teacher_id <> v_uid then
      raise exception 'not authorized for this classroom';
    end if;

  elsif v_role = 'student' then
    if not exists (
      select 1 from public.classroom_students
      where classroom_id = p_classroom_id and student_id = v_uid
    ) then
      raise exception 'not enrolled in this classroom';
    end if;

    -- task-based access lock: block if there's an incomplete, past-due homework
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

      -- one-time bypass: consume it so it doesn't silently unlock future classes
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

-- ============================================================
-- Chat: conversation creation gated server-side (never trust a
-- client-inserted conversation_participants row)
-- ============================================================

create or replace function public.start_conversation(p_other_user_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_my_role public.user_role;
  v_other_role public.user_role;
  v_type public.conversation_type;
  v_conversation_id uuid;
  v_shared boolean;
begin
  select role into v_my_role from public.profiles where id = v_uid and status = 'active';
  select role into v_other_role from public.profiles where id = p_other_user_id and status = 'active';

  if v_my_role is null or v_other_role is null then
    raise exception 'invalid participants';
  end if;

  if v_my_role = 'student' and v_other_role = 'teacher' then
    v_type := 'student_teacher';
    select exists (
      select 1 from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_id = v_uid and c.teacher_id = p_other_user_id
    ) into v_shared;

  elsif v_my_role = 'teacher' and v_other_role = 'student' then
    v_type := 'student_teacher';
    select exists (
      select 1 from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_id = p_other_user_id and c.teacher_id = v_uid
    ) into v_shared;

  elsif (v_my_role = 'teacher' and v_other_role = 'board') or (v_my_role = 'board' and v_other_role = 'teacher') then
    v_type := 'teacher_board';
    v_shared := true;

  else
    raise exception 'conversation type not allowed';
  end if;

  if not v_shared then
    raise exception 'no shared classroom between participants';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.type = v_type
    and exists (select 1 from public.conversation_participants where conversation_id = c.id and user_id = v_uid)
    and exists (select 1 from public.conversation_participants where conversation_id = c.id and user_id = p_other_user_id);

  if v_conversation_id is null then
    insert into public.conversations (type) values (v_type) returning id into v_conversation_id;
    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conversation_id, v_uid), (v_conversation_id, p_other_user_id);
  end if;

  return v_conversation_id;
end;
$$;

grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
grant execute on function public.update_my_contact_info(text, text, text) to authenticated;
grant execute on function public.approve_profile(uuid) to authenticated;
grant execute on function public.reject_profile(uuid, text) to authenticated;
grant execute on function public.remove_profile(uuid, text) to authenticated;
grant execute on function public.join_classroom(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
