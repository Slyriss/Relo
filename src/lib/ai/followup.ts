import type { Attendee, Meeting } from "@/types";

export function mockFollowup({
  meeting,
  sender,
  recipient
}: {
  meeting: Meeting;
  sender: Attendee;
  recipient: Attendee;
}) {
  return `Hi ${recipient.name.split(" ")[0]}, great meeting you at Relo Summit. I enjoyed hearing about ${recipient.company} and especially noted: ${meeting.note || "the overlap in our goals"}. Would you be open to a 20-minute follow-up next week to compare notes and see where ${sender.company} and ${recipient.company} can help each other?`;
}
