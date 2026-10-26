import { describe, it, expect } from "vitest";
import { batchPairs, mergeGraph, simulate, topology, graphSvg } from "./advanced";
import { createNodeData } from "./model";
import type { TNode, TEdge } from "./store";
const node = (id: string): TNode => ({
  id,
  type: "thread",
  position: { x: 0, y: 0 },
  data: createNodeData("idea", id),
});
const edge = (a: string, b: string): TEdge => ({
  id: a + b,
  source: b,
  target: a,
  type: "relation",
  data: { relation: "depends_on" },
});
describe("advanced canvas rules", () => {
  it("reverses dependencies and excludes supporting evidence from scheduling", () => {
    const t = topology([node("a"), node("b")], [edge("a", "b")]);
    expect(t.order).toEqual(["a", "b"]);
    expect(t.depth["b"]).toBe(1);
    expect(
      topology([node("a"), node("b")], [{ ...edge("a", "b"), data: { relation: "supports" } }])
        .depth["b"],
    ).toBe(0);
  });
  it("reports circular dependencies rather than manufacturing a critical path", () => {
    expect(topology([node("a"), node("b")], [edge("a", "b"), edge("b", "a")]).blocked).toEqual([
      "a",
      "b",
    ]);
    expect(() =>
      simulate([node("a"), node("b")], [edge("a", "b"), edge("b", "a")], { a: 1, b: 1 }),
    ).toThrow();
  });
  it("samples shared prerequisites once per trial and honors 0 and 100 percent", () => {
    expect(
      simulate(
        [node("a"), node("b"), node("c")],
        [edge("a", "b"), edge("a", "c")],
        { a: 0, b: 1, c: 1 },
        10,
        () => 0.5,
      ).map((r) => r.rate),
    ).toEqual([0, 0, 0]);
    expect(
      simulate([node("a"), node("b")], [edge("a", "b")], { a: 1, b: 1 }, 10, () => 0.5).map(
        (r) => r.rate,
      ),
    ).toEqual([1, 1]);
  });
  it("keeps both changes until a merge conflict is explicitly chosen", () => {
    const a = node("a");
    const ours = { ...a, data: { ...a.data, title: "Ours" } },
      theirs = { ...a, data: { ...a.data, title: "Theirs" } };
    const m = mergeGraph(
      { nodes: [a], edges: [] },
      { nodes: [ours], edges: [] },
      { nodes: [theirs], edges: [] },
    );
    expect(m.conflicts).toHaveLength(1);
    expect(
      mergeGraph(
        { nodes: [a], edges: [] },
        { nodes: [ours], edges: [] },
        { nodes: [theirs], edges: [] },
        { "card:a": "theirs" },
      ).nodes[0]?.data.title,
    ).toBe("Theirs");
  });
  it("merges nonconflicting additions and deletes dangling threads", () => {
    expect(
      mergeGraph(
        { nodes: [node("a"), node("b")], edges: [edge("a", "b")] },
        { nodes: [node("a")], edges: [edge("a", "b")] },
        { nodes: [node("a"), node("b"), node("c")], edges: [edge("a", "b")] },
      ).edges,
    ).toEqual([]);
  });
  it("weaves unique chain, fan and all-pairs connections", () => {
    expect(batchPairs(["a", "b", "c", "a"], "chain")).toEqual([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
    expect(batchPairs(["a", "b", "c"], "fan")).toHaveLength(2);
    expect(batchPairs(["a", "b", "c"], "all")).toHaveLength(3);
  });
  it("escapes untrusted text in vector exports", () => {
    expect(
      graphSvg(
        [{ ...node("a"), data: { ...node("a").data, title: "<script>bad</script>" } }],
        [],
        "Canvas",
      ),
    ).not.toContain("<script>");
  });
});
