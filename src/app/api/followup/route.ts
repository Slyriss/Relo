import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import type { FollowupInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  let body: FollowupInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.meeting || !body.sender || !body.recipient) {
    return NextResponse.json({ error: "meeting, sender, and recipient are required" }, { status: 400 });
  }

  const draft = await aiProvider.generateFollowup(body);
  return NextResponse.json({ draft });
}
