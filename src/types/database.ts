export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type RowMap<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users: RowMap<{
        id: string;
        email: string;
        name: string | null;
        role: "attendee" | "organizer" | "admin";
        company: string | null;
        title: string | null;
        linkedin_url: string | null;
        bio: string | null;
        headline: string | null;
        industry: string | null;
        location: string | null;
        skills: string[];
        photo_url: string | null;
        visibility: Json;
        crawl_status: "idle" | "scanning" | "found" | "error";
        crawled_at: string | null;
        created_at: string;
      }>;
      organizations: RowMap<{
        id: string;
        name: string;
        slug: string;
        owner_id: string;
        created_at: string;
      }>;
      organization_members: RowMap<{
        id: string;
        organization_id: string;
        user_id: string;
        role: "owner" | "organizer" | "admin";
        created_at: string;
      }>;
      events: RowMap<{
        id: string;
        organization_id: string;
        title: string;
        slug: string;
        description: string | null;
        venue: string | null;
        starts_at: string;
        ends_at: string;
        status: "draft" | "published";
        created_at: string;
      }>;
      attendees: RowMap<{
        id: string;
        event_id: string;
        user_id: string | null;
        name: string;
        email: string;
        company: string | null;
        title: string | null;
        linkedin_url: string | null;
        bio: string | null;
        headline: string | null;
        goals: string[];
        industry: string | null;
        seniority: number | null;
        photo_url: string | null;
        profile_complete: boolean;
        created_at: string;
      }>;
      matches: RowMap<{
        id: string;
        event_id: string;
        attendee_id: string;
        target_attendee_id: string;
        score: number;
        why: string[];
        created_at: string;
      }>;
      meetings: RowMap<{
        id: string;
        event_id: string;
        attendee_a_id: string;
        attendee_b_id: string;
        note: string;
        created_at: string;
      }>;
      notes: RowMap<{
        id: string;
        meeting_id: string;
        author_attendee_id: string;
        body: string;
        created_at: string;
      }>;
      followups: RowMap<{
        id: string;
        meeting_id: string;
        channel: "email" | "linkedin";
        draft: string;
        sent_at: string | null;
        created_at: string;
      }>;
      analytics_events: RowMap<{
        id: string;
        organization_id: string | null;
        event_id: string | null;
        actor_user_id: string | null;
        name: string;
        properties: Json;
        created_at: string;
      }>;
      meeting_requests: RowMap<{
        id: string;
        event_id: string;
        requester_id: string;
        target_id: string;
        note: string | null;
        status: "pending" | "facilitated";
        created_at: string;
      }>;
      check_ins: RowMap<{
        id: string;
        event_id: string;
        attendee_id: string;
        checked_in_at: string;
      }>;
      person_enrichments: RowMap<{
        id: string;
        attendee_id: string;
        status: "queued" | "scanning" | "ready" | "error";
        public_profile_url: string | null;
        industry: string | null;
        likely_focus: string | null;
        company_news: string[];
        strategy: string[];
        confidence: number;
        source_summary: Json;
        scanned_at: string;
        created_at: string;
        updated_at: string;
      }>;
      public_profile_signals: RowMap<{
        id: string;
        enrichment_id: string;
        source: string;
        label: string;
        value: string;
        url: string | null;
        confidence: number;
        observed_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      is_org_member: {
        Args: { org: string };
        Returns: boolean;
      };
      is_event_member: {
        Args: { event: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
