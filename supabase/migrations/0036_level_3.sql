-- Third level. Like Level 2 it's for students who already recite, so a
-- recitation is recorded at registration. Phase count mirrors Level 2 until
-- the academy sets its own curriculum length.
insert into public.levels (name, requires_recitation) values ('Level 3', true) on conflict (name) do nothing;
insert into public.syllabus_tracks (name, total_milestones) values ('Level 3', 10) on conflict (name) do nothing;
