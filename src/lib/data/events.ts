import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDbEvent } from "@/lib/data/mappers";
import type { Event } from "@/types";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function listEvents(client: Client): Promise<Event[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDbEvent);
}

export async function getEventByIdOrSlug(client: Client, idOrSlug: string): Promise<Event | null> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDbEvent(data) : null;
}
