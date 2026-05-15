import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/runtime";
import type { Database } from "@/types/database";

const adminPrefixes = ["/dashboard", "/settings", "/org"];
const protectedPrefixes = [...adminPrefixes, "/events"];

type MiddlewareClient = any;

async function firstAttendeeEvent(client: MiddlewareClient, userId: string, email?: string) {
  const byUser = await client.from("attendees").select("event_id").eq("user_id", userId).limit(1).maybeSingle();
  if (byUser.data?.event_id) return byUser.data.event_id;
  if (!email) return null;

  const byEmail = await client.from("attendees").select("event_id").eq("email", email).limit(1).maybeSingle();
  return byEmail.data?.event_id ?? null;
}

export async function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const config = getSupabasePublicConfig();
  if (!config) return NextResponse.next();

  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  }) as MiddlewareClient;

  const { data } = await client.auth.getUser();
  if (!data.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const profile = await client.from("users").select("role,email").eq("id", data.user.id).maybeSingle();
  const role = profile.data?.role;
  const email = profile.data?.email ?? data.user.email;
  const isAdminRoute = adminPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (isAdminRoute && role === "attendee") {
    const eventId = await firstAttendeeEvent(client, data.user.id, email);
    return NextResponse.redirect(new URL(eventId ? `/events/${eventId}` : "/setup", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/events") && (role === "organizer" || role === "admin")) {
    const eventId = request.nextUrl.pathname.split("/")[2];
    return NextResponse.redirect(new URL(eventId ? `/dashboard/events/${eventId}` : "/dashboard/events", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/org/:path*", "/events/:path*"],
};
