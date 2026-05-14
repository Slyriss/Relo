import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/data/bootstrap";
import { loadWorkspace } from "@/lib/data/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const { data: auth } = await client.auth.getUser();
  if (auth.user) await ensureUserProfile(client, auth.user);

  const workspace = await loadWorkspace(client);
  return NextResponse.json(workspace);
}
