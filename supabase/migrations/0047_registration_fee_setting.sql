-- Academy-wide settings (a single row). Starts with the registration fee,
-- which was hard-coded at 100 SAR; the academy charges 600 SAR and finance
-- needs to be able to change it.
create table public.academy_settings (
  id smallint primary key default 1 check (id = 1),
  registration_fee numeric not null default 600 check (registration_fee >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.academy_settings (id, registration_fee) values (1, 600);

alter table public.academy_settings enable row level security;

-- The fee is public information (shown at registration).
create policy academy_settings_select_all on public.academy_settings for select using (true);

create policy academy_settings_update_finance_admin on public.academy_settings for update
  using (public.is_active_role('finance') or public.is_active_role('admin'))
  with check (public.is_active_role('finance') or public.is_active_role('admin'));

alter table public.fee_invoices alter column amount set default 600;

-- Re-price existing registration invoices that haven't received any payment
-- (the 9 pending students were invoiced the old 100 SAR).
update public.fee_invoices
  set amount = 600
  where period = 'registration' and status = 'due' and amount_paid = 0;
