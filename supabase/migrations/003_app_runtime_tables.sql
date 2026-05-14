alter table public.users
  add column if not exists company text,
  add column if not exists title text,
  add column if not exists linkedin_url text,
  add column if not exists bio text,
  add column if not exists headline text,
  add column if not exists industry text,
  add column if not exists location text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists photo_url text,
  add column if not exists visibility jsonb not null default '{
    "email": false,
    "company": true,
    "title": true,
    "linkedinUrl": false,
    "bio": true,
    "headline": true,
    "goals": true,
    "industry": true,
    "location": true
  }'::jsonb,
  add column if not exists crawl_status text not null default 'idle'
    check (crawl_status in ('idle', 'scanning', 'found', 'error')),
  add column if not exists crawled_at timestamptz;

create table if not exists public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  requester_id uuid not null references public.attendees(id) on delete cascade,
  target_id uuid not null references public.attendees(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending', 'facilitated')),
  created_at timestamptz not null default now(),
  unique (event_id, requester_id, target_id)
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (event_id, attendee_id)
);

alter table public.meeting_requests enable row level security;
alter table public.check_ins enable row level security;

drop policy if exists "event members read meeting requests" on public.meeting_requests;
create policy "event members read meeting requests" on public.meeting_requests
  for select using (public.is_event_member(event_id));

drop policy if exists "event members manage meeting requests" on public.meeting_requests;
create policy "event members manage meeting requests" on public.meeting_requests
  for all using (public.is_event_member(event_id))
  with check (public.is_event_member(event_id));

drop policy if exists "event members read check ins" on public.check_ins;
create policy "event members read check ins" on public.check_ins
  for select using (public.is_event_member(event_id));

drop policy if exists "event members manage check ins" on public.check_ins;
create policy "event members manage check ins" on public.check_ins
  for all using (public.is_event_member(event_id))
  with check (public.is_event_member(event_id));
