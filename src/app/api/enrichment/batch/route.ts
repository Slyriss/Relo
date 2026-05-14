import { NextResponse } from "next/server";
import { z } from "zod";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import type { EnrichmentPersistenceClient } from "@/lib/data/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  attendees: z.array(attendeePayloadSchema).min(1).max(100),
  persist: z.boolean().default(true),
});

function optionalServerClient() {
  try {
    return createSupabaseServerClient() as EnrichmentPersistenceClient | null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "attendees are required" }, { status: 400 });
  }

  const client = parsed.data.persist ? optionalServerClient() : null;
  const results = await Promise.all(
    parsed.data.attendees.map((attendee) => scanAttendeeEnrichment(attendee, { client }))
  );

  return NextResponse.json({
    results,
    count: results.length,
    mode: "public-enrichment",
  });
}
