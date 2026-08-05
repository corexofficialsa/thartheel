-- Board had no RLS visibility into student profiles at all (only teachers,
-- via profiles_select_board_teachers) and remove_profile() only allowed
-- board to target teachers — both needed for a board "Students" directory
-- with a remove action.
create policy profiles_select_board_students on public.profiles for select
  using (public.is_active_role('board') and role = 'student');

create or replace function public.remove_profile(p_profile_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_role public.user_role;
begin
  select role into v_target_role from public.profiles where id = p_profile_id;

  if not (
    public.is_active_role('admin')
    or (public.is_active_role('board') and v_target_role in ('teacher', 'student'))
  ) then
    raise exception 'not authorized';
  end if;

  update public.profiles set status = 'removed', rejection_reason = p_reason, updated_at = now()
  where id = p_profile_id;

  update auth.users set banned_until = 'infinity' where id = p_profile_id;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'remove_profile', 'profiles', p_profile_id, jsonb_build_object('reason', p_reason));
end;
$$;
