import { NextResponse } from "next/server";
import { z } from "zod";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import type { EnrichmentPersistenceClient } from "@/lib/data/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  attendee: attendeePayloadSchema,
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
    return NextResponse.json({ error: "attendee is required" }, { status: 400 });
  }

  const result = await scanAttendeeEnrichment(parsed.data.attendee, {
    client: parsed.data.persist ? optionalServerClient() : null,
  });

  return NextResponse.json({
    result,
    enrichment: result.enrichment,
    mode: "public-enrichment",
  });
}
