import { mapDbCheckIn, mapDbMeetingRequest } from "@/lib/data/mappers";
import type { CheckIn, MeetingRequest } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

export async function listMeetingRequests(client: Client, eventId?: string): Promise<MeetingRequest[]> {
  let query = client.from("meeting_requests").select("*").order("created_at", { ascending: false });
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapDbMeetingRequest);
}

export async function upsertMeetingRequest(
  client: Client,
  request: Omit<MeetingRequest, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<MeetingRequest> {
  const { data, error } = await client
    .from("meeting_requests")
    .upsert(
      {
        id: request.id,
        event_id: request.eventId,
        requester_id: request.requesterId,
        target_id: request.targetId,
        note: request.note,
        status: request.status,
      },
      { onConflict: "event_id,requester_id,target_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapDbMeetingRequest(data);
}

export async function updateMeetingRequestStatus(
  client: Client,
  id: string,
  status: MeetingRequest["status"]
): Promise<MeetingRequest> {
  const { data, error } = await client.from("meeting_requests").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  return mapDbMeetingRequest(data);
}

export async function deleteMeetingRequest(client: Client, id: string): Promise<void> {
  const { error } = await client.from("meeting_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function listCheckIns(client: Client, eventId?: string): Promise<CheckIn[]> {
  let query = client.from("check_ins").select("*").order("checked_in_at", { ascending: false });
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapDbCheckIn);
}

export async function toggleCheckIn(client: Client, eventId: string, attendeeId: string): Promise<CheckIn | null> {
  const existing = await client
    .from("check_ins")
    .select("*")
    .eq("event_id", eventId)
    .eq("attendee_id", attendeeId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data) {
    const { error } = await client.from("check_ins").delete().eq("id", existing.data.id);
    if (error) throw error;
    return null;
  }

  const { data, error } = await client
    .from("check_ins")
    .insert({ event_id: eventId, attendee_id: attendeeId })
    .select("*")
    .single();

  if (error) throw error;
  return mapDbCheckIn(data);
}
