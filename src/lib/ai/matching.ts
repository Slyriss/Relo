import type { Attendee, Goal, MatchRecommendation } from "@/types";

const complementaryGoals: Record<Goal, Goal[]> = {
  fundraising: ["learning", "partnerships"],
  hiring: ["learning", "customers"],
  partnerships: ["customers", "fundraising"],
  customers: ["partnerships", "learning"],
  learning: ["fundraising", "hiring", "customers", "partnerships"]
};

const roleSignals = ["founder", "partner", "principal", "vp", "head", "lead", "manager", "cfo", "coo"];

export function scoreMatch(source: Attendee, target: Attendee): MatchRecommendation {
  if (source.id === target.id) {
    return { attendeeId: source.id, targetId: target.id, score: 0, why: [] };
  }

  let score = 20;
  const why: string[] = [];
  const sharedGoals = source.goals.filter((goal) => target.goals.includes(goal));
  const complementary = source.goals.filter((goal) =>
    complementaryGoals[goal].some((targetGoal) => target.goals.includes(targetGoal))
  );

  if (sharedGoals.length) {
    score += sharedGoals.length * 12;
    why.push(`Shared focus on ${sharedGoals.join(", ")}`);
  }

  if (complementary.length) {
    score += complementary.length * 16;
    why.push("Goals are complementary for a useful exchange");
  }

  if (source.industry && source.industry === target.industry) {
    score += 14;
    why.push(`Both operate in ${source.industry}`);
  } else if (source.industry && target.industry) {
    score += 6;
    why.push(`${target.industry} perspective adds useful diversity`);
  }

  if (source.goals.includes("fundraising") && /venture|capital|invest/i.test(`${target.industry} ${target.title}`)) {
    score += 14;
    why.push("Investor perspective fits fundraising goals");
  }

  const sourceRole = source.title.toLowerCase();
  const targetRole = target.title.toLowerCase();
  if (roleSignals.some((role) => sourceRole.includes(role) || targetRole.includes(role))) {
    score += 8;
  }

  const seniorityGap = Math.abs((source.seniority ?? 3) - (target.seniority ?? 3));
  if (seniorityGap >= 2) {
    score += 8;
    why.push("Seniority mix supports mentorship or buying insight");
  }

  const diversityBonus = stableBonus(`${source.id}:${target.id}`) % 10;
  score += diversityBonus;

  return {
    attendeeId: source.id,
    targetId: target.id,
    score: Math.min(100, score),
    why: why.length ? why : ["Relevant background and event goals"]
  };
}

export function scoreMatches(source: Attendee, attendees: Attendee[]) {
  return attendees
    .filter((attendee) => attendee.id !== source.id)
    .map((attendee) => scoreMatch(source, attendee))
    .sort((a, b) => b.score - a.score);
}

function stableBonus(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
