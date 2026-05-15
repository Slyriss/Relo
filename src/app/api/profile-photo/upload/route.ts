import { NextResponse } from "next/server";
import { guardPost } from "@/lib/api/security";
import { ALLOWED_PROFILE_PHOTO_TYPES, MAX_PROFILE_PHOTO_BYTES, storeProfilePhotoBytes } from "@/lib/profile-photos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifiedOwner(ownerType: string, ownerId: string) {
  const serverClient = await createSupabaseServerClient();
  const { data: authData } = serverClient ? await serverClient.auth.getUser() : { data: { user: null } };
  const authUser = authData.user;
  if (!authUser) return { ok: false as const, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };

  const client = createSupabaseAdminClient();
  if (!client) {
    return { ok: false as const, response: NextResponse.json({ error: "Photo storage is not configured" }, { status: 503 }) };
  }

  if (ownerType === "user") {
    if (ownerId !== authUser.id) {
      return { ok: false as const, response: NextResponse.json({ error: "Cannot update another user's profile photo" }, { status: 403 }) };
    }
    return { ok: true as const, client, authUser };
  }

  if (ownerType === "attendee") {
    const { data: attendee, error } = await client.from("attendees").select("id,user_id").eq("id", ownerId).maybeSingle();
    if (error) {
      return { ok: false as const, response: NextResponse.json({ error: "Could not verify profile ownership" }, { status: 500 }) };
    }
    if (!attendee) return { ok: false as const, response: NextResponse.json({ error: "Attendee not found" }, { status: 404 }) };
    if (attendee.user_id !== authUser.id) {
      return { ok: false as const, response: NextResponse.json({ error: "Cannot update another attendee's profile photo" }, { status: 403 }) };
    }
    return { ok: true as const, client, authUser };
  }

  return { ok: false as const, response: NextResponse.json({ error: "ownerType must be user or attendee" }, { status: 400 }) };
}

export async function POST(request: Request) {
  const guarded = guardPost(request, "profile-photo-upload", 10, 60_000);
  if (guarded) return guarded;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload a profile photo file." }, { status: 400 });
  }

  const ownerType = String(formData.get("ownerType") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  const consent = String(formData.get("consent") ?? "") === "true";
  const file = formData.get("photo");

  if (!consent) {
    return NextResponse.json({ error: "Confirm you have permission to use this photo." }, { status: 400 });
  }
  if (!ownerId || !(file instanceof File)) {
    return NextResponse.json({ error: "Photo file, ownerType, and ownerId are required." }, { status: 400 });
  }
  if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Profile photo must be a JPEG, PNG, WebP, or AVIF image." }, { status: 400 });
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return NextResponse.json({ error: "Profile photo is larger than 5MB." }, { status: 413 });
  }

  const owner = await verifiedOwner(ownerType, ownerId);
  if (!owner.ok) return owner.response;

  try {
    const stored = await storeProfilePhotoBytes(await owner.client, await file.arrayBuffer(), file.type, {
      type: ownerType as "attendee" | "user",
      id: ownerId,
    });

    const table = ownerType === "attendee" ? "attendees" : "users";
    const { error } = await owner.client.from(table).update({ photo_url: stored.publicUrl }).eq("id", ownerId);
    if (error) throw error;

    if (ownerType === "user") {
      await owner.client.from("attendees").update({ photo_url: stored.publicUrl }).eq("user_id", ownerId);
    }

    return NextResponse.json({ photoUrl: stored.publicUrl, path: stored.path });
  } catch {
    return NextResponse.json(
      { error: "Could not store profile photo. Try a smaller JPEG, PNG, WebP, or AVIF image." },
      { status: 500 }
    );
  }
}
