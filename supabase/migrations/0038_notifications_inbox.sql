-- In-app notifications (the Notifications tab and unread badges). Rows are
-- created by triggers on the source tables, so nothing in app code can
-- forget to notify.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('message', 'homework', 'graded', 'reopened')),
  title text not null,
  body text,
  link text,
  conversation_id uuid references public.conversations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Chat link per recipient role (board's chat lives under Messages).
create or replace function public.chat_link_for(p_role public.user_role)
returns text language sql immutable as $$
  select case p_role when 'board' then '/board/messages' else '/' || p_role::text || '/chat' end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sender_name text;
  v_classroom_name text;
begin
  select name into v_sender_name from public.profiles where id = new.sender_id;
  select c.name into v_classroom_name
    from public.conversations conv join public.classrooms c on c.id = conv.classroom_id
    where conv.id = new.conversation_id;

  insert into public.notifications (user_id, kind, title, body, link, conversation_id, actor_id)
  select cp.user_id,
         'message',
         case when v_classroom_name is not null
              then coalesce(v_sender_name, 'Someone') || ' in ' || v_classroom_name
              else 'New message from ' || coalesce(v_sender_name, 'someone') end,
         left(new.content, 140),
         public.chat_link_for(p.role),
         new.conversation_id,
         new.sender_id
  from public.conversation_participants cp
  join public.profiles p on p.id = cp.user_id
  where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id;
  return new;
end;
$$;

create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_new_message();

create or replace function public.notify_new_homework()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  select cs.student_id, 'homework', 'New homework: ' || new.title,
         'Due ' || to_char(new.due_date at time zone 'Asia/Riyadh', 'DD Mon YYYY, HH24:MI'),
         '/student/homework', new.teacher_id
  from public.classroom_students cs
  where cs.classroom_id = new.classroom_id;
  return new;
end;
$$;

create trigger homework_notify after insert on public.homework
  for each row execute function public.notify_new_homework();

create or replace function public.notify_homework_graded()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid;
  v_title text;
begin
  select s.student_id, h.title into v_student, v_title
    from public.homework_submissions s join public.homework h on h.id = s.homework_id
    where s.id = new.submission_id;
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  values (v_student, 'graded', 'Homework graded: ' || v_title,
          case when new.grade is not null then 'Grade: ' || new.grade::text else null end,
          '/student/homework', new.graded_by);
  return new;
end;
$$;

create trigger homework_grades_notify after insert on public.homework_grades
  for each row execute function public.notify_homework_graded();

create or replace function public.notify_homework_reopened()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.homework where id = new.homework_id;
  insert into public.notifications (user_id, kind, title, body, link, actor_id)
  values (new.student_id, 'reopened', 'Homework reopened: ' || v_title,
          'Your teacher is letting you submit again.', '/student/homework', new.granted_by);
  return new;
end;
$$;

create trigger resubmit_grants_notify after insert on public.homework_resubmit_grants
  for each row execute function public.notify_homework_reopened();
