-- Split from 0028 on purpose: Postgres won't let a newly added enum value
-- be used in the same transaction that adds it, and Supabase applies each
-- migration file as one transaction.
alter type public.conversation_type add value 'classroom_group';
