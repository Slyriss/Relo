import { mapDbAttendee } from "@/lib/data/mappers";
import type { Attendee } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

export async function listAttendees(client: Client, eventId?: string): Promise<Attendee[]> {
  let query = client.from("attendees").select("*").order("created_at", { ascending: true });
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapDbAttendee);
}

export async function insertAttendees(client: Client, attendees: Array<Omit<Attendee, "id"> & { id?: string }>): Promise<Attendee[]> {
  const { data, error } = await client
    .from("attendees")
    .insert(
      attendees.map((attendee) => ({
        event_id: attendee.eventId,
        name: attendee.name,
        email: attendee.email,
        company: attendee.company,
        title: attendee.title,
        linkedin_url: attendee.linkedinUrl,
        bio: attendee.bio,
        headline: attendee.headline,
        goals: attendee.goals,
        industry: attendee.industry,
        seniority: attendee.seniority,
        photo_url: attendee.photoUrl,
        profile_complete: attendee.profileComplete,
      }))
    )
    .select("*");

  if (error) throw error;
  return (data ?? []).map(mapDbAttendee);
}
