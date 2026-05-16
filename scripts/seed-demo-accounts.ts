import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { demoAccounts } from "../src/lib/demo-accounts";
import {
  demoAttendees,
  demoCheckIns,
  demoEvent,
  demoMeetingRequests,
  demoMeetings,
  demoOrg,
} from "../src/lib/demo-data";
import { defaultVisibility } from "../src/types";
import type { Database } from "../src/types/database";

function demoAccountFor(role: "organizer" | "attendee") {
  const account = demoAccounts.find((item) => item.role === role);
  if (!account) throw new Error(`Demo ${role} account is required.`);
  return account;
}

const organizerAccount = demoAccountFor("organizer");
const participantAccount = demoAccountFor("attendee");

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureAuthUser(account: (typeof demoAccounts)[number]) {
  const existingProfile = await supabase.from("users").select("id").eq("email", account.email).maybeSingle();
  if (existingProfile.error) throw existingProfile.error;
  if (existingProfile.data?.id) {
    await supabase.auth.admin.updateUserById(existingProfile.data.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: { name: account.name, demo: true },
    });
    return existingProfile.data.id;
  }

  const created = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { name: account.name, demo: true },
  });

  if (created.error) throw created.error;
  return created.data.user.id;
}

function profileFor(account: (typeof demoAccounts)[number], id: string) {
  const attendee = account.role === "attendee" ? demoAttendees[0] : undefined;

  return {
    id,
    email: account.email,
    name: account.name,
    role: account.role,
    company: account.role === "organizer" ? "Northstar Ventures" : attendee?.company,
    title: account.role === "organizer" ? "General Partner" : attendee?.title,
    linkedin_url: account.role === "organizer" ? "https://linkedin.com/in/avachen" : attendee?.linkedinUrl,
    bio: account.role === "organizer" ? "Runs high-trust founder and investor events for Northstar Ventures." : attendee?.bio,
    headline: account.role === "organizer" ? "Event organizer at Northstar Ventures" : attendee?.headline,
    industry: account.role === "organizer" ? "Venture Capital" : attendee?.industry,
    location: "San Francisco, CA",
    skills: account.role === "organizer" ? ["Event Strategy", "Founder Community", "Venture Capital"] : [],
    photo_url: account.role === "organizer" ? `https://i.pravatar.cc/160?u=${account.email}` : attendee?.photoUrl,
    visibility: defaultVisibility,
    crawl_status: "found" as const,
    crawled_at: new Date().toISOString(),
  };
}

async function main() {
  const userIds = new Map<string, string>();

  for (const account of demoAccounts) {
    const id = await ensureAuthUser(account);
    userIds.set(account.email, id);
    const { error } = await supabase.from("users").upsert(profileFor(account, id), { onConflict: "id" });
    if (error) throw error;
  }

  const organizerId = userIds.get(organizerAccount.email)!;
  const participantId = userIds.get(participantAccount.email)!;

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .upsert(
      {
        name: demoOrg.name,
        slug: demoOrg.slug,
        owner_id: organizerId,
      },
      { onConflict: "slug" }
    )
    .select("*")
    .single();
  if (orgError) throw orgError;

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: organization.id,
      user_id: organizerId,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" }
  );
  if (memberError) throw memberError;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .upsert(
      {
        organization_id: organization.id,
        title: demoEvent.title,
        slug: demoEvent.slug,
        description: demoEvent.description,
        venue: demoEvent.venue,
        starts_at: demoEvent.startsAt,
        ends_at: demoEvent.endsAt,
        status: demoEvent.status,
      },
      { onConflict: "organization_id,slug" }
    )
    .select("*")
    .single();
  if (eventError) throw eventError;

  const attendeeIdByDemoId = new Map<string, string>();
  for (const attendee of demoAttendees) {
    const { data, error } = await supabase
      .from("attendees")
      .upsert(
        {
          event_id: event.id,
          user_id: attendee.id === "att-1" ? participantId : null,
          name: attendee.name,
          email: attendee.id === "att-1" ? participantAccount.email : attendee.email,
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
        },
        { onConflict: "event_id,email" }
      )
      .select("*")
      .single();
    if (error) throw error;
    attendeeIdByDemoId.set(attendee.id, data.id);
  }

  const { error: clearMeetingsError } = await supabase.from("meetings").delete().eq("event_id", event.id);
  if (clearMeetingsError) throw clearMeetingsError;

  for (const meeting of demoMeetings) {
    const attendeeA = attendeeIdByDemoId.get(meeting.attendeeAId);
    const attendeeB = attendeeIdByDemoId.get(meeting.attendeeBId);
    if (!attendeeA || !attendeeB) continue;
    const { error } = await supabase.from("meetings").insert({
      event_id: event.id,
      attendee_a_id: attendeeA,
      attendee_b_id: attendeeB,
      note: meeting.note,
    });
    if (error) throw error;
  }

  for (const checkIn of demoCheckIns) {
    const attendeeId = attendeeIdByDemoId.get(checkIn.attendeeId);
    if (!attendeeId) continue;
    const { error } = await supabase.from("check_ins").upsert(
      {
        event_id: event.id,
        attendee_id: attendeeId,
        checked_in_at: checkIn.checkedInAt,
      },
      { onConflict: "event_id,attendee_id" }
    );
    if (error) throw error;
  }

  for (const request of demoMeetingRequests) {
    const requesterId = attendeeIdByDemoId.get(request.requesterId);
    const targetId = attendeeIdByDemoId.get(request.targetId);
    if (!requesterId || !targetId) continue;
    const { error } = await supabase.from("meeting_requests").upsert(
      {
        event_id: event.id,
        requester_id: requesterId,
        target_id: targetId,
        note: request.note,
        status: request.status,
      },
      { onConflict: "event_id,requester_id,target_id" }
    );
    if (error) throw error;
  }

  console.log("Seeded internal QA accounts:");
  for (const account of demoAccounts) {
    console.log(`- ${account.label}: ${account.email} / ${account.password}`);
  }
  console.log(`Event: /events/${event.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
