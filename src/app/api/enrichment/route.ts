import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichAttendee } from "@/lib/enrichment";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";

const requestSchema = z.object({
  attendee: attendeePayloadSchema,
});

export async function POST(request: Request) {
  const guarded = guardPost(request, "enrichment", 60, 60_000);
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

  return NextResponse.json({
    enrichment: enrichAttendee(parsed.data.attendee),
    mode: "public-enrichment",
  });
}
