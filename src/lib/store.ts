"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { scoreMatches } from "@/lib/ai/matching";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WorkspaceData } from "@/lib/data/workspace";
import { defaultVisibility, type Attendee, type CheckIn, type CrawlStatus, type Event, type Meeting, type MeetingRequest, type Organization, type ProfileVisibility, type RecommendationAction, type User } from "@/types";

type AppState = {
  user: User | null;
  organization: Organization | null;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  recommendationActions: RecommendationAction[];
  checkIns: CheckIn[];
  loadingWorkspace: boolean;
  workspaceError: string | null;
  hydrateWorkspace: (workspace: WorkspaceData) => void;
  refreshWorkspace: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setVisibility: (field: keyof ProfileVisibility, value: boolean) => void;
  setCrawlStatus: (status: CrawlStatus) => void;
  createEvent: (event: Event) => Promise<Event | null>;
  addAttendees: (attendees: Attendee[]) => Promise<Attendee[]>;
  updateAttendee: (attendee: Attendee) => void;
  logMeeting: (meeting: Meeting) => Promise<Meeting | null>;
  addMeetingRequest: (req: MeetingRequest) => Promise<MeetingRequest | null>;
  removeMeetingRequest: (id: string) => Promise<void>;
  facilitateMeetingRequest: (id: string) => Promise<void>;
  markRecommendationAction: (action: Omit<RecommendationAction, "id" | "createdAt"> & { note?: string }) => void;
  toggleCheckIn: (eventId: string, attendeeId: string) => Promise<void>;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  organization: null,
  events: [],
  attendees: [],
  meetings: [],
  meetingRequests: [],
  recommendationActions: [],
  checkIns: [],
  loadingWorkspace: false,
  workspaceError: null,
  hydrateWorkspace: (workspace) =>
    set({
      user: workspace.user,
      organization: workspace.organization,
      events: workspace.events,
      attendees: workspace.attendees,
      meetings: workspace.meetings,
      meetingRequests: workspace.meetingRequests,
      checkIns: workspace.checkIns,
      workspaceError: null,
    }),
  refreshWorkspace: async () => {
    set({ loadingWorkspace: true, workspaceError: null });
    try {
      const workspace = await jsonFetch<WorkspaceData>("/api/workspace");
      get().hydrateWorkspace(workspace);
    } catch (error) {
      set({ workspaceError: error instanceof Error ? error.message : "Could not load workspace" });
    } finally {
      set({ loadingWorkspace: false });
    }
  },
  logout: async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    set({ user: null, organization: null, events: [], attendees: [], meetings: [], meetingRequests: [], checkIns: [] });
  },
  updateUser: (updates) => {
    const previous = get().user;
    const fallbackUser: User = {
      id: "pending",
      email: updates.email ?? "",
      name: updates.name ?? "New user",
      role: updates.role ?? "organizer",
      visibility: defaultVisibility,
      crawlStatus: "idle",
    };
    const nextUser = previous ? { ...previous, ...updates } : { ...fallbackUser, ...updates };
    set({ user: nextUser });
    void jsonFetch<{ user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(nextUser),
    })
      .then(({ user }) => set({ user }))
      .catch(() => previous && set({ user: previous }));
  },
  setVisibility: (field, value) =>
    get().updateUser({
      visibility: {
        ...(get().user?.visibility ?? defaultVisibility),
        [field]: value,
      },
    }),
  setCrawlStatus: (status) =>
    get().updateUser({ crawlStatus: status }),
  createEvent: async (event) => {
    set((state) => ({ events: [event, ...state.events] }));
    try {
      const { event: saved } = await jsonFetch<{ event: Event }>("/api/events", {
        method: "POST",
        body: JSON.stringify(event),
      });
      set((state) => ({ events: state.events.map((item) => (item.id === event.id ? saved : item)) }));
      return saved;
    } catch {
      set((state) => ({ events: state.events.filter((item) => item.id !== event.id) }));
      return null;
    }
  },
  addAttendees: async (attendees) => {
    set((state) => ({ attendees: [...attendees, ...state.attendees] }));
    try {
      const { attendees: saved } = await jsonFetch<{ attendees: Attendee[] }>("/api/attendees", {
        method: "POST",
        body: JSON.stringify({ attendees }),
      });
      const optimisticIds = new Set(attendees.map((attendee) => attendee.id));
      set((state) => ({
        attendees: [...saved, ...state.attendees.filter((attendee) => !optimisticIds.has(attendee.id))],
      }));
      return saved;
    } catch {
      const optimisticIds = new Set(attendees.map((attendee) => attendee.id));
      set((state) => ({ attendees: state.attendees.filter((attendee) => !optimisticIds.has(attendee.id)) }));
      return [];
    }
  },
  updateAttendee: (attendee) =>
    set((state) => ({
      attendees: state.attendees.map((item) => (item.id === attendee.id ? attendee : item))
    })),
  logMeeting: async (meeting) => {
    set((state) => ({ meetings: [meeting, ...state.meetings] }));
    try {
      const { meeting: saved } = await jsonFetch<{ meeting: Meeting }>("/api/meetings", {
        method: "POST",
        body: JSON.stringify(meeting),
      });
      set((state) => ({ meetings: state.meetings.map((item) => (item.id === meeting.id ? saved : item)) }));
      return saved;
    } catch {
      return null;
    }
  },
  addMeetingRequest: async (req) => {
    set((state) => ({ meetingRequests: [req, ...state.meetingRequests.filter((item) => item.id !== req.id)] }));
    try {
      const { meetingRequest } = await jsonFetch<{ meetingRequest: MeetingRequest }>("/api/meeting-requests", {
        method: "POST",
        body: JSON.stringify(req),
      });
      set((state) => ({
        meetingRequests: [meetingRequest, ...state.meetingRequests.filter((item) => item.id !== req.id && item.id !== meetingRequest.id)],
      }));
      return meetingRequest;
    } catch {
      return null;
    }
  },
  removeMeetingRequest: async (id) => {
    const previous = get().meetingRequests;
    set({ meetingRequests: previous.filter((r) => r.id !== id) });
    try {
      await jsonFetch<{ ok: true }>(`/api/meeting-requests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      set({ meetingRequests: previous });
    }
  },
  facilitateMeetingRequest: async (id) => {
    const previous = get().meetingRequests;
    set({
      meetingRequests: previous.map((r) => (r.id === id ? { ...r, status: "facilitated" } : r)),
    });
    try {
      const { meetingRequest } = await jsonFetch<{ meetingRequest: MeetingRequest }>("/api/meeting-requests", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "facilitated" }),
      });
      set((state) => ({
        meetingRequests: state.meetingRequests.map((r) => (r.id === id ? meetingRequest : r)),
      }));
    } catch {
      set({ meetingRequests: previous });
    }
  },
  markRecommendationAction: (action) =>
    set((state) => {
      const timestamp = new Date().toISOString();
      const nextAction: RecommendationAction = {
        ...action,
        id: `ra-${Date.now()}`,
        createdAt: timestamp,
      };
      const withoutExisting = state.recommendationActions.filter(
        (item) =>
          !(
            item.eventId === action.eventId &&
            item.viewerId === action.viewerId &&
            item.targetId === action.targetId
          )
      );

      return {
        recommendationActions: [nextAction, ...withoutExisting],
        meetingRequests:
          action.action === "saved" &&
          !state.meetingRequests.some(
            (request) =>
              request.eventId === action.eventId &&
              request.requesterId === action.viewerId &&
              request.targetId === action.targetId
          )
            ? [
                {
                  id: `req-${Date.now()}`,
                  eventId: action.eventId,
                  requesterId: action.viewerId,
                  targetId: action.targetId,
                  note: action.note,
                  createdAt: timestamp,
                  status: "pending",
                },
                ...state.meetingRequests,
              ]
            : action.action === "skipped" || action.action === "met"
              ? state.meetingRequests.filter(
                  (request) =>
                    !(
                      request.eventId === action.eventId &&
                      request.requesterId === action.viewerId &&
                      request.targetId === action.targetId
                    )
                )
              : state.meetingRequests,
      };
    }),
  toggleCheckIn: async (eventId, attendeeId) => {
    const previous = get().checkIns;
    set((state) => {
      const exists = state.checkIns.some((c) => c.eventId === eventId && c.attendeeId === attendeeId);
      return {
        checkIns: exists
          ? state.checkIns.filter((c) => !(c.eventId === eventId && c.attendeeId === attendeeId))
          : [...state.checkIns, { id: `ci-${Date.now()}`, eventId, attendeeId, checkedInAt: new Date().toISOString() }],
      };
    });
    try {
      const { checkIn } = await jsonFetch<{ checkIn: CheckIn | null }>("/api/check-ins", {
        method: "POST",
        body: JSON.stringify({ eventId, attendeeId }),
      });
      set((state) => {
        const without = state.checkIns.filter((c) => !(c.eventId === eventId && c.attendeeId === attendeeId));
        return { checkIns: checkIn ? [checkIn, ...without] : without };
      });
    } catch {
      set({ checkIns: previous });
    }
  },
}));

export function useEvent(eventId: string) {
  return useAppStore((state) => state.events.find((event) => event.id === eventId || event.slug === eventId));
}

export function useEventAttendees(eventId: string) {
  return useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
}

export function useCurrentEventAttendee(eventId: string) {
  return useAppStore((state) => {
    const eventAttendees = state.attendees.filter((attendee) => attendee.eventId === eventId);
    const userEmail = state.user?.email.toLowerCase();
    return userEmail
      ? eventAttendees.find((attendee) => attendee.email.toLowerCase() === userEmail)
      : undefined;
  });
}

export function useRecommendations(eventId: string, attendeeId?: string) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((a) => a.eventId === eventId)));
  return useMemo(() => {
    if (!attendeeId) return [];
    const source = attendeeId ? attendees.find((a) => a.id === attendeeId) : attendees[0];
    return source ? scoreMatches(source, attendees) : [];
  }, [attendees, attendeeId]);
}
