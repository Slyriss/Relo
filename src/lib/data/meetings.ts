import { mapDbMeeting } from "@/lib/data/mappers";
import type { Meeting } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

export async function listMeetings(client: Client, eventId?: string): Promise<Meeting[]> {
  let query = client.from("meetings").select("*").order("created_at", { ascending: false });
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapDbMeeting);
}

export async function insertMeeting(client: Client, meeting: Meeting): Promise<Meeting> {
  const { data, error } = await client
    .from("meetings")
    .insert({
      event_id: meeting.eventId,
      attendee_a_id: meeting.attendeeAId,
      attendee_b_id: meeting.attendeeBId,
      note: meeting.note,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapDbMeeting(data);
}
