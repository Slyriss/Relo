import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { profileParseInputSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";

export async function POST(request: Request) {
  const guarded = guardPost(request, "profile-parse", 20, 60_000);
  if (guarded) return guarded;

  let body: { text: string };
  try {
    body = await readJsonBody(request, 32_000) as { text: string };
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = profileParseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const profile = await aiProvider.parseProfile(parsed.data.text);
  return NextResponse.json({ profile });
}
