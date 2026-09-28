-- Students only become conversation_participants of a classroom group chat
-- the first time they open it, so notifying participants missed everyone
-- who hadn't opened it yet. For classroom chats, notify the classroom's
-- teacher and every enrolled student instead.
create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sender_name text;
  v_classroom_id uuid;
  v_classroom_name text;
begin
  select name into v_sender_name from public.profiles where id = new.sender_id;
  select c.id, c.name into v_classroom_id, v_classroom_name
    from public.conversations conv join public.classrooms c on c.id = conv.classroom_id
    where conv.id = new.conversation_id;

  insert into public.notifications (user_id, kind, title, body, link, conversation_id, actor_id)
  select r.user_id,
         'message',
         case when v_classroom_name is not null
              then coalesce(v_sender_name, 'Someone') || ' in ' || v_classroom_name
              else 'New message from ' || coalesce(v_sender_name, 'someone') end,
         left(new.content, 140),
         public.chat_link_for(p.role),
         new.conversation_id,
         new.sender_id
  from (
    select cp.user_id from public.conversation_participants cp
      where v_classroom_id is null and cp.conversation_id = new.conversation_id
    union
    select c.teacher_id from public.classrooms c
      where c.id = v_classroom_id and c.teacher_id is not null
    union
    select cs.student_id from public.classroom_students cs
      where cs.classroom_id = v_classroom_id
  ) r
  join public.profiles p on p.id = r.user_id
  where r.user_id <> new.sender_id;
  return new;
end;
$$;
