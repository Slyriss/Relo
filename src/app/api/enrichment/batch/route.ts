import { NextResponse } from "next/server";
import { z } from "zod";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import type { EnrichmentPersistenceClient } from "@/lib/data/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  attendees: z.array(attendeePayloadSchema).min(1).max(100),
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
  const guarded = guardPost(request, "enrichment-batch", 8, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(request, 256_000);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "attendees are required" }, { status: 400 });
  }

  const client = parsed.data.persist ? await optionalServerClient() : null;
  const results = await Promise.all(
    parsed.data.attendees.map((attendee) => scanAttendeeEnrichment(attendee, { client }))
  );

  return NextResponse.json({
    results,
    count: results.length,
    mode: "public-enrichment",
  });
}
