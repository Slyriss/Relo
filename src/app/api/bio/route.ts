import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  const input: BioInput = await req.json();

  await new Promise((r) => setTimeout(r, 600));

  const template = BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
  const bio = template(input);

  return NextResponse.json({ bio });
}
