import { z } from "zod";

export const goalSchema = z.enum(["fundraising", "hiring", "partnerships", "customers", "learning"]);

export const attendeePayloadSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().default(""),
  title: z.string().default(""),
  linkedinUrl: z.string().url().optional(),
  bio: z.string().default(""),
  headline: z.string().optional(),
  goals: z.array(goalSchema).default(["learning"]),
  industry: z.string().optional(),
  seniority: z.number().int().min(1).max(6).optional(),
  profileComplete: z.boolean().default(false),
  photoUrl: z.string().url().optional(),
});

export const meetingPayloadSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  attendeeAId: z.string().min(1),
  attendeeBId: z.string().min(1),
  note: z.string().default(""),
  createdAt: z.string().min(1),
  synced: z.boolean().optional(),
});

export const followupInputSchema = z.object({
  meeting: meetingPayloadSchema,
  sender: attendeePayloadSchema,
  recipient: attendeePayloadSchema,
});

export const prepInputSchema = z.object({
  source: attendeePayloadSchema,
  target: attendeePayloadSchema,
});

export const profileParseInputSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
});

export const prepResponseSchema = z.object({
  bullets: z
    .array(z.string().trim().min(1).max(180))
    .length(3),
});

export const profileResponseSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().min(1).max(120).optional(),
  headline: z.string().trim().min(1).max(160).optional(),
  photoUrl: z.string().url().optional(),
  goals: z.array(goalSchema).max(5).optional(),
  industry: z.string().trim().min(1).max(80).optional(),
  seniority: z.number().int().min(1).max(6).optional(),
}).strip();

export const connectionPlanResponseSchema = z.object({
  headline: z.string().trim().min(1).max(220),
  whyMeet: z.string().trim().min(1).max(420),
  personalBridge: z.string().trim().min(1).max(360),
  partnership: z.string().trim().min(1).max(420),
  ask: z.string().trim().min(1).max(300),
  offer: z.string().trim().min(1).max(300),
  nextStep: z.string().trim().min(1).max(300),
  risk: z.string().trim().min(1).max(300),
}).strip();

export const researchBriefResponseSchema = z.object({
  summary: z.string().trim().min(1).max(700),
  actionPlan: z.object({
    approach: z.string().trim().min(1).max(420),
    opener: z.string().trim().min(1).max(240),
    talkingPoints: z.array(z.string().trim().min(1).max(220)).min(2).max(5),
    questions: z.array(z.string().trim().min(1).max(220)).min(2).max(5),
    offer: z.string().trim().min(1).max(260),
    followUp: z.string().trim().min(1).max(260),
    avoid: z.array(z.string().trim().min(1).max(180)).min(1).max(4),
  }).strip(),
  findings: z.array(z.string().trim().min(1).max(260)).min(2).max(6),
  sourceNotes: z.array(z.string().trim().min(1).max(220)).min(1).max(4),
  followUpQuestions: z.array(z.string().trim().min(1).max(180)).min(1).max(5),
}).strip();
