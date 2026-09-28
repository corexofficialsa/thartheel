-- Installment payments: an invoice can now be paid in parts. amount_paid
-- accumulates each recorded payment; status flips to 'paid' only once it
-- reaches the invoice amount (so the registration payment gate in
-- approve_profile() still means "fully paid").
alter table public.fee_invoices add column amount_paid numeric not null default 0;
update public.fee_invoices set amount_paid = amount where status = 'paid';

-- Salary allocations can now go to tech support / tech maintenance, which
-- are outside vendors without a profile: they carry a payee name instead.
alter table public.salary_allocations alter column profile_id drop not null;
alter table public.salary_allocations alter column role drop not null;
alter table public.salary_allocations add column category text not null default 'staff'
  check (category in ('staff', 'tech_support', 'tech_maintenance'));
alter table public.salary_allocations add column payee text;
alter table public.salary_allocations add constraint salary_allocations_payee_check check (
  (category = 'staff' and profile_id is not null)
  or (category <> 'staff' and payee is not null)
);
