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

/**
 * The Semantic Intelligence Layout.
 * Arranges nodes into distinct semantic columns, anchored by their source dossiers.
 * This turns the canvas from a messy corkboard into a structured logical map.
 */
export function intelligentTidy(nodes: TNode[], edges: TEdge[]): Record<string, { x: number, y: number }> {
  if (nodes.length === 0) return {};
  
  const positions: Record<string, { x: number, y: number }> = {};
  const dossiers = nodes.filter(n => n.data.kind === "dossier");
  const nonDossiers = nodes.filter(n => n.data.kind !== "dossier");
  
  // 1. Layout Dossiers down the far left side
  let dossierY = 0;
  dossiers.forEach((n) => {
    positions[n.id] = { x: 0, y: dossierY };
    dossierY += 300; // space them out nicely
  });
  
  // 2. Categorize non-dossiers
  const notes: TNode[] = [];
  const ideas: TNode[] = [];
  const omissions: TNode[] = [];
  const questions: TNode[] = [];
  const experiments: TNode[] = [];
  const actions: TNode[] = [];
  const portals: TNode[] = [];
  const others: TNode[] = [];

  nonDossiers.forEach(n => {
    switch (n.data.kind) {
      case "note": notes.push(n); break;
      case "idea": ideas.push(n); break;
      case "omission": omissions.push(n); break;
      case "question": questions.push(n); break;
      case "experiment": experiments.push(n); break;
      case "action": actions.push(n); break;
      case "portal": portals.push(n); break;
      default: others.push(n); break;
    }
  });

  // Helper to find the Y coordinate of the connected Dossier to align insights
  const getAnchorY = (node: TNode): number => {
    const edgesToNode = edges.filter(e => e.source === node.id || e.target === node.id);
    for (const e of edgesToNode) {
      const otherId = e.source === node.id ? e.target : e.source;
      const anchor = dossiers.find(d => d.id === otherId);
      if (anchor && positions[anchor.id]) {
        return positions[anchor.id]!.y;
      }
    }
    return -1;
  };

  // Helper to lay out a column of nodes, pulling them towards their dossiers
  const layoutColumn = (colNodes: TNode[], x: number, startY: number = 0) => {
    let currentY = startY;
    
    // Sort by their anchor Y so they align horizontally with their source Dossiers
    const sorted = [...colNodes].sort((a, b) => {
      const ya = getAnchorY(a);
      const yb = getAnchorY(b);
      if (ya === -1 && yb === -1) return 0;
      if (ya === -1) return 1;
      if (yb === -1) return -1;
      return ya - yb;
    });

    sorted.forEach((n) => {
      let targetY = getAnchorY(n);
      if (targetY !== -1 && targetY > currentY) {
        currentY = targetY; // snap to the dossier's Y level
      }
      positions[n.id] = { x, y: currentY };
      currentY += 240; // spacing for next card in this column
    });
    return currentY;
  };

  // 3. Lay out columns horizontally (Left to Right intelligence flow)
  let maxY = Math.max(0, dossierY);
  
  if (notes.length > 0) {
    const endY = layoutColumn(notes, 400);
    maxY = Math.max(maxY, endY);
  }
  if (ideas.length > 0) {
    const endY = layoutColumn(ideas, 720);
    maxY = Math.max(maxY, endY);
  }
  
  // Blind spots sit next to ideas (the "unknowns")
  const blindSpots = [...questions, ...omissions];
  if (blindSpots.length > 0) {
    const endY = layoutColumn(blindSpots, 1040);
    maxY = Math.max(maxY, endY);
  }
  
  if (experiments.length > 0) {
    const endY = layoutColumn(experiments, 1360);
    maxY = Math.max(maxY, endY);
  }
  if (actions.length > 0) {
    const endY = layoutColumn(actions, 1680);
    maxY = Math.max(maxY, endY);
  }

  // 4. Handle portals and orphans (push to the bottom or far left)
  let orphanY = maxY + 200;
  [...portals, ...others].forEach(n => {
    positions[n.id] = { x: -380, y: orphanY };
    orphanY += 240;
  });

  return positions;
}