import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureOrganization, ensureUserProfile } from "@/lib/data/bootstrap";
import { insertEvent } from "@/lib/data/events";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).default(""),
  venue: z.string().trim().max(240).default(""),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(request: Request) {
  const guarded = guardPost(request, "events", 30, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = eventSchema.parse(await readJsonBody(request));
    const user = await ensureUserProfile(client, auth.user);
    const organization = await ensureOrganization(client, user);
    const event = await insertEvent(client, { ...body, organizationId: organization.id });
    return NextResponse.json({ event });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create event" }, { status });
  }
}
