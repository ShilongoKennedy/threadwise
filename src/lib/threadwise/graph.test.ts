import { beforeEach, describe, expect, it } from "vitest";
import { auditGraph, graduationCandidates, neighborhood, relationshipForce } from "./graph";
import { createNodeData, type Epistemic, type ThreadNodeType } from "./model";
import { useThread, type TEdge, type TNode } from "./store";
import { createPhysics } from "./physics";

const node = (id: string, kind: ThreadNodeType, epistemic: Epistemic): TNode => ({ id, type: "thread", position: { x: 0, y: 0 }, data: { ...createNodeData(kind, id), epistemic } });
const edge = (source: string, target: string, relation: "leads_to" | "depends_on" = "leads_to"): TEdge => ({ id: `${source}-${target}`, source, target, type: "relation", data: { relation } });
const nodes = () => [node("idea", "idea", "fact"), node("belief", "note", "assumption"), node("test", "experiment", "hypothesis"), node("action", "action", "fact")];
const edges = [edge("idea", "belief"), edge("belief", "test"), edge("test", "action")];

describe("semantic rules", () => {
  beforeEach(() => { useThread.setState({ nodes: nodes(), edges, history: [], ghosts: [], replayIndex: null, pendingExperiment: null }); });
  it("supports and depends_on attract more closely than contradictions", () => {
    expect(relationshipForce("supports")).toEqual({ distance: 345, strength: 0.25 });
    expect(relationshipForce("depends_on")).toEqual(relationshipForce("supports"));
    expect(relationshipForce("contradicts").distance).toBeGreaterThan(relationshipForce("supports").distance);
  });
  it("the proven simulation keeps positions finite and separates overlapping cards", () => {
    const engine = createPhysics(nodes(), edges); engine.simulation.tick(200);
    const positions = Object.values(engine.positions());
    expect(positions.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(new Set(positions.map((p) => `${p.x},${p.y}`)).size).toBe(4);
  });
  it("selection includes exactly first and second degree, not third degree", () => {
    expect([...neighborhood("idea", edges).nodeIds]).toEqual(["idea", "belief", "test"]);
    expect(neighborhood("idea", edges).edgeIds.has("test-action")).toBe(false);
  });
  it("unverified assumptions without a validated intervening experiment flag the action", () => {
    expect(auditGraph(nodes(), edges).some((f) => f.actionId === "action")).toBe(true);
  });
  it("unknowns also flag action chains", () => {
    const ns = nodes(); const belief = ns.find((n) => n.id === "belief"); if (belief) belief.data.epistemic = "unknown";
    expect(auditGraph(ns, [edge("idea", "belief"), edge("belief", "action")])[0]?.uncertainId).toBe("belief");
  });
  it("a validated completed experiment interrupts a fault line", () => {
    const ns = nodes(); const exp = ns.find((n) => n.id === "test"); if (exp) exp.data.meta = { status: "completed", result: "validated" };
    expect(auditGraph(ns, edges)).toEqual([]);
  });
  it("dependency direction is reversed for upstream beliefs", () => {
    expect(graduationCandidates("test", nodes(), [edge("test", "belief", "depends_on")]).map((n) => n.id)).toEqual(["belief"]);
  });
  it("high risk steps also reveal untested upstream assumptions", () => {
    const ns = nodes(); const experiment = ns.find((n) => n.id === "test"); if (experiment) { experiment.data.epistemic = "evidence"; experiment.data.lenses.risk = 3; }
    expect(auditGraph(ns, edges).some((f) => f.actionId === "test" && f.uncertainId === "belief")).toBe(true);
  });
  it("completion asks for an outcome and cancel leaves the original status", () => {
    const s = useThread.getState(); s.updateNode("test", (d) => ({ ...d, meta: { ...d.meta, status: "completed" } }));
    expect(useThread.getState().pendingExperiment).toBe("test");
    s.cancelExperiment(); expect(useThread.getState().nodes.find((n) => n.id === "test")?.data.meta["status"]).toBe("planned");
  });
  it("validated outcomes graduate only explicitly chosen upstream beliefs", () => {
    useThread.getState().finishExperiment("test", "validated", "Passed", ["belief", "action"], "evidence");
    expect(useThread.getState().nodes.find((n) => n.id === "belief")?.data.epistemic).toBe("evidence");
    expect(useThread.getState().nodes.find((n) => n.id === "action")?.data.epistemic).toBe("fact");
  });
  it("invalidation flags downstream actions and creates a connected lessons note", () => {
    useThread.getState().finishExperiment("test", "invalidated", "Customers did not pay", [], "evidence");
    const s = useThread.getState(); const lesson = s.nodes.find((n) => n.data.body === "Customers did not pay");
    expect(s.nodes.find((n) => n.id === "action")?.data.meta["reviewRequired"]).toBe("test");
    expect(lesson?.data.kind).toBe("note"); expect(s.edges.some((e) => e.source === "test" && e.target === lesson?.id)).toBe(true);
  });
  it("inconclusive outcomes do not graduate beliefs", () => {
    useThread.getState().finishExperiment("test", "inconclusive", "More data needed", ["belief"], "fact");
    expect(useThread.getState().nodes.find((n) => n.id === "belief")?.data.epistemic).toBe("assumption");
  });
  it("timeline snapshots are immutable and replay never replaces live data", () => {
    const s = useThread.getState(); s.recordSnapshot("Before"); s.updateNode("idea", { title: "Changed" }); s.recordSnapshot("After"); s.setReplay(0);
    expect(useThread.getState().history[0]?.nodes[0]?.data.title).toBe("idea");
    expect(useThread.getState().nodes[0]?.data.title).toBe("Changed");
    s.setReplay(null); expect(useThread.getState().nodes[0]?.data.title).toBe("Changed");
  });
  it("ghost edits remain staged until acceptance", () => {
    const s = useThread.getState(); s.setGhosts([{ kind: "question", title: "Check", body: "", rationale: "", epistemic: "unknown", anchorId: "idea", targetId: null, relation: "needs_evidence_from", hypothesis: null, successCriteria: null }]);
    const ghost = useThread.getState().ghosts[0]; if (!ghost) throw new Error("Missing ghost");
    s.updateGhost(ghost.id, { title: "Edited question" });
    expect(useThread.getState().nodes).toHaveLength(4);
    expect(useThread.getState().ghosts[0]?.sourceIds).toEqual(["idea"]);
    s.acceptGhost(ghost.id); expect(useThread.getState().nodes.at(-1)?.data.title).toBe("Edited question");
  });
});
import { raycast, cordSag } from "./graph";
describe("keyboard raycasting", () => {
  const n = (id: string, x: number, y: number) => ({ id, type: "thread" as const, position: { x, y }, data: {} as never });
  const nodes = [n("a", 0, 0), n("near", 300, 0), n("linked", 600, 120), n("up", 0, -400)];
  it("prefers a connected card in the ray's direction", () => {
    expect(raycast("a", "right", nodes, [{ id: "e", source: "linked", target: "a" }])).toBe("linked");
  });
  it("falls back to the nearest aligned card", () => {
    expect(raycast("a", "right", nodes, [])).toBe("near");
    expect(raycast("a", "up", nodes, [])).toBe("up");
    expect(raycast("a", "left", nodes, [])).toBeNull();
  });
  it("cords sag more when short and stay taut when long", () => {
    expect(cordSag(100)).toBeGreaterThan(cordSag(700));
    expect(cordSag(100, 0.9)).toBeLessThan(cordSag(100));
  });
});
