create extension if not exists "pgcrypto";

create type public.user_role as enum ('student','teacher','board','finance','admin');
create type public.profile_status as enum ('pending','active','rejected','removed');

create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  center_id uuid references public.centers(id) on delete set null,
  level_id uuid references public.levels(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

-- profiles.id intentionally mirrors auth.users.id; rows are only ever created
-- via the service-role registration Server Action or the seed script, never
-- by the client, since role/status are trust-sensitive.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  status public.profile_status not null default 'pending',
  username text unique,
  name text not null,
  email text not null,
  phone text,
  whatsapp_number text,
  level_id uuid references public.levels(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_status_idx on public.profiles(role, status);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admission_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create type public.lead_status as enum ('new','contacted','converted','lost');

create table public.campaign_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  name text not null,
  contact text not null,
  status public.lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);
