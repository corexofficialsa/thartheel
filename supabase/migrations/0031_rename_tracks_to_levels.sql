-- Curriculum tracks are now named by level to match registration levels
-- (Level 1 / Level 2) instead of their descriptive names.
update public.syllabus_tracks set name = 'Level 1' where name = 'Qaida Al-Madania';
update public.syllabus_tracks set name = 'Level 2' where name = 'Recitation Learning';
