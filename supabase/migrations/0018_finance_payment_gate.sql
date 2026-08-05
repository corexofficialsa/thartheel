-- ============================================================
-- Finance visibility into profiles (real gap: no policy granted
-- finance any access to `profiles` at all, so the existing "Create fee
-- invoice" / "Collect deposit" / "Set salary" student & staff pickers on
-- the finance ledger page were silently returning zero rows under RLS)
-- ============================================================
create policy profiles_select_finance_students on public.profiles for select
  using (public.is_active_role('finance') and role = 'student');

create policy profiles_select_finance_staff on public.profiles for select
  using (public.is_active_role('finance') and role in ('teacher', 'admin'));

-- ============================================================
-- Registration payment gate: a pending student's registration can't be
-- approved until finance marks their registration fee invoice paid.
-- Reuses the existing fee_invoices table/UI (period = 'registration')
-- rather than adding a parallel payment-tracking mechanism.
-- ============================================================
create or replace function public.approve_profile(p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role;
  v_paid boolean;
begin
  if not public.is_active_role('admin') then
    raise exception 'not authorized';
  end if;

  select role into v_role from public.profiles where id = p_profile_id;

  if v_role = 'student' then
    select exists (
      select 1 from public.fee_invoices
      where student_id = p_profile_id and period = 'registration' and status = 'paid'
    ) into v_paid;

    if not v_paid then
      raise exception 'payment_not_confirmed';
    end if;
  end if;

  update public.profiles set status = 'active', updated_at = now()
  where id = p_profile_id and status = 'pending';

  insert into public.audit_log (actor_id, action, target_table, target_id)
  values (auth.uid(), 'approve_profile', 'profiles', p_profile_id);
end;
$$;
