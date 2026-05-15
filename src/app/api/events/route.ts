import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { ensureOrganization } from "@/lib/data/bootstrap";
import { insertEvent } from "@/lib/data/events";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const unsafeControlText = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
const eventText = (max: number, min = 0) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !unsafeControlText.test(value), "Remove unsupported control characters.");

const eventSchema = z
  .object({
    title: eventText(120, 1),
    slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a valid event slug."),
    description: eventText(1200).default(""),
    venue: eventText(160).default(""),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .refine((event) => new Date(event.endsAt).getTime() > new Date(event.startsAt).getTime(), {
    path: ["endsAt"],
    message: "The event end time must be after the start time.",
  });

export async function POST(request: Request) {
  const guarded = guardPost(request, "events", 30, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const auth = await requireAdminUser(client);
  if (!auth.context) return auth.response;

  try {
    const body = eventSchema.parse(await readJsonBody(request));
    const organization = await ensureOrganization(client, auth.context.user);
    const event = await insertEvent(client, { ...body, organizationId: organization.id });
    return NextResponse.json({ event });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Check the event details and try again."
        : error instanceof RequestBodyError
          ? error.message
          : "Could not create event";
    return NextResponse.json({ error: message }, { status });
  }
}
