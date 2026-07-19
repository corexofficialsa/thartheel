create type public.finance_record_type as enum ('income','expense');
create type public.invoice_status as enum ('due','paid','overdue');
create type public.deposit_status as enum ('held','refunded');

create table public.finance_records (
  id uuid primary key default gen_random_uuid(),
  type public.finance_record_type not null,
  category text not null,
  amount numeric not null,
  description text,
  date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- fees are recorded manually by finance staff for now (no payment gateway yet);
-- amount defaults to the standard 100 SAR monthly fee.
create table public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  period text not null,
  amount numeric not null default 100,
  status public.invoice_status not null default 'due',
  paid_at timestamptz,
  method text,
  created_at timestamptz not null default now(),
  unique (student_id, period)
);

create table public.caution_deposits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  status public.deposit_status not null default 'held',
  collected_at timestamptz not null default now(),
  refunded_at timestamptz
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  center_id uuid references public.centers(id) on delete cascade,
  period text not null,
  category text not null,
  limit_amount numeric not null,
  created_at timestamptz not null default now(),
  unique (center_id, period, category)
);

-- fixed default allocations per spec: mentor 200 SAR / admin 200 SAR, adjustable per period.
create table public.salary_allocations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  amount numeric not null,
  period text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, period)
);
