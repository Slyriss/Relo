import { describe, expect, it } from "vitest";
import { demoAttendees, demoMeetings } from "@/lib/demo-data";
import { graphifyEventNetwork } from "@/lib/graph";

describe("graphify event network", () => {
  it("builds analyzable graph nodes, meeting edges, and suggested intro edges", () => {
    const graph = graphifyEventNetwork(demoAttendees, demoMeetings, 320);

    expect(graph.nodes).toHaveLength(demoAttendees.length);
    expect(graph.edges).toHaveLength(demoMeetings.length);
    expect(graph.suggestedEdges.length).toBeGreaterThan(0);
    expect(graph.stats.connectedCount).toBe(6);
    expect(graph.stats.isolatedCount).toBe(demoAttendees.length - 6);
  });

  it("marks attendees with meeting activity as active graph participants", () => {
    const graph = graphifyEventNetwork(demoAttendees, demoMeetings, 320);
    const maya = graph.nodes.find((node) => node.id === "att-1");
    const sam = graph.nodes.find((node) => node.id === "att-4");

    expect(maya?.meetingCount).toBe(1);
    expect(maya?.status).not.toBe("isolated");
    expect(sam?.status).toBe("isolated");
  });

  it("keeps suggested edges distinct from logged meeting edges", () => {
    const graph = graphifyEventNetwork(demoAttendees, demoMeetings, 320);
    const meetingPairs = new Set(graph.edges.map((edge) => [edge.sourceId, edge.targetId].sort().join(":")));

    expect(graph.suggestedEdges.every((edge) => edge.kind === "suggested")).toBe(true);
    expect(graph.suggestedEdges.some((edge) => meetingPairs.has([edge.sourceId, edge.targetId].sort().join(":")))).toBe(false);
  });
});
