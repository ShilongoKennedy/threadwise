import { useEffect, useState } from "react";
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
  X,
} from "lucide-react";
import { addWatch, checkWatchNow, claimWatch, listWatches, removeWatch, WATCH_LABEL, type Watch } from "@/lib/threadwise/watches";
import { toast } from "sonner";
import { VerdictStamp } from "./VerdictStamp";
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
import {
  addDays,
  startOfMonth,
  startOfWeek,
  format,
  isSameDay,
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

  useEffect(() => {
    const openCalendar = () => setOpen(true);
    window.addEventListener("threadwise:open-calendar", openCalendar);
    return () => window.removeEventListener("threadwise:open-calendar", openCalendar);
  }, []);

  return (
    <>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tw-planning w-[calc(100%-24px)] max-w-6xl max-h-[90dvh] overflow-y-auto p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="font-display text-3xl font-normal">
              Dates that matter.
            </DialogTitle>
            <DialogDescription>
              {c?.title} · {ws.status}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] px-4 pb-6 pt-4 sm:px-6">
            <Schedule decisions={planning.decisions} onOutcome={() => setOpen(false)} />
</div>
        </DialogContent>
      </Dialog>
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
  const [view] = useState<"calendar">("calendar");
  const [nodeId, setNodeId] = useState("");
  const [finding, setFinding] = useState("");
  const events = scheduleEvents(s.nodes, decisions);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [claim, setClaim] = useState("");
  const [due, setDue] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [watchError, setWatchError] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    let active = true;
    void listWatches()
      .then((rows) => {
        if (active) setWatches(rows);
      })
      .catch(() => {
        /* signed out or table not migrated yet: the calendar still works */
      });
    return () => {
      active = false;
    };
  }, []);

  const watch = async () => {
    setSaving(true);
    setWatchError("");
    try {
      const created = await addWatch({ claim, dueDate: due, sourceUrl });
      setWatches((rows) => [...rows, created].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setClaim("");
      setSourceUrl("");
    } catch (error) {
      setWatchError(error instanceof Error ? error.message : "Could not add the watch.");
    } finally {
      setSaving(false);
    }
  };
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
      </div>
      <div className="flex flex-wrap items-center gap-2 border-2 border-foreground p-2">
        <Input
          value={claim}
          onChange={(event) => setClaim(event.target.value)}
          placeholder="What is supposed to happen? e.g. Treaty signed"
          aria-label="Claim to watch"
          className="h-9 min-w-[200px] flex-1"
        />
        <Input
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="Source URL (optional)"
          aria-label="Source article for this claim"
          className="h-9 min-w-[160px] flex-1"
        />
        <Input
          type="date"
          value={due}
          onChange={(event) => setDue(event.target.value)}
          aria-label="Date to check the claim"
          className="h-9 w-[150px]"
        />
        <Button size="sm" className="h-9" disabled={!claim.trim() || saving} onClick={() => void watch()}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Watch
        </Button>
        {watches.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65">
            {watches.filter((item) => item.status === "pending").length} open
          </span>
        )}
      </div>
      {watchError && <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C1121F]">{watchError}</p>}

      {watches.length > 0 && (
        <section className="border-2 border-foreground">
          <div className="flex items-center justify-between border-b border-foreground/12 bg-foreground px-3 py-1">
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#FDFBF7]">
              Watched claims
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
              {watches.filter((item) => item.status === "pending").length} open
            </span>
          </div>
          <ul>
            {watches.map((item) => {
              const contradicted = item.status === "contradicted";
              const pending = item.status === "pending";
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 border-b border-foreground/10 px-3 py-1.5 last:border-b-0"
                >
                  {item.scope === "suggested" ? (
                    <span className="shrink-0 bg-[#6B6862] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                      Suggested
                    </span>
                  ) : pending ? (
                    <span className="shrink-0 bg-[#1A4BFF] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                      {WATCH_LABEL[item.status]}
                    </span>
                  ) : (
                    <VerdictStamp status={contradicted ? "contradicted" : "confirmed"} sound={false} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px]" title={item.claim}>
                    {item.claim}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-foreground/65">{item.due_date}</span>
                  {item.scope === "suggested" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 px-2 text-[11px]"
                      title="Keep this date and let the agent check it"
                      onClick={() => {
                        void claimWatch(item.id)
                          .then(() => listWatches())
                          .then(setWatches)
                          .catch(() => setWatchError("Could not keep that suggestion."));
                      }}
                    >
                      Keep
                    </Button>
                  ) : (
                    <>
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 px-2 text-[11px]"
                        disabled={checking === item.id}
                        title="Check this claim against today's reporting"
                        onClick={() => {
                          setChecking(item.id);
                          void checkWatchNow(item.id)
                            .then((result) => {
                              setWatches((rows) =>
                                rows.map((row) =>
                                  row.id === item.id
                                    ? {
                                        ...row,
                                        status: result.status === "inconclusive" ? row.status : result.status,
                                        resolution: result.note,
                                        checked_at: new Date().toISOString(),
                                      }
                                    : row,
                                ),
                              );
                              if (result.status === "inconclusive") {
                                toast("Not settled by today's article", {
                                  description: result.note || "It stays open and will be checked again.",
                                });
                              } else {
                                toast[result.status === "confirmed" ? "success" : "error"](
                                  result.status === "confirmed" ? "Confirmed" : "Contradicted",
                                  { description: result.note },
                                );
                              }
                            })
                            .catch((error: unknown) =>
                              toast.error(
                                error instanceof Error ? error.message : "The check failed.",
                              ),
                            )
                            .finally(() => setChecking(null));
                        }}
                      >
                        {checking === item.id ? "Looking…" : "Check"}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      aria-label={`Stop watching ${item.claim}`}
                      title="Stop watching"
                      onClick={() => {
                        void removeWatch(item.id)
                          .then(() => setWatches((rows) => rows.filter((row) => row.id !== item.id)))
                          .catch(() => setWatchError("Could not remove that watch."));
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {view === "calendar" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-7 border-2 border-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="border-r border-b border-foreground/10 bg-foreground px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#FDFBF7]"
              >
                {d}
              </div>
            ))}
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-b border-r border-foreground/10 p-1.5 ${day.getMonth() !== month.getMonth() ? "bg-foreground/[0.035]" : ""} ${isSameDay(day, new Date()) ? "bg-[#1A4BFF]/[0.07]" : ""}`}
              >
                <span className={`font-mono text-[10px] ${isSameDay(day, new Date()) ? "font-bold text-[#1A4BFF]" : "text-foreground/65"}`}>{format(day, "d")}</span>
                {events
                  .filter((e) => e.date === format(day, "yyyy-MM-dd"))
                  .map((e) => (
                    <Button
                      key={e.id}
                      variant="ghost"
                      className="mt-1 h-auto w-full justify-start whitespace-normal rounded-none border-l-2 border-[#1A4BFF] bg-white px-1.5 py-0.5 text-left font-mono text-[10px] leading-tight hover:bg-[#1A4BFF] hover:text-white"
                      onClick={() => setNodeId(e.nodeId)}
                    >
                      {e.title}
                    </Button>
                  ))}
                {watches
                  .filter((item) => item.due_date === format(day, "yyyy-MM-dd"))
                  .map((item) => (
                    <div
                      key={item.id}
                      title={`${item.claim} · ${WATCH_LABEL[item.status]}`}
                      className="mt-1 w-full truncate border border-dashed px-1.5 py-0.5 font-mono text-[10px] leading-tight"
                      style={{
                        borderColor:
                          item.status === "contradicted"
                            ? "#C1121F"
                            : item.status === "confirmed"
                              ? "var(--foreground)"
                              : "var(--accent-ink)",
                        color:
                          item.status === "contradicted"
                            ? "#C1121F"
                            : item.status === "confirmed"
                              ? "var(--foreground)"
                              : "var(--accent-ink)",
                      }}
                    >
                      {item.claim}
                    </div>
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
                      className="text-center font-mono text-[10px] text-muted-foreground"
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
