create table if not exists public.person_enrichments (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  status text not null default 'ready' check (status in ('queued', 'scanning', 'ready', 'error')),
  public_profile_url text,
  industry text,
  likely_focus text,
  company_news text[] not null default '{}',
  strategy text[] not null default '{}',
  confidence numeric not null default 0,
  source_summary jsonb not null default '{}',
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attendee_id)
);

create table if not exists public.public_profile_signals (
  id uuid primary key default gen_random_uuid(),
  enrichment_id uuid not null references public.person_enrichments(id) on delete cascade,
  source text not null,
  label text not null,
  value text not null,
  url text,
  confidence numeric not null default 0,
  observed_at timestamptz not null default now()
);

alter table public.person_enrichments enable row level security;
alter table public.public_profile_signals enable row level security;

drop policy if exists "event members read person enrichments" on public.person_enrichments;
create policy "event members read person enrichments" on public.person_enrichments
  for select using (
    exists (
      select 1 from public.attendees a
      where a.id = attendee_id and public.is_event_member(a.event_id)
    )
  );

drop policy if exists "event members manage person enrichments" on public.person_enrichments;
create policy "event members manage person enrichments" on public.person_enrichments
  for all using (
    exists (
      select 1 from public.attendees a
      where a.id = attendee_id and public.is_event_member(a.event_id)
    )
  )
  with check (
    exists (
      select 1 from public.attendees a
      where a.id = attendee_id and public.is_event_member(a.event_id)
    )
  );

drop policy if exists "event members read public profile signals" on public.public_profile_signals;
create policy "event members read public profile signals" on public.public_profile_signals
  for select using (
    exists (
      select 1
      from public.person_enrichments pe
      join public.attendees a on a.id = pe.attendee_id
      where pe.id = enrichment_id and public.is_event_member(a.event_id)
    )
  );

drop policy if exists "event members manage public profile signals" on public.public_profile_signals;
create policy "event members manage public profile signals" on public.public_profile_signals
  for all using (
    exists (
      select 1
      from public.person_enrichments pe
      join public.attendees a on a.id = pe.attendee_id
      where pe.id = enrichment_id and public.is_event_member(a.event_id)
    )
  )
  with check (
    exists (
      select 1
      from public.person_enrichments pe
      join public.attendees a on a.id = pe.attendee_id
      where pe.id = enrichment_id and public.is_event_member(a.event_id)
    )
  );
