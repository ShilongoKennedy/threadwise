import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutTemplate,
  ListChecks,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useThread } from "@/lib/threadwise/store";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { useAccount } from "@/lib/threadwise/cloud-sync";
import {
  TEMPLATES,
  templateGraph,
  analyzeDecision,
  executionNodes,
  scheduleEvents,
  validDate,
  type Decision,
} from "@/lib/threadwise/planning";
import { WorkshopPanel } from "./WorkshopPanel";
import {
  addDays,
  startOfMonth,
  startOfWeek,
  format,
  addMonths,
  differenceInCalendarDays,
  getDaysInMonth,
  parseISO,
} from "date-fns";

export function PlanningSuite() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("templates");
  const s = useThread();
  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const c = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  const planning = c?.planning ?? { decisions: [] };
  const save = (decisions: Decision[]) => {
    if (c) ws.updatePlanning(c.id, { ...planning, decisions });
  };
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="tw-planning-launch absolute left-4 top-[232px] z-10 bg-card sm:left-6 md:top-5 md:left-[210px]"
        disabled={s.replayIndex !== null}
        aria-label="Open planning suite"
        onClick={() => setOpen(true)}
      >
        <ListChecks />
        Plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tw-planning w-[calc(100%-24px)] max-w-6xl max-h-[90dvh] overflow-y-auto p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="font-display text-3xl font-normal">
              From possibility to commitment.
            </DialogTitle>
            <DialogDescription>
              {c?.title} · {ws.status}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={tab} onValueChange={setTab} className="px-4 sm:px-6">
            <TabsList className="tw-choice-rail h-auto w-full justify-start gap-1 overflow-x-auto p-1">
              <TabsTrigger className="tw-choice-tab" value="workshop">
                <Users className="mr-2 h-4 w-4" />
                Run the room
              </TabsTrigger>
              <TabsTrigger className="tw-choice-tab" value="decisions">
                <ListChecks className="mr-2 h-4 w-4" />
                Decisions
              </TabsTrigger>
              <TabsTrigger className="tw-choice-tab" value="schedule">
                <CalendarDays className="mr-2 h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger className="tw-choice-tab" value="templates">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="min-h-[420px] px-4 pb-6 sm:px-6">
            {tab === "workshop" && <WorkshopPanel />}
            {tab === "decisions" && <DecisionPanel decisions={planning.decisions} save={save} />}
            {tab === "schedule" && (
              <Schedule decisions={planning.decisions} onOutcome={() => setOpen(false)} />
            )}
            {tab === "templates" && (
              <>
                <div className="mb-5 flex items-end justify-between">
                  <h2 className="font-display text-2xl">Choose your starting point.</h2>
                  <span className="font-mono text-xs text-muted-foreground">05 WORKFLOWS</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {TEMPLATES.map((t, i) => (
                    <article key={t.id} className="tw-workflow-card rounded-lg border bg-card p-5">
                      <div className="mb-5 flex justify-between font-mono text-xs text-muted-foreground">
                        <span>
                          0{i + 1} / {t.audience}
                        </span>
                        <LayoutTemplate className="h-4 w-4" />
                      </div>
                      <h3 className="min-h-14 font-display text-2xl">{t.title}</h3>
                      <ol className="my-5 space-y-2 text-sm text-muted-foreground">
                        {t.steps.map((step, i) => (
                          <li key={step}>
                            {i + 1}. {step}
                          </li>
                        ))}
                      </ol>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const id = ws.createCanvas(t.title);
                          const graph = templateGraph(t.id);
                          useThread.setState({
                            ...graph,
                            ghosts: [],
                            history: [],
                            selectedId: null,
                          });
                          ws.updatePlanning(id, { decisions: [], templateId: t.id, step: 0 });
                          setOpen(false);
                        }}
                      >
                        <Plus />
                        Create canvas
                      </Button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {planning.templateId && <GuidedSteps />}
    </>
  );
}
function GuidedSteps() {
  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const c = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  const t = TEMPLATES.find((t) => t.id === c?.planning?.templateId);
  const s = useThread();
  if (!c || !t) return null;
  const p = c.planning ?? { decisions: [] };
  const step = p.step ?? 0;
  return (
    <div className="absolute bottom-24 left-4 z-10 max-w-[calc(100%-32px)] border bg-card p-3 shadow-[var(--shadow-card)] sm:left-6">
      <div className="font-mono text-[10px] text-muted-foreground">
        {t.title} · {Math.min(step + 1, t.steps.length)}/{t.steps.length}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <span className="text-sm">{t.steps[step] ?? "Workflow complete"}</span>
        <Button
          size="icon"
          variant="ghost"
          disabled={s.replayIndex !== null || step === 0}
          aria-label="Previous workflow step"
          onClick={() => ws.updatePlanning(c.id, { ...p, step: step - 1 })}
        >
          <ChevronLeft />
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={s.replayIndex !== null || step >= t.steps.length}
          aria-label="Complete workflow step"
          onClick={() => ws.updatePlanning(c.id, { ...p, step: step + 1 })}
        >
          <Check />
        </Button>
      </div>
    </div>
  );
}
function DecisionPanel({
  decisions,
  save,
}: {
  decisions: Decision[];
  save: (d: Decision[]) => void;
}) {
  const s = useThread();
  const user = useAccount((a) => a.user);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [tradeoffs, setTradeoffs] = useState("");
  const [review, setReview] = useState("");
  const [signer, setSigner] = useState("");
  const analysis = analyzeDecision(selected, s.nodes, s.edges);
  const [active, setActive] = useState<string | null>(null);
  const decision = decisions.find((d) => d.id === active);
  const patch = (d: Decision) => save(decisions.map((x) => (x.id === d.id ? d : x)));
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-2 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-4">
        <Button variant="outline" className="w-full" onClick={() => setActive(null)}>
          <Plus />
          New conclusion
        </Button>
        {decisions.map((d) => (
          <Button
            key={d.id}
            variant={active === d.id ? "secondary" : "ghost"}
            className="h-auto w-full justify-start whitespace-normal text-left"
            onClick={() => setActive(d.id)}
          >
            <span>
              {d.title}
              <span className="block font-mono text-[10px] text-muted-foreground">
                {d.status} · {d.signoffs.length} sign-offs
              </span>
            </span>
          </Button>
        ))}
      </aside>
      <section className="min-w-0 space-y-4">
        {!decision ? (
          <>
            <h2 className="font-display text-2xl">Record a defensible choice.</h2>
            <Input
              aria-label="Decision title"
              placeholder="Decision title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="max-h-36 overflow-y-auto border p-3">
              {s.nodes
                .filter((n) => n.data.kind !== "portal")
                .map((n) => (
                  <label key={n.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(n.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, n.id]
                            : selected.filter((id) => id !== n.id),
                        )
                      }
                    />
                    {n.data.title}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {n.data.epistemic}
                    </span>
                  </label>
                ))}
              {!s.nodes.length && <p className="text-muted-foreground">No cards on this canvas.</p>}
            </div>
            <div className="grid grid-cols-3 border-y py-3 text-sm">
              <span>{analysis.evidence.length} evidence / facts</span>
              <span>{analysis.uncertain.length} unverified</span>
              <span className={analysis.faults ? "text-accent-ink" : ""}>
                {analysis.faults} fault lines
              </span>
            </div>
            <Textarea
              aria-label="Conclusion rationale"
              placeholder="Conclusion and rationale"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
            <Textarea
              aria-label="Decision trade-offs"
              placeholder="Alternatives rejected, costs, risks and trade-offs"
              value={tradeoffs}
              onChange={(e) => setTradeoffs(e.target.value)}
            />
            <label className="block text-sm">
              Review date
              <Input
                type="date"
                aria-label="Decision review date"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </label>
            <Button
              disabled={
                !title.trim() || !conclusion.trim() || !tradeoffs.trim() || !selected.length
              }
              onClick={() => {
                const id = crypto.randomUUID();
                save([
                  ...decisions,
                  {
                    id,
                    title: title.trim(),
                    conclusion,
                    tradeoffs,
                    nodeIds: analysis.nodeIds,
                    analysis: {
                      evidence: analysis.evidence,
                      uncertain: analysis.uncertain,
                      faults: analysis.faults,
                    },
                    status: "draft",
                    signoffs: [],
                    createdAt: new Date().toISOString(),
                    reviewDate: review,
                  },
                ]);
                setActive(id);
                setTitle("");
                setConclusion("");
                setTradeoffs("");
                setSelected([]);
              }}
            >
              Record conclusion
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl">{decision.title}</h2>
            <p className="whitespace-pre-wrap">{decision.conclusion}</p>
            <div className="border-l-2 pl-4">
              <h3 className="font-mono text-xs text-muted-foreground">TRADE-OFFS</h3>
              <p className="mt-2 whitespace-pre-wrap">{decision.tradeoffs}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              At conclusion: {decision.analysis.evidence.length} evidence / facts ·{" "}
              {decision.analysis.uncertain.length} unverified · {decision.analysis.faults} fault
              lines
            </p>
            {decision.analysis.faults > 0 && (
              <p className="border-l-2 border-accent-ink pl-3 text-sm text-accent-ink">
                Unverified dependencies remain. Sign-off records acceptance; it does not validate
                assumptions.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Input
                className="max-w-64"
                aria-label="Sign-off name"
                placeholder="Your sign-off name"
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
              />
              <Button
                disabled={
                  !user || !signer.trim() || decision.signoffs.some((x) => x.userId === user.id)
                }
                onClick={() => {
                  if (user)
                    patch({
                      ...decision,
                      status: "approved",
                      signoffs: [
                        ...decision.signoffs,
                        { userId: user.id, name: signer.trim(), at: new Date().toISOString() },
                      ],
                    });
                }}
              >
                Sign off this decision
              </Button>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground">Sign in to record your sign-off.</p>
            )}
            {decision.signoffs.map((x) => (
              <p key={x.userId} className="text-sm">
                <Check className="mr-2 inline h-4 w-4" />
                {x.name} · {new Date(x.at).toLocaleDateString()}
              </p>
            ))}
            <label className="block text-sm">
              Next decision review
              <Input
                aria-label="Next decision review"
                type="date"
                value={decision.reviewDate}
                onChange={(e) => patch({ ...decision, reviewDate: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <h3 className="font-display text-xl">Execution plan</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const actions = executionNodes(decision, s.nodes, s.edges);
                  if (!actions.length) {
                    const id = s.addNode("action", { x: 0, y: 500 });
                    s.updateNode(id, {
                      title: `Execute: ${decision.title}`,
                      body: decision.conclusion,
                    });
                    patch({ ...decision, nodeIds: [...decision.nodeIds, id] });
                  } else
                    actions.forEach((n) =>
                      s.updateNode(n.id, (d) => ({
                        ...d,
                        meta: {
                          ...d.meta,
                          decisionId: decision.id,
                          priority: d.meta["priority"] || "medium",
                        },
                      })),
                    );
                }}
              >
                Generate execution plan
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Download execution plan"
                aria-label="Download execution plan"
                onClick={() => {
                  const text =
                    `# ${decision.title}\n\n${decision.conclusion}\n\n## Trade-offs\n${decision.tradeoffs}\n\n` +
                    executionNodes(decision, s.nodes, s.edges)
                      .map(
                        (n) =>
                          `- ${n.data.title} | Owner: ${n.data.meta["owner"] || "Unassigned"} | ${n.data.meta["priority"] || "medium"} | Due: ${n.data.meta["dueDate"] || "Unscheduled"} | Milestone: ${n.data.meta["milestone"] || "—"}`,
                      )
                      .join("\n");
                  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "execution-plan.md";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download />
              </Button>
            </div>
            {executionNodes(decision, s.nodes, s.edges).map((n, i) => (
              <article key={n.id} className="border-b pb-4">
                <h4 className="mb-2 text-sm font-medium">
                  {i + 1}. {n.data.title}
                </h4>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    aria-label={`Owner for ${n.data.title}`}
                    placeholder="Owner"
                    value={n.data.meta["owner"] ?? ""}
                    onChange={(e) =>
                      s.updateNode(n.id, (d) => ({
                        ...d,
                        meta: { ...d.meta, owner: e.target.value },
                      }))
                    }
                  />
                  <Select
                    value={n.data.meta["priority"] || "medium"}
                    onValueChange={(priority) =>
                      s.updateNode(n.id, (d) => ({ ...d, meta: { ...d.meta, priority } }))
                    }
                  >
                    <SelectTrigger aria-label={`Priority for ${n.data.title}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["high", "medium", "low"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Milestone"
                    aria-label={`Milestone for ${n.data.title}`}
                    value={n.data.meta["milestone"] ?? ""}
                    onChange={(e) =>
                      s.updateNode(n.id, (d) => ({
                        ...d,
                        meta: { ...d.meta, milestone: e.target.value },
                      }))
                    }
                  />
                </div>
              </article>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
function Schedule({ decisions, onOutcome }: { decisions: Decision[]; onOutcome: () => void }) {
  const s = useThread();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [view, setView] = useState("calendar");
  const [nodeId, setNodeId] = useState("");
  const [finding, setFinding] = useState("");
  const events = scheduleEvents(s.nodes, decisions);
  const days = Array.from({ length: 42 }, (_, i) =>
    addDays(startOfWeek(month, { weekStartsOn: 1 }), i),
  );
  const node = s.nodes.find((n) => n.id === nodeId);
  const patch = (key: string, value: string) => {
    if (node) s.updateNode(node.id, (d) => ({ ...d, meta: { ...d.meta, [key]: value } }));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <h2 className="w-44 font-display text-2xl">{format(month, "MMMM yyyy")}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="tw-choice-rail h-auto w-auto gap-1 p-1">
            <TabsTrigger className="tw-choice-tab" value="calendar">Calendar</TabsTrigger>
            <TabsTrigger className="tw-choice-tab" value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === "calendar" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-7 border-t border-l">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="border-r border-b p-2 font-mono text-xs text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`min-h-20 border-r border-b p-2 ${day.getMonth() !== month.getMonth() ? "bg-muted/40" : ""}`}
              >
                <span className="font-mono text-xs text-muted-foreground">{format(day, "d")}</span>
                {events
                  .filter((e) => e.date === format(day, "yyyy-MM-dd"))
                  .map((e) => (
                    <Button
                      key={e.id}
                      variant="ghost"
                      className="mt-1 h-auto w-full justify-start whitespace-normal border-l-2 border-accent-ink p-1 text-left text-[11px]"
                      onClick={() => setNodeId(e.nodeId)}
                    >
                      {e.title}
                    </Button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {
              <div className="grid grid-cols-[200px_minmax(0,1fr)] border-b pb-2">
                <span className="font-mono text-xs text-muted-foreground">SCHEDULE</span>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${getDaysInMonth(month)},minmax(0,1fr))` }}
                >
                  {Array.from({ length: getDaysInMonth(month) }, (_, i) => (
                    <span
                      key={i}
                      className="text-center font-mono text-[9px] text-muted-foreground"
                    >
                      {(i + 1) % 5 === 0 ? i + 1 : ""}
                    </span>
                  ))}
                </div>
              </div>
            }
            {events
              .filter(
                (e) =>
                  e.start < format(addMonths(month, 1), "yyyy-MM-dd") &&
                  e.date >= format(month, "yyyy-MM-dd"),
              )
              .map((e) => {
                const offset = Math.max(0, differenceInCalendarDays(parseISO(e.start), month));
                const length = Math.max(
                  1,
                  differenceInCalendarDays(
                    parseISO(e.date),
                    offset === 0 ? month : parseISO(e.start),
                  ) + 1,
                );
                return (
                  <div
                    key={e.id}
                    className="grid grid-cols-[200px_minmax(0,1fr)] items-center border-b py-3"
                  >
                    <Button
                      variant="ghost"
                      className="justify-start truncate"
                      onClick={() => setNodeId(e.nodeId)}
                    >
                      {e.title}
                    </Button>
                    <div
                      className="tw-gantt-track grid"
                      style={{
                        gridTemplateColumns: `repeat(${getDaysInMonth(month)},minmax(0,1fr))`,
                      }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-w-0 overflow-hidden rounded-sm border-l-2 border-accent-ink text-[10px]"
                        style={{
                          gridColumn: `${Math.min(getDaysInMonth(month), offset + 1)} / span ${Math.min(length, getDaysInMonth(month) - Math.min(getDaysInMonth(month) - 1, offset))}`,
                        }}
                        onClick={() => setNodeId(e.nodeId)}
                      >
                        {e.date.slice(5)}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      <div className="grid gap-4 border-t pt-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <Select value={nodeId} onValueChange={setNodeId}>
          <SelectTrigger aria-label="Schedule card">
            <SelectValue placeholder="Schedule an action or experiment" />
          </SelectTrigger>
          <SelectContent>
            {s.nodes
              .filter((n) => ["action", "experiment"].includes(n.data.kind))
              .map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.data.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {node && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["startDate", "Start"],
                ["dueDate", "Deadline"],
                ["reviewDate", "Review check-in"],
              ].map(([key, label]) => (
                <label key={key} className="text-sm">
                  {label}
                  <Input
                    type="date"
                    aria-label={`${label} date`}
                    value={node.data.meta[key ?? ""] ?? ""}
                    min={
                      key === "dueDate" && validDate(node.data.meta["startDate"])
                        ? node.data.meta["startDate"]
                        : undefined
                    }
                    onChange={(e) => patch(key ?? "", e.target.value)}
                  />
                </label>
              ))}
            </div>
            {node.data.kind === "experiment" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Outcome: {node.data.meta["result"] || "Pending"} ·{" "}
                  {node.data.meta["lessonsLearned"]}
                </p>
                <Textarea
                  aria-label="Experiment review finding"
                  placeholder="Finding from this review"
                  value={finding}
                  onChange={(e) => setFinding(e.target.value)}
                />
                <Button
                  disabled={!finding.trim()}
                  variant="outline"
                  onClick={() => {
                    const id = s.addNode("note", {
                      x: node.position.x + 340,
                      y: node.position.y + 240,
                    });
                    s.updateNode(id, {
                      title: `Review: ${node.data.title}`,
                      body: finding,
                      meta: { source: node.id },
                    });
                    s.connect(
                      { source: node.id, target: id, sourceHandle: null, targetHandle: null },
                      "leads_to",
                    );
                    patch("reviewFinding", finding);
                    setFinding("");
                  }}
                >
                  Loop finding back to canvas
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    s.updateNode(node.id, (d) => ({
                      ...d,
                      meta: { ...d.meta, status: "completed" },
                    }));
                    onOutcome();
                  }}
                >
                  Record experiment outcome
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {!events.length && (
        <p className="text-sm text-muted-foreground">No scheduled deadlines or reviews yet.</p>
      )}
    </div>
  );
}
