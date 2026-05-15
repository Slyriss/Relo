import { NextResponse } from "next/server";
import { z } from "zod";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { storeProfilePhotoFromUrl, validateProfilePhotoSource } from "@/lib/profile-photos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  imageUrl: z.string().url(),
  ownerType: z.enum(["attendee", "user"]),
  ownerId: z.string().min(1),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function updateStoredPhoto(client: ReturnType<typeof createSupabaseAdminClient>, ownerType: "attendee" | "user", ownerId: string, photoUrl: string) {
  if (!client) return;
  const table = ownerType === "attendee" ? "attendees" : "users";
  const { error } = await client.from(table).update({ photo_url: photoUrl }).eq("id", ownerId);
  if (error) throw error;

  if (ownerType === "user") {
    await client.from("attendees").update({ photo_url: photoUrl }).eq("user_id", ownerId);
  }
}

export async function POST(request: Request) {
  const guarded = guardPost(request, "profile-photo", 10, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "imageUrl, ownerType, and ownerId are required" }, { status: 400 });
  }

  const source = validateProfilePhotoSource(parsed.data.imageUrl);
  if (!source.ok) return NextResponse.json({ error: source.reason }, { status: 400 });

  const client = createSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase service role is not configured" }, { status: 503 });
  }

  const serverClient = await createSupabaseServerClient();
  const { data: authData } = serverClient ? await serverClient.auth.getUser() : { data: { user: null } };
  const authUser = authData.user;
  if (!authUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  if (parsed.data.ownerType === "user" && parsed.data.ownerId !== authUser.id) {
    return NextResponse.json({ error: "Cannot update another user's profile photo" }, { status: 403 });
  }

  if (parsed.data.ownerType === "attendee") {
    const { data: attendee, error: attendeeError } = await client
      .from("attendees")
      .select("id,user_id,event_id")
      .eq("id", parsed.data.ownerId)
      .maybeSingle();

    if (attendeeError) {
      return NextResponse.json({ error: "Could not verify profile ownership" }, { status: 500 });
    }
    if (!attendee) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    if (attendee.user_id !== authUser.id) {
      return NextResponse.json({ error: "Cannot update another attendee's profile photo" }, { status: 403 });
    }
  }

  try {
    const stored = await storeProfilePhotoFromUrl(client, parsed.data.imageUrl, {
      type: parsed.data.ownerType,
      id: parsed.data.ownerId,
    });

    await updateStoredPhoto(client, parsed.data.ownerType, parsed.data.ownerId, stored.publicUrl);

    return NextResponse.json({ photoUrl: stored.publicUrl, path: stored.path });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not store profile photo. Use a direct public image URL you have permission to store." },
      { status: 500 }
    );
  }
}
