import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { insertAttendees } from "@/lib/data/attendees";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const attendeeSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  company: z.string().default(""),
  title: z.string().default(""),
  linkedinUrl: z.string().optional(),
  bio: z.string().default(""),
  headline: z.string().optional(),
  goals: z.array(z.enum(["fundraising", "hiring", "partnerships", "customers", "learning"])).default([]),
  industry: z.string().optional(),
  seniority: z.number().optional(),
  profileComplete: z.boolean().default(false),
  photoUrl: z.string().optional(),
});

const bodySchema = z.object({ attendees: z.array(attendeeSchema).min(1).max(500) });

export async function POST(request: Request) {
  const guarded = guardPost(request, "attendees", 10, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const auth = await requireAdminUser(client);
  if (!auth.context) return auth.response;

  try {
    const body = bodySchema.parse(await readJsonBody(request, 750_000));
    const attendees = await insertAttendees(client, body.attendees);
    return NextResponse.json({ attendees });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import attendees" }, { status });
  }
}
