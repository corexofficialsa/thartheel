insert into public.centers (name) values ('Main Center') on conflict do nothing;

insert into public.levels (name) values
  ('Beginner'), ('Intermediate'), ('Advanced')
on conflict (name) do nothing;

insert into public.syllabus_tracks (name, total_milestones) values
  ('Qaida Noorania', 17),
  ('Tajweed & Qira''at', 10)
on conflict (name) do nothing;
