create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'attendee' check (role in ('attendee', 'organizer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'organizer' check (role in ('owner', 'organizer', 'admin')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text not null,
  company text,
  title text,
  linkedin_url text,
  bio text,
  headline text,
  goals text[] not null default '{}',
  industry text,
  seniority int default 2,
  photo_url text,
  profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  target_attendee_id uuid not null references public.attendees(id) on delete cascade,
  score int not null,
  why text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (attendee_id, target_attendee_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  attendee_a_id uuid not null references public.attendees(id) on delete cascade,
  attendee_b_id uuid not null references public.attendees(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  author_attendee_id uuid not null references public.attendees(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email', 'linkedin')),
  draft text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  name text not null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.events enable row level security;
alter table public.attendees enable row level security;
alter table public.matches enable row level security;
alter table public.meetings enable row level security;
alter table public.notes enable row level security;
alter table public.followups enable row level security;
alter table public.analytics_events enable row level security;

create function public.is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid()
  );
$$;

create function public.is_event_member(event uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.organization_members om on om.organization_id = e.organization_id
    where e.id = event and om.user_id = auth.uid()
  )
  or exists (
    select 1 from public.attendees a
    where a.event_id = event and a.user_id = auth.uid()
  );
$$;

create policy "users can read self" on public.users for select using (id = auth.uid());
create policy "users can update self" on public.users for update using (id = auth.uid());

create policy "members read orgs" on public.organizations for select using (public.is_org_member(id));
create policy "owners update orgs" on public.organizations for update using (owner_id = auth.uid());
create policy "authenticated create orgs" on public.organizations for insert with check (owner_id = auth.uid());

create policy "members read memberships" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "owners manage memberships" on public.organization_members for all using (
  exists (select 1 from public.organizations where id = organization_id and owner_id = auth.uid())
);

create policy "members manage events" on public.events for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "attendees read published events" on public.events for select using (status = 'published' and public.is_event_member(id));

create policy "event members read attendees" on public.attendees for select using (public.is_event_member(event_id));
create policy "organizers import attendees" on public.attendees for insert with check (public.is_event_member(event_id));
create policy "attendees update own profile" on public.attendees for update using (user_id = auth.uid() or public.is_event_member(event_id));

create policy "event members read matches" on public.matches for select using (public.is_event_member(event_id));
create policy "organizers manage matches" on public.matches for all using (public.is_event_member(event_id));

create policy "event members read meetings" on public.meetings for select using (public.is_event_member(event_id));
create policy "attendees log meetings" on public.meetings for insert with check (public.is_event_member(event_id));

create policy "authors and organizers read notes" on public.notes for select using (
  author_attendee_id in (select id from public.attendees where user_id = auth.uid())
  or exists (
    select 1 from public.meetings m where m.id = meeting_id and public.is_event_member(m.event_id)
  )
);
create policy "authors write notes" on public.notes for insert with check (
  author_attendee_id in (select id from public.attendees where user_id = auth.uid())
);

create policy "event members read followups" on public.followups for select using (
  exists (select 1 from public.meetings m where m.id = meeting_id and public.is_event_member(m.event_id))
);
create policy "event members manage followups" on public.followups for all using (
  exists (select 1 from public.meetings m where m.id = meeting_id and public.is_event_member(m.event_id))
);

create policy "members read analytics" on public.analytics_events for select using (
  organization_id is null or public.is_org_member(organization_id)
);
create policy "members write analytics" on public.analytics_events for insert with check (
  organization_id is null or public.is_org_member(organization_id)
);
