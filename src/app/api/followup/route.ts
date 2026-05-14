import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { followupInputSchema } from "@/lib/ai/schemas";
import type { FollowupInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  let body: FollowupInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = followupInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "meeting, sender, and recipient are required" }, { status: 400 });
  }

  const draft = await aiProvider.generateFollowup(parsed.data);
  return NextResponse.json({ draft });
}
