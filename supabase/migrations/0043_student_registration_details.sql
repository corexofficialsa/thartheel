-- Extra answers from the student registration form (mirrors the academy's
-- Google Form): gender, full address, a self-assessment of Makharij, Qaida
-- Madaniyya and Tajweed, a preferred class time, and when the Terms &
-- Conditions were accepted. All nullable — teachers and older student
-- accounts don't have them.
alter table public.profiles
  add column gender text check (gender in ('male', 'female')),
  add column address text,
  add column makharij_level text check (makharij_level in ('beginner', 'intermediate', 'advanced')),
  add column qaida_level text check (qaida_level in ('beginner', 'intermediate', 'advanced')),
  add column tajweed_level text check (tajweed_level in ('beginner', 'intermediate', 'advanced')),
  add column preferred_time_slot text check (preferred_time_slot in ('05:30', '20:00', '21:00')),
  add column terms_accepted_at timestamptz;
