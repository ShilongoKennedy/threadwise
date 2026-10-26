import { reasoningLinks } from "./graph";
import type { TNode, TEdge } from "./store";

export type Frame = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lane: boolean;
};
export type Seal = {
  id: string;
  signer: string;
  userId: string;
  at: string;
  digest: string;
  note: string;
};
export type Suite = {
  frames: Frame[];
  inbox: { id: string; text: string }[];
  stops: string[];
  seals: Seal[];
  scenario?: Partial<import("./strategy").ScenarioParams> | undefined;
  runway?: import("./strategy").RunwayPlan | undefined;
  discourse?: import("./discourse").Corpus | undefined;
  branch?: { sourceId: string; baseNodes: TNode[]; baseEdges: TEdge[] } | undefined;
};
export const emptySuite = (): Suite => ({ frames: [], inbox: [], stops: [], seals: [] });
export const prerequisiteLinks = (edges: TEdge[]) =>
  reasoningLinks(
    edges.filter((e) => ["depends_on", "needs_evidence_from"].includes(e.data?.relation ?? "")),
  );

export function topology(nodes: TNode[], edges: TEdge[], strict = true) {
  const ids = new Set(nodes.map((n) => n.id));
  const links = (strict ? prerequisiteLinks(edges) : reasoningLinks(edges)).filter(
    (e) => ids.has(e.from) && ids.has(e.to),
  );
  const incoming = new Map(nodes.map((n) => [n.id, links.filter((l) => l.to === n.id).length]));
  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id),
    order: string[] = [];
  const depth: Record<string, number> = {},
    days: Record<string, number> = {},
    previous: Record<string, string> = {};
  for (const id of queue) depth[id] = 0;
  while (queue.length) {
    const id = queue.shift();
    if (!id) continue;
    order.push(id);
    const node = nodes.find((n) => n.id === id);
    const duration = Math.max(0.1, Number(node?.data.meta["durationDays"]) || 1);
    days[id] = (days[id] ?? 0) + duration;
    for (const link of links.filter((l) => l.from === id)) {
      depth[link.to] = Math.max(depth[link.to] ?? 0, (depth[id] ?? 0) + 1);
      if ((days[id] ?? 0) > (days[link.to] ?? 0)) {
        days[link.to] = days[id] ?? 0;
        previous[link.to] = id;
      }
      incoming.set(link.to, (incoming.get(link.to) ?? 1) - 1);
      if (incoming.get(link.to) === 0) queue.push(link.to);
    }
  }
  const blocked = nodes.filter((n) => !order.includes(n.id)).map((n) => n.id);
  const end = order.reduce((a, b) => ((days[b] ?? 0) > (days[a] ?? 0) ? b : a), "");
  const path: string[] = [];
  let at = end;
  while (at) {
    path.unshift(at);
    at = previous[at] ?? "";
  }
  return { order, depth, days, path, blocked, totalDays: days[end] ?? 0, links };
}
export function simulate(
  nodes: TNode[],
  edges: TEdge[],
  probabilities: Record<string, number>,
  trials = 5000,
  random: () => number = Math.random,
) {
  const t = topology(nodes, edges);
  if (t.blocked.length) throw new Error("Resolve circular dependencies before simulating.");
  for (const n of nodes)
    if (
      !Number.isFinite(probabilities[n.id]) ||
      (probabilities[n.id] ?? -1) < 0 ||
      (probabilities[n.id] ?? 2) > 1
    )
      throw new Error("Set a probability between 0% and 100% for every card.");
  const count: Record<string, number> = {},
    samples = Math.max(1, Math.min(50000, Math.floor(trials)));
  for (let i = 0; i < samples; i++) {
    const success: Record<string, boolean> = {};
    for (const id of t.order) {
      success[id] =
        random() < (probabilities[id] ?? 0) &&
        t.links.filter((l) => l.to === id).every((l) => success[l.from]);
      if (success[id]) count[id] = (count[id] ?? 0) + 1;
    }
  }
  return nodes.map((n) => {
    const rate = (count[n.id] ?? 0) / samples;
    const margin = 1.96 * Math.sqrt((rate * (1 - rate)) / samples);
    return { id: n.id, rate, low: Math.max(0, rate - margin), high: Math.min(1, rate + margin) };
  });
}
export type MergeConflict = {
  key: string;
  label: string;
  ours: TNode | TEdge | undefined;
  theirs: TNode | TEdge | undefined;
};
const content = (item: TNode | TEdge | undefined) =>
  item
    ? JSON.stringify(
        "position" in item
          ? {
              id: item.id,
              data: item.data,
              position: item.position,
              width: item.width,
              height: item.height,
            }
          : { id: item.id, source: item.source, target: item.target, data: item.data },
      )
    : "";
export function mergeGraph(
  base: { nodes: TNode[]; edges: TEdge[] },
  ours: { nodes: TNode[]; edges: TEdge[] },
  theirs: { nodes: TNode[]; edges: TEdge[] },
  choices: Record<string, "ours" | "theirs"> = {},
) {
  const conflicts: MergeConflict[] = [];
  function merge<T extends TNode | TEdge>(kind: string, b: T[], o: T[], t: T[]): T[] {
    const result: T[] = [];
    for (const id of new Set([...b, ...o, ...t].map((n) => n.id))) {
      const before = b.find((n) => n.id === id),
        mine = o.find((n) => n.id === id),
        other = t.find((n) => n.id === id);
      let chosen = mine;
      if (content(mine) === content(before)) chosen = other;
      else if (content(other) !== content(before) && content(mine) !== content(other)) {
        const key = `${kind}:${id}`;
        conflicts.push({
          key,
          label:
            mine && "position" in mine
              ? mine.data.title
              : other && "position" in other
                ? other.data.title
                : `Thread ${id}`,
          ours: mine,
          theirs: other,
        });
        chosen = choices[key] === "theirs" ? other : mine;
      }
      if (chosen) result.push(structuredClone(chosen));
    }
    return result;
  }
  const nodes = merge("card", base.nodes, ours.nodes, theirs.nodes),
    edges = merge("thread", base.edges, ours.edges, theirs.edges);
  const ids = new Set(nodes.map((n) => n.id));
  return { nodes, edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)), conflicts };
}
export function batchPairs(ids: string[], mode: "chain" | "fan" | "all") {
  const list = [...new Set(ids)];
  return list.flatMap((source, i) =>
    list
      .slice(i + 1)
      .filter((_, j) => mode === "all" || (mode === "chain" ? j === 0 : i === 0))
      .map((target) => ({ source, target })),
  );
}
export function snapToLane(node: TNode, frames: Frame[]) {
  const frame = frames.find(
    (f) =>
      f.lane &&
      node.position.x + 136 >= f.x &&
      node.position.x + 136 <= f.x + f.width &&
      node.position.y + 60 >= f.y &&
      node.position.y + 60 <= f.y + f.height,
  );
  return frame
    ? {
        x: frame.x + 24,
        y: Math.max(
          frame.y + 56,
          Math.round((node.position.y - frame.y - 56) / 24) * 24 + frame.y + 56,
        ),
      }
    : null;
}
export function narrative(nodes: TNode[], edges: TEdge[], title: string) {
  return (
    `# ${title}\n\n` +
    nodes
      .map(
        (n) =>
          `## ${n.data.title}\n\n${n.data.kind} · ${n.data.epistemic}\n\n${n.data.body}\n\n${Object.entries(
            n.data.meta,
          )
            .filter(([, v]) => v)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n")}`,
      )
      .join("\n\n") +
    "\n\n## Relationships\n\n" +
    edges
      .map(
        (e) =>
          `- ${nodes.find((n) => n.id === e.source)?.data.title ?? e.source} → ${e.data?.relation} → ${nodes.find((n) => n.id === e.target)?.data.title ?? e.target}`,
      )
      .join("\n")
  );
}
export function graphSvg(nodes: TNode[], edges: TEdge[], title: string) {
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c,
    );
  const minX = Math.min(0, ...nodes.map((n) => n.position.x)) - 40,
    minY = Math.min(0, ...nodes.map((n) => n.position.y)) - 60;
  const width = Math.max(600, ...nodes.map((n) => n.position.x + 300 - minX)),
    height = Math.max(300, ...nodes.map((n) => n.position.y + 200 - minY));
  const text = (s: string) => s.match(/.{1,34}(?:\s|$)|.{1,34}/g)?.slice(0, 4) ?? [];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}"><title>${esc(title)}</title><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor"/></marker></defs>${edges
    .map((e) => {
      const a = nodes.find((n) => n.id === e.source),
        b = nodes.find((n) => n.id === e.target);
      return a && b
        ? `<path d="M${a.position.x + 272} ${a.position.y + 50} L${b.position.x} ${b.position.y + 50}" fill="none" stroke="currentColor" marker-end="url(#arrow)"/><text x="${(a.position.x + 272 + b.position.x) / 2}" y="${(a.position.y + b.position.y) / 2 + 40}" font-size="10">${esc(e.data?.relation ?? "")}</text>`
        : "";
    })
    .join("")}${nodes
    .map(
      (n) =>
        `<g transform="translate(${n.position.x},${n.position.y})"><rect width="272" height="180" rx="8" fill="${/^#[0-9a-f]{6}$/i.test(n.data.color ?? "") ? n.data.color : "white"}" stroke="currentColor"/><rect x="8" y="8" width="256" height="164" rx="4" fill="white" fill-opacity="0.95"/><text x="16" y="28" font-size="10">${esc(n.data.kind + " · " + n.data.epistemic)}</text>${text(
          n.data.title,
        )
          .slice(0, 2)
          .map((line, i) => `<text x="16" y="${52 + i * 18}" font-size="15">${esc(line)}</text>`)
          .join("")}${text(n.data.body)
          .map((line, i) => `<text x="16" y="${102 + i * 16}" font-size="11">${esc(line)}</text>`)
          .join("")}</g>`,
    )
    .join("")}</svg>`;
}
export async function graphDigest(nodes: TNode[], edges: TEdge[]) {
  const stable = JSON.stringify({
    nodes: [...nodes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((n) => ({ id: n.id, data: n.data })),
    edges: [...edges]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
  });
  return [
    ...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stable))),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
