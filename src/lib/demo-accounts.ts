export const DEMO_PASSWORD = "ReloDemo2026!";

export const demoAccounts = [
  {
    label: "Organizer",
    email: "organizer@relo.demo",
    password: DEMO_PASSWORD,
    name: "Ava Chen",
    role: "organizer" as const,
    description: "Full admin workspace with seeded event data.",
  },
  {
    label: "Participant",
    email: "participant@relo.demo",
    password: DEMO_PASSWORD,
    name: "Maya Patel",
    role: "attendee" as const,
    description: "Attendee view for browsing matches and logging meetings.",
  },
];
