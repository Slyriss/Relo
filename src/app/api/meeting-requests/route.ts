import { NextResponse } from "next/server";
import { z } from "zod";
import { canActAsAttendee, forbidden, getMeetingRequestActors, requireAdminUser, requireUser } from "@/lib/auth/server";
import { isAdminRole } from "@/lib/auth/roles";
import { deleteMeetingRequest, updateMeetingRequestStatus, upsertMeetingRequest } from "@/lib/data/engagement";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1),
  requesterId: z.string().min(1),
  targetId: z.string().min(1),
  note: z.string().optional(),
  status: z.enum(["pending", "facilitated"]).default("pending"),
});

async function authedClient() {
  const client = await createSupabaseServerClient();
  if (!client) return { client: null, response: NextResponse.json({ error: "Supabase is not configured" }, { status: 503 }) };
  const auth = await requireUser(client);
  if (!auth.context) return { client: null, context: null, response: auth.response };
  return { client, context: auth.context, response: null };
}

export async function POST(request: Request) {
  const guarded = guardPost(request, "meeting-requests", 80, 60_000);
  if (guarded) return guarded;

  const { client, context, response } = await authedClient();
  if (!client) return response;

  try {
    const body = requestSchema.parse(await readJsonBody(request));
    if (!isAdminRole(context.user.role) && body.status !== "pending") {
      return forbidden("Only admins can facilitate meeting requests");
    }
    if (!(await canActAsAttendee(client, context.user, body.eventId, body.requesterId))) {
      return forbidden("You can only request meetings from your own attendee profile");
    }
    const meetingRequest = await upsertMeetingRequest(client, body);
    return NextResponse.json({ meetingRequest });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save request" }, { status });
  }
}

export async function PATCH(request: Request) {
  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const auth = await requireAdminUser(client);
  if (!auth.context) return auth.response;

  const schema = z.object({ id: z.string().min(1), status: z.enum(["pending", "facilitated"]) });
  try {
    const body = schema.parse(await readJsonBody(request));
    const meetingRequest = await updateMeetingRequestStatus(client, body.id, body.status);
    return NextResponse.json({ meetingRequest });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { client, context, response } = await authedClient();
  if (!client) return response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const actors = await getMeetingRequestActors(client, id);
  if (!actors) return NextResponse.json({ error: "Meeting request not found" }, { status: 404 });
  if (!isAdminRole(context.user.role) && !(await canActAsAttendee(client, context.user, actors.eventId, actors.requesterId))) {
    return forbidden("You can only remove your own meeting requests");
  }
  await deleteMeetingRequest(client, id);
  return NextResponse.json({ ok: true });
}
