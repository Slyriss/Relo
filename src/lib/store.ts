"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  demoAttendees, demoCheckIns, demoEvent, demoMeetingRequests, demoMeetings, demoOrg, demoUser,
  pastEvent1, pastEvent2,
  pastAttendees1, pastAttendees2,
  pastMeetings
} from "@/lib/demo-data";
import { scoreMatches } from "@/lib/ai/matching";
import type { Attendee, CheckIn, CrawlStatus, Event, Meeting, MeetingRequest, Organization, ProfileVisibility, RecommendationAction, User } from "@/types";

type AppState = {
  user: User | null;
  organization: Organization;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  recommendationActions: RecommendationAction[];
  checkIns: CheckIn[];
  loginDemo: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setVisibility: (field: keyof ProfileVisibility, value: boolean) => void;
  setCrawlStatus: (status: CrawlStatus) => void;
  createEvent: (event: Event) => void;
  addAttendees: (attendees: Attendee[]) => void;
  updateAttendee: (attendee: Attendee) => void;
  logMeeting: (meeting: Meeting) => void;
  addMeetingRequest: (req: MeetingRequest) => void;
  removeMeetingRequest: (id: string) => void;
  facilitateMeetingRequest: (id: string) => void;
  markRecommendationAction: (action: Omit<RecommendationAction, "id" | "createdAt"> & { note?: string }) => void;
  toggleCheckIn: (eventId: string, attendeeId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: demoUser,
  organization: demoOrg,
  events: [demoEvent, pastEvent1, pastEvent2],
  attendees: [...demoAttendees, ...pastAttendees1, ...pastAttendees2],
  meetings: [...demoMeetings, ...pastMeetings],
  meetingRequests: demoMeetingRequests,
  recommendationActions: [],
  checkIns: demoCheckIns,
  loginDemo: () => set({ user: demoUser }),
  logout: () => set({ user: null }),
  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : state.user })),
  setVisibility: (field, value) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, visibility: { ...state.user.visibility, [field]: value } }
        : state.user,
    })),
  setCrawlStatus: (status) =>
    set((state) => ({ user: state.user ? { ...state.user, crawlStatus: status } : state.user })),
  createEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  addAttendees: (attendees) => set((state) => ({ attendees: [...attendees, ...state.attendees] })),
  updateAttendee: (attendee) =>
    set((state) => ({
      attendees: state.attendees.map((item) => (item.id === attendee.id ? attendee : item))
    })),
  logMeeting: (meeting) => set((state) => ({ meetings: [meeting, ...state.meetings] })),
  addMeetingRequest: (req) =>
    set((state) => ({ meetingRequests: [req, ...state.meetingRequests] })),
  removeMeetingRequest: (id) =>
    set((state) => ({ meetingRequests: state.meetingRequests.filter((r) => r.id !== id) })),
  facilitateMeetingRequest: (id) =>
    set((state) => ({
      meetingRequests: state.meetingRequests.map((r) =>
        r.id === id ? { ...r, status: "facilitated" } : r
      ),
    })),
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
  toggleCheckIn: (eventId, attendeeId) =>
    set((state) => {
      const exists = state.checkIns.some((c) => c.eventId === eventId && c.attendeeId === attendeeId);
      return {
        checkIns: exists
          ? state.checkIns.filter((c) => !(c.eventId === eventId && c.attendeeId === attendeeId))
          : [...state.checkIns, { id: `ci-${Date.now()}`, eventId, attendeeId, checkedInAt: new Date().toISOString() }],
      };
    }),
}));

export function useEvent(eventId: string) {
  return useAppStore((state) => state.events.find((event) => event.id === eventId || event.slug === eventId));
}

export function useEventAttendees(eventId: string) {
  return useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
}

export function useRecommendations(eventId: string, attendeeId = "att-1") {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((a) => a.eventId === eventId)));
  return useMemo(() => {
    const source = attendees.find((a) => a.id === attendeeId) ?? attendees[0];
    return source ? scoreMatches(source, attendees) : [];
  }, [attendees, attendeeId]);
}
