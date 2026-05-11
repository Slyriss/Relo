-- Demo seed is intentionally compact; scripts/seed.ts emits a richer local payload.
insert into public.analytics_events (name, properties)
values
  ('demo_seeded', '{"source":"supabase/seed.sql"}');
