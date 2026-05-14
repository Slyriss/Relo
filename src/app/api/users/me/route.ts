import { NextResponse } from "next/server";
import { z } from "zod";
import { defaultVisibility } from "@/types";
import { mapDbUser } from "@/lib/data/mappers";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().trim().min(1).optional(),
  role: z.enum(["attendee", "organizer", "admin"]).optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  linkedinUrl: z.string().optional(),
  bio: z.string().optional(),
  headline: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  photoUrl: z.string().optional(),
  visibility: z.record(z.boolean()).optional(),
  crawlStatus: z.enum(["idle", "scanning", "found", "error"]).optional(),
  crawledAt: z.string().optional(),
});

export async function PATCH(request: Request) {
  const guarded = guardPost(request, "users-me", 80, 60_000);
  if (guarded) return guarded;

  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = profileSchema.parse(await readJsonBody(request));
    const visibility = body.visibility ? { ...defaultVisibility, ...body.visibility } : undefined;
    const updates: Database["public"]["Tables"]["users"]["Update"] = {
      email: body.email ?? auth.user.email ?? "",
      name: body.name,
      role: body.role,
      company: body.company,
      title: body.title,
      linkedin_url: body.linkedinUrl,
      bio: body.bio,
      headline: body.headline,
      industry: body.industry,
      location: body.location,
      skills: body.skills,
      photo_url: body.photoUrl,
      visibility,
      crawl_status: body.crawlStatus,
      crawled_at: body.crawledAt,
    };
    const usersTable = client.from("users") as any;
    const { data, error } = await usersTable
      .update(updates)
      .eq("id", auth.user.id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const { data: inserted, error: insertError } = await usersTable
        .insert({ ...updates, id: auth.user.id, email: updates.email ?? auth.user.email ?? "" })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return NextResponse.json({ user: mapDbUser(inserted) });
    }
    return NextResponse.json({ user: mapDbUser(data) });
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update profile" }, { status });
  }
}
