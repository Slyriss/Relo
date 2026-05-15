import { listAttendees } from "@/lib/data/attendees";
import { listCheckIns, listMeetingRequests } from "@/lib/data/engagement";
import { listEvents } from "@/lib/data/events";
import { listMeetings } from "@/lib/data/meetings";
import { filterWorkspaceForRole } from "@/lib/auth/roles";
import { ensureUserProfile } from "@/lib/data/bootstrap";
import { mapDbOrganization, mapDbUser } from "@/lib/data/mappers";
import type { Attendee, CheckIn, Event, Meeting, MeetingRequest, Organization, User } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

export type WorkspaceData = {
  user: User | null;
  organization: Organization | null;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  checkIns: CheckIn[];
};

export async function loadWorkspace(client: Client): Promise<WorkspaceData> {
  const { data: auth } = await client.auth.getUser();
  const authUser = auth.user;

  const [userResult, orgResult, events, attendees, meetings, meetingRequests, checkIns] = await Promise.all([
    authUser
      ? client.from("users").select("*").eq("id", authUser.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client.from("organizations").select("*").limit(1).maybeSingle(),
    listEvents(client),
    listAttendees(client),
    listMeetings(client),
    listMeetingRequests(client),
    listCheckIns(client),
  ]);

  if (userResult.error) throw userResult.error;
  if (orgResult.error) throw orgResult.error;

  let user = userResult.data ? mapDbUser(userResult.data) : null;
  if (authUser) {
    user = await ensureUserProfile(client, authUser);
  }

  return filterWorkspaceForRole({
    user,
    organization: orgResult.data ? mapDbOrganization(orgResult.data) : null,
    events,
    attendees,
    meetings,
    meetingRequests,
    checkIns,
  });
}
