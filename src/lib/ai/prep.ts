import type { Attendee } from "@/types";

export function mockPrep({ source, target }: { source: Attendee; target: Attendee }): string[] {
  const sharedGoals = source.goals.filter((g) => target.goals.includes(g));
  const whyLine = sharedGoals.length
    ? `You both care about ${sharedGoals.join(" and ")} — anchor there first.`
    : `Your goals are complementary: you're on ${source.goals[0]} while they're focused on ${target.goals[0]}.`;

  return [
    `${target.name} is ${target.title} at ${target.company} — ${target.bio.slice(0, 90)}.`,
    whyLine,
    `Good opener: "What's the one outcome you're optimizing for at this event?" Then share yours.`
  ];
}
