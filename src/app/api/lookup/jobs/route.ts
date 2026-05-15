import { NextResponse } from "next/server";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createLookupResearchJob } from "@/lib/lookup-research-jobs";
import { lookupSchema } from "@/lib/lookup-research";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guarded = guardPost(request, "lookup-jobs", 20, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "attendee is required" }, { status: 400 });
  }

  return NextResponse.json(createLookupResearchJob(parsed.data), { status: 202 });
}
