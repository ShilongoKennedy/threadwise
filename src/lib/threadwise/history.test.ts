import { describe, expect, it } from "vitest";
import { createNodeData } from "./model";
import { describeChange } from "./history";
import type { TEdge, TNode } from "./store";

const node = (id: string, title: string, x = 0, y = 0): TNode => ({
  id,
  type: "thread",
  position: { x, y },
  data: { ...createNodeData("idea", id), title },
});

const edge = (id: string, source: string, target: string): TEdge => ({
  id,
  source,
  target,
  type: "relation",
  data: { relation: "leads_to" },
});

describe("undo step labels", () => {
  it("names a single added card by its title", () => {
    const a = node("a", "The ceasefire holds");
    expect(describeChange({ nodes: [], edges: [] }, { nodes: [a], edges: [] })).toBe(
      "Added The ceasefire holds",
    );
  });

  it("counts a batch of additions instead of listing them", () => {
    const a = node("a", "One");
    const b = node("b", "Two");
    expect(describeChange({ nodes: [], edges: [] }, { nodes: [a, b], edges: [] })).toBe(
      "Added 2 cards",
    );
  });

  it("reports deletions by title", () => {
    const a = node("a", "Missing context");
    expect(describeChange({ nodes: [a], edges: [] }, { nodes: [], edges: [] })).toBe(
      "Deleted Missing context",
    );
  });

  it("separates connecting from removing a cord", () => {
    const a = node("a", "One");
    const b = node("b", "Two");
    const cord = edge("e1", "a", "b");
    expect(describeChange({ nodes: [a, b], edges: [] }, { nodes: [a, b], edges: [cord] })).toBe(
      "Connected a cord",
    );
    expect(describeChange({ nodes: [a, b], edges: [cord] }, { nodes: [a, b], edges: [] })).toBe(
      "Removed a cord",
    );
  });

  it("prefers an edit over a move when both happened", () => {
    const before = node("a", "Claim");
    const edited: TNode = {
      ...before,
      position: { x: 40, y: 0 },
      data: { ...before.data, title: "Claim, revised" },
    };
    expect(describeChange({ nodes: [before], edges: [] }, { nodes: [edited], edges: [] })).toBe(
      "Edited Claim, revised",
    );
  });

  it("truncates a long title rather than overflowing the tooltip", () => {
    const long = node("a", "A claim that runs on for far longer than any tooltip should show");
    expect(describeChange({ nodes: [], edges: [] }, { nodes: [long], edges: [] }).length).toBeLessThan(48);
  });
});
