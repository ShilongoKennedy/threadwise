import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraft } from "@/lib/threadwise/draft";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { useSocratic } from "@/lib/threadwise/socratic";
import { playSound, useSound } from "@/lib/threadwise/sound";
import { WorkspaceBar } from "./WorkspaceBar";
import { EvidenceClipper } from "./EvidenceClipper";
import { MemoGenerator } from "./MemoGenerator";
import { SocraticDrawer } from "./SocraticDrawer";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  Atom,
  BookOpen,
  CircleHelp,
  FileDown,
  FileText,
  Orbit,
  RotateCcw,
  Scissors,
  Sparkles,
  PanelTopClose,
  Plus,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Search
} from "lucide-react";
import { createPhysics } from "@/lib/threadwise/physics";
import { auditGraph, neighborhood, raycast, type Direction } from "@/lib/threadwise/graph";
import { intelligentTidy } from "@/lib/threadwise/layout";
import { ExperimentOutcome } from "./ExperimentOutcome";
import { Timeline } from "./Timeline";
import { AuditPanel } from "./AuditPanel";
import { GhostNode, type GhostNodeT } from "./GhostNode";
import { ExplorePanel } from "./ExplorePanel";
import { Onboarding, useOnboarding } from "./Onboarding";
import type { TEdge, TNode } from "@/lib/threadwise/store";
import type { NodeChange } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NODE_TYPES, TYPE_INFO, relationLabel, type Relation, type ThreadNodeType } from "@/lib/threadwise/model";
import { useThread } from "@/lib/threadwise/store";
import { ThreadNode, TYPE_COLOR, TYPE_ICON } from "./ThreadNode";
import { RelationEdge, markSnap } from "./RelationEdge";
import { DetailsPanel, RelationGrid } from "./DetailsPanel";
import { paperColor } from "@/lib/threadwise/paper";
import { PlanningSuite } from "./PlanningSuite";
import { CanvasStudio } from "./CanvasStudio";
import { SpatialAtmosphere } from "./SpatialAtmosphere";
import { snapToLane } from "@/lib/threadwise/advanced";
import { toast } from "sonner";

const nodeTypes = { thread: ThreadNode, ghost: GhostNode };
const edgeTypes = { relation: RelationEdge };

type Pending = { conn: Connection; x: number; y: number; custom?: boolean; label?: string };

function Inner({ threadId }: { threadId?: string | undefined }) {
  const s = useThread();
  const navigate = useNavigate();
  const ws = useWorkspaces();
  const sound = useSound();
  const workspace = ws.workspaces.find((w) => w.id === ws.activeId);
  const canvasId = workspace?.document.activeCanvasId;
  const [clipper, setClipper] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | undefined>();
  const [presentation, setPresentation] = useState(false);
  const [memo, setMemo] = useState(false);
  const rf = useReactFlow();
  const [pending, setPending] = useState<Pending | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [physics, setPhysics] = useState(false);
  const [audit, setAudit] = useState(false);
  const [chromeOpen, setChromeOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [spatial, setSpatial] = useState(false);
  const [thoughtPortal, setThoughtPortal] = useState<string | null>(null);
  const [focusField, setFocusField] = useState(false);
  const onboarding = useOnboarding();
  const wrapper = useRef<HTMLDivElement>(null);
  const dragStart = useRef<Record<string, { x: number; y: number }>>({});
  const [kbd, setKbd] = useState(false);
  
  const pt = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const t = "changedTouches" in e ? e.changedTouches[0] : e;
    return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 };
  };
  const sx = (x: number) => x / Math.max(1, window.innerWidth);
  const overDraft = (x: number, y: number) =>
    document.elementsFromPoint(x, y).some((el) => el.closest("[data-memo-drop]"));
  
  const replay = s.replayIndex !== null;
  const snapshot = replay ? s.history[s.replayIndex ?? 0] : undefined;
  
  const visibleNodes = snapshot?.nodes ?? s.nodes ?? [];
  const visibleEdges = snapshot?.edges ?? s.edges ?? [];
  
  const focus = useMemo(
    () => neighborhood(s.selectedId, visibleEdges),
    [s.selectedId, visibleEdges],
  );
  const hasFocus = visibleNodes.some((n) => n.id === s.selectedId);
  const focusActive = focusField && hasFocus;
  const portalNode = visibleNodes.find((n) => n.id === thoughtPortal);
  const portalLinks = useMemo(
    () => thoughtPortal ? visibleEdges.filter((e) => e.source === thoughtPortal || e.target === thoughtPortal) : [],
    [thoughtPortal, visibleEdges],
  );
  const faults = useMemo(
    () => (audit ? auditGraph(visibleNodes, visibleEdges) : []),
    [audit, visibleNodes, visibleEdges],
  );
  const faultNodes = new Set(faults.flatMap((f) => f.nodeIds));
  const faultEdges = new Set(faults.flatMap((f) => f.edgeIds));
  const activeGhost = s.ghosts.find((g) => g.id === s.activeGhost);
  const sources = new Set(
    activeGhost?.sourceIds ??
      (activeGhost
        ? [activeGhost.anchorId, ...(activeGhost.targetId ? [activeGhost.targetId] : [])]
        : []),
  );

  const fitView = rf.fitView;
  useEffect(() => {
    setPending(null);
    setPhysics(false);
    setAudit(false);
    setExploreOpen(false);
    setClipper(false);
    setMemo(false);
    setThoughtPortal(null);
    setFocusField(false);
    const timer = setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 80);
    return () => clearTimeout(timer);
  }, [canvasId, fitView]);
  const openInquiry = () => {
    const id = useSocratic
      .getState()
      .create(canvasId ?? "", [...neighborhood(s.selectedId, s.edges).nodeIds]);
    void navigate({ to: "/socratic/$threadId", params: { threadId: id } });
  };

  useEffect(() => {
    if (!s.history.length) s.recordSnapshot("Starting canvas");
  }, [s.history.length, s.recordSnapshot]);
  useEffect(() => {
    if (!physics || replay) return;
    const state = useThread.getState();
    const engine = createPhysics(state.nodes, state.edges);
    let frame = 0;
    const tick = () => {
      engine.simulation.tick();
      const positions = engine.positions();
      const dragging = new Set(
        useThread
          .getState()
          .nodes.filter((n) => n.dragging)
          .map((n) => n.id),
      );
      for (const id of dragging) delete positions[id];
      useThread.getState().setPositions(positions);
      if (engine.simulation.alpha() > 0.015) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      engine.simulation.stop();
    };
  }, [physics, replay, s.nodes.length, s.edges]);
  
  const tidy = () => {
    setPhysics(false);
    const newPositions = intelligentTidy(s.nodes, s.edges);
    s.setPositions(newPositions);
    s.recordSnapshot("Intelligence tidy");
    setTimeout(() => rf.fitView({ padding: 0.25, duration: 800 }), 50);
  };

  const exportSitrep = () => {
    const canvasTitle = workspace?.document.canvases.find((c) => c.id === canvasId)?.title || "Untitled Canvas";
    
    const dossiers = visibleNodes.filter(n => n.data.kind === "dossier");
    const evidence = visibleNodes.filter(n => n.data.kind === "note");
    const hypotheses = visibleNodes.filter(n => n.data.kind === "idea");
    const omissions = visibleNodes.filter(n => n.data.kind === "omission" || n.data.kind === "question");
    const actions = visibleNodes.filter(n => n.data.kind === "action" || n.data.kind === "experiment");

    let md = `# SITREP: ${canvasTitle}\n\n`;
    md += `**Date:** ${new Date().toLocaleDateString()}\n`;
    md += `**Status:** UNCLASSIFIED // FOR OFFICIAL USE ONLY\n\n`;
    md += `---\n\n`;

    md += `## 1. INTELLIGENCE SOURCES (DOSSIERS)\n\n`;
    if (dossiers.length === 0) md += `*No sources indexed.*\n\n`;
    dossiers.forEach(d => {
      md += `### ${d.data.title}\n${d.data.body}\n\n`;
    });

    md += `## 2. KEY FINDINGS (EVIDENCE & NOTES)\n\n`;
    if (evidence.length === 0) md += `*No evidence logged.*\n\n`;
    evidence.forEach(e => {
      md += `- **${e.data.title}**: ${e.data.body}\n`;
    });
    md += `\n`;

    md += `## 3. STRATEGIC HYPOTHESES\n\n`;
    if (hypotheses.length === 0) md += `*No hypotheses generated.*\n\n`;
    hypotheses.forEach(h => {
      md += `### ${h.data.title}\n${h.data.body}\n\n`;
    });

    md += `## 4. BLIND SPOTS / OMISSIONS\n\n`;
    if (omissions.length === 0) md += `*No omissions identified.*\n\n`;
    omissions.forEach(o => {
      const edgesTo = visibleEdges.filter(e => e.target === o.id || e.source === o.id);
      const linkedNode = edgesTo.map(e => visibleNodes.find(n => n.id === (e.source === o.id ? e.target : e.source))).find(Boolean);
      md += `- **${o.data.title}**\n  ${o.data.body}\n  *(Challenges: ${linkedNode?.data.title || "General context"})*\n\n`;
    });

    md += `## 5. RECOMMENDED ACTIONS\n\n`;
    if (actions.length === 0) md += `*No actions assigned.*\n\n`;
    actions.forEach(a => {
      md += `- [ ] **${a.data.title}** (${a.data.kind})\n`;
    });
    md += `\n`;

    md += `## 6. INTELLIGENCE GRAPH\n\n`;
    visibleEdges.forEach(e => {
      const source = visibleNodes.find(n => n.id === e.source)?.data.title || "Unknown";
      const target = visibleNodes.find(n => n.id === e.target)?.data.title || "Unknown";
      const rel = e.data?.relation || "leads_to";
      md += `- ${source} ➔ *${rel}* ➔ ${target}\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SITREP-${canvasTitle.replace(/\s+/g, '-')}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Sitrep exported successfully.");
  };

  const allNodes = useMemo(
    () =>
      [
        ...visibleNodes.map((n) => ({
          ...n,
          selected: !replay && s.selectedId === n.id,
          className: `${(hasFocus || focusActive) && !focus.nodeIds.has(n.id) && !sources.has(n.id) ? "tw-fog" : ""} ${faultNodes.has(n.id) ? "tw-fault" : ""}`,
        })),
        ...(replay ? [] : s.ghosts).map((g): GhostNodeT => ({
          id: `ghost-${g.id}`,
          type: "ghost",
          position: g.position,
          data: { ghost: g },
          connectable: false,
          selectable: true,
        })),
      ] as (TNode | GhostNodeT)[],
    [visibleNodes, s.ghosts, replay, hasFocus, focusActive, focus, s.selectedId, activeGhost, faults],
  );
  const allEdges = useMemo(
    () => [
      ...visibleEdges.map((e) => ({
        ...e,
        selected: !replay && s.selectedId === e.id,
        data: {
          ...e.data,
          relation: e.data?.relation ?? ("leads_to" as Relation),
          traced: hasFocus && focus.edgeIds.has(e.id),
          dimmed: hasFocus && !focus.edgeIds.has(e.id),
          fault: faultEdges.has(e.id),
        },
      })),
      ...(replay ? [] : s.ghosts).flatMap((g): TEdge[] => [
        {
          id: `ghost-edge-${g.id}`,
          source: g.anchorId,
          target: `ghost-${g.id}`,
          type: "relation",
          selectable: false,
          data: {
            relation: g.relation as Relation,
            ghost: true,
            provenance: s.activeGhost === g.id,
          },
        },
        ...(g.kind === "connection" && g.targetId
          ? [
              {
                id: `ghost-target-${g.id}`,
                source: `ghost-${g.id}`,
                target: g.targetId,
                type: "relation" as const,
                selectable: false,
                data: {
                  relation: g.relation as Relation,
                  ghost: true,
                  provenance: s.activeGhost === g.id,
                },
              },
            ]
          : []),
      ]),
    ],
    [visibleEdges, s.ghosts, replay, focus, hasFocus, faults, s.activeGhost],
  );
  const onNodesChange = (changes: NodeChange<TNode | GhostNodeT>[]) => {
    if (replay) return;
    const real: NodeChange<TNode>[] = [];
    for (const c of changes) {
      if ("id" in c && c.id.startsWith("ghost-")) {
        if (c.type === "position" && c.position) s.moveGhost(c.id.slice(6), c.position);
      } else real.push(c as NodeChange<TNode>);
    }
    if (real.length) s.onNodesChange(real);
  };

  const create = useCallback(
    (kind: ThreadNodeType, screen?: { x: number; y: number }) => {
      if (replay) return;
      if (kind === "portal") {
        ws.createCanvas("Untitled child canvas", canvasId);
        return;
      }
      const pt = screen ?? { x: window.innerWidth / 2 - 128, y: window.innerHeight / 2 - 50 };
      const pos = rf.screenToFlowPosition(pt);
      s.addNode(kind, { x: pos.x - (screen ? 128 : 0), y: pos.y - (screen ? 30 : 0) });
    },
    [rf, s, replay, ws, canvasId],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      
      if (
        presentation || 
        t.closest('[role="dialog"]') || 
        t.closest('[aria-label="Canvas studio"]') ||
        t.tagName === "INPUT" || 
        t.tagName === "TEXTAREA" || 
        t.isContentEditable
      ) return;

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const n = Number(e.key);
      const kind = n >= 1 && n <= 5 ? NODE_TYPES[n - 1] : undefined;
      if (kind) {
        e.preventDefault();
        create(kind);
      } else if (e.key === "e" || e.key === "E") setExploreOpen((o) => !o);
      else if ((e.key === "o" || e.key === "O") && useThread.getState().selectedId) {
        e.preventDefault();
        setThoughtPortal(useThread.getState().selectedId);
      }
      else if ((e.key === "z" || e.key === "Z") && useThread.getState().selectedId) {
        e.preventDefault();
        setFocusField((active) => !active);
      }
      else if (e.key.startsWith("Arrow")) {
        const st = useThread.getState();
        if (st.replayIndex !== null) return;
        e.preventDefault();
        setKbd(true);
        const from = st.nodes.find((n) => n.id === st.selectedId);
        let next: string | null;
        if (!from) {
          const c = rf.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
          next =
            [...st.nodes].sort(
              (a, b) =>
                Math.hypot(a.position.x - c.x, a.position.y - c.y) -
                Math.hypot(b.position.x - c.x, b.position.y - c.y),
            )[0]?.id ?? null;
        } else
          next = raycast(from.id, e.key.slice(5).toLowerCase() as Direction, st.nodes, st.edges);
        const target = st.nodes.find((n) => n.id === next);
        if (target) {
          st.select(target.id);
          void rf.setCenter(target.position.x + 136, target.position.y + 60, {
            zoom: rf.getZoom(),
            duration: 320,
          });
          playSound("drag", 0.5);
        }
      } else if ((e.key === "l" || e.key === "L") && !e.shiftKey) {
        const st = useThread.getState();
        if (
          st.replayIndex !== null ||
          !st.selectedId ||
          !st.nodes.some((n) => n.id === st.selectedId)
        )
          return;
        setKbd(true);
        st.setLinkAnchor(st.linkAnchor === st.selectedId ? null : st.selectedId);
      } else if (e.key === "L" && e.shiftKey) {
        const st = useThread.getState();
        if (!st.linkAnchor || !st.selectedId) return;
        const a = st.linkAnchor,
          b = st.selectedId;
        st.edges
          .filter((x) => (x.source === a && x.target === b) || (x.source === b && x.target === a))
          .forEach((x) => st.deleteEdge(x.id));
        st.setLinkAnchor(null);
        playSound("drop", 0.5);
      } else if (e.key === "Enter") {
        const st = useThread.getState();
        if (!st.linkAnchor || !st.selectedId || st.linkAnchor === st.selectedId) return;
        e.preventDefault();
        const node = rf.getInternalNode(st.selectedId);
        const screen = node
          ? rf.flowToScreenPosition({
              x: node.internals.positionAbsolute.x,
              y: node.internals.positionAbsolute.y,
            })
          : { x: 200, y: 200 };
        setPending({
          conn: {
            source: st.linkAnchor,
            target: st.selectedId,
            sourceHandle: null,
            targetHandle: null,
          },
          x: screen.x,
          y: screen.y,
        });
        st.setLinkAnchor(null);
      } else if (e.key === "Escape") {
        if (focusField) {
          setFocusField(false);
          return;
        }
        setThoughtPortal(null);
        useThread.getState().select(null);
        useThread.getState().setLinkAnchor(null);
        setPending(null);
        setKbd(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [create, rf, presentation, focusField]);

  const finish = (relation: Relation, label?: string) => {
    if (!pending) return;
    markSnap();
    s.connect(pending.conn, relation, label);
    playSound("latch", sx(pending.x));
    try {
      navigator.vibrate?.(8);
    } catch {
      /* haptics are optional */
    }
    const target = document.querySelector(
      `.react-flow__node[data-id="${CSS.escape(pending.conn.target)}"]`,
    );
    target?.classList.add("tw-recoil");
    setTimeout(() => target?.classList.remove("tw-recoil"), 360);
    setPending(null);
  };

  const advancePortal = (kind: ThreadNodeType) => {
    if (!portalNode || replay) return;
    const titles: Partial<Record<ThreadNodeType, string>> = {
      question: `What would change our mind about “${portalNode.data.title || "this thought"}”?`,
      experiment: `Test: ${portalNode.data.title || "this thought"}`,
      action: `Move: ${portalNode.data.title || "this thought"}`,
    };
    const offset = kind === "question" ? { x: 350, y: 190 } : kind === "experiment" ? { x: 350, y: 0 } : { x: 350, y: -190 };
    const id = s.addNode(kind, { x: portalNode.position.x + offset.x, y: portalNode.position.y + offset.y });
    s.updateNode(id, { title: titles[kind] ?? "Untitled thought" });
    const connection = { sourceHandle: null, targetHandle: null };
    if (kind === "question") s.connect({ ...connection, source: portalNode.id, target: id }, "needs_evidence_from");
    if (kind === "experiment") s.connect({ ...connection, source: id, target: portalNode.id }, "could_solve");
    if (kind === "action") s.connect({ ...connection, source: portalNode.id, target: id }, "leads_to");
    setThoughtPortal(id);
    void rf.setCenter(portalNode.position.x + 270, portalNode.position.y + 70, { zoom: Math.max(rf.getZoom(), 0.86), duration: 350 });
  };

  return (
    <div
      ref={wrapper}
      data-canvas-paper={paperColor(
        workspace?.document.canvases.find((c) => c.id === canvasId)?.color,
      )}
      className={`relative h-full w-full ${replay ? "tw-replay" : ""} ${kbd ? "tw-kbd" : ""} ${focusActive ? "tw-focus-field" : ""} ${presentation ? "tw-presenting" : ""} ${chromeOpen ? "tw-chrome-open" : "tw-chrome-quiet"}`}
      onDragOver={(e) => {
        if (!replay && !presentation && e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (replay || presentation || !e.dataTransfer.files.length) return;
        e.preventDefault();
        setDroppedFile(e.dataTransfer.files[0]);
        setClipper(true);
      }}
      onPointerDown={() => setKbd(false)}
      onPointerMove={(e) => {
        const el = wrapper.current;
        if (!el) return;
        el.style.setProperty("--lx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty("--ly", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }}
      onDoubleClick={(e) => {
        if (!presentation && (e.target as HTMLElement).classList.contains("react-flow__pane"))
          create("idea", { x: e.clientX, y: e.clientY });
      }}
    >
      {!presentation && spatial && <SpatialAtmosphere density={visibleNodes.length} />}
      <ReactFlow
        nodes={allNodes}
        edges={allEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={(changes) => {
          if (!replay) s.onEdgesChange(changes);
        }}
        nodesDraggable={!replay && !presentation}
        nodesConnectable={!replay && !presentation}
        deleteKeyCode={replay || presentation ? null : "Backspace"}
        onConnect={(conn) => setTimeout(() => setPending({ conn, ...lastPointerRef.current }), 0)}
        onConnectEnd={(ev) => {
          const p = "changedTouches" in ev ? ev.changedTouches[0] : ev;
          if (p) lastPointerRef.current = { x: p.clientX, y: p.clientY };
        }}
        onNodeClick={(_, n) => {
          if (replay || presentation) return;
          if (n.type === "ghost") s.setActiveGhost(n.id.slice(6));
          else s.select(n.id);
        }}
        onNodeDoubleClick={(_, n) => {
          if (replay || n.type !== "thread") return;
          if (n.data.kind === "portal") ws.switchCanvas(String(n.data.meta["childCanvasId"] ?? ""));
          else {
            s.select(n.id);
            setThoughtPortal(n.id);
          }
        }}
        onMove={(e) => {
          if (e && "clientX" in e) playSound("pan", sx(e.clientX));
        }}
        onNodeDragStart={(e, n) => {
          const p = pt(e);
          dragStart.current[n.id] = { ...n.position };
          playSound("drag", sx(p.x));
        }}
        onNodeDrag={(e) => {
          const p = pt(e);
          playSound("drag", sx(p.x));
          if (memo)
            document
              .querySelector("[data-memo-drop]")
              ?.classList.toggle("tw-transclude-target", overDraft(p.x, p.y));
        }}
        onNodeDragStop={(e, n) => {
          const p = pt(e);
          playSound("drop", sx(p.x));
          const start = dragStart.current[n.id];
          delete dragStart.current[n.id];
          const canvas = workspace?.document.canvases.find((c) => c.id === canvasId);
          if (n.type === "thread") {
            const snapped = snapToLane(n as TNode, canvas?.suite?.frames ?? []);
            if (snapped) s.setPositions({ [n.id]: snapped });
          }
          document.querySelector("[data-memo-drop]")?.classList.remove("tw-transclude-target");
          if (memo && canvasId && n.type === "thread" && overDraft(p.x, p.y)) {
            useDraft.getState().embed(canvasId, n.id);
            if (start) s.setPositions({ [n.id]: start });
            playSound("latch", sx(p.x));
          }
        }}
        onEdgeClick={(_, e) => {
          if (!replay && !presentation && !e.id.startsWith("ghost-")) s.select(e.id);
        }}
        onPaneClick={() => {
          s.select(null);
          s.setActiveGhost(null);
          setPending(null);
        }}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--edge)" },
        }}
        zoomOnDoubleClick={false}
        snapToGrid
        snapGrid={[12, 12]}
        connectionRadius={32}
        nodeDragThreshold={3}
        autoPanOnNodeDrag
        selectNodesOnDrag={false}
        minZoom={0.1}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          id="minor"
          variant={BackgroundVariant.Lines}
          gap={24}
          lineWidth={0.5}
          color="var(--grid-minor)"
        />
        <Background
          id="major"
          variant={BackgroundVariant.Lines}
          gap={120}
          lineWidth={0.75}
          color="var(--grid-major)"
        />
        {!presentation&&<Controls
          position="bottom-left"
          showInteractive={false}
          className="!hidden md:!flex"
          style={{ marginLeft: 24, marginBottom: 24 }}
        />}
        {!presentation&&!s.selectedId && (
          <MiniMap
            className="!hidden lg:!block"
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) =>
              n.type === "ghost"
                ? "var(--grid-major)"
                : TYPE_COLOR[(n.data as { kind: ThreadNodeType }).kind]
            }
            nodeBorderRadius={2}
            maskColor="color-mix(in oklab, var(--background) 75%, transparent)"
            style={{ marginRight: 24, marginBottom: 24, width: 168, height: 108 }}
          />
        )}
      </ReactFlow>
      {focusActive && (
        <div className="tw-focus-field-bar" role="status">
          <span><i /> Focus field <b>{visibleNodes.find((node) => node.id === s.selectedId)?.data.title ?? "Selected thought"}</b></span>
          <Button variant="ghost" size="sm" onClick={() => setFocusField(false)}>Exit <kbd>Esc</kbd></Button>
        </div>
      )}
      {portalNode && !presentation && (
        <aside className="tw-thought-portal" role="dialog" aria-modal="true" aria-label={`Thought portal: ${portalNode.data.title}`}>
          <div className="tw-thought-portal-glow" aria-hidden />
          <header>
            <div className="tw-portal-kicker"><Orbit /> Thought portal <span>O</span></div>
            <Button variant="ghost" size="icon" onClick={() => setThoughtPortal(null)} aria-label="Close thought portal"><X /></Button>
          </header>
          <div className="tw-portal-core" style={{ ["--portal-tone" as string]: TYPE_COLOR[portalNode.data.kind] }}>
            <div className="tw-portal-type">{TYPE_INFO[portalNode.data.kind].label} · {portalNode.data.epistemic}</div>
            <h2>{portalNode.data.title || "Untitled thought"}</h2>
            <p>{portalNode.data.body || "This thought is waiting for its first sentence."}</p>
          </div>
          <div className="tw-portal-metrics">
            <span><b>{portalLinks.length}</b> live threads</span>
            <span><b>{portalLinks.filter((e) => e.data?.relation === "needs_evidence_from").length}</b> evidence asks</span>
            <span><b>{portalLinks.filter((e) => e.data?.relation === "contradicts").length}</b> tensions</span>
          </div>
          <section aria-label="Connected thoughts">
            <div className="tw-portal-section-title">What this thought touches</div>
            <div className="tw-portal-links">
              {portalLinks.length ? portalLinks.map((edge) => {
                const otherId = edge.source === portalNode.id ? edge.target : edge.source;
                const other = visibleNodes.find((node) => node.id === otherId);
                return other ? <button key={edge.id} onClick={() => { s.select(other.id); setThoughtPortal(other.id); }}>
                  <i style={{ background: TYPE_COLOR[other.data.kind] }} />
                  <span><small>{relationLabel(edge.data?.relation ?? "leads_to", edge.data?.customLabel)}</small>{other.data.title || "Untitled thought"}</span>
                </button> : null;
              }) : <p className="tw-portal-empty">No connections yet. Link evidence, a question, or a next move to give this thought momentum.</p>}
            </div>
          </section>
          <section className="tw-portal-next" aria-label="Create the next move">
            <div className="tw-portal-section-title">Give it momentum</div>
            <div>
              <button onClick={() => advancePortal("question")}><b>?</b><span>Challenge it<small>Ask what would change your mind</small></span></button>
              <button onClick={() => advancePortal("experiment")}><b>✳</b><span>Test it<small>Design the smallest useful experiment</small></span></button>
              <button onClick={() => advancePortal("action")}><b>→</b><span>Move it<small>Turn the thought into a next action</small></span></button>
            </div>
          </section>
          <footer>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setThoughtPortal(null); s.select(portalNode.id); }}>Edit this thought</Button>
              <Button variant="ghost" onClick={() => { setThoughtPortal(null); s.select(portalNode.id); setFocusField(true); }}>Focus canvas</Button>
              <Button onClick={() => { window.dispatchEvent(new CustomEvent("threadwise:present-from", { detail: { id: portalNode.id } })); setThoughtPortal(null); }}>Present this scene</Button>
            </div>
            <span>Double-click any card · O opens selected</span>
          </footer>
        </aside>
      )}
      <CanvasStudio
        onEvidence={() => {
          setDroppedFile(undefined);
          setClipper(true);
        }}
        onPresentChange={(v) => {
          setPresentation(v);
          setPhysics(false);
          s.select(null);
        }}
      />
      <div className="tw-desk-chrome">
        {chromeOpen && <><Timeline />
        <WorkspaceBar />
        </>}
        {!threadId && <PlanningSuite />}
        {audit && !replay && (
          <AuditPanel
            faults={faults}
            onClose={() => setAudit(false)}
            onFocus={(id) => {
              s.select(id);
              rf.fitView({
                nodes: visibleNodes.filter((n) =>
                  faults.some((f) => f.actionId === id && f.nodeIds.includes(n.id)),
                ),
                padding: 0.6,
                duration: 400,
              });
            }}
          />
        )}
        {replay && (
          <div className="absolute left-4 right-4 top-[184px] z-10 border-l-2 border-foreground bg-background/95 px-3 py-2 font-mono text-[10px] md:left-6 md:right-auto md:top-[132px]">
            REPLAY · {snapshot?.label} · {snapshot ? new Date(snapshot.at).toLocaleString() : ""}
          </div>
        )}
        {chromeOpen && <div
          className={`tw-toolstrip absolute right-4 top-[185px] z-10 max-w-[calc(100%-32px)] gap-1 overflow-x-auto border bg-card p-1 shadow-[var(--shadow-card)] md:top-5 md:right-20 ${threadId ? "hidden md:flex" : "flex"}`}
        >
          <Button
            size="icon"
            variant={physics ? "default" : "ghost"}
            disabled={replay}
            aria-pressed={physics}
            aria-label="Toggle semantic physics"
            title="Semantic physics"
            onClick={() => setPhysics((v) => !v)}
          >
            <Atom />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={replay}
            aria-label="Tidy semantic layout"
            title="Tidy semantic layout"
            onClick={tidy}
          >
            <Wand2 />
          </Button>
          <Button
            size="icon"
            variant={audit ? "default" : "ghost"}
            disabled={replay}
            aria-pressed={audit}
            aria-label="Audit epistemic integrity"
            title="Audit · fragile ideas"
            onClick={() => setAudit((v) => !v)}
          >
            <AlertTriangle />
          </Button>
          <div className="mx-1 border-l" />
          <Button
            size="icon"
            variant="ghost"
            disabled={replay}
            aria-label="Open evidence clipper"
            title="Evidence clipper"
            onClick={() => setClipper(true)}
          >
            <Scissors />
          </Button>
          <Button
            size="icon"
            variant={threadId ? "default" : "ghost"}
            disabled={replay}
            aria-label="Open Socratic inquiry"
            title="Socratic inquiry"
            onClick={openInquiry}
          >
            <BookOpen />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={replay}
            aria-label="Export Sitrep"
            title="Export Sitrep (Markdown)"
            onClick={exportSitrep}
          >
            <FileDown />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={replay}
            aria-label="Open live draft"
            title="Live draft · drag cards in"
            aria-pressed={memo}
            onClick={() => setMemo((v) => !v)}
          >
            <FileText />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle sound"
            title={sound.enabled ? "Mute sound" : "Enable tactile sound"}
            aria-pressed={sound.enabled}
            onClick={sound.toggle}
          >
            {sound.enabled ? <Volume2 /> : <VolumeX />}
          </Button>
        </div>}

        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="pointer-events-auto flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="h-7 w-7 text-foreground" aria-hidden>
              <circle cx="7" cy="9" r="3" fill="currentColor" />
              <circle cx="25" cy="23" r="3" fill="var(--accent-ink)" />
              <path
                d="M7 9 C 16 9, 14 23, 25 23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            <div className="leading-none">
              <div className="font-display text-[22px] italic tracking-tight">Threadwise</div>
              <div className={`mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground ${chromeOpen ? "" : "hidden"}`}>
                {String(visibleNodes.length).padStart(2, "0")} cards ·{" "}
                {String(visibleEdges.length).padStart(2, "0")} threads
              </div>
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSpatial((v) => !v)}
            aria-pressed={spatial}
            aria-label={spatial ? "Turn off spatial atmosphere" : "Turn on spatial atmosphere"}
            title={spatial ? "Turn off spatial atmosphere" : "Turn on spatial atmosphere"}
            className="tw-canvas-toggle tw-press grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground shadow-[var(--shadow-card)] hover:text-foreground"
          >
            <Atom className={`h-4 w-4 transition-transform ${spatial ? "rotate-90 text-accent-ink" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChromeOpen((v) => !v)}
            aria-pressed={chromeOpen}
            aria-label={chromeOpen ? "Hide workspace controls" : "Show workspace controls"}
            title={chromeOpen ? "Hide workspace controls" : "Show workspace controls"}
            className="tw-canvas-toggle tw-press grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground shadow-[var(--shadow-card)] hover:text-foreground"
          >
            <PanelTopClose className={`h-4 w-4 transition-transform ${chromeOpen ? "rotate-180" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            disabled={replay}
            onClick={onboarding.show}
            aria-label="Show introduction"
            title="Introduction & shortcuts"
            className="tw-press pointer-events-auto grid h-10 w-10 place-items-center rounded-full border bg-card font-display text-lg italic text-muted-foreground shadow-[var(--shadow-card)] transition-colors hover:text-foreground"
          >
            ?
          </Button>
          </div>
        </header>

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-10 justify-center px-3 sm:bottom-5 ${threadId ? "hidden md:flex" : "flex"}`}
        >
          <nav
            className="dock pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl p-1.5"
            aria-label="Add to canvas"
          >
            {!dockOpen ? <Button variant="ghost" disabled={replay} onClick={() => setDockOpen(true)} className="tw-press flex h-11 items-center gap-2 rounded-xl px-4 text-[13px] text-dock-foreground"><Plus className="h-4 w-4" />Add to canvas</Button> : <>
            {NODE_TYPES.filter(k => k !== "dossier").map((k, i) => {
              const Icon = TYPE_ICON[k];
              return (
                <Button
                  variant="ghost"
                  disabled={replay}
                  key={k}
                  onClick={() => create(k)}
                  title={`${TYPE_INFO[k].hint}${i < 5 ? ` — press ${i + 1}` : ""}`}
                  aria-label={`Add ${TYPE_INFO[k].label}`}
                  className="tw-press group flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2.5 text-[13px] text-dock-foreground/80 transition-colors hover:bg-dock-foreground/10 hover:text-dock-foreground lg:px-3"
                >
                  <Icon
                    className="h-[18px] w-[18px] lg:h-4 lg:w-4"
                    style={{ color: TYPE_COLOR[k] }}
                    strokeWidth={1.75}
                  />
                  <span className="hidden lg:inline">{TYPE_INFO[k].label}</span>
                  {i < 5 && (
                    <kbd className="hidden font-mono text-[10px] text-dock-foreground/35 group-hover:text-dock-foreground/60 [@media(hover:hover)]:md:inline">
                      {i + 1}
                    </kbd>
                  )}
                </Button>
              );
            })}
            <div className="mx-1 h-6 w-px shrink-0 bg-dock-foreground/15" />
            <Button
              variant="ghost"
              disabled={replay}
              onClick={() => setExploreOpen((o) => !o)}
              title="Explore with AI — press E"
              className={`tw-press flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-[13px] font-medium transition-colors ${exploreOpen ? "bg-accent-ink text-dock" : "text-dock-foreground hover:bg-dock-foreground/10"}`}
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />{" "}
              <span className="hidden sm:inline">Explore</span>
              {s.ghosts.length > 0 && (
                <span className="rounded-full bg-dock-foreground/15 px-1.5 font-mono text-[10px]">
                  {s.ghosts.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" title="Collapse add tools" aria-label="Collapse add tools" onClick={() => setDockOpen(false)} className="tw-press grid h-11 w-9 shrink-0 place-items-center rounded-xl text-dock-foreground/60 hover:bg-dock-foreground/10">×</Button>
            </>}
            <Button
              variant="ghost"
              title="Open Threadwise guide"
              aria-label="Open Threadwise guide"
              onClick={onboarding.show}
              className="tw-press grid h-11 w-10 shrink-0 place-items-center rounded-xl text-dock-foreground/50 transition-colors hover:bg-dock-foreground/10 hover:text-dock-foreground"
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              disabled={replay}
              title="Reset to example canvas"
              aria-label="Reset to example canvas"
              onClick={() => confirm("Replace this canvas with the example?") && s.reset()}
              className="tw-press grid h-11 w-10 shrink-0 place-items-center rounded-xl text-dock-foreground/50 transition-colors hover:bg-dock-foreground/10 hover:text-dock-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </nav>
        </div>
        {onboarding.open && <Onboarding onClose={onboarding.close} />}
        
        {s.nodes.length === 0 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="pointer-events-auto bg-[#FDFBF7]/90 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] rounded-3xl p-10 max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500">
              
              <div className="mx-auto w-16 h-16 bg-[#CBE6F9] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                 <Search className="w-8 h-8 text-[#1A1A1A]" />
              </div>
              
              <h2 className="font-display text-4xl mb-3 text-foreground tracking-tight">Uncover the bigger picture.</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                Paste speeches, news articles, or transcripts. Threadwise helps you find hidden motives, contradictions, and the truth.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent("threadwise:open-lab"))} 
                  className="w-full h-12 text-base bg-[#1A1A1A] hover:bg-[#333] text-white shadow-lg"
                >
                  <Search className="mr-2 h-5 w-5" /> Start a Discourse Analysis
                </Button>
                <Button variant="outline" onClick={() => create("idea")} className="w-full h-12 bg-white/50 border-black/10">
                  <Plus className="mr-2 h-4 w-4" /> Start a blank canvas
                </Button>
                <Button variant="ghost" onClick={() => s.reset()} className="w-full h-12 text-muted-foreground hover:text-foreground">
                  Load an example canvas
                </Button>
              </div>

              <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Or double-click anywhere on the canvas
              </p>
            </div>
          </div>
        )}

        {pending && (
          <div
            className="tw-pop absolute z-20 w-64 rounded-xl border bg-popover p-2 shadow-[var(--shadow-lift)]"
            style={{
              left: Math.max(8, Math.min(pending.x, window.innerWidth - 272)),
              top: Math.max(8, Math.min(pending.y, window.innerHeight - 320)),
            }}
          >
            <div className="px-1.5 pb-2 pt-1 font-display text-[15px] italic">
              How are these related?
            </div>
            {pending.custom ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  finish("custom", pending.label);
                }}
                className="flex gap-1"
              >
                <Input
                  autoFocus
                  placeholder="e.g. inspired by"
                  value={pending.label ?? ""}
                  onChange={(e) => setPending({ ...pending, label: e.target.value })}
                  className="h-8 text-xs"
                />
                <Button size="sm" type="submit">
                  Add
                </Button>
              </form>
            ) : (
              <RelationGrid
                onPick={(r) =>
                  r === "custom" ? setPending({ ...pending, custom: true }) : finish(r)
                }
              />
            )}
            <button
              className="mt-1 w-full rounded-md py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
        )}

        {exploreOpen && !replay && <ExplorePanel onClose={() => setExploreOpen(false)} />}
        {!replay && !threadId && !memo && <DetailsPanel />}
        {!replay && <ExperimentOutcome />}
        {clipper && !replay && (
          <EvidenceClipper
            initialFile={droppedFile}
            onClose={() => {
              setClipper(false);
              setDroppedFile(undefined);
            }}
          />
        )}
        {memo && !replay && canvasId && (
          <MemoGenerator canvasId={canvasId} onClose={() => setMemo(false)} />
        )}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="tw-deckle" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
        </svg>
        {threadId && !replay && <SocraticDrawer threadId={threadId} />}
      </div>
    </div>
  );
}

const lastPointerRef = { current: { x: 200, y: 200 } };

export default function Canvas({ threadId }: { threadId?: string | undefined }) {
  return (
    <ReactFlowProvider>
      <Inner threadId={threadId} />
    </ReactFlowProvider>
  );
}