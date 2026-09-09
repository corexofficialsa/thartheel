-- Classroom-wide group chat: one conversation per classroom, so a teacher's
-- message is visible to every enrolled student together (not just whoever
-- they happen to be in a 1:1 chat with). Reuses the existing
-- conversations/conversation_participants/messages tables and their RLS —
-- those were already participant-count-agnostic, only start_conversation()
-- assumed exactly 2 participants.
alter table public.conversations add column classroom_id uuid references public.classrooms(id) on delete cascade;

-- At most one group conversation per classroom.
create unique index conversations_classroom_group_unique on public.conversations (classroom_id)
  where type = 'classroom_group';

create or replace function public.open_classroom_conversation(p_classroom_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_classroom public.classrooms;
  v_conversation_id uuid;
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
  else
    raise exception 'not authorized for this classroom';
  end if;

  select id into v_conversation_id
  from public.conversations
  where classroom_id = p_classroom_id and type = 'classroom_group';

  if v_conversation_id is null then
    insert into public.conversations (type, classroom_id)
    values ('classroom_group', p_classroom_id)
    returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conversation_id, v_classroom.teacher_id)
    on conflict (conversation_id, user_id) do nothing;
  end if;

  -- Lazily ensure the caller is a participant — self-heals for students
  -- enrolled after the group conversation already exists, with no need for
  -- an enrollment-time trigger.
  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conversation_id, v_uid)
  on conflict (conversation_id, user_id) do nothing;

  return v_conversation_id;
end;
$$;

grant execute on function public.open_classroom_conversation(uuid) to authenticated;
