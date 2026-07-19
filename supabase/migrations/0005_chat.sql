create type public.conversation_type as enum ('student_teacher','teacher_board');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  created_at timestamptz not null default now()
);

-- join table (not an array column) so RLS can check "is this me" per row;
-- creation is still gated by start_conversation() since a bare insert policy
-- can't validate that a pairing is legitimate (shared classroom, etc).
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
