import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import {
  ArrowUpRight,
  Beaker,
  CheckSquare,
  DoorOpen,
  EyeOff,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readReactions } from "@/lib/threadwise/reactions";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { cn } from "@/lib/utils";
import {
  LENSES,
  TYPE_INFO,
  groundedLift,
  type Epistemic,
  type ThreadNodeType,
} from "@/lib/threadwise/model";
import { useThread, type TNode } from "@/lib/threadwise/store";
import { isCustomColor, paperColor, paperInk } from "@/lib/threadwise/paper";
import { NOTE_DEFAULT_HEIGHT, resizedNoteHeight } from "@/lib/threadwise/note-sizing";

export const TYPE_ICON: Record<ThreadNodeType, typeof Lightbulb> = {
  idea: Lightbulb,
  note: StickyNote,
  question: HelpCircle,
  experiment: Beaker,
  action: CheckSquare,
  portal: DoorOpen,
  dossier: FolderOpen,
  omission: EyeOff,
};

export const TYPE_COLOR: Record<ThreadNodeType, string> = {
  idea: "var(--type-idea)",
  note: "var(--type-note)",
  question: "var(--type-question)",
  experiment: "var(--type-experiment)",
  action: "var(--type-action)",
  portal: "var(--foreground)",
  dossier: "var(--type-dossier)",
  omission: "var(--type-omission)",
};

/** A small glyph that encodes how certain a card is — filled = known, hollow = assumed. */
export function EpistemicGlyph({ status, className }: { status: Epistemic; className?: string }) {
  const c = "currentColor";
  return (
    <svg viewBox="0 0 12 12" className={cn("h-3 w-3", className)} aria-hidden>
      {status === "fact" && <circle cx="6" cy="6" r="4.5" fill={c} />}
      {status === "evidence" && (
        <>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke={c} strokeWidth="1.2" />
          <path d="M6 1.5 A4.5 4.5 0 0 1 6 10.5 Z" fill={c} />
        </>
      )}
      {status === "assumption" && (
        <circle cx="6" cy="6" r="4.5" fill="none" stroke={c} strokeWidth="1.2" />
      )}
      {status === "hypothesis" && (
        <path
          d="M6 1.6 L10.6 10 H1.4 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}
      {status === "unknown" && (
        <circle
          cx="6"
          cy="6"
          r="4.5"
          fill="none"
          stroke={c}
          strokeWidth="1.2"
          strokeDasharray="1.6 1.8"
        />
      )}
    </svg>
  );
}

const STATUS_DONE = new Set(["done", "complete", "completed", "answered"]);

const isUrl = (v: string | undefined) => !!v && /^https?:\/\//.test(v);

function focusInLab(source: string) {
  window.dispatchEvent(new CustomEvent("threadwise:focus-source", { detail: { source } }));
}

/** The Source Dossier anchor: a distinct manila-folder visual that pins one document to the canvas. */
function DossierCard({ id, data, selected }: NodeProps<TNode>) {
  const sourceTitle = data.meta["source"] || data.title || "Untitled source";
  const hasUrl = isUrl(data.meta["sourceUrl"]) || isUrl(data.meta["source"]);
  const linkedCount = useThread((s) => s.edges.filter((e) => e.source === id || e.target === id).length);
  
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--rx", `${(py - 0.5) * -12}deg`);
    e.currentTarget.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
    e.currentTarget.style.setProperty("--near", "1");
  };
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
    e.currentTarget.style.setProperty("--near", "0");
  };

  return (
    <div 
      className={cn("tw-dossier group relative w-[272px]", selected && "is-selected")}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ perspective: "1000px" }}
    >
      <Handle type="target" position={Position.Left} className="tw-handle" />
      <div
        className="absolute -top-2 left-3 z-10 flex items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.16em] transition-transform duration-200"
        style={{
          background: "var(--card)",
          borderColor: "var(--type-dossier)",
          color: "var(--type-dossier)",
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(32px)",
        }}
      >
        <FolderOpen className="h-3 w-3" />
        Source dossier
      </div>
      <div
        className="mt-4 rounded-[2px] border bg-card p-4 text-card-foreground shadow-sm transition-transform duration-200"
        style={{ 
          borderColor: "var(--type-dossier)",
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(16px)"
        }}
      >
        <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>Anchor</span>
          <span style={{ color: "var(--type-dossier)" }}>● locked</span>
        </div>
        <div className="font-display text-[17px] font-bold leading-[1.2]">{sourceTitle}</div>
        {data.body && data.body !== "Source document anchor." && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{data.body}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            {linkedCount} linked · {hasUrl ? "web" : "indexed"}
          </span>
          <button
            type="button"
            className="nodrag nopan rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-muted"
            style={{ borderColor: "var(--type-dossier)", color: "var(--type-dossier)" }}
            onClick={(e) => {
              e.stopPropagation();
              focusInLab(sourceTitle);
            }}
          >
            ↗ Return to Lab
          </button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="tw-handle" />
    </div>
  );
}

export function ThreadNode({ id, data, selected }: NodeProps<TNode>) {
  const landed = useThread((s) => s.landed === id);
  const linkAnchor = useThread((s) => s.linkAnchor === id);
  const zoom = useStore((s) => s.transform[2]);
  const noteHeight = useThread(
    (s) => s.nodes.find((n) => n.id === id)?.height ?? NOTE_DEFAULT_HEIGHT,
  );

  // Dossier renders its own compact folder card and never uses the standard card chrome.
  if (data.kind === "dossier") {
    return <DossierCard id={id} data={data} selected={selected} width={0} height={0} dragging={false} zIndex={0} isConnectable={true} />;
  }

  const lift = groundedLift(data);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const full = clamp((zoom - 0.36) / 0.24);
  const label = clamp((zoom - 0.16) / 0.12);
  const unfold = clamp((zoom - 1.05) / 0.35);
  const extras = TYPE_INFO[data.kind].fields.filter(
    (f) => f.key !== "status" && f.key !== "dueDate" && data.meta[f.key],
  );
  const Icon = TYPE_ICON[data.kind];
  const customHex = isCustomColor(data.color) ? data.color : undefined;
  const custom = customHex !== undefined;
  const ink = customHex ? paperInk(customHex) : undefined;
  const color = custom
    ? `color-mix(in oklab, ${TYPE_COLOR[data.kind]} 60%, ${ink})`
    : TYPE_COLOR[data.kind];
  const tall = data.kind === "note";
  const status = data.meta["status"];
  const due = data.meta["dueDate"];
  const lenses = data.lenses ?? { scarcity: 0, difficulty: 0, risk: 0 };
  const lensed = LENSES.some((l) => lenses[l]);
  const riskPulse = lenses.risk >= 3;
  const source = data.meta["source"];
  const sourceIsUrl = isUrl(source);
  
  const isOmission = data.kind === "omission";

  return (
    <div
      className={cn(
        "tw-card group relative h-full w-[272px] rounded-[2px] bg-card text-card-foreground",
        tall && "tw-tall",
        lift >= 0.6 && "is-floating",
        lift === 0 && "is-grounded",
        selected && "is-focus-ring",
        linkAnchor && "is-link-anchor",
        selected && "is-selected",
        landed && "is-landed",
        data.meta["reviewRequired"] && "is-fault",
        ["fact", "evidence"].includes(data.epistemic) && "is-grounded-evidence",
        ["assumption", "hypothesis", "unknown"].includes(data.epistemic) && "is-uncertain",
        riskPulse && "is-risk-pulse",
      )}
      style={{
        ["--note-height" as string]: `${noteHeight}px`,
        ["--card-tint" as string]: color,
        ["--lift" as string]: lift,
        ["--z" as string]: zoom,
        ["--full" as string]: full,
        ["--label" as string]: label,
        ["--unfold" as string]: unfold,
        perspective: "1200px",
        ...(custom && !isOmission
          ? {
              ["--paper-tone" as string]: data.color,
              ["--paper-ink" as string]: ink,
              ["--paper-muted" as string]: `color-mix(in oklab, ${ink} 62%, ${data.color})`,
            }
          : {}),
        ...(isOmission ? {
          border: "2px dashed var(--type-omission)",
          background: "linear-gradient(to bottom right, #FFFFFF, color-mix(in oklab, var(--accent-ink) 7%, #FFFFFF))",
        } : {})
      }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        
        e.currentTarget.style.setProperty("--hx", `${px * 100}%`);
        e.currentTarget.style.setProperty("--hy", `${py * 100}%`);
        
        // 3D Tilt: Cranked up to 15 degrees for maximum physical feel
        e.currentTarget.style.setProperty("--rx", `${(py - 0.5) * -15}deg`);
        e.currentTarget.style.setProperty("--ry", `${(px - 0.5) * 15}deg`);
        e.currentTarget.style.setProperty("--near", "1");
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
        e.currentTarget.style.setProperty("--near", "0");
      }}
      data-lift={lift}
      data-paper={custom && !isOmission ? "custom" : paperColor(data.color)}
    >
      {data.kind === "note" && (
        <Button
          variant="ghost"
          type="button"
          className="tw-note-grip nodrag nopan"
          aria-label="Drag to make the note longer"
          title="Drag to make the note longer"
          onPointerDown={(e) => {
            if (e.button !== 0 || useThread.getState().replayIndex !== null) return;
            e.stopPropagation();
            e.preventDefault();
            const startY = e.clientY;
            const startH = noteHeight;
            const z = zoom || 1;
            let last = startH;
            const grip = e.currentTarget;
            grip.setPointerCapture(e.pointerId);
            const apply = (resizing: boolean) =>
              useThread.getState().onNodesChange([
                {
                  id,
                  type: "dimensions",
                  dimensions: { width: 272, height: last },
                  resizing,
                  setAttributes: true,
                },
              ]);
            const onMove = (ev: PointerEvent) => {
              last = resizedNoteHeight(startH, ev.clientY - startY, z);
              apply(true);
            };
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
              window.removeEventListener("pointercancel", onUp);
              if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
              apply(false);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp, { once: true });
            window.addEventListener("pointercancel", onUp, { once: true });
          }}
        >
          <span className="tw-note-grip-pill" aria-hidden />
        </Button>
      )}
      {lift >= 0.6 && !isOmission && <span className="tw-deckle" aria-hidden />}
      <Handle type="target" position={Position.Left} className="tw-handle" />
      {data.meta["reactions"] && (
        <div className="tw-reaction-stamps" aria-label="Card reactions">
          {Object.entries(readReactions(data.meta["reactions"]))
            .filter(([, count]) => count > 0)
            .map(([stamp, count]) => (
              <span key={stamp} title={stamp}>
                {(
                  { agree: "✓", challenge: "?", important: "!", celebrate: "★" } as Record<
                    string,
                    string
                  >
                )[stamp] ?? stamp}{" "}
                {count}
              </span>
            ))}
        </div>
      )}
      <div className="tw-full px-4 pb-3.5 pt-3" aria-hidden={full === 0}>
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5" style={{ color }}>
            <Icon className="h-3 w-3" strokeWidth={2} />
            {TYPE_INFO[data.kind].label}
          </span>
          <span
            className="flex items-center gap-1 text-muted-foreground"
            title={`Epistemic status: ${data.epistemic}`}
          >
            <EpistemicGlyph status={data.epistemic} className="text-[color:var(--accent-ink)]" />
            {data.epistemic}
          </span>
        </div>
        <div
          className={cn(
            "font-display text-[17px] leading-[1.25]",
            status && STATUS_DONE.has(status) && "text-muted-foreground",
            isOmission && "text-[color:var(--type-omission)] font-bold"
          )}
        >
          {data.title}
        </div>
        {data.body && (
          <p
            tabIndex={tall ? 0 : undefined}
            role={tall ? "region" : undefined}
            aria-label={tall ? `Note text: ${data.title}` : undefined}
            style={tall ? undefined : { WebkitLineClamp: unfold > 0.3 ? 24 : 3 }}
            className={cn(
              "tw-body mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground",
              tall && "nodrag nopan nowheel",
              isOmission && "text-[color:var(--type-omission)] opacity-80"
            )}
            onClick={tall ? (e) => e.stopPropagation() : undefined}
          >
            {data.body}
          </p>
        )}
        {data.kind === "portal" && data.meta["childCanvasId"] && (
          <Button
            variant="ghost"
            size="sm"
            className="nodrag nopan mt-3 w-full justify-between border-t"
            disabled={useThread.getState().replayIndex !== null}
            onClick={(e) => {
              e.stopPropagation();
              useWorkspaces.getState().switchCanvas(data.meta["childCanvasId"] ?? "");
            }}
          >
            Open canvas
            <ArrowUpRight />
          </Button>
        )}
        {data.kind === "note" && sourceIsUrl && (
          <a
            className="nodrag nopan mt-2 block truncate font-mono text-[10px] text-accent-ink underline"
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {data.meta["sourceTitle"] || source}
          </a>
        )}
        {source && !sourceIsUrl && (
          <button
            type="button"
            className="nodrag nopan mt-2 inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              focusInLab(source);
            }}
          >
            <ArrowUpRight className="h-2.5 w-2.5" /> Return to Lab
          </button>
        )}
        {extras.length > 0 && (
          <div className="tw-unfold" aria-hidden={unfold === 0}>
            <dl className="mt-2.5 space-y-1.5 border-l-2 pl-2.5" style={{ borderColor: color }}>
              {extras.map((f) => (
                <div key={f.key}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd
                    className={cn(
                      "text-[12px] leading-snug",
                      (f.key === "excerpt" || f.key === "answer") && "font-display italic",
                    )}
                  >
                    {f.key === "excerpt" ? `“${data.meta[f.key]}”` : data.meta[f.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {data.meta["reviewRequired"] && (
          <p className="mt-2 font-mono text-[10px] text-accent-ink">Review · invalidated premise</p>
        )}
        {(data.meta["affinity"] || data.meta["votes"]) && (
          <div className="mt-2 flex flex-wrap justify-between gap-2 border-t pt-2 font-mono text-[10px] text-muted-foreground">
            <span>{data.meta["affinity"]}</span>
            {data.meta["votes"] && <span>{data.meta["votes"]} dots</span>}
          </div>
        )}
        {(status || lensed || due) && (
          <div className="mt-3 flex items-center justify-between border-t border-dashed pt-2.5">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {status && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {status}
                </span>
              )}
              {due && <span>due {due.slice(5)}</span>}
            </span>
            {lensed && (
              <span className="flex items-end gap-2">
                {LENSES.map((l) => (
                  <span
                    key={l}
                    className="flex items-end gap-1"
                    title={`${l}: ${["not assessed", "low", "medium", "high"][lenses[l]]}`}
                  >
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {l[0]}
                    </span>
                    <span className="flex items-end gap-[2px]">
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="w-[3px] rounded-[1px]"
                          style={{
                            height: 3 + i * 3,
                            background:
                              i <= lenses[l]
                                ? (ink ?? "var(--foreground)")
                                : custom
                                  ? "var(--paper-muted)"
                                  : "var(--border-strong)",
                          }}
                        />
                      ))}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
      </div>
      <div
        className="tw-compact"
        aria-hidden={full === 1}
        title={`${data.title} · ${data.epistemic}`}
      >
        <span className="tw-seal" style={{ color }}>
          <EpistemicGlyph status={data.epistemic} className="h-full w-full" />
        </span>
        <span className="tw-compact-text">
          <span className={cn("block truncate font-display text-xl leading-tight", isOmission && "text-[color:var(--type-omission)]")}>{data.title}</span>
          <span className="tw-pill font-mono text-[10px] uppercase tracking-[0.12em]">
            {status ?? data.epistemic}
          </span>
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="tw-handle" />
    </div>
  );
}