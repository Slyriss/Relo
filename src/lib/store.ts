"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { demoAttendees, demoEvent, demoMeetings, demoOrg, demoUser } from "@/lib/demo-data";
import { scoreMatches } from "@/lib/ai/matching";
import type { Attendee, Event, Meeting, Organization, User } from "@/types";

type AppState = {
  user: User | null;
  organization: Organization;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
  loginDemo: () => void;
  createEvent: (event: Event) => void;
  addAttendees: (attendees: Attendee[]) => void;
  updateAttendee: (attendee: Attendee) => void;
  logMeeting: (meeting: Meeting) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: demoUser,
  organization: demoOrg,
  events: [demoEvent],
  attendees: demoAttendees,
  meetings: demoMeetings,
  loginDemo: () => set({ user: demoUser }),
  createEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  addAttendees: (attendees) => set((state) => ({ attendees: [...attendees, ...state.attendees] })),
  updateAttendee: (attendee) =>
    set((state) => ({
      attendees: state.attendees.map((item) => (item.id === attendee.id ? attendee : item))
    })),
  logMeeting: (meeting) => set((state) => ({ meetings: [meeting, ...state.meetings] }))
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
