import { NextResponse } from "next/server";
import { z } from "zod";
import { canActAsAttendee, forbidden, requireUser } from "@/lib/auth/server";
import { insertMeeting } from "@/lib/data/meetings";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const meetingSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1),
  attendeeAId: z.string().min(1),
  attendeeBId: z.string().min(1),
  note: z.string().default(""),
  createdAt: z.string().optional(),
});

export async function POST(request: Request) {
  const guarded = guardPost(request, "meetings", 60, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const auth = await requireUser(client);
  if (!auth.context) return auth.response;

  try {
    const meeting = meetingSchema.parse(await readJsonBody(request));
    const canLog =
      (await canActAsAttendee(client, auth.context.user, meeting.eventId, meeting.attendeeAId)) ||
      (await canActAsAttendee(client, auth.context.user, meeting.eventId, meeting.attendeeBId));
    if (!canLog) return forbidden("You can only log meetings for your own attendee profile");

    const saved = await insertMeeting(client, { ...meeting, id: meeting.id ?? crypto.randomUUID(), createdAt: meeting.createdAt ?? new Date().toISOString() });
    return NextResponse.json({ meeting: saved });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not log meeting" }, { status });
  }
}
