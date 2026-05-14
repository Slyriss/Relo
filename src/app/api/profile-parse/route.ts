import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { profileParseInputSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  let body: { text: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileParseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const profile = await aiProvider.parseProfile(parsed.data.text);
  return NextResponse.json({ profile });
}
