import { defaultVisibility } from "@/types";
import type { Attendee, CheckIn, Event, Goal, Meeting, MeetingRequest, Organization, ProfileVisibility, User } from "@/types";
import type { Tables } from "@/types/database";

const goalValues = new Set(["fundraising", "hiring", "partnerships", "customers", "learning"]);

function toGoals(goals: string[] | null | undefined): Goal[] {
  return (goals ?? []).filter((goal): goal is Goal => goalValues.has(goal));
}

export function mapDbUser(row: Tables<"users">): User {
  const visibility = row.visibility && typeof row.visibility === "object" && !Array.isArray(row.visibility)
    ? { ...defaultVisibility, ...(row.visibility as Partial<ProfileVisibility>) }
    : defaultVisibility;

  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email,
    role: row.role,
    company: row.company ?? undefined,
    title: row.title ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    bio: row.bio ?? undefined,
    headline: row.headline ?? undefined,
    industry: row.industry ?? undefined,
    location: row.location ?? undefined,
    skills: row.skills,
    photoUrl: row.photo_url ?? undefined,
    visibility,
    crawlStatus: row.crawl_status,
    crawledAt: row.crawled_at ?? undefined,
  };
}

export function mapDbOrganization(row: Tables<"organizations">): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
  };
}

export function mapDbEvent(row: Tables<"events">): Event {
  return {
    id: row.id,
    organizationId: row.organization_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    venue: row.venue ?? "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  };
}

export function mapDbAttendee(row: Tables<"attendees">): Attendee {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    company: row.company ?? "",
    title: row.title ?? "",
    linkedinUrl: row.linkedin_url ?? undefined,
    bio: row.bio ?? "",
    headline: row.headline ?? undefined,
    goals: toGoals(row.goals),
    industry: row.industry ?? undefined,
    seniority: row.seniority ?? undefined,
    profileComplete: row.profile_complete,
    photoUrl: row.photo_url ?? undefined,
  };
}

export function mapDbMeeting(row: Tables<"meetings">): Meeting {
  return {
    id: row.id,
    eventId: row.event_id,
    attendeeAId: row.attendee_a_id,
    attendeeBId: row.attendee_b_id,
    note: row.note,
    createdAt: row.created_at,
    synced: true,
  };
}

export function mapDbMeetingRequest(row: Tables<"meeting_requests">): MeetingRequest {
  return {
    id: row.id,
    eventId: row.event_id,
    requesterId: row.requester_id,
    targetId: row.target_id,
    note: row.note ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapDbCheckIn(row: Tables<"check_ins">): CheckIn {
  return {
    id: row.id,
    eventId: row.event_id,
    attendeeId: row.attendee_id,
    checkedInAt: row.checked_in_at,
  };
}
