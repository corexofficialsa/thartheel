create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  level_id uuid references public.levels(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  name text not null,
  meeting_link text,
  created_at timestamptz not null default now()
);

create table public.classroom_students (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

create type public.attendance_role as enum ('student','teacher');

-- unique (classroom_id, user_id, date) makes repeat "join" clicks idempotent;
-- date is always derived server-side in join_classroom(), never client-supplied.
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.attendance_role not null,
  date date not null,
  joined_at timestamptz not null default now(),
  unique (classroom_id, user_id, date)
);
