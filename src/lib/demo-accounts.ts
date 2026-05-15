export const DEMO_PASSWORD = "ReloDemo2026!";

export const demoAccounts = [
  {
    label: "Admin operations demo",
    email: "organizer@relo.demo",
    password: DEMO_PASSWORD,
    name: "Ava Chen",
    role: "organizer" as const,
    description: "Full control-room workspace with seeded event data.",
  },
  {
    label: "Participant event demo",
    email: "participant@relo.demo",
    password: DEMO_PASSWORD,
    name: "Maya Patel",
    role: "attendee" as const,
    description: "Participant event space for browsing matches and logging meetings.",
  },
] satisfies DemoAccount[];

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
  name: string;
  role: "organizer" | "attendee";
  description: string;
};
