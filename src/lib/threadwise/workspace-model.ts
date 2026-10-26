import type { Ghost, Snapshot, TEdge, TNode } from "./store";
export type CanvasMap = {
  id: string;
  title: string;
  suite?: import("./advanced").Suite | undefined;
  planning?: import("./planning").Planning | undefined;
  color?: import("./paper").PaperColor | undefined;
  parentId: string | null;
  nodes: TNode[];
  edges: TEdge[];
  ghosts: Ghost[];
  history: Snapshot[];
};
export type WorkspaceDocument = {
  canvases: CanvasMap[];
  activeCanvasId: string;
  color?: import("./paper").PaperColor | undefined;
};
export type Workspace = {
  id: string;
  title: string;
  document: WorkspaceDocument;
  revision: number;
  dirty: boolean;
  generation: number;
};

export function breadcrumbs(canvases: CanvasMap[], id: string): CanvasMap[] {
  const result: CanvasMap[] = [];
  const seen = new Set<string>();
  let current = canvases.find((c) => c.id === id);
  while (current && !seen.has(current.id)) {
    result.unshift(current);
    seen.add(current.id);
    current = canvases.find((c) => c.id === current?.parentId);
  }
  return result;
}

/** Explicit projection is the privacy boundary: chat history is never part of cloud data. */
export function cloudDocument(document: WorkspaceDocument): WorkspaceDocument {
  return {
    activeCanvasId: document.activeCanvasId,
    color: document.color,
    canvases: document.canvases.map((c) => ({
      id: c.id,
      title: c.title,
      suite: c.suite,
      planning: c.planning,
      color: c.color,
      parentId: c.parentId,
      nodes: c.nodes,
      edges: c.edges,
      ghosts: c.ghosts,
      history: c.history,
    })),
  };
}
