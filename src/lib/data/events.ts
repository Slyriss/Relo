import { mapDbEvent } from "@/lib/data/mappers";
import type { Event } from "@/types";
import type { Database } from "@/types/database";

type Client = any;

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

export async function insertEvent(client: Client, event: Omit<Event, "id"> & { id?: string }): Promise<Event> {
  const { data, error } = await client
    .from("events")
    .insert({
      organization_id: event.organizationId,
      slug: event.slug,
      title: event.title,
      description: event.description,
      venue: event.venue,
      starts_at: event.startsAt,
      ends_at: event.endsAt,
      status: event.status,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapDbEvent(data);
}
