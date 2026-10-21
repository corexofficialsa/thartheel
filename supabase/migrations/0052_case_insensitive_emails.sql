-- Emails are case-insensitive. Auth stores them lowercase, but profiles kept
-- whatever case was typed at registration ("Yasir@…"), and login/forgot-
-- password compared exactly — so typing the email in lowercase failed.
update public.profiles set email = lower(email) where email <> lower(email);

create or replace function public.resolve_login_identifier(p_identifier text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where lower(username) = lower(trim(p_identifier)) or email = lower(trim(p_identifier))
  limit 1;
$$;
revoke execute on function public.resolve_login_identifier(text) from public, anon, authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;
