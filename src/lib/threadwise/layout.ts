import type { TNode, TEdge } from "./store";
import { reasoningLinks } from "./graph";
export async function layeredLayout(
  nodes: TNode[],
  edges: TEdge[],
  direction: "RIGHT" | "DOWN" = "RIGHT",
) {
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  const elk = new ELK();
  const result = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: n.width ?? 272,
      height: n.height ?? (n.data.kind === "note" ? 260 : 180),
    })),
    edges: reasoningLinks(edges)
      .filter((e) => nodes.some((n) => n.id === e.from) && nodes.some((n) => n.id === e.to))
      .map((e) => ({ id: e.id, sources: [e.from], targets: [e.to] })),
  });
  return Object.fromEntries(
    (result.children ?? []).map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]),
  );
}
