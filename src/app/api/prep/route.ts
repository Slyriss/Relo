import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { prepInputSchema } from "@/lib/ai/schemas";
import type { PrepInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  let body: PrepInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = prepInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "source and target are required" }, { status: 400 });
  }

  const bullets = await aiProvider.generatePrep(parsed.data);
  return NextResponse.json({ bullets });
}
