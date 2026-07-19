-- Chat uses Postgres Changes (not Broadcast) for simplicity: RLS on the
-- messages table already scopes delivery to conversation participants, so no
-- extra channel-authorization layer is needed for this table.
alter publication supabase_realtime add table public.messages;
