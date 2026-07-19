create type public.notify_channel as enum ('whatsapp','email','sms');
create type public.notify_status as enum ('mock_sent','sent','failed');

-- every WhatsApp/email/SMS send (mock or real) lands here; lib/notify/* writes
-- one row per attempt regardless of which provider is behind it.
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  channel public.notify_channel not null,
  template_name text not null,
  params jsonb not null default '{}'::jsonb,
  status public.notify_status not null default 'mock_sent',
  created_at timestamptz not null default now()
);
