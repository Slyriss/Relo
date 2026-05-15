import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/data/bootstrap";
import { isAdminRole } from "@/lib/auth/roles";
import type { User as AppUser } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Client = any;

export type AuthedContext = {
  client: Client;
  authUser: SupabaseUser;
  user: AppUser;
};

export function forbidden(message = "You do not have access to this resource") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireUser(client: Client): Promise<{ context: AuthedContext; response: null } | { context: null; response: NextResponse }> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) {
    return { context: null, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  const user = await ensureUserProfile(client, auth.user);
  return { context: { client, authUser: auth.user, user }, response: null };
}

export async function requireAdminUser(
  client: Client
): Promise<{ context: AuthedContext; response: null } | { context: null; response: NextResponse }> {
  const result = await requireUser(client);
  if (!result.context) return result;
  if (!isAdminRole(result.context.user.role)) {
    return { context: null, response: forbidden("Admin access required") };
  }

  return result;
}

export async function getAttendeeIdsForUser(client: Client, eventId: string, user: AppUser): Promise<Set<string>> {
  const { data, error } = await client
    .from("attendees")
    .select("id,email,user_id")
    .eq("event_id", eventId);

  if (error) throw error;
  const email = user.email.toLowerCase();
  return new Set(
    (data ?? [])
      .filter((attendee: { id: string; email: string; user_id: string | null }) => attendee.user_id === user.id || attendee.email.toLowerCase() === email)
      .map((attendee: { id: string }) => attendee.id)
  );
}

export async function canActAsAttendee(client: Client, user: AppUser, eventId: string, attendeeId: string) {
  if (isAdminRole(user.role)) return true;
  const attendeeIds = await getAttendeeIdsForUser(client, eventId, user);
  return attendeeIds.has(attendeeId);
}

export async function getMeetingRequestActors(client: Client, id: string): Promise<{ eventId: string; requesterId: string; targetId: string } | null> {
  const { data, error } = await client
    .from("meeting_requests")
    .select("event_id,requester_id,target_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        eventId: data.event_id,
        requesterId: data.requester_id,
        targetId: data.target_id,
      }
    : null;
}
