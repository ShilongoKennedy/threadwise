import { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  GitBranch,
  GitFork,
  Inbox,
  Layers,
  Link2,
  Maximize,
  MousePointer2,
  PenLine,
  Play,
  Plus,
  ScanLine,
  ShieldCheck,
  Stamp,
  Trash2,
  Users,
  Wand2,
  X,
  FileUp,
  ChartNoAxesCombined,
  PanelTop,
  Presentation,
  Square,
  Pause,
  SlidersHorizontal,
  Wallet,
  FileBadge,
  BookOpenText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useThread } from "@/lib/threadwise/store";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { useAccount } from "@/lib/threadwise/cloud-sync";
import {
  batchPairs,
  emptySuite,
  graphDigest,
  graphSvg,
  mergeGraph,
  narrative,
  simulate,
  topology,
  type Suite,
} from "@/lib/threadwise/advanced";
import { layeredLayout } from "@/lib/threadwise/layout";
import { streamTask } from "@/lib/threadwise/ai-client";
import { validateFindings, type RedTeamResult } from "@/lib/threadwise/redteam";
import { RELATIONS, type Relation, type ThreadNodeType } from "@/lib/threadwise/model";
import { LivePresence, LiveRoomDialog } from "./LiveRoom";
import { accountLabel } from "@/lib/threadwise/account-label";
import { readReactions } from "@/lib/threadwise/reactions";
import { PresentationMode } from "./PresentationMode";
import { ThoughtPlayback } from "./ThoughtPlayback";
import { DecisionTheatre } from "./DecisionTheatre";
import { ConsequenceMap } from "./ConsequenceMap";
import { DossierTool, RunwayTool, ScenarioTool } from "./StrategyTools";
import { DiscourseLab } from "./DiscourseLab";

const TOOLS = [
  { id: "presence", label: "Live room & audio", icon: Users },
  { id: "risk", label: "Risk simulation", icon: ChartNoAxesCombined },
  { id: "discourse", label: "Discourse lab", icon: BookOpenText },
  { id: "scenario", label: "Scenario stress-test", icon: SlidersHorizontal },
  { id: "runway", label: "Resource & runway", icon: Wallet },
  { id: "dossier", label: "Executive dossier", icon: FileBadge },
  { id: "radar", label: "Executive radar", icon: ChartNoAxesCombined },
  { id: "zoom", label: "Spatial narratives", icon: Maximize },
  { id: "tensions", label: "Contradiction engine", icon: GitFork },
  { id: "field", label: "Field capture", icon: PenLine },
  { id: "intake", label: "Conversation to canvas", icon: FileUp },
  { id: "bridge", label: "External bridge", icon: Link2 },
  { id: "branches", label: "Branches & merge", icon: GitBranch },
  { id: "present", label: "Presentation", icon: Presentation },
  { id: "playback", label: "Thought playback", icon: Play },
  { id: "theatre", label: "Decision theatre", icon: Square },
  { id: "consequences", label: "Consequence map", icon: GitFork },
  { id: "redteam", label: "Red-team audit", icon: ShieldCheck },
  { id: "pointer", label: "Laser & temporary ink", icon: MousePointer2 },
  { id: "frames", label: "Swimlanes & frames", icon: PanelTop },
  { id: "stamps", label: "Reaction stamps", icon: Stamp },
  { id: "inbox", label: "Capture inbox", icon: Inbox },
  { id: "path", label: "Critical path & depth", icon: ScanLine },
  { id: "weave", label: "Batch wire", icon: Layers },
  { id: "layout", label: "Auto-layout", icon: Wand2 },
  { id: "evidence", label: "Document & evidence", icon: FileUp },
  { id: "seal", label: "Decision signature", icon: Check },
  { id: "export", label: "Vector & narrative export", icon: Download },
];
type Stroke = { id: string; points: { x: number; y: number }[]; at: number };
const saveFile = (text: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const downloadSlug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "canvas";
export function CanvasStudio({
  onEvidence,
  onPresentChange,
}: {
  onEvidence: () => void;
  onPresentChange: (v: boolean) => void;
}) {
  const s = useThread(),
    ws = useWorkspaces(),
    user = useAccount((a) => a.user),
    rf = useReactFlow(),
    viewport = useViewport();
  const w = ws.workspaces.find((w) => w.id === ws.activeId),
    canvas = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId),
    suite = canvas?.suite ?? emptySuite();
  const [open, setOpen] = useState(false),
    [tool, setTool] = useState("inbox"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [live, setLive] = useState(false);
  const [ink, setInk] = useState<"laser" | "pen" | null>(null),
    [strokes, setStrokes] = useState<Stroke[]>([]),
    [laser, setLaser] = useState<{ x: number; y: number } | null>(null),
    currentStroke = useRef<string | null>(null);
  const [title, setTitle] = useState(""),
    [capture, setCapture] = useState(""),
    [ids, setIds] = useState<string[]>([]),
    [relation, setRelation] = useState<Relation>("depends_on"),
    [wireMode, setWireMode] = useState<"chain" | "fan" | "all">("chain");
  const [prob, setProb] = useState<Record<string, number>>({}),
    [results, setResults] = useState<ReturnType<typeof simulate> | null>(null),
    [findings, setFindings] = useState<RedTeamResult | null>(null),
    [choices, setChoices] = useState<Record<string, "ours" | "theirs">>({}),
    [signature, setSignature] = useState(""),
    [digest, setDigest] = useState("");
  const [present, setPresent] = useState(false),
    [stop, setStop] = useState(0),
    [auto, setAuto] = useState(false),
    [pace, setPace] = useState(7000),
    [playback, setPlayback] = useState(false),
    [theatre, setTheatre] = useState(false);
  const [consequences, setConsequences] = useState(false),
    [lab, setLab] = useState(false),
    [redTeamPersona, setRedTeamPersona] = useState("skeptical investor");
  const [tensionFrom, setTensionFrom] = useState(""),
    [tensionTo, setTensionTo] = useState(""),
    [fieldKind, setFieldKind] = useState<ThreadNodeType>("note"),
    [fieldText, setFieldText] = useState(""),
    [intakeText, setIntakeText] = useState(""),
    [intakeCards, setIntakeCards] = useState<
      { kind: ThreadNodeType; title: string; body: string; relation?: Relation }[]
    >([]);
  const abort = useRef<AbortController | null>(null),
    revision = useRef(0);
  const update = (patch: Partial<Suite>) => {
    if (canvas && s.replayIndex === null) ws.updateSuite(canvas.id, { ...suite, ...patch });
  };
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The tool could not finish.");
    } finally {
      setBusy(false);
    }
  };
  const check = (id: string) =>
    setIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const validStops = suite.stops.filter((id) => s.nodes.some((n) => n.id === id));
  const dependency = topology(s.nodes, s.edges),
    depth = topology(s.nodes, s.edges, false);
  const branch = suite.branch,
    source = w?.document.canvases.find((c) => c.id === branch?.sourceId);
  const merged =
    branch && source
      ? mergeGraph(
          { nodes: branch.baseNodes, edges: branch.baseEdges },
          { nodes: source.nodes, edges: source.edges },
          { nodes: s.nodes, edges: s.edges },
          choices,
        )
      : null;
  useEffect(() => {
    setIds([]);
    setResults(null);
    setFindings(null);
    setProb({});
    setChoices({});
    setStrokes([]);
    setInk(null);
    setPresent(false);
    setPlayback(false);
    setTheatre(false);
    setAuto(false);
    setStop(0);
    onPresentChange(false);
    abort.current?.abort();
    revision.current++;
  }, [canvas?.id]);
  useEffect(() => {
    const beginFromThought = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id || !s.nodes.some((node) => node.id === id) || s.replayIndex !== null) return;
      // The invited thought is the opening beat; keep the authored walkthrough after it.
      update({ stops: [id, ...suite.stops.filter((stopId) => stopId !== id)] });
      setStop(0);
      setPresent(true);
      setOpen(false);
      onPresentChange(true);
    };
    window.addEventListener("threadwise:present-from", beginFromThought);
    return () => window.removeEventListener("threadwise:present-from", beginFromThought);
  }, [canvas?.id, s.nodes, s.replayIndex, suite.stops, onPresentChange]);
  useEffect(() => {
    const timer = setInterval(
      () => setStrokes((v) => v.filter((s) => Date.now() - s.at < 12000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    void graphDigest(s.nodes, s.edges).then((v) => {
      if (active) setDigest(v);
    });
    return () => {
      active = false;
    };
  }, [s.nodes, s.edges]);
  useEffect(() => {
    if (!present) return;
    const id = validStops[stop];
    const node = s.nodes.find((n) => n.id === id);
    if (node) {
      const width = node.width ?? 272,
        height = node.height ?? (node.data.kind === "note" ? 260 : 180);
      void rf.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
        zoom: Math.min(
          1.7,
          (window.innerWidth - 100) / (width * 1.8),
          (window.innerHeight - 300) / (height * 1.8),
        ),
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900,
      });
    }
  }, [present, stop, validStops.join(","), rf]);
  useEffect(() => {
    if (!auto || !present) return;
    const timer = setInterval(
      () =>
        setStop((v) => {
          if (v >= validStops.length - 1) {
            setAuto(false);
            return v;
          }
          return v + 1;
        }),
      pace,
    );
    return () => clearInterval(timer);
  }, [auto, present, validStops.length, pace]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (s.replayIndex !== null) {
      setOpen(false);
      setInk(null);
      setPresent(false);
      setPlayback(false);
      setTheatre(false);
      setAuto(false);
      onPresentChange(false);
      abort.current?.abort();
    }
  }, [s.replayIndex]);
  const exitPresent = () => {
    setPresent(false);
    setAuto(false);
    onPresentChange(false);
  };
  const selected = s.nodes.find((n) => n.id === s.selectedId);
  const radar = useMemo(() => {
    const actions = s.nodes.filter(
      (n) => n.data.kind === "action" && n.data.meta.status !== "done",
    );
    const uncertain = s.nodes.filter((n) =>
      ["assumption", "hypothesis", "unknown"].includes(n.data.epistemic),
    );
    const contradictory = s.edges.filter((e) => e.data?.relation === "contradicts");
    const decisions = canvas?.planning?.decisions ?? [];
    return { actions, uncertain, contradictory, decisions };
  }, [s.nodes, s.edges, canvas?.planning?.decisions]);
  const focus = (nodes: typeof s.nodes, padding = 0.35) =>
    void rf.fitView({ nodes, padding, duration: 550, maxZoom: 1.35 });
  const canvasCentre = () =>
    rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const placeFieldCapture = () => {
    const text = fieldText.trim();
    if (!text) return;
    const id = s.addNode(fieldKind, canvasCentre());
    s.updateNode(id, {
      title: text.split(/[\n.!?]/)[0]?.slice(0, 72) || "Field capture",
      body: text,
      meta: { ...s.nodes.find((n) => n.id === id)?.data.meta, source: "Field capture" },
    });
    setFieldText("");
    setMessage("Captured at the centre of your current view.");
  };
  const makeIntakeDraft = () => {
    const lines = intakeText
      .split(/\n|(?<=[.!?])\s+/)
      .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
      .filter((line) => line.length > 8)
      .slice(0, 8);
    setIntakeCards(
      lines.map((line) => ({
        kind: /\?$/.test(line) ? "question" : /\b(next|will|should|need to|follow up)\b/i.test(line) ? "action" : "note",
        title: line.slice(0, 78),
        body: line,
        relation: "leads_to",
      })),
    );
  };
  const makeDeepSeekIntakeDraft = async () => {
    await act(async () => {
      abort.current = new AbortController();
      const token = revision.current;
      const text = await streamTask(
        { mode: "intake", text: intakeText },
        () => {},
        abort.current.signal,
      );
      const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as {
        cards: { kind: ThreadNodeType; title: string; body: string; relation?: Relation }[];
      };
      if (token !== revision.current) return;
      if (!Array.isArray(parsed.cards) || !parsed.cards.length)
        throw new Error("DeepSeek returned no usable canvas draft.");
      setIntakeCards(parsed.cards.slice(0, 8));
    });
  };
  const acceptIntake = () => {
    const origin = canvasCentre();
    const made: string[] = [];
    intakeCards.forEach((card, index) => {
      const id = s.addNode(card.kind, { x: origin.x + (index % 2) * 340, y: origin.y + Math.floor(index / 2) * 220 });
      s.updateNode(id, { title: card.title, body: card.body });
      made.push(id);
    });
    made.slice(1).forEach((id, index) =>
      s.connect({ source: made[index] ?? "", target: id, sourceHandle: null, targetHandle: null }, intakeCards[index + 1]?.relation ?? "leads_to"),
    );
    if (made.length) s.recordSnapshot("Conversation intake accepted");
    setIntakeCards([]);
    setIntakeText("");
    setMessage(`${made.length} conversation moments placed as editable cards.`);
  };
  const pickList = (
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {s.nodes.map((n) => (
        <label key={n.id} className="flex items-start gap-3 border-b py-2 text-sm">
          <Checkbox
            checked={ids.includes(n.id)}
            onCheckedChange={() => check(n.id)}
            aria-label={`Include ${n.data.title}`}
          />
          <span className="min-w-0 break-words">
            {n.data.title}
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
              {n.data.epistemic}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
  const draw = (e: React.PointerEvent<SVGSVGElement>) => {
    const point = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    if (ink === "laser") setLaser(point);
    else if (currentStroke.current)
      setStrokes((v) =>
        v.map((s) =>
          s.id === currentStroke.current
            ? { ...s, points: [...s.points, point], at: Date.now() }
            : s,
        ),
      );
  };
  return (
    <>
      <LivePresence />
      {!present && (
        <Button
          className="tw-studio-launch"
          size="sm"
          variant={open ? "default" : "outline"}
          aria-label="Open canvas studio"
          title="Canvas studio"
          disabled={s.replayIndex !== null}
          onClick={() => {
            s.select(null);
            setOpen((v) => !v);
          }}
        >
          <Layers />
          <span>Studio</span>
        </Button>
      )}
      {suite.frames.length > 0 && (
        <svg className="tw-frame-layer" aria-hidden>
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
            {suite.frames.map((f) => (
              <g key={f.id}>
                <rect
                  x={f.x}
                  y={f.y}
                  width={f.width}
                  height={f.height}
                  rx="6"
                  className={f.lane ? "tw-lane-paper" : "tw-frame-paper"}
                />
                <text x={f.x + 20} y={f.y + 32} className="tw-frame-label">
                  {f.title}
                </text>
              </g>
            ))}
          </g>
        </svg>
      )}
      {(ink || strokes.length > 0) && (
        <svg
          className={`tw-ink-layer ${ink ? "is-drawing" : ""}`}
          aria-label="Temporary canvas ink"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            if (ink === "pen") {
              const id = crypto.randomUUID();
              currentStroke.current = id;
              setStrokes((v) => [
                ...v,
                {
                  id,
                  points: [rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })],
                  at: Date.now(),
                },
              ]);
            }
            draw(e);
          }}
          onPointerMove={draw}
          onPointerUp={() => {
            currentStroke.current = null;
          }}
          onPointerCancel={() => {
            currentStroke.current = null;
          }}
          onPointerLeave={() => setLaser(null)}
        >
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
            {strokes.map((s) => (
              <polyline
                key={s.id}
                points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                className="tw-ink-stroke"
              />
            ))}
            {laser && ink === "laser" && (
              <circle cx={laser.x} cy={laser.y} r={6 / viewport.zoom} className="tw-laser-dot" />
            )}
          </g>
        </svg>
      )}
      {ink && (
        <div className="tw-ink-controls">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInk(null);
              setLaser(null);
            }}
          >
            Done
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Clear temporary ink"
            onClick={() => setStrokes([])}
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {live && <LiveRoomDialog onClose={() => setLive(false)} />}
      {lab && canvas && <DiscourseLab corpus={suite.discourse} update={(discourse) => update({ discourse })} onClose={() => setLab(false)} />}
      {present && (
        <PresentationMode
          stops={validStops}
          index={Math.min(stop, Math.max(0, validStops.length - 1))}
          setIndex={setStop}
          auto={auto}
          setAuto={setAuto}
          pace={pace}
          setPace={setPace}
          title={canvas?.title ?? "Walkthrough"}
          onExit={exitPresent}
        />
      )}
      {playback && <ThoughtPlayback history={s.history} title={canvas?.title ?? "Thought playback"} onExit={() => setPlayback(false)} />}
      {theatre && <DecisionTheatre onExit={() => setTheatre(false)} />}
      {consequences && <ConsequenceMap onExit={() => setConsequences(false)} />}
      {open && !present && s.replayIndex === null && (
        <aside className="tw-studio-panel" aria-label="Canvas studio">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                THE WORKBENCH
              </span>
              <h2 className="font-display text-2xl">Canvas studio</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close canvas studio"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="tw-studio-body">
            <nav aria-label="Canvas tools" className="tw-studio-nav">
              {TOOLS.map((t) => (
                <Button
                  key={t.id}
                  variant={tool === t.id ? "secondary" : "ghost"}
                  title={t.label}
                  className="justify-start text-xs"
                  onClick={() => {
                    setTool(t.id);
                    setError("");
                    setMessage("");
                    if (t.id === "presence") setLive(true);
                    if (t.id === "discourse") setLab(true);
                    if (t.id === "evidence") onEvidence();
                  }}
                >
                  <t.icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </Button>
              ))}
            </nav>
            <section className="tw-studio-content">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl">
                {TOOLS.find((t) => t.id === tool)?.label}
              </h3>
              {tool === "presence" && (
                <Button onClick={() => setLive(true)}>
                  <Users />
                  Host or join a live room
                </Button>
              )}
              {tool === "pointer" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setInk("laser");
                      setOpen(false);
                    }}
                  >
                    <MousePointer2 />
                    Laser
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInk("pen");
                      setOpen(false);
                    }}
                  >
                    <PenLine />
                    Ink
                  </Button>
                </div>
              )}
              {tool === "inbox" && (
                <>
                  <Textarea
                    aria-label="Quick capture"
                    placeholder="A thought worth keeping…"
                    value={capture}
                    onChange={(e) => setCapture(e.target.value)}
                    className="mb-3"
                  />
                  <Button
                    disabled={!capture.trim()}
                    onClick={() => {
                      update({
                        inbox: [...suite.inbox, { id: crypto.randomUUID(), text: capture.trim() }],
                      });
                      setCapture("");
                    }}
                  >
                    <Plus />
                    Capture
                  </Button>
                  <div className="mt-5 divide-y">
                    {suite.inbox.map((item) => (
                      <div key={item.id} className="py-4">
                        <p className="whitespace-pre-wrap break-words text-sm">{item.text}</p>
                        <div className="mt-3 flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const pos = rf.screenToFlowPosition({
                                x: window.innerWidth / 2,
                                y: window.innerHeight / 2,
                              });
                              const id = s.addNode("note", pos);
                              s.updateNode(id, {
                                title: item.text.split("\n")[0]?.slice(0, 60) || "Captured note",
                                body: item.text,
                              });
                              update({ inbox: suite.inbox.filter((i) => i.id !== item.id) });
                              setMessage("Added to canvas.");
                            }}
                          >
                            Place note
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete captured thought"
                            onClick={() =>
                              update({ inbox: suite.inbox.filter((i) => i.id !== item.id) })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tool === "radar" && (
                <>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    A live briefing made from the actual canvas. It shows what needs movement,
                    what is still unproven, and where the team is holding two incompatible views.
                  </p>
                  <div className="grid gap-3">
                    {[
                      ["Open moves", radar.actions.length, "Actions that are not done", radar.actions],
                      ["Unproven", radar.uncertain.length, "Assumptions, hypotheses and unknowns", radar.uncertain],
                      ["Tensions", radar.contradictory.length, "Explicit contradictions", []],
                      ["Decision receipts", radar.decisions.length, "Saved planning decisions", []],
                    ].map(([label, count, description, nodes]) => (
                      <button
                        key={String(label)}
                        className="rounded-xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => Array.isArray(nodes) && nodes.length && focus(nodes as typeof s.nodes, 0.6)}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{String(label)}</span>
                        <strong className="mt-1 block font-display text-3xl">{String(count).padStart(2, "0")}</strong>
                        <span className="text-xs text-muted-foreground">{String(description)}</span>
                      </button>
                    ))}
                  </div>
                  {radar.decisions.slice(0, 3).map((decision) => (
                    <article key={decision.id} className="mt-4 rounded-xl border border-dashed p-4">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">Decision receipt · {decision.status}</span>
                      <h4 className="mt-1 font-display text-lg">{decision.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{decision.conclusion || "Conclusion still being written."}</p>
                      <p className="mt-3 text-xs">{decision.analysis.evidence.length} evidence signals · {decision.analysis.uncertain.length} open assumptions · review {decision.reviewDate || "not scheduled"}</p>
                    </article>
                  ))}
                  <p className="mt-5 text-xs text-muted-foreground">Create and approve receipts through Plan → Decisions. The radar never invents a decision.</p>
                </>
              )}
              {tool === "zoom" && (
                <>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    Treat the same canvas as three different stories. These moves change only your
                    viewpoint—never the graph or its meaning.
                  </p>
                  <div className="grid gap-3">
                    <Button onClick={() => focus(s.nodes, 0.42)} disabled={!s.nodes.length}><Maximize />Atlas — see the whole terrain</Button>
                    <Button variant="outline" onClick={() => focus(radar.actions, 0.75)} disabled={!radar.actions.length}><ScanLine />Execution — follow the open moves</Button>
                    <Button variant="outline" onClick={() => focus(radar.uncertain, 0.7)} disabled={!radar.uncertain.length}><ShieldCheck />Inquiry — isolate what must become true</Button>
                    <Button variant="outline" onClick={() => selected && focus([selected], 1.25)} disabled={!selected}><MousePointer2 />Close-up — selected card</Button>
                  </div>
                  <p className="mt-5 text-xs text-muted-foreground">Use this before presenting: it turns one board into an overview, an execution view, and an evidence view without making duplicate canvases.</p>
                </>
              )}
              {tool === "tensions" && (
                <>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    Make disagreement visible instead of quietly resolving it in conversation. A
                    contradiction is a relationship, not a judgement about either person.
                  </p>
                  <Select value={tensionFrom} onValueChange={setTensionFrom}>
                    <SelectTrigger aria-label="First side of contradiction"><SelectValue placeholder="First claim" /></SelectTrigger>
                    <SelectContent>{s.nodes.map((n) => <SelectItem key={n.id} value={n.id}>{n.data.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={tensionTo} onValueChange={setTensionTo}>
                    <SelectTrigger aria-label="Second side of contradiction"><SelectValue placeholder="Second claim" /></SelectTrigger>
                    <SelectContent>{s.nodes.filter((n) => n.id !== tensionFrom).map((n) => <SelectItem key={n.id} value={n.id}>{n.data.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="mt-3" disabled={!tensionFrom || !tensionTo} onClick={() => {
                    s.connect({ source: tensionFrom, target: tensionTo, sourceHandle: null, targetHandle: null }, "contradicts");
                    s.recordSnapshot("Explicit contradiction recorded");
                    setTensionFrom(""); setTensionTo(""); setMessage("Tension recorded. It will now appear in the executive radar.");
                  }}><GitFork />Hold both views</Button>
                  <div className="mt-5 divide-y">
                    {radar.contradictory.map((edge) => <button key={edge.id} className="w-full py-3 text-left text-sm hover:text-accent-ink" onClick={() => focus(s.nodes.filter((n) => n.id === edge.source || n.id === edge.target), 0.9)}>
                      {s.nodes.find((n) => n.id === edge.source)?.data.title} <span className="font-mono text-[10px] text-muted-foreground">contradicts</span> {s.nodes.find((n) => n.id === edge.target)?.data.title}
                    </button>)}
                    {!radar.contradictory.length && <p className="py-4 text-sm text-muted-foreground">No explicit tensions yet. That may mean agreement—or unspoken disagreement.</p>}
                  </div>
                </>
              )}
              {tool === "field" && (
                <>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    Capture the room without opening a full card editor. The note lands exactly at
                    the centre of your current view, ready to connect later.
                  </p>
                  <Select value={fieldKind} onValueChange={(v) => setFieldKind(v as ThreadNodeType)}>
                    <SelectTrigger aria-label="Field capture kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["note", "question", "idea", "action", "experiment"] as ThreadNodeType[]).map((kind) => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea className="mt-3" aria-label="Field capture" placeholder="A quote, observation, commitment, or unresolved question…" value={fieldText} onChange={(e) => setFieldText(e.target.value)} />
                  <Button className="mt-3" disabled={!fieldText.trim()} onClick={placeFieldCapture}><Plus />Drop on canvas</Button>
                </>
              )}
              {tool === "intake" && (
                <>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    Turn a messy meeting note into an editable draft. Nothing reaches the canvas
                    until you inspect and accept it; this is deliberately a human-controlled intake.
                  </p>
                  <Textarea aria-label="Conversation or meeting notes" placeholder="Paste raw meeting notes, an interview, or a voice transcript…" value={intakeText} onChange={(e) => setIntakeText(e.target.value)} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button disabled={!intakeText.trim()} onClick={makeIntakeDraft}><Wand2 />Make quick draft</Button>
                    <Button variant="outline" disabled={!intakeText.trim() || busy || !user} onClick={() => void makeDeepSeekIntakeDraft()}><Wand2 />{busy ? "DeepSeek is shaping…" : "Shape with DeepSeek"}</Button>
                  </div>
                  {!user && <p className="mt-3 text-xs text-muted-foreground">Sign in to use DeepSeek shaping. The quick draft always works locally.</p>}
                  {intakeCards.length > 0 && <>
                    <div className="mt-5 space-y-3">{intakeCards.map((card, index) => <div key={index} className="rounded-xl border p-3">
                      <div className="mb-2 flex gap-2"><Select value={card.kind} onValueChange={(v) => setIntakeCards((cards) => cards.map((item, i) => i === index ? { ...item, kind: v as ThreadNodeType } : item))}><SelectTrigger aria-label={`Card ${index + 1} type`}><SelectValue /></SelectTrigger><SelectContent>{(["note", "question", "idea", "action", "experiment"] as ThreadNodeType[]).map((kind) => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="ghost" aria-label="Remove draft card" onClick={() => setIntakeCards((cards) => cards.filter((_, i) => i !== index))}><Trash2 /></Button></div>
                      <Input value={card.title} aria-label={`Draft card ${index + 1} title`} onChange={(e) => setIntakeCards((cards) => cards.map((item, i) => i === index ? { ...item, title: e.target.value, body: e.target.value } : item))} />
                    </div>)}</div>
                    <Button className="mt-4" onClick={acceptIntake}><Plus />Accept {intakeCards.length} editable cards</Button>
                  </>}
                </>
              )}
              {tool === "frames" && (
                <>
                  <Input
                    aria-label="Frame title"
                    placeholder="Frame or lane title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="my-3 flex gap-2">
                    {[false, true].map((lane) => (
                      <Button
                        key={String(lane)}
                        variant={lane ? "outline" : "default"}
                        onClick={() => {
                          const p = rf.screenToFlowPosition({
                            x: window.innerWidth / 2 - 150,
                            y: window.innerHeight / 2 - 150,
                          });
                          update({
                            frames: [
                              ...suite.frames,
                              {
                                id: crypto.randomUUID(),
                                title: title.trim() || (lane ? "Swimlane" : "Frame"),
                                ...p,
                                width: lane ? 320 : 1000,
                                height: lane ? 900 : 640,
                                lane,
                              },
                            ],
                          });
                          setTitle("");
                        }}
                      >
                        <Plus />
                        {lane ? "Lane" : "Frame"}
                      </Button>
                    ))}
                  </div>
                  {suite.frames.map((f) => (
                    <div key={f.id} className="mt-4 border-t pt-3">
                      <div className="flex gap-2">
                        <Input
                          aria-label="Rename frame"
                          value={f.title}
                          onChange={(e) =>
                            update({
                              frames: suite.frames.map((x) =>
                                x.id === f.id ? { ...x, title: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete frame"
                          onClick={() =>
                            update({ frames: suite.frames.filter((x) => x.id !== f.id) })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(["x", "y", "width", "height"] as const).map((key) => (
                          <label key={key} className="text-xs capitalize text-muted-foreground">
                            {key}
                            <Input
                              type="number"
                              aria-label={`${f.title} ${key}`}
                              value={f[key]}
                              onChange={(e) =>
                                update({
                                  frames: suite.frames.map((x) =>
                                    x.id === f.id
                                      ? {
                                          ...x,
                                          [key]:
                                            key === "width" || key === "height"
                                              ? Math.max(300, Number(e.target.value))
                                              : Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void rf.fitBounds(
                            { x: f.x, y: f.y, width: f.width, height: f.height },
                            { duration: 500, padding: 0.2 },
                          )
                        }
                      >
                        <Maximize />
                        Focus
                      </Button>
                    </div>
                  ))}
                </>
              )}
              {tool === "stamps" && (
                <>
                  <Select value={s.selectedId ?? ""} onValueChange={s.select}>
                    <SelectTrigger aria-label="Card to stamp">
                      <SelectValue placeholder="Choose a card" />
                    </SelectTrigger>
                    <SelectContent>
                      {s.nodes.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.data.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["agree", "challenge", "important", "celebrate"].map((stamp) => (
                      <Button
                        variant="outline"
                        key={stamp}
                        disabled={!selected}
                        onClick={() => {
                          if (!selected) return;
                          const entries = readReactions(selected.data.meta["reactions"]);
                          s.updateNode(selected.id, (d) => ({
                            ...d,
                            meta: {
                              ...d.meta,
                              reactions: JSON.stringify({
                                ...entries,
                                [stamp]: (entries[stamp] ?? 0) + 1,
                              }),
                            },
                          }));
                        }}
                      >
                        <Stamp />
                        {stamp}
                      </Button>
                    ))}
                  </div>
                  {selected && (
                    <Button
                      className="mt-4"
                      variant="ghost"
                      onClick={() =>
                        s.updateNode(selected.id, (d) => ({
                          ...d,
                          meta: { ...d.meta, reactions: "" },
                        }))
                      }
                    >
                      Clear stamps
                    </Button>
                  )}
                </>
              )}
              {tool === "risk" && (
                <>
                  <p className="mb-4 text-xs text-muted-foreground">
                    5,000 trials · independent card outcomes · every prerequisite must succeed.
                    Estimates are yours, not inferred facts.
                  </p>
                  <div className="max-h-96 space-y-3 overflow-auto">
                    {s.nodes.map((n) => (
                      <label className="flex items-center gap-3 text-sm" key={n.id}>
                        <span className="min-w-0 flex-1 break-words">{n.data.title}</span>
                        <Input
                          className="w-20 shrink-0"
                          aria-label={`Success probability ${n.data.title}`}
                          type="number"
                          min={0}
                          max={100}
                          placeholder="%"
                          value={prob[n.id] ?? n.data.meta["probability"] ?? ""}
                          onChange={(e) => {
                            setResults(null);
                            setProb((v) => ({
                              ...v,
                              [n.id]: Math.max(0, Math.min(100, Number(e.target.value))),
                            }));
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <Button
                    className="mt-4"
                    disabled={busy || !s.nodes.length}
                    onClick={() =>
                      void act(async () => {
                        const p = Object.fromEntries(
                          s.nodes.map((n) => [
                            n.id,
                            (prob[n.id] ?? Number(n.data.meta["probability"] || NaN)) / 100,
                          ]),
                        );
                        const r = simulate(s.nodes, s.edges, p);
                        s.nodes.forEach((n) =>
                          s.updateNode(n.id, (d) => ({
                            ...d,
                            meta: { ...d.meta, probability: String((p[n.id] ?? 0) * 100) },
                          })),
                        );
                        setResults(r);
                      })
                    }
                  >
                    <Play />
                    Run simulation
                  </Button>
                  {results && (
                    <div className="mt-5 divide-y">
                      {results.map((r) => (
                        <div key={r.id} className="py-3">
                          <p className="text-sm">
                            {s.nodes.find((n) => n.id === r.id)?.data.title}
                          </p>
                          <div className="mt-2 flex justify-between font-mono text-xs">
                            <strong>{Math.round(r.rate * 100)}% success</strong>
                            <span>
                              {(r.low * 100).toFixed(1)}–{(r.high * 100).toFixed(1)}% · 95% MC
                              interval
                            </span>
                          </div>
                          <progress className="mt-2 h-2 w-full" value={r.rate} max={1} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {tool === "path" && (
                <>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Scheduling uses explicit dependencies only; duration defaults to one day unless
                    estimated. Epistemic depth includes reasoning links.
                  </p>
                  {dependency.blocked.length > 0 ? (
                    <p role="alert" className="text-sm text-accent-ink">
                      Circular or cycle-dependent cards:{" "}
                      {dependency.blocked
                        .map((id) => s.nodes.find((n) => n.id === id)?.data.title)
                        .join(", ")}
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 border-b pb-4">
                        <span className="font-display text-3xl">{dependency.totalDays} days</span>
                        <p className="text-xs text-muted-foreground">Longest prerequisite path</p>
                      </div>
                      {dependency.path.map((id, i) => (
                        <Button
                          className="mb-1 w-full justify-start whitespace-normal text-left"
                          variant="ghost"
                          key={id}
                          onClick={() => {
                            s.select(id);
                            void rf.fitView({
                              nodes: s.nodes.filter((n) => n.id === id),
                              padding: 0.8,
                              duration: 400,
                            });
                          }}
                        >
                          {i + 1}. {s.nodes.find((n) => n.id === id)?.data.title}
                        </Button>
                      ))}
                    </>
                  )}
                  <h4 className="my-4 font-display text-lg">Epistemic depth</h4>
                  {s.nodes.map((n) => (
                    <div key={n.id} className="flex justify-between gap-4 border-b py-2 text-xs">
                      <span>{n.data.title}</span>
                      <span className="font-mono">
                        {depth.blocked.includes(n.id) ? "cycle" : (depth.depth[n.id] ?? 0)}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {tool === "weave" && (
                <>
                  {pickList}
                  <div className="my-4 flex gap-2">
                    <Select
                      value={wireMode}
                      onValueChange={(v) => setWireMode(v as typeof wireMode)}
                    >
                      <SelectTrigger aria-label="Batch wiring pattern">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chain">Chain</SelectItem>
                        <SelectItem value="fan">Fan out</SelectItem>
                        <SelectItem value="all">All pairs</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={relation} onValueChange={(v) => setRelation(v as Relation)}>
                      <SelectTrigger aria-label="Batch relationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONS.filter((r) => r !== "custom").map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replaceAll("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Order:{" "}
                    {ids.map((id) => s.nodes.find((n) => n.id === id)?.data.title).join(" → ") ||
                      "No cards selected"}
                  </p>
                  <Button
                    disabled={ids.length < 2}
                    onClick={() => {
                      const pairs = batchPairs(ids, wireMode);
                      let count = 0;
                      for (const p of pairs) {
                        if (
                          useThread
                            .getState()
                            .edges.some((e) => e.source === p.source && e.target === p.target)
                        )
                          continue;
                        s.connect({ ...p, sourceHandle: null, targetHandle: null }, relation);
                        count++;
                      }
                      s.recordSnapshot("Batch threads woven");
                      setMessage(`${count} threads added.`);
                    }}
                  >
                    <Layers />
                    Weave {batchPairs(ids, wireMode).length} threads
                  </Button>
                </>
              )}
              {tool === "layout" && (
                <div className="flex flex-wrap gap-3">
                  {(["RIGHT", "DOWN"] as const).map((direction) => (
                    <Button
                      key={direction}
                      variant={direction === "RIGHT" ? "default" : "outline"}
                      disabled={busy || !s.nodes.length}
                      onClick={() =>
                        void act(async () => {
                          const positions = await layeredLayout(s.nodes, s.edges, direction);
                          if (useThread.getState().replayIndex !== null) return;
                          s.setPositions(positions);
                          s.recordSnapshot("Layered auto-layout");
                          await rf.fitView({ padding: 0.25, duration: 600 });
                        })
                      }
                    >
                      <Wand2 />
                      {direction === "RIGHT" ? "Horizontal" : "Vertical"}
                    </Button>
                  ))}
                </div>
              )}
              {tool === "branches" && (
                <>
                  <Input
                    aria-label="Branch name"
                    placeholder="Alternative decision"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Button
                    className="my-4"
                    onClick={() => {
                      if (canvas) ws.branchCanvas(canvas.id, title);
                      setTitle("");
                    }}
                  >
                    <GitBranch />
                    Branch this canvas
                  </Button>
                  {branch && source && merged && (
                    <>
                      <h4 className="font-display text-lg">Merge into {source.title}</h4>
                      <p className="my-3 text-xs text-muted-foreground">
                        {merged.conflicts.length} conflicts · source and branch remain intact; the
                        result is a new canvas.
                      </p>
                      {merged.conflicts.map((c) => (
                        <div key={c.key} className="my-3 border-b pb-3">
                          <p className="mb-2 text-sm">{c.label}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant={choices[c.key] === "ours" ? "default" : "outline"}
                              onClick={() => setChoices((v) => ({ ...v, [c.key]: "ours" }))}
                            >
                              Source {c.ours ? "version" : "deletion"}
                            </Button>
                            <Button
                              variant={choices[c.key] === "theirs" ? "default" : "outline"}
                              onClick={() => setChoices((v) => ({ ...v, [c.key]: "theirs" }))}
                            >
                              Branch {c.theirs ? "version" : "deletion"}
                            </Button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <p className="break-words">
                              {c.ours && "position" in c.ours
                                ? c.ours.data.body || c.ours.data.title
                                : "Source thread or deletion"}
                            </p>
                            <p className="break-words">
                              {c.theirs && "position" in c.theirs
                                ? c.theirs.data.body || c.theirs.data.title
                                : "Branch thread or deletion"}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Button
                        disabled={merged.conflicts.some((c) => !choices[c.key])}
                        onClick={() => {
                          const result = merged;
                          ws.createCanvas(`${source.title} · merged`);
                          useThread.setState({
                            nodes: result.nodes,
                            edges: result.edges,
                            ghosts: [],
                            history: [],
                          });
                          useThread.getState().recordSnapshot("Explicit three-way merge");
                          setMessage("Merged into a new canvas.");
                        }}
                      >
                        <Check />
                        Create merged canvas
                      </Button>
                    </>
                  )}
                  {branch && !source && (
                    <p role="alert" className="text-sm text-accent-ink">
                      The original canvas is unavailable; this branch is preserved.
                    </p>
                  )}
                </>
              )}
              {tool === "scenario" && (
                <ScenarioTool suite={suite} update={update} readOnly={s.replayIndex !== null} />
              )}
              {tool === "runway" && (
                <RunwayTool suite={suite} update={update} nodes={s.nodes} readOnly={s.replayIndex !== null} />
              )}
              {tool === "dossier" && (
                <DossierTool
                  suite={suite}
                  nodes={s.nodes}
                  edges={s.edges}
                  {...(canvas?.planning ? { planning: canvas.planning } : {})}
                  digest={digest}
                  title={canvas?.title ?? "Decision"}
                />
              )}
              {tool === "present" && (
                <>
                  {pickList}
                  <Button
                    className="mt-4"
                    disabled={!ids.length}
                    onClick={() => update({ stops: ids })}
                  >
                    <Plus />
                    Set walkthrough order
                  </Button>
                  <div className="my-4 divide-y">
                    {validStops.map((id, i) => (
                      <div key={id} className="flex items-center gap-2 py-2 text-sm">
                        <span className="min-w-0 flex-1 break-words">
                          {i + 1}. {s.nodes.find((n) => n.id === id)?.data.title}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={i === 0}
                          aria-label="Move stop earlier"
                          onClick={() => {
                            const stops = [...validStops];
                            const prior = stops[i - 1];
                            if (prior) {
                              stops[i - 1] = id;
                              stops[i] = prior;
                              update({ stops });
                            }
                          }}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Remove presentation stop"
                          onClick={() => update({ stops: validStops.filter((x) => x !== id) })}
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    disabled={!validStops.length}
                    onClick={() => {
                      setStop(0);
                      void document.documentElement.requestFullscreen?.().catch(() => {});
                      setPresent(true);
                      setOpen(false);
                      onPresentChange(true);
                    }}
                  >
                    <Play />
                    Start walkthrough
                  </Button>
                </>
              )}
              {tool === "playback" && (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">Replay the real sequence of saved canvas moments. Nothing is invented: the film is made from your own thinking history.</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{s.history.length} moments available · last 36 shown</p>
                  <Button className="mt-5" disabled={s.history.length < 2} onClick={() => { setPlayback(true); setOpen(false); }}><Play />Play the thinking</Button>
                </>
              )}
              {tool === "theatre" && (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">Step into the selected card—or the nearest action—and see the evidence that grounds it, the uncertainty around it, and the moves it opens.</p>
                  <p className="mt-3 text-xs text-muted-foreground">Pick a card on the canvas first for a deliberate focal point.</p>
                  <Button className="mt-5" disabled={!s.nodes.length} onClick={() => { setTheatre(true); setOpen(false); }}><Square />Enter decision theatre</Button>
                </>
              )}
              {tool === "consequences" && (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">A playable “if we do this, then what?” map. It follows the real graph instead of generating confident-looking future fiction.</p>
                  <p className="mt-3 text-xs text-muted-foreground">Select an action or decision to make it the source; otherwise the nearest action is used.</p>
                  <Button className="mt-5" disabled={!s.nodes.length} onClick={() => { setConsequences(true); setOpen(false); }}><GitFork />Map consequences</Button>
                </>
              )}
              {tool === "redteam" && (
                <>
                  <label className="mb-3 block text-xs">Challenge from the perspective of
                    <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={redTeamPersona} onChange={(e) => setRedTeamPersona(e.target.value)}>
                      <option value="skeptical investor">a skeptical investor</option><option value="cautious CFO">a cautious CFO</option><option value="hostile journalist">a hostile journalist</option><option value="actual customer">an actual customer</option><option value="regulator">a regulator</option><option value="domain expert">a domain expert</option>
                    </select>
                  </label>
                  <Button
                    disabled={busy || !s.nodes.length || !user}
                    onClick={() =>
                      void act(async () => {
                        abort.current = new AbortController();
                        const token = revision.current;
                        const nodeIds = s.nodes.map((n) => n.id);
                        const text = await streamTask(
                          {
                            mode: "redteam",
                            persona: redTeamPersona,
                            graph: {
                              nodes: s.nodes.map((n) => ({ id: n.id, ...n.data })),
                              edges: s.edges,
                            },
                          },
                          () => {},
                          abort.current.signal,
                        );
                        const result = validateFindings(JSON.parse(text), nodeIds);
                        if (token !== revision.current) return;
                        if (!result.findings.length)
                          throw new Error("No valid card-cited findings returned.");
                        setFindings(result);
                      })
                    }
                  >
                    <ShieldCheck />
                    {busy ? "Reviewing…" : "Challenge this canvas"}
                  </Button>
                  {!user && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Sign in to run the AI audit.
                    </p>
                  )}
                  {busy && (
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => abort.current?.abort()}
                    >
                      <Square />
                      Stop
                    </Button>
                  )}
                  {findings?.findings.map((f, i) => (
                    <article className="mt-5 border-t pt-4" key={i}>
                      <span className="font-mono text-[10px] uppercase text-accent-ink">
                        {f.severity} · possible {f.bias.replaceAll("_", " ")}
                      </span>
                      <h4 className="my-2 font-display text-xl">{f.title}</h4>
                      <p className="text-sm leading-relaxed">{f.challenge}</p>
                      <p className="my-3 text-xs text-muted-foreground">Test: {f.suggestedTest}</p>
                      <div className="flex flex-wrap gap-1">
                        {f.nodeIds.map((id) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="max-w-full whitespace-normal text-left"
                            key={id}
                            onClick={() =>
                              void rf.fitView({
                                nodes: s.nodes.filter((n) => n.id === id),
                                padding: 0.8,
                                duration: 400,
                              })
                            }
                          >
                            {s.nodes.find((n) => n.id === id)?.data.title}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const anchor = s.nodes.find((n) => n.id === f.nodeIds[0]);
                          const id = s.addNode("question", {
                            x: (anchor?.position.x ?? 0) + 360,
                            y: (anchor?.position.y ?? 0) + 280,
                          });
                          s.updateNode(id, {
                            title: f.title,
                            body: f.challenge + "\n\nTest: " + f.suggestedTest,
                          });
                          if (anchor)
                            s.connect(
                              {
                                source: anchor.id,
                                target: id,
                                sourceHandle: null,
                                targetHandle: null,
                              },
                              "needs_evidence_from",
                            );
                          setMessage("Challenge added as a question.");
                        }}
                      >
                        Add challenge to canvas
                      </Button>
                    </article>
                  ))}
                </>
              )}
              {tool === "bridge" && (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Per-user connections need workspace setup before live synchronization can be
                    enabled.
                  </p>
                  {["Linear", "GitHub", "Slack", "Jira"].map((provider) => (
                    <div key={provider} className="flex justify-between gap-4 border-b py-4">
                      <h4 className="font-display text-lg">{provider}</h4>
                      <span className="text-xs text-muted-foreground">
                        {provider === "Jira"
                          ? "Per-user connector unavailable"
                          : "OAuth client not configured"}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() =>
                      saveFile(
                        narrative(
                          s.nodes.filter((n) => ["action", "experiment"].includes(n.data.kind)),
                          s.edges,
                          canvas?.title ?? "Execution plan",
                        ),
                        "execution-plan.md",
                        "text/markdown",
                      )
                    }
                  >
                    <Download />
                    Export execution plan
                  </Button>
                </>
              )}
              {tool === "evidence" && (
                <Button onClick={onEvidence}>
                  <FileUp />
                  Open evidence clipper
                </Button>
              )}
              {tool === "seal" && (
                <>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Personal sign-off records the account, timestamp and a fingerprint of this
                    graph. Not a legal electronic signature.
                  </p>
                  <Textarea
                    aria-label="Decision sign-off statement"
                    placeholder="I approve this decision, subject to…"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                  <Button
                    className="mt-4"
                    disabled={!user || !signature.trim() || busy}
                    onClick={() =>
                      void act(async () => {
                        if (!user) return;
                        const hash = await graphDigest(s.nodes, s.edges);
                        update({
                          seals: [
                            ...suite.seals,
                            {
                              id: crypto.randomUUID(),
                              signer: accountLabel(user.user_metadata, "Account holder"),
                              userId: user.id,
                              at: new Date().toISOString(),
                              digest: hash,
                              note: signature.trim(),
                            },
                          ],
                        });
                        setSignature("");
                      })
                    }
                  >
                    <Stamp />
                    Sign decision
                  </Button>
                  {!user && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Sign in to record a signature.
                    </p>
                  )}
                  {suite.seals.map((seal) => (
                    <div className="tw-decision-seal mt-5" key={seal.id}>
                      <ShieldCheck className="h-6 w-6" />
                      <div>
                        <h4 className="font-display text-lg">{seal.signer}</h4>
                        <p className="text-sm whitespace-pre-wrap break-words">{seal.note}</p>
                        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                          {new Date(seal.at).toLocaleString()} ·{" "}
                          {seal.digest === digest ? "Current graph" : "Graph changed since signing"}
                        </p>
                        <p className="mt-1 break-all font-mono text-[9px] text-muted-foreground">
                          SHA-256 {seal.digest}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {tool === "export" && (
                <div className="flex flex-col items-start gap-3">
                  <Button
                    onClick={() =>
                      saveFile(
                        graphSvg(s.nodes, s.edges, canvas?.title ?? "Threadwise canvas"),
                        downloadSlug(canvas?.title ?? "canvas") + ".svg",
                        "image/svg+xml",
                      )
                    }
                  >
                    <Download />
                    Vector SVG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      saveFile(
                        narrative(s.nodes, s.edges, canvas?.title ?? "Threadwise canvas"),
                        downloadSlug(canvas?.title ?? "canvas") + ".md",
                        "text/markdown",
                      )
                    }
                  >
                    <Download />
                    Narrative Markdown
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      saveFile(
                        JSON.stringify(
                          { title: canvas?.title, nodes: s.nodes, edges: s.edges, suite },
                          null,
                          2,
                        ),
                        downloadSlug(canvas?.title ?? "canvas") + ".json",
                        "application/json",
                      )
                    }
                  >
                    <Download />
                    Canvas JSON
                  </Button>
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="mt-5 border-l-2 border-accent-ink pl-3 text-sm text-accent-ink"
                >
                  {error}
                </p>
              )}
              {message && (
                <p role="status" className="mt-5 text-sm text-muted-foreground">
                  {message}
                </p>
              )}
            </section>
          </div>
        </aside>
      )}
    </>
  );
}
