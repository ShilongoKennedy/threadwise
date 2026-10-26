import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import type { RawSuggestion } from "./explore.types";
import { playSound } from "./sound";
import { connectedDirection, graduationCandidates, type Outcome } from "./graph";
import { createNodeData, type Relation, type ThreadEdgeData, type ThreadNodeData, type ThreadNodeType } from "./model";

export type TNode = Node<ThreadNodeData, "thread">;
export type TEdge = Edge<ThreadEdgeData, "relation">;

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): { nodes: TNode[]; edges: TEdge[] } {
  const mk = (id: string, kind: ThreadNodeType, title: string, body: string, x: number, y: number): TNode => ({
    id, type: "thread", position: { x, y }, data: { ...createNodeData(kind, title), body },
  });
  const nodes = [
    mk("n1", "note", "Opportunity hides where things are scarce, hard, or risky", "Most people avoid problems that are scarce, difficult, or risky — so value concentrates there.", 0, 0),
    mk("n2", "idea", "Niche tools for regulated industries", "Compliance is hard and risky, so few competitors build here.", 380, -80),
    mk("n3", "question", "Will small firms pay for compliance help?", "", 380, 160),
    mk("n4", "experiment", "Landing page smoke test", "", 760, 160),
    mk("n5", "action", "Interview 5 small accounting firms", "", 760, -80),
  ];
  const idea = nodes[1];
  const experiment = nodes[3];
  if (idea) idea.data.lenses = { scarcity: 2, difficulty: 3, risk: 2 };
  if (experiment) experiment.data.meta["hypothesis"] = "At least 5% of visitors join the waitlist.";
  const e = (s: string, t: string, relation: Relation): TEdge => ({ id: uid(), source: s, target: t, type: "relation", data: { relation } });
  return { nodes, edges: [e("n1", "n2", "supports"), e("n2", "n3", "needs_evidence_from"), e("n4", "n3", "could_solve"), e("n2", "n5", "leads_to")] };
}

export type Ghost = RawSuggestion & { id: string; position: { x: number; y: number }; sourceIds?: string[] };
export type Snapshot = { id: string; at: number; label: string; nodes: TNode[]; edges: TEdge[] };

type State = {
  history: Snapshot[];
  replayIndex: number | null;
  activeGhost: string | null;
  pendingExperiment: string | null;
  /** Keyboard rewiring: the card a new link will start from. Transient. */
  linkAnchor: string | null;
  setLinkAnchor: (id: string | null) => void;
  setReplay: (index: number | null) => void;
  setActiveGhost: (id: string | null) => void;
  updateGhost: (id: string, patch: Partial<RawSuggestion>) => void;
  setPositions: (positions: Record<string, { x: number; y: number }>) => void;
  recordSnapshot: (label: string) => void;
  finishExperiment: (id: string, outcome: Outcome, lessons: string, graduateIds: string[], promoteTo: "evidence" | "fact") => void;
  cancelExperiment: () => void;
  ghosts: Ghost[];
  leaving: Record<string, "accept" | "dismiss">;
  landed: string | null;
  resolveGhost: (id: string, action: "accept" | "dismiss") => void;
  setGhosts: (g: RawSuggestion[]) => void;
  moveGhost: (id: string, pos: { x: number; y: number }) => void;
  acceptGhost: (id: string) => void;
  dismissGhost: (id: string) => void;
  nodes: TNode[];
  edges: TEdge[];
  selectedId: string | null;
  onNodesChange: (c: NodeChange<TNode>[]) => void;
  onEdgesChange: (c: EdgeChange<TEdge>[]) => void;
  addNode: (kind: ThreadNodeType, pos: { x: number; y: number }) => string;
  updateNode: (id: string, patch: Partial<ThreadNodeData> | ((d: ThreadNodeData) => ThreadNodeData)) => void;
  deleteNode: (id: string) => void;
  connect: (c: Connection, relation: Relation, customLabel?: string) => void;
  updateEdge: (id: string, data: ThreadEdgeData) => void;
  deleteEdge: (id: string) => void;
  select: (id: string | null) => void;
  reset: () => void;
};

export const useThread = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      selectedId: null,
      ghosts: [],
      leaving: {},
      landed: null,
      history: [], replayIndex: null, activeGhost: null, pendingExperiment: null, linkAnchor: null,
      setLinkAnchor: (linkAnchor) => set({ linkAnchor }),
      setReplay: (replayIndex) => {
        if (replayIndex !== null && get().replayIndex === null) get().recordSnapshot("Current canvas");
        set({ replayIndex, selectedId: null, activeGhost: null });
      },
      setActiveGhost: (activeGhost) => set({ activeGhost }),
      updateGhost: (id, patch) => set({ ghosts: get().ghosts.map((g) => g.id === id ? { ...g, ...patch } : g) }),
      setPositions: (positions) => set({ nodes: get().nodes.map((n) => positions[n.id] ? { ...n, position: positions[n.id] ?? n.position } : n) }),
      recordSnapshot: (label) => {
        const { nodes, edges, history } = get();
        const cleanNodes = nodes.map(({ selected: _s, dragging: _d, measured: _m, ...n }) => n);
        const cleanEdges = edges.map(({ selected: _s, ...e }) => e);
        const last = history.at(-1);
        if (last && JSON.stringify([last.nodes, last.edges]) === JSON.stringify([cleanNodes, cleanEdges])) return;
        set({ history: [...history, { id: uid(), at: Date.now(), label, nodes: structuredClone(cleanNodes), edges: structuredClone(cleanEdges) }].slice(-200) });
      },
      cancelExperiment: () => set({ pendingExperiment: null }),
      finishExperiment: (id, result, lessons, graduateIds, promoteTo) => {
        const state = get();
        const exp = state.nodes.find((n) => n.id === id);
        if (!exp) return;
        const candidates = new Set(graduationCandidates(id, state.nodes, state.edges).map((n) => n.id));
        const downstream = connectedDirection(id, state.edges, false);
        const nodes = state.nodes.map((n) => {
          if (n.id === id) return { ...n, data: { ...n.data, epistemic: result === "validated" ? "evidence" as const : n.data.epistemic, meta: { ...n.data.meta, status: "completed", result, outcome: result, lessonsLearned: lessons } } };
          if (result === "validated" && graduateIds.includes(n.id) && candidates.has(n.id)) return { ...n, data: { ...n.data, epistemic: promoteTo } };
          if (result === "invalidated" && downstream.has(n.id) && n.data.kind === "action") return { ...n, data: { ...n.data, meta: { ...n.data.meta, reviewRequired: id } } };
          return n;
        });
        let edges = state.edges;
        if (result === "invalidated") {
          const noteId = uid();
          nodes.push({ id: noteId, type: "thread", position: { x: exp.position.x + 360, y: exp.position.y + 240 }, data: { ...createNodeData("note", `Lessons: ${exp.data.title}`), body: lessons || "The experiment invalidated the hypothesis. Review dependent actions before proceeding.", meta: { source: exp.id } } });
          edges = [...edges, { id: uid(), source: id, target: noteId, type: "relation", data: { relation: "leads_to" } }];
        }
        set({ nodes, edges, pendingExperiment: null });
         playSound(result === "validated" ? "stamp" : "complete");
        get().recordSnapshot(`Experiment ${result}`);
      },
      resolveGhost: (id, action) => {
        if (get().leaving[id]) return;
         if (action === "accept") playSound("accept");
        set({ leaving: { ...get().leaving, [id]: action } });
        setTimeout(() => {
          if (action === "accept") get().acceptGhost(id);
          else get().dismissGhost(id);
          const { [id]: _, ...rest } = get().leaving;
          set({ leaving: rest });
        }, 240);
      },
      setGhosts: (list) => {
        // Place each suggested card in the nearest free spot around its anchor.
        const W = 290, H = 230;
        const taken = get().nodes.map((n) => n.position);
        const free = (p: { x: number; y: number }) => taken.every((t) => Math.abs(t.x - p.x) >= W || Math.abs(t.y - p.y) >= H);
        const ghosts = list.map((g) => {
          const base = get().nodes.find((n) => n.id === g.anchorId)?.position ?? { x: 0, y: 0 };
          let position = { x: base.x + W * 1.3, y: base.y };
          {
            outer: for (let r = 1; r < 8; r++)
              for (const [dx, dy] of [[r, 0], [0, r], [r, r], [0, -r], [r, -r], [-r, r], [-r, 0], [-r, -r]] as const) {
                const p = { x: base.x + dx * W * 1.3, y: base.y + dy * H };
                if (free(p)) { position = p; break outer; }
              }
            taken.push(position);
          }
          return { ...g, id: uid(), position, sourceIds: [g.anchorId, ...(g.kind === "connection" && g.targetId ? [g.targetId] : [])] };
        });
        set({ ghosts });
      },
      moveGhost: (id, position) => set({ ghosts: get().ghosts.map((g) => (g.id === id ? { ...g, position } : g)) }),
      dismissGhost: (id) => set({ ghosts: get().ghosts.filter((g) => g.id !== id) }),
      acceptGhost: (id) => {
        const g = get().ghosts.find((x) => x.id === id);
        if (!g) return;
        const rel = g.relation as Relation;
        if (g.kind === "connection") {
          if (g.targetId) get().connect({ source: g.anchorId, target: g.targetId, sourceHandle: null, targetHandle: null }, rel);
        } else {
          const nid = uid();
          const data = createNodeData(g.kind, g.title);
          data.body = g.body;
          data.epistemic = g.epistemic;
          if (g.kind === "experiment") {
            data.meta["hypothesis"] = g.hypothesis ?? "";
            data.meta["successCriteria"] = g.successCriteria ?? "";
          }
          set({ nodes: [...get().nodes, { id: nid, type: "thread", position: g.position, data }], landed: nid });
          setTimeout(() => get().landed === nid && set({ landed: null }), 900);
          get().connect({ source: g.anchorId, target: nid, sourceHandle: null, targetHandle: null }, rel);
        }
        set({ ghosts: get().ghosts.filter((x) => x.id !== id) });
      },
      onNodesChange: (c) => set({ nodes: applyNodeChanges(c, get().nodes) }),
      onEdgesChange: (c) => set({ edges: applyEdgeChanges(c, get().edges) }),
      addNode: (kind, position) => {
        const id = uid();
        set({
          nodes: [...get().nodes.map((n) => ({ ...n, selected: false })), { id, type: "thread", position, data: createNodeData(kind), selected: true }],
          selectedId: id,
        });
        return id;
      },
      updateNode: (id, patch) => {
        let pendingExperiment = get().pendingExperiment;
        const nodes = get().nodes.map((n) => {
          if (n.id !== id) return n;
          const data = typeof patch === "function" ? patch(n.data) : { ...n.data, ...patch };
          if (data.kind === "experiment" && ["complete", "completed"].includes(data.meta["status"] ?? "") && data.meta["status"] !== n.data.meta["status"]) {
            pendingExperiment = id;
            return { ...n, data: { ...data, meta: { ...data.meta, status: n.data.meta["status"] ?? "planned" } } };
          }
          return { ...n, data };
        });
        set({ nodes, pendingExperiment });
      },
      deleteNode: (id) =>
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        }),
      connect: (c, relation, customLabel) =>
        set({ edges: addEdge({ ...c, id: uid(), type: "relation", data: customLabel ? { relation, customLabel } : { relation } }, get().edges) as TEdge[] }),
      updateEdge: (id, data) => set({ edges: get().edges.map((e) => (e.id === id ? { ...e, data } : e)) }),
      deleteEdge: (id) =>
        set({ edges: get().edges.filter((e) => e.id !== id), selectedId: get().selectedId === id ? null : get().selectedId }),
      select: (selectedId) => set({ selectedId }),
      reset: () => set({ ...seed(), selectedId: null, ghosts: [] }),
    }),
    { name: "threadwise-canvas-v1", partialize: (s) => ({ nodes: s.nodes, edges: s.edges, ghosts: s.ghosts, history: s.history }) },
  ),
);

// Coalesce typing and dragging into meaningful moments, never record transient selection.
let snapshotTimer: ReturnType<typeof setTimeout> | undefined;
useThread.subscribe((state, previous) => {
  if (state.replayIndex !== null || (state.nodes === previous.nodes && state.edges === previous.edges)) return;
  clearTimeout(snapshotTimer);
  const label = state.nodes.length > previous.nodes.length ? "Card added" : state.nodes.length < previous.nodes.length ? "Card removed" : state.edges.length !== previous.edges.length ? "Threads changed" : "Canvas revised";
  snapshotTimer = setTimeout(() => useThread.getState().recordSnapshot(label), 650);
});
