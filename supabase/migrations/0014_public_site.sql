-- ============================================================
-- Public marketing site + registration overhaul + leaderboard
-- ============================================================

-- ---------- levels: collapse to the two public program tiers ----------
-- Level 2 requires a Quran recitation placement test at registration.
alter table public.levels add column requires_recitation boolean not null default false;

delete from public.levels where name not in ('Level 1', 'Level 2');
insert into public.levels (name) values ('Level 1'), ('Level 2') on conflict (name) do nothing;
update public.levels set requires_recitation = (name = 'Level 2');

-- ---------- profiles: extra student registration fields ----------
alter table public.profiles add column age smallint;
alter table public.profiles add column place text;

-- ---------- Quran ayahs: pool for the Level 2 recitation prompt ----------
create table public.quran_ayahs (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  arabic_text text not null,
  translation text not null
);

alter table public.quran_ayahs enable row level security;
create policy quran_ayahs_select_all on public.quran_ayahs for select using (true);

insert into public.quran_ayahs (reference, arabic_text, translation) values
  ('Al-Fatiha 1:1', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'),
  ('Al-Fatiha 1:2', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'All praise is due to Allah, Lord of the worlds.'),
  ('Al-Ikhlas 112:1', 'قُلْ هُوَ اللَّهُ أَحَدٌ', 'Say, He is Allah, [who is] One.'),
  ('Al-Ikhlas 112:2', 'اللَّهُ الصَّمَدُ', 'Allah, the Eternal Refuge.'),
  ('An-Nas 114:1', 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'Say, I seek refuge in the Lord of mankind.'),
  ('Al-Asr 103:1-3', 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', 'By time, indeed mankind is in loss, except for those who believe, do righteous deeds, and advise each other to truth and to patience.'),
  ('Al-Kawthar 108:1', 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'Indeed, We have granted you al-Kawthar.'),
  ('Al-Baqarah 2:255 (excerpt)', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.');

-- ---------- Student recitations: audio submitted with registration ----------
create table public.student_recitations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ayah_id uuid references public.quran_ayahs(id) on delete set null,
  audio_url text not null,
  created_at timestamptz not null default now()
);

alter table public.student_recitations enable row level security;

-- Rows are written by the service-role client inside registerAccount()
-- (same as admission_documents), so these policies are a safety net for
-- reads, not the enforcement path for inserts.
create policy student_recitations_select_own on public.student_recitations for select using (profile_id = auth.uid());
create policy student_recitations_select_admin on public.student_recitations for select using (public.is_active_role('admin'));
create policy student_recitations_insert_own on public.student_recitations for insert with check (profile_id = auth.uid());

-- ---------- Storage: private bucket for recitation audio ----------
insert into storage.buckets (id, name, public)
values ('registration-recitations', 'registration-recitations', false)
on conflict (id) do nothing;

create policy registration_recitations_owner_rw on storage.objects for all
  using (bucket_id = 'registration-recitations' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'registration-recitations' and (storage.foldername(name))[1] = auth.uid()::text);

create policy registration_recitations_admin_read on storage.objects for select
  using (bucket_id = 'registration-recitations' and public.is_active_role('admin'));

-- ---------- Student leaderboard ----------
-- Ranks active students by a simple attendance + marks composite score.
-- security definer so it can read across students despite per-student RLS
-- on attendance/exam_results/profiles — same trust model as
-- resolve_login_identifier() in 0008_functions.sql.
create or replace function public.top_student_leaderboard()
returns table(profile_id uuid, name text, score numeric)
language sql stable security definer set search_path = public as $$
  select
    p.id as profile_id,
    p.name,
    (coalesce(a.attendance_count, 0) * 2 + coalesce(e.avg_marks, 0)) as score
  from public.profiles p
  left join (
    select user_id, count(*) as attendance_count
    from public.attendance
    where role = 'student' and date >= (current_date - 30)
    group by user_id
  ) a on a.user_id = p.id
  left join (
    select student_id, avg(marks) as avg_marks
    from public.exam_results
    group by student_id
  ) e on e.student_id = p.id
  where p.role = 'student' and p.status = 'active'
  order by score desc, p.name asc
  limit 3;
$$;

grant execute on function public.top_student_leaderboard() to authenticated;
