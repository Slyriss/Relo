import type { User as SupabaseUser } from "@supabase/supabase-js";
import { mapDbOrganization, mapDbUser } from "@/lib/data/mappers";
import { slugify } from "@/lib/utils";
import type { Organization, User } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

export async function ensureUserProfile(client: Client, authUser: SupabaseUser): Promise<User> {
  const existing = await client.from("users").select("*").eq("id", authUser.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return mapDbUser(existing.data);

  const { data, error } = await client
    .from("users")
    .insert({
      id: authUser.id,
      email: authUser.email ?? "",
      name: authUser.user_metadata?.name ?? authUser.email ?? "New user",
      role: "organizer",
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
