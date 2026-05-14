import { scoreMatches } from "@/lib/ai/matching";
import type { Attendee, Goal, Meeting } from "@/types";

export type GraphNode = {
  id: string;
  name: string;
  company: string;
  primaryGoal: string;
  meetingCount: number;
  communityId?: string;
  influence?: number;
  bridgeScore?: number;
  status?: "connector" | "broker" | "active" | "isolated";
  x: number;
  y: number;
  r: number;
};

export type GraphEdge = {
  id: string;
  sourceId?: string;
  targetId?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  note: string;
  weight?: number;
  kind?: "meeting" | "suggested";
};

export type GraphifyCommunity = {
  id: string;
  label: string;
  color: string;
  attendeeIds: string[];
  meetingCount: number;
  density: number;
};

export type GraphifyInsight = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type GraphifiedNetwork = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  suggestedEdges: GraphEdge[];
  communities: GraphifyCommunity[];
  insights: GraphifyInsight[];
  stats: {
    attendeeCount: number;
    meetingCount: number;
    connectedCount: number;
    isolatedCount: number;
    density: number;
    communityCount: number;
  };
  cx: number;
  cy: number;
};

export const GOAL_COLOR: Record<string, string> = {
  fundraising: "#f97316",
  hiring:       "#8b5cf6",
  partnerships: "#06b6d4",
  customers:    "#22c55e",
  learning:     "#3b82f6"
};

const GOAL_LABEL: Record<Goal | string, string> = {
  fundraising: "Raising",
  hiring: "Hiring",
  partnerships: "Partnerships",
  customers: "Customers",
  learning: "Learning",
};

function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function buildAdjacency(attendeeIds: string[], meetings: Meeting[]) {
  const adjacency = new Map<string, Set<string>>();
  const pairWeights = new Map<string, number>();

  for (const id of attendeeIds) adjacency.set(id, new Set());

  for (const meeting of meetings) {
    if (!adjacency.has(meeting.attendeeAId) || !adjacency.has(meeting.attendeeBId)) continue;
    adjacency.get(meeting.attendeeAId)!.add(meeting.attendeeBId);
    adjacency.get(meeting.attendeeBId)!.add(meeting.attendeeAId);
    const key = pairKey(meeting.attendeeAId, meeting.attendeeBId);
    pairWeights.set(key, (pairWeights.get(key) ?? 0) + 1);
  }

  return { adjacency, pairWeights };
}

function findCommunities(attendees: Attendee[], adjacency: Map<string, Set<string>>) {
  const byId = new Map(attendees.map((attendee) => [attendee.id, attendee]));
  const visited = new Set<string>();
  const communities: Array<{ id: string; attendeeIds: string[] }> = [];

  for (const attendee of attendees) {
    if (visited.has(attendee.id)) continue;

    const queue = [attendee.id];
    const ids: string[] = [];
    visited.add(attendee.id);

    while (queue.length > 0) {
      const id = queue.shift()!;
      ids.push(id);

      for (const neighbor of adjacency.get(id) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    const dominantGoal = ids
      .map((id) => byId.get(id)?.goals[0] ?? "learning")
      .sort((a, b) => {
        const aCount = ids.filter((id) => byId.get(id)?.goals[0] === a).length;
        const bCount = ids.filter((id) => byId.get(id)?.goals[0] === b).length;
        return bCount - aCount || a.localeCompare(b);
      })[0];

    communities.push({ id: `${dominantGoal}-${communities.length + 1}`, attendeeIds: ids });
  }

  return communities.sort((a, b) => b.attendeeIds.length - a.attendeeIds.length);
}

function shortestPathCount(start: string, end: string, adjacency: Map<string, Set<string>>) {
  if (start === end) return 0;

  const queue: Array<{ id: string; distance: number }> = [{ id: start, distance: 0 }];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current.id) ?? []) {
      if (neighbor === end) return current.distance + 1;
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push({ id: neighbor, distance: current.distance + 1 });
    }
  }

  return Number.POSITIVE_INFINITY;
}

function bridgeScore(id: string, attendeeIds: string[], adjacency: Map<string, Set<string>>) {
  const neighbors = [...(adjacency.get(id) ?? [])];
  if (neighbors.length < 2) return 0;

  let separatedPairs = 0;
  const reduced = new Map([...adjacency].map(([nodeId, edges]) => [nodeId, new Set(edges)]));
  for (const neighbor of neighbors) reduced.get(neighbor)?.delete(id);
  reduced.set(id, new Set());

  for (let i = 0; i < neighbors.length; i++) {
    for (let j = i + 1; j < neighbors.length; j++) {
      if (!Number.isFinite(shortestPathCount(neighbors[i], neighbors[j], reduced))) {
        separatedPairs++;
      }
    }
  }

  const possible = (attendeeIds.length - 1) * (attendeeIds.length - 2) * 0.5;
  return possible > 0 ? separatedPairs / possible : 0;
}

export function graphifyEventNetwork(attendees: Attendee[], meetings: Meeting[], size = 560): GraphifiedNetwork {
  const cx = size / 2;
  const cy = size / 2;
  const attendeeIds = attendees.map((attendee) => attendee.id);
  const attendeeById = new Map(attendees.map((attendee) => [attendee.id, attendee]));
  const { adjacency, pairWeights } = buildAdjacency(attendeeIds, meetings);
  const rawCommunities = findCommunities(attendees, adjacency);
  const communityByAttendee = new Map<string, string>();
  const communityAngle = new Map<string, number>();
  const communityCount = Math.max(rawCommunities.length, 1);

  rawCommunities.forEach((community, index) => {
    const angle = (2 * Math.PI * index) / communityCount - Math.PI / 2;
    communityAngle.set(community.id, angle);
    for (const attendeeId of community.attendeeIds) communityByAttendee.set(attendeeId, community.id);
  });

  const possibleEdges = attendees.length * (attendees.length - 1) * 0.5;
  const density = possibleEdges > 0 ? pairWeights.size / possibleEdges : 0;
  const maxDegree = Math.max(1, ...attendeeIds.map((id) => adjacency.get(id)?.size ?? 0));
  const communityRadius = rawCommunities.length <= 1 ? 0 : size * 0.22;
  const localRadius = size * 0.17;

  const nodes: GraphNode[] = attendees.map((attendee, index) => {
    const communityId = communityByAttendee.get(attendee.id) ?? "unclustered";
    const community = rawCommunities.find((item) => item.id === communityId);
    const communityIndex = Math.max(0, community?.attendeeIds.indexOf(attendee.id) ?? index);
    const localCount = Math.max(community?.attendeeIds.length ?? attendees.length, 1);
    const localAngle = (2 * Math.PI * communityIndex) / localCount - Math.PI / 2;
    const angle = communityAngle.get(communityId) ?? localAngle;
    const degree = adjacency.get(attendee.id)?.size ?? 0;
    const bridge = bridgeScore(attendee.id, attendeeIds, adjacency);
    const influence = Math.round(((degree / maxDegree) * 70 + Math.min(bridge * 100, 30)) * 10) / 10;
    const baseX = cx + communityRadius * Math.cos(angle);
    const baseY = cy + communityRadius * Math.sin(angle);
    const isolatedNudge = degree === 0 ? size * 0.08 : 0;

    return {
      id: attendee.id,
      name: attendee.name,
      company: attendee.company,
      primaryGoal: attendee.goals[0] ?? "learning",
      meetingCount: meetings.filter(
        (meeting) => meeting.attendeeAId === attendee.id || meeting.attendeeBId === attendee.id
      ).length,
      communityId,
      influence,
      bridgeScore: Math.round(bridge * 1000) / 1000,
      status: degree === 0 ? "isolated" : bridge > 0 ? "broker" : degree >= maxDegree ? "connector" : "active",
      x: baseX + (localRadius + isolatedNudge) * Math.cos(localAngle),
      y: baseY + (localRadius + isolatedNudge) * Math.sin(localAngle),
      r: 9 + Math.min(18, degree * 4 + influence / 12),
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges: GraphEdge[] = meetings.map((meeting) => {
    const source = nodeById.get(meeting.attendeeAId);
    const target = nodeById.get(meeting.attendeeBId);
    const weight = pairWeights.get(pairKey(meeting.attendeeAId, meeting.attendeeBId)) ?? 1;
    return {
      id: meeting.id,
      sourceId: meeting.attendeeAId,
      targetId: meeting.attendeeBId,
      x1: source?.x ?? cx,
      y1: source?.y ?? cy,
      x2: target?.x ?? cx,
      y2: target?.y ?? cy,
      note: meeting.note,
      weight,
      kind: "meeting",
    };
  });

  const suggestedEdges: GraphEdge[] = getMissedConnections(attendees, meetings, 6).map((connection) => {
    const source = nodeById.get(connection.source.id);
    const target = nodeById.get(connection.target.id);
    return {
      id: `suggested-${connection.source.id}-${connection.target.id}`,
      sourceId: connection.source.id,
      targetId: connection.target.id,
      x1: source?.x ?? cx,
      y1: source?.y ?? cy,
      x2: target?.x ?? cx,
      y2: target?.y ?? cy,
      note: connection.why[0] ?? "High-scoring intro opportunity",
      weight: connection.score,
      kind: "suggested",
    };
  });

  const communities: GraphifyCommunity[] = rawCommunities.map((community) => {
    const communityMeetings = meetings.filter(
      (meeting) => community.attendeeIds.includes(meeting.attendeeAId) && community.attendeeIds.includes(meeting.attendeeBId)
    );
    const possibleCommunityEdges = community.attendeeIds.length * (community.attendeeIds.length - 1) * 0.5;
    const dominantGoal = attendeeById.get(community.attendeeIds[0])?.goals[0] ?? "learning";
    return {
      id: community.id,
      label:
        community.attendeeIds.length === 1
          ? `${GOAL_LABEL[dominantGoal]} solo`
          : `${GOAL_LABEL[dominantGoal]} cluster`,
      color: GOAL_COLOR[dominantGoal] ?? "#94a3b8",
      attendeeIds: community.attendeeIds,
      meetingCount: communityMeetings.length,
      density: possibleCommunityEdges > 0 ? communityMeetings.length / possibleCommunityEdges : 0,
    };
  });

  const connectedCount = attendeeIds.filter((id) => (adjacency.get(id)?.size ?? 0) > 0).length;
  const isolated = nodes.filter((node) => node.status === "isolated");
  const topConnector = [...nodes].sort((a, b) => (b.influence ?? 0) - (a.influence ?? 0))[0];
  const topCommunity = [...communities].sort((a, b) => b.attendeeIds.length - a.attendeeIds.length)[0];
  const insights: GraphifyInsight[] = [
    {
      id: "coverage",
      label: "Coverage",
      value: `${connectedCount}/${attendees.length}`,
      detail: `${isolated.length} attendee${isolated.length === 1 ? "" : "s"} have not been pulled into the live network yet.`,
    },
    {
      id: "density",
      label: "Density",
      value: `${Math.round(density * 100)}%`,
      detail: "Share of possible attendee relationships already logged as meetings.",
    },
    {
      id: "connector",
      label: "Key connector",
      value: topConnector?.name.split(" ")[0] ?? "None",
      detail: topConnector ? `${topConnector.company} has the strongest current network position.` : "No meeting data yet.",
    },
    {
      id: "cluster",
      label: "Largest cluster",
      value: topCommunity ? `${topCommunity.attendeeIds.length}` : "0",
      detail: topCommunity ? `${topCommunity.label} is the most active relationship pocket.` : "No communities detected yet.",
    },
  ];

  return {
    nodes,
    edges,
    suggestedEdges,
    communities,
    insights,
    stats: {
      attendeeCount: attendees.length,
      meetingCount: meetings.length,
      connectedCount,
      isolatedCount: isolated.length,
      density,
      communityCount: communities.length,
    },
    cx,
    cy,
  };
}

export function buildNetworkGraph(attendees: Attendee[], meetings: Meeting[], size = 560) {
  const { nodes, edges, cx, cy } = graphifyEventNetwork(attendees, meetings, size);
  return { nodes, edges, cx, cy };
}

// High-scoring pairs that have never had a logged meeting
export function getMissedConnections(attendees: Attendee[], meetings: Meeting[], limit = 5) {
  const metPairs = new Set(meetings.map((m) => [m.attendeeAId, m.attendeeBId].sort().join(":")));
  const seen = new Set<string>();
  const missed: Array<{ source: Attendee; target: Attendee; score: number; why: string[] }> = [];

  for (const source of attendees) {
    for (const match of scoreMatches(source, attendees).slice(0, 4)) {
      const key = [source.id, match.targetId].sort().join(":");
      if (metPairs.has(key) || seen.has(key)) continue;
      seen.add(key);
      const target = attendees.find((a) => a.id === match.targetId);
      if (target) missed.push({ source, target, score: match.score, why: match.why });
    }
  }

  return missed.sort((a, b) => b.score - a.score).slice(0, limit);
}
