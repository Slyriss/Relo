create or replace function public.is_event_admin(event uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.organization_members om on om.organization_id = e.organization_id
    where e.id = event
      and om.user_id = auth.uid()
      and om.role in ('owner', 'organizer', 'admin')
  );
$$;

create or replace function public.is_attendee_self(attendee uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attendees a
    left join public.users u on u.id = auth.uid()
    where a.id = attendee
      and (a.user_id = auth.uid() or lower(a.email) = lower(u.email))
  );
$$;

create or replace function public.is_meeting_participant(meeting uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meetings m
    where m.id = meeting
      and (public.is_attendee_self(m.attendee_a_id) or public.is_attendee_self(m.attendee_b_id))
  );
$$;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id and old.role is distinct from new.role then
    raise exception 'Role changes require admin access';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.users;
create trigger prevent_self_role_change
  before update on public.users
  for each row execute function public.prevent_self_role_change();

drop policy if exists "organizers import attendees" on public.attendees;
create policy "organizers import attendees" on public.attendees
  for insert with check (public.is_event_admin(event_id));

drop policy if exists "attendees update own profile" on public.attendees;
create policy "attendees update own profile" on public.attendees
  for update using (public.is_attendee_self(id) or public.is_event_admin(event_id))
  with check (public.is_attendee_self(id) or public.is_event_admin(event_id));

drop policy if exists "organizers manage matches" on public.matches;
create policy "organizers manage matches" on public.matches
  for all using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

drop policy if exists "event members read meetings" on public.meetings;
create policy "event members read meetings" on public.meetings
  for select using (public.is_event_admin(event_id) or public.is_attendee_self(attendee_a_id) or public.is_attendee_self(attendee_b_id));

drop policy if exists "attendees log meetings" on public.meetings;
create policy "attendees log meetings" on public.meetings
  for insert with check (public.is_event_admin(event_id) or public.is_attendee_self(attendee_a_id) or public.is_attendee_self(attendee_b_id));

drop policy if exists "event members read followups" on public.followups;
create policy "event participants read followups" on public.followups
  for select using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and (public.is_event_admin(m.event_id) or public.is_meeting_participant(m.id))
    )
  );

drop policy if exists "event members manage followups" on public.followups;
create policy "event participants manage followups" on public.followups
  for all using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and (public.is_event_admin(m.event_id) or public.is_meeting_participant(m.id))
    )
  )
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and (public.is_event_admin(m.event_id) or public.is_meeting_participant(m.id))
    )
  );

drop policy if exists "event members read meeting requests" on public.meeting_requests;
create policy "participants read own meeting requests" on public.meeting_requests
  for select using (public.is_event_admin(event_id) or public.is_attendee_self(requester_id) or public.is_attendee_self(target_id));

drop policy if exists "event members manage meeting requests" on public.meeting_requests;
create policy "participants create own meeting requests" on public.meeting_requests
  for insert with check (public.is_event_admin(event_id) or (status = 'pending' and public.is_attendee_self(requester_id)));

create policy "participants delete own meeting requests" on public.meeting_requests
  for delete using (public.is_event_admin(event_id) or public.is_attendee_self(requester_id));

create policy "organizers update meeting requests" on public.meeting_requests
  for update using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

drop policy if exists "event members manage check ins" on public.check_ins;
create policy "participants manage own check ins" on public.check_ins
  for all using (public.is_event_admin(event_id) or public.is_attendee_self(attendee_id))
  with check (public.is_event_admin(event_id) or public.is_attendee_self(attendee_id));

drop policy if exists "event members manage enrichments" on public.person_enrichments;
drop policy if exists "event members update enrichments" on public.person_enrichments;
drop policy if exists "event members insert enrichments" on public.person_enrichments;
create policy "organizers manage enrichments" on public.person_enrichments
  for all using (
    exists (select 1 from public.attendees a where a.id = attendee_id and public.is_event_admin(a.event_id))
  )
  with check (
    exists (select 1 from public.attendees a where a.id = attendee_id and public.is_event_admin(a.event_id))
  );

drop policy if exists "event members manage enrichment signals" on public.public_profile_signals;
drop policy if exists "event members update enrichment signals" on public.public_profile_signals;
drop policy if exists "event members insert enrichment signals" on public.public_profile_signals;
create policy "organizers manage enrichment signals" on public.public_profile_signals
  for all using (
    exists (
      select 1
      from public.person_enrichments pe
      join public.attendees a on a.id = pe.attendee_id
      where pe.id = enrichment_id and public.is_event_admin(a.event_id)
    )
  )
  with check (
    exists (
      select 1
      from public.person_enrichments pe
      join public.attendees a on a.id = pe.attendee_id
      where pe.id = enrichment_id and public.is_event_admin(a.event_id)
    )
  );
