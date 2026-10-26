import type { TEdge, TNode } from "./store";

export type Outcome = "validated" | "invalidated" | "inconclusive";
export type Fault = { actionId: string; uncertainId: string; nodeIds: string[]; edgeIds: string[] };

/** A dependency points from dependent to prerequisite; reasoning flows the other way. */
export function reasoningLinks(edges: TEdge[]) {
  return edges.filter((e) => !["contradicts", "similar_to", "example_of", "custom"].includes(e.data?.relation ?? "custom"))
    .map((e) => ["depends_on", "needs_evidence_from"].includes(e.data?.relation ?? "")
      ? { from: e.target, to: e.source, id: e.id } : { from: e.source, to: e.target, id: e.id });
}

export function neighborhood(id: string | null, edges: TEdge[], depth = 2) {
  const nodeIds = new Set<string>(id ? [id] : []);
  const edgeIds = new Set<string>();
  let frontier = new Set(nodeIds);
  for (let i = 0; i < depth; i++) {
    const next = new Set<string>();
    for (const e of edges) {
      if (frontier.has(e.source) || frontier.has(e.target)) {
        edgeIds.add(e.id);
        for (const n of [e.source, e.target]) if (!nodeIds.has(n)) next.add(n);
      }
    }
    for (const n of next) nodeIds.add(n);
    frontier = next;
  }
  return { nodeIds, edgeIds };
}

export function connectedDirection(id: string, edges: TEdge[], upstream: boolean) {
  const links = reasoningLinks(edges);
  const found = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift();
    for (const e of links) {
      if ((upstream ? e.to : e.from) !== current) continue;
      const next = upstream ? e.from : e.to;
      if (next === id || found.has(next)) continue;
      found.add(next); queue.push(next);
    }
  }
  return found;
}

export function graduationCandidates(id: string, nodes: TNode[], edges: TEdge[]) {
  const upstream = connectedDirection(id, edges, true);
  return nodes.filter((n) => upstream.has(n.id) && ["assumption", "hypothesis"].includes(n.data.epistemic) && n.data.kind !== "experiment");
}

export function auditGraph(nodes: TNode[], edges: TEdge[]): Fault[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const links = reasoningLinks(edges);
  const faults: Fault[] = [];
  const keys = new Set<string>();
  // Keep the unverified belief in the traversal state; a validated experiment clears it.
  for (const idea of nodes.filter((n) => n.data.kind === "idea")) {
    const queue = [{ id: idea.id, uncertain: "", nodes: [idea.id], edges: [] as string[] }];
    const visited = new Set<string>();
    while (queue.length) {
      const step = queue.shift();
      if (!step) continue;
      const node = map.get(step.id);
      if (!node) continue;
      let uncertain = step.uncertain;
      if (node.data.kind === "experiment" && ["complete", "completed"].includes(node.data.meta["status"] ?? "") && node.data.meta["result"] === "validated") uncertain = "";
      else if (node.data.kind !== "action" && ["assumption", "hypothesis", "unknown"].includes(node.data.epistemic)) uncertain = node.id;
      const key = `${step.id}:${uncertain}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if ((node.data.kind === "action" || node.data.lenses.risk === 3) && uncertain && node.id !== uncertain) {
        const fk = `${node.id}:${uncertain}`;
        if (!keys.has(fk)) { faults.push({ actionId: node.id, uncertainId: uncertain, nodeIds: step.nodes, edgeIds: step.edges }); keys.add(fk); }
      }
      for (const link of links.filter((e) => e.from === node.id)) {
        if (step.nodes.includes(link.to)) continue;
        queue.push({ id: link.to, uncertain, nodes: [...step.nodes, link.to], edges: [...step.edges, link.id] });
      }
    }
  }
  return faults;
}

export function relationshipForce(relation?: string) {
  if (relation === "supports" || relation === "depends_on") return { distance: 345, strength: 0.25 };
  if (relation === "contradicts") return { distance: 680, strength: 0.08 };
  return { distance: 460, strength: 0.06 };
}
export type Direction = "left" | "right" | "up" | "down";
const VECTORS: Record<Direction, [number, number]> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

/**
 * Projects a ray from a card along a screen direction. Cards joined by an edge
 * (incoming or outgoing) win over unconnected ones; within each tier the best
 * alignment-over-distance score wins. Cards outside a 60° cone are ignored.
 */
export function raycast(fromId: string, dir: Direction, nodes: TNode[], edges: TEdge[]): string | null {
  const from = nodes.find((n) => n.id === fromId);
  if (!from) return null;
  const linked = new Set(edges.flatMap((e) => e.source === fromId ? [e.target] : e.target === fromId ? [e.source] : []));
  const [vx, vy] = VECTORS[dir];
  let best: { id: string; score: number } | null = null;
  for (const n of nodes) {
    if (n.id === fromId) continue;
    const dx = n.position.x - from.position.x, dy = n.position.y - from.position.y;
    const dist = Math.hypot(dx, dy);
    if (!dist) continue;
    const cos = (dx * vx + dy * vy) / dist;
    if (cos < 0.5) continue;
    const score = (linked.has(n.id) ? 1e6 : 0) + (cos * cos * 1000) / dist;
    if (!best || score > best.score) best = { id: n.id, score };
  }
  return best?.id ?? null;
}

/** Catenary-like sag: slack short cords hang, long cords pull taut. */
export function cordSag(distance: number, tension = 0) {
  const slack = Math.max(0, 260 - distance * 0.35) + 18;
  return Math.max(4, slack * (1 - Math.min(0.9, tension)));
}
