import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  GitFork,
  Highlighter,
  Maximize,
  Minimize,
  MousePointer2,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread } from "@/lib/threadwise/store";
import { reasoningLinks } from "@/lib/threadwise/graph";
import { TYPE_INFO, relationLabel } from "@/lib/threadwise/model";

type Lens = "story" | "proof" | "action";
type Atmosphere = "cinema" | "quiet" | "electric";
type Scene = "monolith" | "constellation" | "signal";
type StoryArc = "reveal" | "investigate" | "challenge" | "rally" | "decide";
type SketchTool = "off" | "pen" | "highlight" | "laser" | "note";
type Stroke = { id: string; tool: "pen" | "highlight"; points: { x: number; y: number }[] };
type StageNote = { id: string; x: number; y: number; text: string };

/** A directed, interactive story stage — deliberately not a slide deck. */
export function PresentationMode({
  stops,
  index,
  setIndex,
  auto,
  setAuto,
  pace,
  setPace,
  title,
  onExit,
}: {
  stops: string[];
  index: number;
  setIndex: (fn: (v: number) => number) => void;
  auto: boolean;
  setAuto: (fn: (v: boolean) => boolean) => void;
  pace: number;
  setPace: (pace: number) => void;
  title: string;
  onExit: () => void;
}) {
  const s = useThread();
  const [full, setFull] = useState(false);
  const [lens, setLens] = useState<Lens>("story");
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("cinema");
  const [scene, setScene] = useState<Scene>("monolith");
  const [storyArc, setStoryArc] = useState<StoryArc>("reveal");
  const [directorOpen, setDirectorOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [sketchTool, setSketchTool] = useState<SketchTool>("off");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [stageNotes, setStageNotes] = useState<StageNote[]>([]);
  const [laser, setLaser] = useState<{ x: number; y: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const activeStroke = useRef<string | null>(null);
  const last = stops.length - 1;
  const node = s.nodes.find((n) => n.id === stops[index]);
  const go = (d: number) => setIndex((v) => Math.min(last, Math.max(0, v + d)));
  const jump = (id: string) => {
    const nextIndex = stops.indexOf(id);
    if (nextIndex >= 0) setIndex(() => nextIndex);
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const sync = () => setFull(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    root.current?.focus();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea,[contenteditable]")) return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) go(1);
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) go(-1);
      else if (k === "Home") setIndex(() => 0);
      else if (k === "End") setIndex(() => last);
      else if (k.toLowerCase() === "f") toggleFull();
      else if (k.toLowerCase() === "p") setAuto((v) => !v);
      else if (k.toLowerCase() === "d") setDirectorOpen((v) => !v);
      else if (k.toLowerCase() === "m") setMapOpen((v) => !v);
      else if (k.toLowerCase() === "n") setPresenterOpen((v) => !v);
      else if (k.toLowerCase() === "r") setReveal((v) => (v + 1) % 4);
      else if (k.toLowerCase() === "a") setSketchTool((v) => (v === "off" ? "pen" : "off"));
      else if (k === "Escape") onExit();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [last, onExit]);
  const links = reasoningLinks(s.edges);
  const byId = useMemo(() => new Map(s.nodes.map((n) => [n.id, n])), [s.nodes]);
  const rel = (id: string) => s.edges.find((e) => e.id === id)?.data;
  const upstream = node
    ? links
        .filter((l) => l.to === node.id)
        .map((l) => ({ n: byId.get(l.from), r: rel(l.id) }))
        .filter((x) => x.n)
    : [];
  const evidence = upstream.filter(
    (x) => ["fact", "evidence"].includes(x.n!.data.epistemic) || x.n!.data.kind === "note",
  );
  const next = node
    ? links
        .filter((l) => l.from === node.id)
        .map((l) => ({ n: byId.get(l.to), r: rel(l.id) }))
        .filter((x) => x.n)
    : [];
  const hypothesis = node?.data.meta["hypothesis"]?.trim() ?? "";
  const extra = node
    ? (["successCriteria", "answer", "outcome", "source"] as const)
        .map((k) => ({
          k,
          v: node.data.meta[k]?.trim(),
          label: TYPE_INFO[node.data.kind].fields.find((f) => f.key === k)?.label,
        }))
        .filter((x) => x.v && x.label)
    : [];
  const lensCopy =
    lens === "story"
      ? "The idea in focus"
      : lens === "proof"
        ? "What earns belief"
        : "What moves next";
  const previousNode = byId.get(stops[index - 1] ?? "");
  const upcomingNode = byId.get(stops[index + 1] ?? "");
  const connectedStops = [
    ...new Set([...evidence, ...next].map((x) => x.n!.id).filter((id) => stops.includes(id))),
  ];
  const provocation =
    node?.data.kind === "experiment"
      ? "What result would make us change course?"
      : node?.data.kind === "question"
        ? "What would a serious answer have to explain?"
        : node?.data.kind === "action"
          ? "What is the smallest move that makes this real?"
          : "What would change our mind about this?";
  const speakerCue =
    node?.data.kind === "action"
      ? "Name the owner and the first irreversible move."
      : node?.data.kind === "experiment"
        ? "Invite the room to define a result that would genuinely change the plan."
        : node?.data.kind === "question"
          ? "Hold the uncertainty for a beat before asking the room to answer it."
          : "State the claim plainly, then let the room notice the tension around it.";
  const linkList = (items: typeof next) =>
    items.length ? (
      <ul>
        {items.map(({ n, r }) => (
          <li key={n!.id}>
            <button onClick={() => jump(n!.id)} disabled={!stops.includes(n!.id)}>
              <span className="tw-slide-rel">
                {r ? relationLabel(r.relation, r.customLabel) : ""}
              </span>
              {n!.data.title}
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm opacity-60">No linked thread yet.</p>
    );
  const stagePoint = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 1000,
    };
  };
  const selectSketchTool = (tool: SketchTool) => {
    setSketchTool((current) => (current === tool ? "off" : tool));
    setLaser(null);
  };
  const chooseArc = (arc: StoryArc) => {
    setStoryArc(arc);
    const direction: Record<StoryArc, { lens: Lens; scene: Scene; atmosphere: Atmosphere }> = {
      reveal: { lens: "story", scene: "signal", atmosphere: "cinema" },
      investigate: { lens: "proof", scene: "constellation", atmosphere: "quiet" },
      challenge: { lens: "proof", scene: "monolith", atmosphere: "electric" },
      rally: { lens: "action", scene: "constellation", atmosphere: "electric" },
      decide: { lens: "action", scene: "signal", atmosphere: "cinema" },
    };
    const nextDirection = direction[arc];
    setLens(nextDirection.lens);
    setScene(nextDirection.scene);
    setAtmosphere(nextDirection.atmosphere);
    setReveal(0);
  };

  return (
    <div
      ref={root}
      tabIndex={-1}
      className="tw-stage"
      data-atmosphere={atmosphere}
      data-scene={scene}
      role="dialog"
      aria-modal="true"
      aria-label={`Presentation: ${title}`}
      onTouchStart={(e) => (touch.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touch.current,
          end = e.changedTouches[0]?.clientX;
        touch.current = null;
        if (sketchTool === "off" && start != null && end != null && Math.abs(end - start) >= 50)
          go(end < start ? 1 : -1);
      }}
    >
      <div className="tw-stage-orbit" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      {scene === "constellation" && (
        <div className="tw-stage-constellation" aria-label="Connected ideas orbiting this scene">
          {connectedStops.slice(0, 6).map((id, i) => (
            <button
              key={id}
              style={{ "--orbit-index": i } as CSSProperties}
              onClick={() => jump(id)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {byId.get(id)?.data.title}
            </button>
          ))}
          {connectedStops.length === 0 && (
            <p>Connect this thought to let its constellation appear.</p>
          )}
        </div>
      )}
      <header className="tw-stage-bar">
        <span className="tw-kicker truncate">
          {title} <span className="tw-stage-lens">/ {lensCopy}</span>
        </span>
        <span className="font-mono text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")}{" "}
          <span className="opacity-50">/ {String(stops.length).padStart(2, "0")}</span>
        </span>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={sketchTool !== "off"}
            aria-label="Open presentation sketchpad"
            title="Sketchpad (A)"
            onClick={() => selectSketchTool("pen")}
          >
            <PenLine />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open story map"
            title="Story map (M)"
            onClick={() => setMapOpen((v) => !v)}
          >
            <Eye />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Advance reveal beat"
            title="Reveal beat (R)"
            onClick={() => setReveal((v) => (v + 1) % 3)}
          >
            <Sparkles />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open director controls"
            title="Director controls (D)"
            onClick={() => setDirectorOpen((v) => !v)}
          >
            <Settings2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={full ? "Exit full screen" : "Enter full screen"}
            title="Full screen (F)"
            onClick={toggleFull}
          >
            {full ? <Minimize /> : <Maximize />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Exit presentation"
            title="Exit (Esc)"
            onClick={onExit}
          >
            <X />
          </Button>
        </div>
      </header>
      {sketchTool !== "off" && (
        <aside className="tw-sketch-toolbar" aria-label="Live presentation sketchpad">
          <span className="tw-kicker">Live mark-up</span>
          <Button
            size="icon"
            variant={sketchTool === "pen" ? "secondary" : "ghost"}
            title="Pen"
            aria-label="Pen"
            onClick={() => selectSketchTool("pen")}
          >
            <PenLine />
          </Button>
          <Button
            size="icon"
            variant={sketchTool === "highlight" ? "secondary" : "ghost"}
            title="Highlighter"
            aria-label="Highlighter"
            onClick={() => selectSketchTool("highlight")}
          >
            <Highlighter />
          </Button>
          <Button
            size="icon"
            variant={sketchTool === "laser" ? "secondary" : "ghost"}
            title="Laser pointer"
            aria-label="Laser pointer"
            onClick={() => selectSketchTool("laser")}
          >
            <MousePointer2 />
          </Button>
          <Button
            size="icon"
            variant={sketchTool === "note" ? "secondary" : "ghost"}
            title="Place note"
            aria-label="Place note"
            onClick={() => selectSketchTool("note")}
          >
            <StickyNote />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Clear presentation markup"
            aria-label="Clear presentation markup"
            onClick={() => {
              setStrokes([]);
              setStageNotes([]);
            }}
          >
            <Trash2 />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => selectSketchTool("off")}>
            Done
          </Button>
        </aside>
      )}
      <svg
        className={`tw-stage-ink ${sketchTool !== "off" ? "is-active" : ""}`}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        onPointerDown={(event) => {
          if (sketchTool === "note") {
            const p = stagePoint(event);
            setStageNotes((notes) => [
              ...notes,
              { id: crypto.randomUUID(), x: p.x, y: p.y, text: "A thought…" },
            ]);
            return;
          }
          if (sketchTool === "pen" || sketchTool === "highlight") {
            event.currentTarget.setPointerCapture(event.pointerId);
            const id = crypto.randomUUID();
            activeStroke.current = id;
            setStrokes((items) => [
              ...items,
              { id, tool: sketchTool, points: [stagePoint(event)] },
            ]);
          }
        }}
        onPointerMove={(event) => {
          const point = stagePoint(event);
          if (sketchTool === "laser") setLaser(point);
          if (activeStroke.current)
            setStrokes((items) =>
              items.map((stroke) =>
                stroke.id === activeStroke.current
                  ? { ...stroke, points: [...stroke.points, point] }
                  : stroke,
              ),
            );
        }}
        onPointerUp={() => {
          activeStroke.current = null;
        }}
        onPointerLeave={() => {
          activeStroke.current = null;
          setLaser(null);
        }}
      >
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            className={`tw-stage-stroke is-${stroke.tool}`}
            points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        ))}
        {laser && sketchTool === "laser" && (
          <circle className="tw-stage-laser" cx={laser.x} cy={laser.y} r="8" />
        )}
      </svg>
      {stageNotes.map((note) => (
        <textarea
          key={note.id}
          className="tw-stage-note"
          aria-label="Presentation note"
          value={note.text}
          style={{ left: `${note.x / 10}%`, top: `${note.y / 10}%` }}
          onChange={(event) =>
            setStageNotes((notes) =>
              notes.map((item) =>
                item.id === note.id ? { ...item, text: event.target.value } : item,
              ),
            )
          }
          onPointerDown={(event) => event.stopPropagation()}
        />
      ))}
      {directorOpen && (
        <aside className="tw-director" aria-label="Presentation director">
          <div>
            <span className="tw-kicker">Director’s console</span>
            <p>Shape the room while you present.</p>
          </div>
          <label>
            Lens
            <div className="tw-choice-row">
              {(["story", "proof", "action"] as Lens[]).map((v) => (
                <button key={v} data-active={lens === v} onClick={() => setLens(v)}>
                  {v}
                </button>
              ))}
            </div>
          </label>
          <label>
            Scene choreography
            <div className="tw-choice-row">
              {(["monolith", "constellation", "signal"] as Scene[]).map((v) => (
                <button key={v} data-active={scene === v} onClick={() => setScene(v)}>
                  {v}
                </button>
              ))}
            </div>
          </label>
          <label>
            Atmosphere
            <div className="tw-choice-row">
              {(["cinema", "quiet", "electric"] as Atmosphere[]).map((v) => (
                <button key={v} data-active={atmosphere === v} onClick={() => setAtmosphere(v)}>
                  {v}
                </button>
              ))}
            </div>
          </label>
          <label>
            Autoplay tempo
            <div className="tw-choice-row">
              {[
                [4500, "brisk"],
                [7000, "balanced"],
                [12000, "slow"],
              ].map(([value, label]) => (
                <button
                  key={String(value)}
                  data-active={pace === value}
                  onClick={() => setPace(value as number)}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>
          <p className="tw-director-note">
            <Sparkles /> A sketch · D director · M story map · R reveals
          </p>
        </aside>
      )}
      {directorOpen && (
        <nav className="tw-arc-strip" aria-label="Story arc">
          <span className="tw-kicker">Story arc</span>
          {(["reveal", "investigate", "challenge", "rally", "decide"] as StoryArc[]).map((arc) => (
            <button key={arc} data-active={storyArc === arc} onClick={() => chooseArc(arc)}>{arc}</button>
          ))}
        </nav>
      )}
      {mapOpen && (
        <aside className="tw-story-map" aria-label="Interactive story map">
          <div className="flex items-center justify-between">
            <span className="tw-kicker">Story map</span>
            <button onClick={() => setMapOpen(false)} aria-label="Close story map">
              <X />
            </button>
          </div>
          <div className="tw-map-line">
            {stops.map((id, i) => (
              <button
                key={id}
                data-active={i === index}
                data-past={i < index || undefined}
                onClick={() => jump(id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {byId.get(id)?.data.title}
              </button>
            ))}
          </div>
        </aside>
      )}
      {presenterOpen && (
        <aside className="tw-presenter-notes" aria-label="Private presenter notes">
          <header>
            <span className="tw-kicker">Private presenter layer</span>
            <button onClick={() => setPresenterOpen(false)} aria-label="Close presenter notes">
              <X />
            </button>
          </header>
          <section>
            <small>Say this</small>
            <p>{speakerCue}</p>
          </section>
          <section>
            <small>Invite a response</small>
            <p>{provocation}</p>
          </section>
          <section>
            <small>Proof in the room</small>
            <p>
              {evidence.length
                ? evidence
                    .slice(0, 2)
                    .map((item) => item.n?.data.title)
                    .join(" · ")
                : "No linked evidence yet — name that gap honestly."}
            </p>
          </section>
          <footer>
            <span>
              {next.length} next move{next.length === 1 ? "" : "s"}
            </span>
            <span>
              {connectedStops.length} connected scene{connectedStops.length === 1 ? "" : "s"}
            </span>
          </footer>
        </aside>
      )}
      <main className="tw-stage-main">
        {node ? (
          <article key={`${node.id}-${lens}-${scene}`} className="tw-slide" aria-live="polite">
            <div className="tw-slide-halo" aria-hidden />
            {scene === "signal" && (
              <p className="tw-signal-echo" aria-hidden>
                {node.data.title}
              </p>
            )}
            <div className="tw-slide-meta">
              <span>{TYPE_INFO[node.data.kind].label}</span>
              <span aria-hidden>·</span>
              <span>{node.data.epistemic}</span>
              {node.data.meta["status"] && (
                <>
                  <span aria-hidden>·</span>
                  <span>{node.data.meta["status"]}</span>
                </>
              )}
            </div>
            <div className="tw-story-spine" aria-label="Story position">
              <button disabled={!previousNode} onClick={() => previousNode && go(-1)}>
                <span>came from</span>
                {previousNode?.data.title ?? "opening"}
              </button>
              <div>
                <i />
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <i />
              </div>
              <button disabled={!upcomingNode} onClick={() => upcomingNode && go(1)}>
                <span>leads toward</span>
                {upcomingNode?.data.title ?? "resolution"}
              </button>
            </div>
            <p className="tw-slide-chapter">{lensCopy}</p>
            <h2 className="tw-slide-title">{node.data.title}</h2>
            {node.data.body && <p className="tw-slide-body">{node.data.body}</p>}
            {reveal >= 1 && (
              <section className="tw-reveal tw-reveal-context">
                <span>
                  <GitFork />
                </span>
                <div>
                  <p className="tw-kicker">Connection field</p>
                  <p>
                    {connectedStops.length
                      ? `${connectedStops.length} presentation ${connectedStops.length === 1 ? "moment is" : "moments are"} directly connected to this thought.`
                      : "This moment has not been woven into the presentation path yet."}
                  </p>
                </div>
              </section>
            )}
            {reveal >= 2 && (
              <section className="tw-reveal tw-reveal-question">
                <span>?</span>
                <div>
                  <p className="tw-kicker">A room to pause</p>
                  <h3>{provocation}</h3>
                </div>
              </section>
            )}
            {reveal >= 3 && (
              <section className="tw-audience-fork">
                <p className="tw-kicker">Let the room choose the next lens</p>
                <div>
                  <button
                    onClick={() => {
                      setLens("proof");
                      setReveal(2);
                    }}
                  >
                    Put the claim on trial <span>→ evidence</span>
                  </button>
                  <button
                    onClick={() => {
                      setLens("action");
                      setReveal(2);
                    }}
                  >
                    Turn tension into a move <span>→ action</span>
                  </button>
                </div>
              </section>
            )}
            {lens !== "action" && (hypothesis || extra.length > 0) && (
              <dl className="tw-slide-facts">
                {hypothesis && (
                  <div>
                    <dt>Hypothesis</dt>
                    <dd>{hypothesis}</dd>
                  </div>
                )}
                {extra.map((x) => (
                  <div key={x.k}>
                    <dt>{x.label}</dt>
                    <dd>{x.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {lens === "proof" && (
              <section className="tw-slide-focus">
                <h3>Evidence pulse</h3>
                <p>
                  {evidence.length
                    ? `${evidence.length} supporting ${evidence.length === 1 ? "thread is" : "threads are"} connected to this idea.`
                    : "This claim has no linked evidence yet. That gap is part of the story."}
                </p>
              </section>
            )}
            {lens === "action" && (
              <section className="tw-slide-focus">
                <h3>Make it move</h3>
                <p>
                  {next.length
                    ? "Choose a downstream thread to continue the story, or return to the canvas and turn one into a concrete action."
                    : "There is no downstream move yet. This is a useful place to name one."}
                </p>
              </section>
            )}
            {(evidence.length > 0 || next.length > 0) && (
              <div className="tw-slide-links">
                <section>
                  <h3 className="tw-kicker">
                    {lens === "action" ? "What grounds it" : "Evidence"}
                  </h3>
                  {linkList(evidence)}
                </section>
                <section>
                  <h3 className="tw-kicker">
                    {lens === "action" ? "Choose a direction" : "Next steps"}
                  </h3>
                  {linkList(next)}
                </section>
              </div>
            )}
            {(evidence.length > 0 || next.length > 0) && (
              <p className="tw-slide-detour">
                Interactive thread: select a linked stop to take a detour, then use the story map to
                return.
              </p>
            )}
          </article>
        ) : (
          <p className="tw-slide">This stop no longer exists.</p>
        )}
      </main>
      <footer className="tw-stage-controls">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous presentation stop"
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset reveal beats"
          title="Reset reveals"
          onClick={() => setReveal(0)}
        >
          <RotateCcw />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={auto ? "Pause presentation" : "Play presentation"}
          onClick={() => setAuto((v) => !v)}
        >
          {auto ? <Pause /> : <Play />}
        </Button>
        <div className="tw-scrubber" role="tablist" aria-label="Presentation stops">
          {stops.map((id, i) => (
            <button
              key={id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Stop ${i + 1}: ${byId.get(id)?.data.title ?? ""}`}
              title={byId.get(id)?.data.title}
              data-state={i < index ? "past" : i === index ? "now" : "next"}
              onClick={() => setIndex(() => i)}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next presentation stop"
          disabled={index === last}
          onClick={() => go(1)}
        >
          <ArrowRight />
        </Button>
        <span className="tw-stage-hint">← → navigate · A sketch · R reveal · D direct · M map</span>
      </footer>
    </div>
  );
}
