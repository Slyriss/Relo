import { NextResponse } from "next/server";
import { z } from "zod";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";

const BIO_TEMPLATES = [
  (p: BioInput) =>
    `${p.title} at ${p.company} with a focus on ${p.industry}. ${p.skills?.slice(0, 2).join(" and ")} practitioner. Attending events to connect with peers and explore new opportunities at the intersection of technology and business.`,
  (p: BioInput) =>
    `Experienced ${p.title?.toLowerCase() ?? "professional"} at ${p.company}, operating in the ${p.industry} space. Passionate about ${p.skills?.[0] ?? "innovation"} and ${p.skills?.[1] ?? "building great products"}. Love connecting with founders, operators, and investors who are solving hard problems.`,
  (p: BioInput) =>
    `Based in the ${p.industry} world as ${p.title} at ${p.company}. My work centers on ${p.skills?.slice(0, 3).join(", ") ?? "driving impact"}. Always looking for collaborators who share a bias toward action.`,
];

type BioInput = {
  name?: string;
  company?: string;
  title?: string;
  industry?: string;
  skills?: string[];
};

const bioInputSchema = z.object({
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  title: z.string().trim().max(160).optional(),
  industry: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
});

export async function POST(req: Request) {
  const guarded = guardPost(req, "bio", 20, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(req, 16_000);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = bioInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid bio input" }, { status: 400 });
  const input: BioInput = parsed.data;

  await new Promise((r) => setTimeout(r, 600));

  const template = BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
  const bio = template(input);

  return NextResponse.json({ bio });
}
