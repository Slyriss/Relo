import { NextResponse } from "next/server";
import { z } from "zod";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { requireAdminUser } from "@/lib/auth/server";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import type { EnrichmentPersistenceClient } from "@/lib/data/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  attendee: attendeePayloadSchema,
  persist: z.boolean().default(true),
});

async function optionalServerClient() {
  try {
    return await createSupabaseServerClient() as EnrichmentPersistenceClient | null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const guarded = guardPost(request, "enrichment-scan", 30, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "attendee is required" }, { status: 400 });
  }

  if (parsed.data.persist) {
    const client = await createSupabaseServerClient();
    if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    const auth = await requireAdminUser(client);
    if (!auth.context) return auth.response;
  }

  const result = await scanAttendeeEnrichment(parsed.data.attendee, {
    client: parsed.data.persist ? await optionalServerClient() : null,
  });

  return NextResponse.json({
    result,
    enrichment: result.enrichment,
    mode: "public-enrichment",
  });
}
