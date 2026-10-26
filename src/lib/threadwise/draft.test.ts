import { describe, expect, it } from "vitest";
import { draftToMarkdown, type DraftBlock } from "./draft";
import { createNodeData } from "./model";
import type { TNode } from "./store";

describe("canvas-to-prose transclusion", () => {
  const node = (title: string, metrics: string): TNode => ({ id: "x", type: "thread", position: { x: 0, y: 0 }, data: { ...createNodeData("experiment", title), meta: { metrics } } });
  const blocks: DraftBlock[] = [{ id: "p", type: "prose", text: "Intro" }, { id: "c", type: "card", nodeId: "x" }];
  it("exports the card's current canvas content, so canvas edits flow into the prose", () => {
    expect(draftToMarkdown(blocks, [node("Pilot", "20% retention")])).toContain("20% retention");
    const later = draftToMarkdown(blocks, [node("Pilot v2", "35% retention")]);
    expect(later).toContain("Pilot v2");
    expect(later).not.toContain("20% retention");
  });
  it("flags cards deleted from the canvas", () => {
    expect(draftToMarkdown(blocks, [])).toContain("Card removed");
  });
});
