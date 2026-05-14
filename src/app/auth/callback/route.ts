import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/data/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard/events";

  if (code) {
    const client = await createSupabaseServerClient();
    if (client) {
      await client.auth.exchangeCodeForSession(code);
      const { data } = await client.auth.getUser();
      if (data.user) await ensureUserProfile(client, data.user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
