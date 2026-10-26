import { describe, it, expect } from "vitest";
import {
  templateGraph,
  TEMPLATES,
  analyzeDecision,
  scheduleEvents,
  executionNodes,
  type Decision,
} from "./planning";
describe("leadership planning rules", () => {
  it("creates all five guided templates as independent graphs", () => {
    expect(TEMPLATES).toHaveLength(5);
    for (const t of TEMPLATES) {
      const a = templateGraph(t.id),
        b = templateGraph(t.id);
      expect(a.nodes).toHaveLength(5);
      expect(
        a.edges.every(
          (e) => a.nodes.some((n) => n.id === e.source) && a.nodes.some((n) => n.id === e.target),
        ),
      ).toBe(true);
      expect(a.nodes[0]?.id).not.toBe(b.nodes[0]?.id);
    }
  });
  it("counts evidence separately from assumptions across connected paths", () => {
    const g = templateGraph("business");
    const a = analyzeDecision([g.nodes[0]?.id ?? ""], g.nodes, g.edges);
    expect(a.evidence).toHaveLength(2);
    expect(a.uncertain).toHaveLength(3);
    expect(a.faults).toBeGreaterThan(0);
  });
  it("includes experiment deadlines and review check-ins, excludes invalid dates", () => {
    const g = templateGraph("personal");
    const n = g.nodes[3];
    if (!n) throw new Error("missing experiment");
    n.data.meta = { dueDate: "2026-11-10", reviewDate: "2026-11-12", startDate: "invalid" };
    const events = scheduleEvents(g.nodes, []);
    expect(events.map((e) => e.date)).toEqual(["2026-11-10", "2026-11-12"]);
    expect(events[0]?.start).toBe("2026-11-10");
  });
  it("converts scoped paths to ordered experiments and actions only", () => {
    const g = templateGraph("product");
    const d = { nodeIds: g.nodes.map((n) => n.id) } as Decision;
    expect(executionNodes(d, g.nodes, g.edges).map((n) => n.data.kind)).toEqual([
      "experiment",
      "action",
    ]);
  });
});
