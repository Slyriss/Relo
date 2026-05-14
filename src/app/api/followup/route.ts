import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { followupInputSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import type { FollowupInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const guarded = guardPost(request, "followup", 12, 60_000);
  if (guarded) return guarded;

  let body: FollowupInput;
  try {
    body = await readJsonBody(request) as FollowupInput;
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = followupInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "meeting, sender, and recipient are required" }, { status: 400 });
  }

  const draft = await aiProvider.generateFollowup(parsed.data);
  return NextResponse.json({ draft });
}
