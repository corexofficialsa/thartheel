create table public.homework (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  attachment_url text,
  audio_url text,
  due_date timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  text_answer text,
  video_url text,
  audio_url text,
  duration_seconds int,
  mime_type text,
  file_size_bytes bigint,
  submitted_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

-- split from homework_submissions so a student's own-row UPDATE grant can
-- never touch grade/feedback columns.
create table public.homework_grades (
  submission_id uuid primary key references public.homework_submissions(id) on delete cascade,
  grade numeric,
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz not null default now()
);

-- one-time bypass: consumed (deleted) by join_classroom() the moment it's used,
-- so a mentor's emergency override doesn't silently unlock every future class.
create table public.homework_lock_overrides (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  granted_by uuid not null references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);
