import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/data/bootstrap";
import { listAttendees } from "@/lib/data/attendees";
import { listEvents } from "@/lib/data/events";
import { appHomeForUser } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/setup";

  let resolvedNext = next;

  if (code) {
    const client = await createSupabaseServerClient();
    if (client) {
      await client.auth.exchangeCodeForSession(code);
      const { data } = await client.auth.getUser();
      if (data.user) {
        const user = await ensureUserProfile(client, data.user);
        const [events, attendees] = await Promise.all([listEvents(client), listAttendees(client)]);
        resolvedNext = next === "/setup" ? appHomeForUser(user, events, attendees) : next;
      }
    }
  }

  return NextResponse.redirect(new URL(resolvedNext, requestUrl.origin));
}
