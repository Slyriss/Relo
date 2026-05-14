import type { SupabaseClient } from "@supabase/supabase-js";
import { listAttendees } from "@/lib/data/attendees";
import { listEvents } from "@/lib/data/events";
import { listMeetings } from "@/lib/data/meetings";
import { mapDbOrganization, mapDbUser } from "@/lib/data/mappers";
import type { Attendee, Event, Meeting, Organization, User } from "@/types";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type WorkspaceData = {
  user: User | null;
  organization: Organization | null;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
};

export async function loadWorkspace(client: Client): Promise<WorkspaceData> {
  const { data: auth } = await client.auth.getUser();
  const authUser = auth.user;

  const [userResult, orgResult, events, attendees, meetings] = await Promise.all([
    authUser
      ? client.from("users").select("*").eq("id", authUser.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client.from("organizations").select("*").limit(1).maybeSingle(),
    listEvents(client),
    listAttendees(client),
    listMeetings(client),
  ]);

  if (userResult.error) throw userResult.error;
  if (orgResult.error) throw orgResult.error;

  return {
    user: userResult.data ? mapDbUser(userResult.data) : null,
    organization: orgResult.data ? mapDbOrganization(orgResult.data) : null,
    events,
    attendees,
    meetings,
  };
}
