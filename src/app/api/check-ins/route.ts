import { NextResponse } from "next/server";
import { z } from "zod";
import { canActAsAttendee, forbidden, requireUser } from "@/lib/auth/server";
import { toggleCheckIn } from "@/lib/data/engagement";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  eventId: z.string().min(1),
  attendeeId: z.string().min(1),
});

export async function POST(request: Request) {
  const guarded = guardPost(request, "check-ins", 120, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const auth = await requireUser(client);
  if (!auth.context) return auth.response;

  try {
    const body = schema.parse(await readJsonBody(request));
    if (!(await canActAsAttendee(client, auth.context.user, body.eventId, body.attendeeId))) {
      return forbidden("You can only check in with your own attendee profile");
    }
    const checkIn = await toggleCheckIn(client, body.eventId, body.attendeeId);
    return NextResponse.json({ checkIn });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update check-in" }, { status });
  }
}
