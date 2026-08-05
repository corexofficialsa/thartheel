-- Curriculum naming correction: Level 1 is "Qaida Al-Madania" (starts from
-- the Arabic letters), Level 2 is "Recitation Learning" — renaming the seed
-- rows from 0011_seed.sql to match rather than leaving stale placeholder names.
update public.syllabus_tracks set name = 'Qaida Al-Madania' where name = 'Qaida Noorania';
update public.syllabus_tracks set name = 'Recitation Learning' where name = 'Tajweed & Qira''at';
