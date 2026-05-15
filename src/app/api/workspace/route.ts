import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { loadWorkspace } from "@/lib/data/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const auth = await requireUser(client);
  if (!auth.context) return auth.response;

  const workspace = await loadWorkspace(client);
  return NextResponse.json(workspace);
}
