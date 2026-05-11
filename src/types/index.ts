export type Role = "attendee" | "organizer" | "admin";
export type EventStatus = "draft" | "published";
export type Goal = "fundraising" | "hiring" | "partnerships" | "customers" | "learning";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
};

export type Event = {
  id: string;
  organizationId: string;
  slug: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
};

export type Attendee = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  bio: string;
  headline?: string;
  goals: Goal[];
  industry?: string;
  seniority?: number;
  profileComplete: boolean;
  photoUrl?: string;
};

export type MatchRecommendation = {
  attendeeId: string;
  targetId: string;
  score: number;
  why: string[];
};

export type Meeting = {
  id: string;
  eventId: string;
  attendeeAId: string;
  attendeeBId: string;
  note: string;
  createdAt: string;
  synced?: boolean;
};

export type Followup = {
  id: string;
  meetingId: string;
  channel: "email" | "linkedin";
  draft: string;
  sentAt?: string;
};

export type AnalyticsSnapshot = {
  attendeesInvited: number;
  profilesCompleted: number;
  meetingsLogged: number;
  activeUsersLive: number;
  followupRate: number;
  engagementScore: number;
};
