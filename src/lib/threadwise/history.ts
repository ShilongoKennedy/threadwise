import type { TEdge, TNode } from "./store";

type Graph = { nodes: TNode[]; edges: TEdge[] };

const shortTitle = (node: TNode) => {
  const title = (node.data.title ?? "").trim();
  if (!title) return "untitled card";
  return title.length > 28 ? `${title.slice(0, 27)}…` : title;
};

/** Undo steps read as sentences: what changed, not just that something did. */
export function describeChange(prev: Graph, next: Graph): string {
  const added = next.nodes.filter((n) => !prev.nodes.some((p) => p.id === n.id));
  if (added.length === 1) return `Added ${shortTitle(added[0]!)}`;
  if (added.length > 1) return `Added ${added.length} cards`;

  const removed = prev.nodes.filter((n) => !next.nodes.some((p) => p.id === n.id));
  if (removed.length === 1) return `Deleted ${shortTitle(removed[0]!)}`;
  if (removed.length > 1) return `Deleted ${removed.length} cards`;

  const delta = next.edges.length - prev.edges.length;
  if (delta > 0) return delta === 1 ? "Connected a cord" : `Connected ${delta} cords`;
  if (delta < 0) return delta === -1 ? "Removed a cord" : `Removed ${-delta} cords`;

  const edited = next.nodes.find((n) => {
    const before = prev.nodes.find((p) => p.id === n.id);
    return before && before.data !== n.data;
  });
  if (edited) return `Edited ${shortTitle(edited)}`;

  const moved = next.nodes.find((n) => {
    const before = prev.nodes.find((p) => p.id === n.id);
    return before && (before.position.x !== n.position.x || before.position.y !== n.position.y);
  });
  if (moved) return `Moved ${shortTitle(moved)}`;

  return "Change";
}
