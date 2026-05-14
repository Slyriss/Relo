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
  const action = meeting.promisedAction
    ? `I have it down that the next step is: ${meeting.promisedAction}.`
    : "I would love to keep the thread going while it is fresh.";
  const timing = meeting.dueDate ? ` I marked ${meeting.dueDate} as the follow-up date.` : "";
  return `Hi ${recipient.name.split(" ")[0]}, great meeting you at Relo Summit. I enjoyed hearing about ${recipient.company} and especially noted: ${meeting.topic || meeting.note || "the overlap in our goals"}. ${action}${timing} Would you be open to a 20-minute follow-up next week to compare notes and see where ${sender.company} and ${recipient.company} can help each other?`;
}
