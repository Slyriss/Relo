import { NextResponse } from "next/server";
import { z } from "zod";
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
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = schema.parse(await readJsonBody(request));
    const checkIn = await toggleCheckIn(client, body.eventId, body.attendeeId);
    return NextResponse.json({ checkIn });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update check-in" }, { status });
  }
}
