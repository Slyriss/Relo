import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { demoAttendees, demoEvent, demoMeetings, demoOrg } from "../src/lib/demo-data";

const payload = {
  organization: demoOrg,
  event: demoEvent,
  attendees: demoAttendees,
  meetings: demoMeetings,
  analytics: {
    attendeesInvited: demoAttendees.length,
    profilesCompleted: demoAttendees.filter((attendee) => attendee.profileComplete).length,
    meetingsLogged: demoMeetings.length,
    activeUsersLive: 8,
    followupRate: 42,
    engagementScore: 84
  }
};

const output = resolve(process.cwd(), "supabase", "demo-seed.json");
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${output}`);
