import type { User as SupabaseUser } from "@supabase/supabase-js";
import { mapDbOrganization, mapDbUser } from "@/lib/data/mappers";
import { slugify } from "@/lib/utils";
import type { Organization, User } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

function providerProfilePhotoUrl(authUser: SupabaseUser) {
  const metadata = authUser.user_metadata ?? {};
  const value = metadata.avatar_url ?? metadata.picture;
  return typeof value === "string" && value.startsWith("https://") ? value : null;
}

async function syncProviderProfile(client: Client, authUser: SupabaseUser, row: Database["public"]["Tables"]["users"]["Row"]) {
  const updates: Database["public"]["Tables"]["users"]["Update"] = {};
  const providerPhotoUrl = providerProfilePhotoUrl(authUser);
  const providerName = typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : null;

  if (!row.photo_url && providerPhotoUrl) updates.photo_url = providerPhotoUrl;
  if ((!row.name || row.name === row.email) && providerName) updates.name = providerName;

  if (!Object.keys(updates).length) return row;

  const { data, error } = await client.from("users").update(updates).eq("id", authUser.id).select("*").single();
  if (error) throw error;

  if (updates.photo_url) {
    await client.from("attendees").update({ photo_url: updates.photo_url }).eq("user_id", authUser.id);
  }

  return data;
}

export async function ensureUserProfile(client: Client, authUser: SupabaseUser): Promise<User> {
  const existing = await client.from("users").select("*").eq("id", authUser.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return mapDbUser(await syncProviderProfile(client, authUser, existing.data));

  const { data, error } = await client
    .from("users")
    .insert({
      id: authUser.id,
      email: authUser.email ?? "",
      name: authUser.user_metadata?.name ?? authUser.email ?? "New user",
      photo_url: providerProfilePhotoUrl(authUser),
      role: "attendee",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapDbUser(data);
}

export async function ensureOrganization(client: Client, user: User): Promise<Organization> {
  const existing = await client.from("organizations").select("*").limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return mapDbOrganization(existing.data);

  const baseSlug = slugify(user.company || `${user.name} workspace`) || `workspace-${user.id.slice(0, 8)}`;
  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .insert({
      name: user.company ? `${user.company} Events` : `${user.name}'s Workspace`,
      slug: `${baseSlug}-${user.id.slice(0, 8)}`,
      owner_id: user.id,
    })
    .select("*")
    .single();

  if (organizationError) throw organizationError;

  const { error: memberError } = await client.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) throw memberError;

  return mapDbOrganization(organization);
}
