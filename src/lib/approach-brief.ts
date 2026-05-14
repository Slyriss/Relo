import type { Attendee, Event, MatchRecommendation } from "@/types";

export type ApproachBrief = {
  decision: "meet_now" | "save_for_later";
  whyNow: string;
  bestAngle: string;
  opener: string;
  suggestedAsk: string;
  mutualValue: string;
  avoid: string;
};

function primaryGoalLabel(attendee: Attendee) {
  const goal = attendee.goals[0] ?? "learning";
  return goal.replace("-", " ");
}

function goalVerb(goal: string) {
  switch (goal) {
    case "fundraising":
      return "capital, investor perspective, or a sharper fundraising narrative";
    case "customers":
      return "buyer feedback, design-partner signal, or a concrete customer intro";
    case "partnerships":
      return "distribution leverage, a co-sell path, or one shared relationship to test";
    case "hiring":
      return "talent insight, hiring-bar calibration, or a strong operator referral";
    default:
      return "a practical lesson, market read, or useful founder/operator pattern";
  }
}

function offerFor(source: Attendee, target: Attendee) {
  if (source.goals.includes("fundraising") && /venture|capital|invest/i.test(`${target.industry ?? ""} ${target.title}`)) {
    return `Offer a crisp traction snapshot from ${source.company} and ask what evidence would make the raise more credible.`;
  }
  if (source.goals.includes("customers")) {
    return `Offer a specific workflow you are testing at ${source.company}, then ask whether ${target.company} sees that pain.`;
  }
  if (source.goals.includes("partnerships")) {
    return `Offer one concrete co-marketing, intro, or pilot path that could benefit both ${source.company} and ${target.company}.`;
  }
  return `Offer one useful lesson from ${source.company}, then ask what ${target.company} is trying to learn from this room.`;
}

export function buildApproachBrief({
  source,
  target,
  event,
  match,
  isHere,
}: {
  source: Attendee;
  target: Attendee;
  event: Event;
  match: MatchRecommendation;
  isHere: boolean;
}): ApproachBrief {
  const sourceGoal = primaryGoalLabel(source);
  const targetGoal = primaryGoalLabel(target);
  const topReason = match.why[0] ?? "relevant background overlap";
  const sourceBenefit = goalVerb(source.goals[0] ?? "learning");
  const targetBenefit = goalVerb(target.goals[0] ?? "learning");
  const sharedIndustry =
    source.industry && target.industry && source.industry === target.industry
      ? `You both work around ${source.industry}.`
      : target.industry
        ? `${target.name} brings a ${target.industry} perspective.`
        : `${target.name}'s background is relevant to your event goals.`;

  return {
    decision: isHere || match.score >= 70 ? "meet_now" : "save_for_later",
    whyNow: isHere
      ? `${target.name} is checked in now, and the strongest signal is: ${topReason}.`
      : `${target.name} is a strong match for ${event.title}, but they are not checked in yet.`,
    bestAngle: `Best angle: trade ${sourceBenefit} for ${targetBenefit}.`,
    opener: `I saw you're focused on ${targetGoal}. I'm here for ${sourceGoal}. What would make this event genuinely useful for you?`,
    suggestedAsk: offerFor(source, target),
    mutualValue: `${sharedIndustry} A useful conversation would test whether ${source.company} and ${target.company} can exchange one practical intro, customer insight, hiring lead, or operating lesson.`,
    avoid: `Do not lead with the score or a generic pitch. Lead with the event context and one specific reason: ${topReason}.`,
  };
}
