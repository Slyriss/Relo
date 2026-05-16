export const demoAccounts = [
  {
    label: "Admin QA account",
    email: "admin@relo.demo",
    password: "admin123",
    name: "Ava Chen",
    role: "organizer" as const,
    description: "Full control-room workspace with seeded event data.",
  },
  {
    label: "Participant QA account",
    email: "participant@relo.demo",
    password: "participant123",
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
