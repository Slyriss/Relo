import { NextResponse } from "next/server";
import { getLookupResearchJob } from "@/lib/lookup-research-jobs";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getLookupResearchJob(id);
  if (!job) return NextResponse.json({ error: "Research job not found" }, { status: 404 });
  return NextResponse.json(job);
}
