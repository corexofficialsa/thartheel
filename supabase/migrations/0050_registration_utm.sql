-- First-touch campaign attribution for registrations (from the mirqath_utm
-- cookie set when a visitor arrives with utm_* parameters).
alter table public.profiles
  add column utm_source text check (char_length(utm_source) <= 100),
  add column utm_medium text check (char_length(utm_medium) <= 100),
  add column utm_campaign text check (char_length(utm_campaign) <= 100),
  add column utm_landing text check (char_length(utm_landing) <= 100);
