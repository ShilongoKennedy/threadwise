import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStorage } from "./safe-storage";
import { useThread } from "./store";
import { createNodeData } from "./model";
import { paperColor, type PaperColor } from "./paper";
import {
  cloudDocument,
  type Workspace,
  type CanvasMap,
  type WorkspaceDocument,
} from "./workspace-model";

type State = {
  owner: string | null;
  workspaces: Workspace[];
  activeId: string | null;
  status: string;
  ready: boolean;
  boot: () => void;
  attachOwner: (id: string | null) => void;
  importGuest: () => void;
  updatePlanning: (id: string, planning: import("./planning").Planning) => void;
  updateSuite: (id: string, suite: import("./advanced").Suite) => void;
  branchCanvas: (id: string, title: string) => string;
  rekeyUnsaved: (id: string) => void;
  switchWorkspace: (id: string) => void;
  switchCanvas: (id: string) => void;
  createWorkspace: (title?: string) => void;
  createCanvas: (title?: string, parentId?: string) => string;
  renameWorkspace: (id: string, title: string) => void;
  setCanvasColor: (id: string, color: PaperColor) => void;
  setWorkspaceColor: (id: string, color: PaperColor) => void;
  duplicateCanvas: (id: string) => string;
  renameCanvas: (id: string, title: string) => void;
  deleteCanvas: (id: string) => void;
  capture: () => void;
  replaceRemote: (rows: Workspace[]) => void;
  acknowledge: (id: string, revision: number, generation: number) => void;
  preserveConflict: (id: string, remote: Workspace) => void;
};
let loading = false;
const uuid = () => crypto.randomUUID();
const readCanvas = (id: string, title: string, parentId: string | null): CanvasMap => {
  const s = useThread.getState();
  return {
    id,
    title,
    parentId,
    nodes: s.nodes,
    edges: s.edges,
    ghosts: s.ghosts,
    history: s.history,
  };
};
function load(document: WorkspaceDocument) {
  const c = document.canvases.find((c) => c.id === document.activeCanvasId) ?? document.canvases[0];
  if (!c) return;
  loading = true;
  useThread.setState({
    nodes: c.nodes,
    edges: c.edges,
    ghosts: c.ghosts,
    history: c.history,
    selectedId: null,
    linkAnchor: null,
    replayIndex: null,
    pendingExperiment: null,
    activeGhost: null,
    leaving: {},
    landed: null,
  });
  loading = false;
}
export const useWorkspaces = create<State>()(
  persist(
    (set, get) => ({
      owner: null,
      workspaces: [],
      activeId: null,
      status: "Saved in this browser",
      ready: false,
      boot: () => {
        if (get().ready) return;
        if (!get().workspaces.length) {
          const id = uuid(),
            canvasId = uuid();
          const workspace: Workspace = {
            id,
            title: "My workspace",
            revision: -1,
            dirty: true,
            generation: 0,
            document: {
              activeCanvasId: canvasId,
              canvases: [readCanvas(canvasId, "First thoughts", null)],
            },
          };
          set({ workspaces: [workspace], activeId: id });
        }
        const workspace =
          get().workspaces.find((w) => w.id === get().activeId) ?? get().workspaces[0];
        if (workspace) {
          set({ activeId: workspace.id });
          load(workspace.document);
        }
        set({ ready: true });
      },
      attachOwner: (owner) => {
        const previous = get().owner;
        if (previous === owner) return;
        get().capture();
        if (previous)
          localStorage.setItem(
            `threadwise-account-${previous}`,
            JSON.stringify({ workspaces: get().workspaces, activeId: get().activeId }),
          );
        if (!previous)
          localStorage.setItem(
            "threadwise-guest-workspaces",
            JSON.stringify({ workspaces: get().workspaces, activeId: get().activeId }),
          );
        const saved = localStorage.getItem(
          owner ? `threadwise-account-${owner}` : "threadwise-guest-workspaces",
        );
        const restored = saved
          ? (JSON.parse(saved) as { workspaces: Workspace[]; activeId: string })
          : { workspaces: [], activeId: null };
        set({ ...restored, owner, ready: false });
        useThread.setState({ nodes: [], edges: [], ghosts: [], history: [], selectedId: null });
        get().boot();
      },
      importGuest: () => {
        if (!get().owner) return;
        const raw = localStorage.getItem("threadwise-guest-workspaces");
        if (!raw) return;
        const guest = JSON.parse(raw) as { workspaces: Workspace[] };
        const imported = guest.workspaces
          .filter(
            (w) =>
              !get().workspaces.some(
                (x) =>
                  x.id === w.id ||
                  x.document.canvases.some((c) => w.document.canvases.some((g) => g.id === c.id)),
              ),
          )
          .map((w) => ({
            ...w,
            id: uuid(),
            title: `${w.title} · imported`,
            revision: -1,
            generation: 0,
            dirty: true,
          }));
        set({ workspaces: [...get().workspaces, ...imported] });
      },
      updatePlanning: (id, planning) => {
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === get().activeId
              ? {
                  ...w,
                  dirty: true,
                  generation: w.generation + 1,
                  document: {
                    ...w.document,
                    canvases: w.document.canvases.map((c) =>
                      c.id === id ? { ...c, planning } : c,
                    ),
                  },
                }
              : w,
          ),
        });
      },
      updateSuite: (id, suite) => {
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === get().activeId
              ? {
                  ...w,
                  dirty: true,
                  generation: w.generation + 1,
                  document: {
                    ...w.document,
                    canvases: w.document.canvases.map((c) => (c.id === id ? { ...c, suite } : c)),
                  },
                }
              : w,
          ),
        });
      },
      branchCanvas: (id, title) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === get().activeId),
          source = w?.document.canvases.find((c) => c.id === id);
        if (!source) return "";
        const copyId = get().duplicateCanvas(id);
        if (!copyId) return "";
        const suite: import("./advanced").Suite = {
          frames: structuredClone(source.suite?.frames ?? []),
          inbox: [],
          stops: [...(source.suite?.stops ?? [])],
          seals: [],
          branch: {
            sourceId: id,
            baseNodes: structuredClone(source.nodes),
            baseEdges: structuredClone(source.edges),
          },
        };
        get().updateSuite(copyId, suite);
        get().renameCanvas(copyId, title.trim() || `${source.title} · branch`);
        return copyId;
      },
      rekeyUnsaved: (id) => {
        const next = uuid();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === id
              ? { ...w, id: next, revision: -1, dirty: true, generation: w.generation + 1 }
              : w,
          ),
          activeId: get().activeId === id ? next : get().activeId,
        });
      },
      capture: () => {
        if (loading || !get().ready || useThread.getState().replayIndex !== null) return;
        const active = get().workspaces.find((w) => w.id === get().activeId);
        if (!active) return;
        const current = active.document.canvases.find(
          (c) => c.id === active.document.activeCanvasId,
        );
        if (!current) return;
        const next = {
          ...readCanvas(current.id, current.title, current.parentId),
          color: current.color,
          planning: current.planning,
          suite: current.suite,
        };
        if (
          next.nodes === current.nodes &&
          next.edges === current.edges &&
          next.ghosts === current.ghosts &&
          next.history === current.history
        )
          return;
        set({
          workspaces: get().workspaces.map((w) =>
            w.id !== active.id
              ? w
              : {
                  ...w,
                  dirty: true,
                  generation: w.generation + 1,
                  document: {
                    ...w.document,
                    canvases: w.document.canvases.map((c) => (c.id === next.id ? next : c)),
                  },
                },
          ),
        });
      },
      switchWorkspace: (id) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === id);
        if (!w) return;
        set({ activeId: id });
        load(w.document);
      },
      switchCanvas: (id) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === get().activeId);
        if (!w?.document.canvases.some((c) => c.id === id)) return;
        const document = { ...w.document, activeCanvasId: id };
        set({
          workspaces: get().workspaces.map((x) =>
            x.id === w.id ? { ...x, document, dirty: true, generation: x.generation + 1 } : x,
          ),
        });
        load(document);
      },
      createWorkspace: (title = "") => {
        get().capture();
        const id = uuid(),
          canvasId = uuid();
        const document = {
          activeCanvasId: canvasId,
          canvases: [
            {
              id: canvasId,
              title: "Untitled canvas",
              parentId: null,
              nodes: [],
              edges: [],
              ghosts: [],
              history: [],
            },
          ],
        };
        const name = title.trim() || `Workspace ${get().workspaces.length + 1}`;
        set({
          workspaces: [
            ...get().workspaces,
            { id, title: name, document, revision: -1, dirty: true, generation: 0 },
          ],
          activeId: id,
        });
        load(document);
      },
      createCanvas: (title = "", parentId) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === get().activeId);
        if (!w) return "";
        if (parentId && !w.document.canvases.some((c) => c.id === parentId)) return "";
        const id = uuid();
        const c: CanvasMap = {
          id,
          title: title.trim() || `Untitled canvas ${w.document.canvases.length + 1}`,
          parentId: parentId ?? null,
          nodes: [],
          edges: [],
          ghosts: [],
          history: [],
        };
        let canvases = [...w.document.canvases, c];
        if (parentId) {
          const s = useThread.getState();
          const node = {
            id: uuid(),
            type: "thread" as const,
            position: {
              x: s.nodes.length ? Math.max(...s.nodes.map((n) => n.position.x)) + 360 : 0,
              y: 0,
            },
            data: { ...createNodeData("portal", c.title), meta: { childCanvasId: id } },
          };
          canvases = canvases.map((canvas) =>
            canvas.id === parentId ? { ...canvas, nodes: [...canvas.nodes, node] } : canvas,
          );
        }
        const document = { activeCanvasId: id, canvases };
        set({
          workspaces: get().workspaces.map((x) =>
            x.id === w.id ? { ...x, document, dirty: true, generation: x.generation + 1 } : x,
          ),
        });
        load(document);
        return id;
      },
      renameWorkspace: (id, title) => {
        if (!title.trim()) return;
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === id
              ? { ...w, title: title.trim(), dirty: true, generation: w.generation + 1 }
              : w,
          ),
        });
      },
      setWorkspaceColor: (id, color) => {
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === id
              ? {
                  ...w,
                  document: { ...w.document, color: paperColor(color) },
                  dirty: true,
                  generation: w.generation + 1,
                }
              : w,
          ),
        });
      },
      setCanvasColor: (id, color) => {
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === get().activeId
              ? {
                  ...w,
                  document: {
                    ...w.document,
                    canvases: w.document.canvases.map((c) =>
                      c.id === id ? { ...c, color: paperColor(color) } : c,
                    ),
                  },
                  dirty: true,
                  generation: w.generation + 1,
                }
              : w,
          ),
        });
      },
      duplicateCanvas: (id) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === get().activeId);
        const original = w?.document.canvases.find((c) => c.id === id);
        if (!w || !original) return "";
        const copyId = uuid();
        // Portal cards belong to their original hierarchy, not the new standalone copy.
        const nodes = structuredClone(original.nodes.filter((n) => n.data.kind !== "portal"));
        const ids = new Set(nodes.map((n) => n.id));
        const copy: CanvasMap = {
          ...original,
          suite: original.suite
            ? { ...structuredClone(original.suite), seals: [], branch: undefined }
            : undefined,
          planning: original.planning ? { ...original.planning, decisions: [] } : undefined,
          id: copyId,
          title: `${original.title} · copy`,
          parentId: null,
          nodes,
          edges: structuredClone(
            original.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
          ),
          ghosts: [],
          history: [],
        };
        const document = {
          ...w.document,
          activeCanvasId: copyId,
          canvases: [...w.document.canvases, copy],
        };
        set({
          workspaces: get().workspaces.map((x) =>
            x.id === w.id ? { ...x, document, dirty: true, generation: x.generation + 1 } : x,
          ),
        });
        load(document);
        return copyId;
      },
      renameCanvas: (id, title) => {
        if (!title.trim()) return;
        get().capture();
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === get().activeId
              ? {
                  ...w,
                  dirty: true,
                  generation: w.generation + 1,
                  document: {
                    ...w.document,
                    canvases: w.document.canvases.map((c) => ({
                      ...c,
                      title: c.id === id ? title.trim() : c.title,
                      nodes: c.nodes.map((n) =>
                        n.data.meta["childCanvasId"] === id
                          ? { ...n, data: { ...n.data, title: title.trim() } }
                          : n,
                      ),
                    })),
                  },
                }
              : w,
          ),
        });
        const w = get().workspaces.find((w) => w.id === get().activeId);
        if (w) load(w.document);
      },
      deleteCanvas: (id) => {
        get().capture();
        const w = get().workspaces.find((w) => w.id === get().activeId);
        if (!w || w.document.canvases.length <= 1) return;
        const removed = new Set([id]);
        let count = -1;
        while (count !== removed.size) {
          count = removed.size;
          for (const c of w.document.canvases)
            if (c.parentId && removed.has(c.parentId)) removed.add(c.id);
        }
        const canvases = w.document.canvases
          .filter((c) => !removed.has(c.id))
          .map((c) => {
            const nodes = c.nodes.filter((n) => !removed.has(n.data.meta["childCanvasId"] ?? ""));
            const ids = new Set(nodes.map((n) => n.id));
            return {
              ...c,
              nodes,
              edges: c.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
            };
          });
        if (!canvases[0]) return;
        const document = {
          ...w.document,
          canvases,
          activeCanvasId: removed.has(w.document.activeCanvasId)
            ? canvases[0].id
            : w.document.activeCanvasId,
        };
        set({
          workspaces: get().workspaces.map((x) =>
            x.id === w.id ? { ...x, document, dirty: true, generation: x.generation + 1 } : x,
          ),
        });
        load(document);
      },
      replaceRemote: (rows) => {
        get().capture();
        const initial = get().workspaces;
        if (
          rows.length &&
          initial.length === 1 &&
          initial[0]?.revision === -1 &&
          initial[0].generation === 0 &&
          initial[0].title === "My workspace" &&
          initial[0].document.canvases.length === 1 &&
          initial[0].document.canvases[0]?.title === "First thoughts" &&
          initial[0].document.canvases.every(
            (c) => !c.nodes.length && !c.edges.length && !c.ghosts.length && !c.history.length,
          )
        ) {
          const first = rows[0];
          if (first) {
            set({ workspaces: rows, activeId: first.id });
            load(first.document);
            return;
          }
        }
        const workspaces = [...get().workspaces];
        let reload = false;
        for (const row of rows) {
          const i = workspaces.findIndex((w) => w.id === row.id);
          const current = workspaces[i];
          if (!current) workspaces.push(row);
          else if (!current.dirty && current.revision < row.revision) {
            workspaces[i] = row;
            if (row.id === get().activeId) reload = true;
          }
        }
        set({ workspaces });
        if (reload) {
          const w = workspaces.find((w) => w.id === get().activeId);
          if (w) load(w.document);
        }
      },
      acknowledge: (id, revision, generation) =>
        set({
          workspaces: get().workspaces.map((w) =>
            w.id === id ? { ...w, revision, dirty: w.generation !== generation } : w,
          ),
        }),
      preserveConflict: (id, remote) => {
        const local = get().workspaces.find((w) => w.id === id);
        if (!local) return;
        const copy = {
          ...local,
          id: uuid(),
          title: `${local.title} · recovered edits`,
          revision: -1,
          dirty: true,
        };
        set({
          workspaces: [...get().workspaces.filter((w) => w.id !== id), remote, copy],
          activeId: get().activeId === id ? copy.id : get().activeId,
          status: "Concurrent edits preserved in a recovered workspace",
        });
      },
    }),
    {
      name: "threadwise-workspaces-v1",
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        owner: s.owner,
        workspaces: s.workspaces.map((w) => ({ ...w, document: cloudDocument(w.document) })),
        activeId: s.activeId,
      }),
    },
  ),
);

useThread.subscribe((state, previous) => {
  if (
    state.nodes !== previous.nodes ||
    state.edges !== previous.edges ||
    state.ghosts !== previous.ghosts ||
    state.history !== previous.history
  )
    useWorkspaces.getState().capture();
});