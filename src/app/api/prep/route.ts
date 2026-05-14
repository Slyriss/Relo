import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { prepInputSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import type { PrepInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const guarded = guardPost(request, "prep", 30, 60_000);
  if (guarded) return guarded;

  let body: PrepInput;
  try {
    body = await readJsonBody(request) as PrepInput;
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = prepInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "source and target are required" }, { status: 400 });
  }

  const bullets = await aiProvider.generatePrep(parsed.data);
  return NextResponse.json({ bullets });
}
