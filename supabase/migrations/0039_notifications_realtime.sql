-- Lets the portal show a live "ping" and update unread badges the moment a
-- notification arrives. RLS (notifications_select_own) scopes delivery to
-- the recipient.
alter publication supabase_realtime add table public.notifications;
