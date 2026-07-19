create table public.syllabus_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  total_milestones int not null
);

create table public.student_milestones (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.syllabus_tracks(id) on delete cascade,
  milestone_index int not null,
  achieved_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null,
  unique (student_id, track_id, milestone_index)
);

create type public.report_period as enum ('daily','weekly','monthly');

create table public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  period public.report_period not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null,
  exam_type text not null,
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  marks numeric not null,
  published_at timestamptz,
  unique (exam_id, student_id)
);

create table public.teaching_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  level_id uuid references public.levels(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
