export type Role = "attendee" | "organizer" | "admin";
export type EventStatus = "draft" | "published";
export type Goal = "fundraising" | "hiring" | "partnerships" | "customers" | "learning";

export type ProfileVisibility = {
  email: boolean;
  company: boolean;
  title: boolean;
  linkedinUrl: boolean;
  bio: boolean;
  headline: boolean;
  goals: boolean;
  industry: boolean;
  location: boolean;
};

export type CrawlStatus = "idle" | "scanning" | "found" | "error";

export type CrawledProfile = {
  name?: string;
  company?: string;
  title?: string;
  industry?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  headline?: string;
};

export const defaultVisibility: ProfileVisibility = {
  email: false,
  company: true,
  title: true,
  linkedinUrl: false,
  bio: true,
  headline: true,
  goals: true,
  industry: true,
  location: true,
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  bio?: string;
  headline?: string;
  industry?: string;
  location?: string;
  skills?: string[];
  photoUrl?: string;
  visibility: ProfileVisibility;
  crawlStatus: CrawlStatus;
  crawledAt?: string;
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

export type RecommendationAction = {
  id: string;
  eventId: string;
  viewerId: string;
  targetId: string;
  action: "saved" | "skipped" | "met";
  note?: string;
  createdAt: string;
};

export type Meeting = {
  id: string;
  eventId: string;
  attendeeAId: string;
  attendeeBId: string;
  note: string;
  topic?: string;
  promisedAction?: string;
  owner?: "me" | "them" | "both";
  dueDate?: string;
  followupChannel?: "email" | "linkedin" | "calendar" | "other";
  permissionToContact?: boolean;
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

export type MeetingRequest = {
  id: string;
  eventId: string;
  requesterId: string;
  targetId: string;
  note?: string;
  createdAt: string;
  status: "pending" | "facilitated";
};

export type CheckIn = {
  id: string;
  eventId: string;
  attendeeId: string;
  checkedInAt: string;
};

export type AnalyticsSnapshot = {
  attendeesInvited: number;
  profilesCompleted: number;
  meetingsLogged: number;
  activeUsersLive: number;
  followupRate: number;
  engagementScore: number;
};
