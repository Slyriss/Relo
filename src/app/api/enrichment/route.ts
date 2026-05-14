import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichAttendee } from "@/lib/enrichment";
import { attendeePayloadSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  attendee: attendeePayloadSchema,
});

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

  return NextResponse.json({
    enrichment: enrichAttendee(parsed.data.attendee),
    mode: "public-enrichment",
  });
}
