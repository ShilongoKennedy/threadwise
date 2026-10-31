import { useMemo, useState } from "react";
import {
  Crosshair,
  Eye,
  FileWarning,
  GitCompare,
  Loader2,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NoteKind = "contradiction" | "fallacy" | "motive";

type Note = {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
};

/** A run of speech text, optionally bound to the note it triggered. */
type Segment = { text: string; noteId?: string };

type Radar = {
  bias: number;
  omission: number;
  urgency: number;
  motive: number;
  evidence: number;
};

type Doc = {
  id: string;
  label: string;
  date: string;
  source: string;
  paragraphs: Segment[][];
  summary: string;
  friction: number;
  radar: Radar;
  notes: Note[];
};

const AXES: { key: keyof Radar; label: string; angle: number }[] = [
  { key: "bias", label: "BIAS", angle: -90 },
  { key: "omission", label: "OMISSION", angle: -18 },
  { key: "urgency", label: "URGENCY", angle: 54 },
  { key: "motive", label: "MOTIVE", angle: 126 },
  { key: "evidence", label: "EVIDENCE", angle: 198 },
];

const NOTE_STYLE: Record<NoteKind, { label: string; ink: string; Icon: typeof ShieldAlert }> = {
  contradiction: { label: "Contradiction", ink: "var(--accent-ink)", Icon: ShieldAlert },
  fallacy: { label: "Fallacy", ink: "#1A1A1A", Icon: FileWarning },
  motive: { label: "Motive", ink: "#5B6B8C", Icon: Eye },
};

const DOCS: Doc[] = [
  {
    id: "doc1",
    label: "Al Jazeera 1",
    date: "Oct 2026",
    source: "Transcript · 00:12:40",
    paragraphs: [
      [
        {
          text: "\u201cI was in a country somewhere in the Middle East\u2026 and the people said, we took our gold out of the vaults in New York City. You know what I said to him? ",
        },
        {
          text: "I said, you have three armies within 400 miles who can come take your gold.",
          noteId: "n1",
        },
        { text: "\u201d" },
      ],
      [
        {
          text: "\u201cThat\u2019s the real world. You\u2019re not thinking clearly about safety. ",
        },
        {
          text: "That gold is protected by the Atlantic, the Pacific, the United States military, the rule of law.",
          noteId: "n2",
        },
        { text: "\u201d" },
      ],
    ],
    summary:
      "The speaker is not arguing about gold; he is pricing the cost of defiance. Two sentences of reassurance are bracketed by an explicit inventory of force \u2014 three armies within 400 miles \u2014 and a claim to the Atlantic and the Pacific as if they were collateral. The structure converts a custodial relationship into a protection racket: safety is offered and threatened in the same breath. What is never stated is who authorised the threat, or what \u201ctake your gold\u201d would actually cost.",
    friction: 85,
    radar: { bias: 74, omission: 62, urgency: 58, motive: 88, evidence: 34 },
    notes: [
      {
        id: "n1",
        kind: "fallacy",
        title: "Appeal to Force",
        body: "Threat of three armies is offered as an argument for leaving the gold where it is.",
      },
      {
        id: "n2",
        kind: "contradiction",
        title: "Rule of Law vs. Force",
        body: "Citing the rule of law in the same breath as implicit force reveals a protection-racket logic.",
      },
    ],
  },
  {
    id: "doc2",
    label: "Reuters Brief",
    date: "Oct 2026",
    source: "Ministerial briefing · 3 paragraphs",
    paragraphs: [
      [
        {
          text: "\u201cThe minister emphasized that economic stability relies on diversified trade routes. ",
        },
        {
          text: "We cannot rely on a single reserve currency.",
          noteId: "n3",
        },
        { text: "\u201d" },
      ],
      [
        {
          text: "\u201cSettlement volumes are expected to normalise over the next two quarters, ",
        },
        {
          text: "though the counterparties involved were not disclosed.",
          noteId: "n4",
        },
        { text: "\u201d" },
      ],
    ],
    summary:
      "The minister\u2019s case rests on diversification, but the sentence carrying the argument is a negative definition: we cannot rely on a single reserve currency. That framing implies a plan without naming one, and relocates the risk entirely outside the country. The second paragraph quietly withdraws even that much \u2014 settlement volumes will \u201cnormalise\u201d, while the counterparties, the only checkable fact in the passage, go undisclosed.",
    friction: 42,
    radar: { bias: 45, omission: 71, urgency: 32, motive: 55, evidence: 40 },
    notes: [
      {
        id: "n3",
        kind: "motive",
        title: "Strategic Ambiguity",
        body: "A negative definition signals intent without committing to a policy anyone can audit.",
      },
      {
        id: "n4",
        kind: "contradiction",
        title: "Undisclosed Counterparties",
        body: "The settlement partners are the only verifiable claim in the paragraph, and they are withheld.",
      },
    ],
  },
  {
    id: "doc3",
    label: "US Treasury",
    date: "Nov 2026",
    source: "Public statement · 210 words",
    paragraphs: [
      [
        {
          text: "\u201cOfficial statements confirm the transfer of assets was completed under standard regulatory frameworks. ",
        },
        {
          text: "No anomalies detected in the ledger.",
          noteId: "n5",
        },
        { text: "\u201d" },
      ],
      [
        { text: "\u201c" },
        {
          text: "The review was conducted by the relevant authorities.",
          noteId: "n6",
        },
        { text: " No further comment was provided.\u201d" },
      ],
    ],
    summary:
      "This is reassurance written entirely in the passive voice. Assets moved, frameworks were followed, and the ledger reports no anomalies \u2014 but no actor, auditor, or date is named. \u201cNo anomalies detected\u201d is unfalsifiable without the detection method, and the review is delegated to \u201cthe relevant authorities\u201d without identifying them. The document can therefore be cited as proof of compliance while containing almost no verifiable claim.",
    friction: 71,
    radar: { bias: 38, omission: 68, urgency: 22, motive: 72, evidence: 26 },
    notes: [
      {
        id: "n5",
        kind: "contradiction",
        title: "Unfalsifiable Assurance",
        body: "A clean ledger means nothing until the detection method and the auditor are named.",
      },
      {
        id: "n6",
        kind: "fallacy",
        title: "Passive Voice as Shield",
        body: "\u201cWas completed\u201d and \u201cwas conducted\u201d remove every accountable subject from the sentence.",
      },
    ],
  },
];

function pointsFor(radar: Radar, reach: number) {
  return AXES.map((axis) => {
    const value = Math.max(6, Math.min(100, radar[axis.key]));
    const radius = (value / 100) * reach;
    const radians = (axis.angle * Math.PI) / 180;
    return `${50 + Math.cos(radians) * radius},${50 + Math.sin(radians) * radius}`;
  }).join(" ");
}

function ring(reach: number) {
  return AXES.map((axis) => {
    const radians = (axis.angle * Math.PI) / 180;
    return `${50 + Math.cos(radians) * reach},${50 + Math.sin(radians) * reach}`;
  }).join(" ");
}

export function InteractiveLaptop() {
  const [activeDoc, setActiveDoc] = useState(DOCS[0]?.id ?? "doc1");
  const [activeTab, setActiveTab] = useState<"workbench" | "diff">("workbench");
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(DOCS[0]?.notes[0]?.id ?? null);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);

  const doc = useMemo(() => DOCS.find((d) => d.id === activeDoc) ?? DOCS[0], [activeDoc]);
  const active = hovered ?? pinned;

  const selectDoc = (id: string) => {
    setActiveDoc(id);
    const next = DOCS.find((d) => d.id === id);
    setPinned(next?.notes[0]?.id ?? null);
    setHovered(null);
    setHasRun(true);
  };

  const runAnalysis = () => {
    if (running) return;
    setRunning(true);
    setHasRun(false);
    setHovered(null);
    window.setTimeout(() => {
      setRunning(false);
      setHasRun(true);
    }, 1600);
  };

  if (!doc) return null;

  const showResults = hasRun && !running;
  const activeNote = doc.notes.find((n) => n.id === active);
  const compareDoc = DOCS.find((d) => d.id !== doc.id) ?? doc;
  const divergence = Math.min(100, Math.abs(doc.friction - compareDoc.friction) + 40);
  const firstQuote = doc.paragraphs.flat().find((s) => s.noteId)?.text ?? "";
  const secondQuote = compareDoc.paragraphs.flat().find((s) => s.noteId)?.text ?? "";

  return (
    <div className="flex h-full w-full bg-[#FDFBF7] text-[#1A1A1A]">
      {/* ── Corpus rail ─────────────────────────────────────────── */}
      <aside className="flex h-full w-[17%] shrink-0 flex-col border-r-2 border-[#1A1A1A]/15 bg-[#FDFBF7] p-2.5">
        <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">
          <span className="h-1.5 w-1.5 bg-[#1A4BFF]" />
          Corpus · {DOCS.length}
        </div>
        <div className="space-y-1.5">
          {DOCS.map((item) => {
            const selected = item.id === doc.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectDoc(item.id)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full flex-col gap-0.5 border px-2 py-1.5 text-left transition-colors",
                  selected
                    ? "border-[#1A4BFF] bg-white"
                    : "border-transparent bg-[#1A1A1A]/[0.04] hover:border-[#1A1A1A]/20 hover:bg-white",
                )}
              >
                <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-[#1A1A1A]/40">
                  {item.date}
                </span>
                <span
                  className={cn(
                    "truncate font-mono text-[8px] uppercase tracking-[0.08em]",
                    selected ? "font-bold text-[#1A1A1A]" : "text-[#1A1A1A]/60",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-dashed border-[#1A1A1A]/20 pt-2 font-mono text-[6px] uppercase leading-relaxed tracking-[0.16em] text-[#1A1A1A]/35">
          {doc.source}
        </div>
      </aside>

      {/* ── Workspace ───────────────────────────────────────────── */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="flex h-8 shrink-0 items-center gap-3 border-b-2 border-[#1A1A1A]/15 bg-white px-3">
          {(
            [
              ["workbench", "Forensic Workbench"],
              ["diff", "Text Diff"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              aria-pressed={activeTab === key}
              className={cn(
                "h-full border-b-2 px-0.5 font-mono text-[7px] uppercase tracking-[0.18em] transition-colors",
                activeTab === key
                  ? "border-[#1A4BFF] font-bold text-[#1A1A1A]"
                  : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70",
              )}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto font-mono text-[6px] uppercase tracking-[0.18em] text-[#1A1A1A]/30">
            {activeTab === "diff" ? `Divergence ${divergence}` : "Live"}
          </span>
        </div>

        {activeTab === "workbench" ? (
          <div className="flex min-h-0 flex-1">
            {/* Source text — warm paper */}
            <div className="relative min-h-0 w-1/2 overflow-hidden border-r-2 border-[#1A1A1A]/15 bg-[#FDFBF7] px-5 py-4">
              <div className="mb-3 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#1A4BFF]">
                <Crosshair className="h-3 w-3" strokeWidth={2.5} />
                Source · {doc.label}
              </div>

              <div className="font-display text-[10.5px] leading-[1.85] text-[#1A1A1A]/85">
                {doc.paragraphs.map((paragraph, pi) => (
                  <p key={pi} className="mb-2.5">
                    {paragraph.map((segment, si) => {
                      const bound = segment.noteId;
                      const hot = bound !== undefined && bound === active;
                      if (!bound) return <span key={si}>{segment.text}</span>;
                      return (
                        <mark
                          key={si}
                          onMouseEnter={() => setHovered(bound)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => setPinned(bound)}
                          className={cn(
                            "cursor-pointer bg-transparent px-0.5 text-inherit transition-colors duration-150",
                            "border-b-2",
                            hot
                              ? "border-[#1A4BFF] bg-[#1A4BFF]/15"
                              : "border-[#1A4BFF]/30 hover:bg-[#1A4BFF]/[0.07]",
                          )}
                        >
                          {segment.text}
                        </mark>
                      );
                    })}
                  </p>
                ))}
              </div>

              {running && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-[#FDFBF7]/55" />
                  <div className="tw-scanline" />
                </div>
              )}
            </div>

            {/* Analyst margin — stark white */}
            <div className="flex min-h-0 w-1/2 flex-col bg-white px-4 py-3">
              {/* The switch */}
              <button
                type="button"
                onClick={runAnalysis}
                aria-pressed={running}
                className={cn(
                  "group relative flex w-full items-center justify-between gap-2 border-2 border-[#1A1A1A] px-2.5 py-2",
                  "font-mono text-[7.5px] font-bold uppercase tracking-[0.2em] transition-all duration-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A4BFF]",
                  running
                    ? "cursor-wait bg-[#1A1A1A] text-white"
                    : "bg-[#1A4BFF] text-white shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#1740ee] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#1A1A1A]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5",
                      running ? "animate-pulse bg-[#1A4BFF]" : "bg-white",
                    )}
                  />
                  {running ? "Running analysis" : "Run Forensic Analysis"}
                </span>
                {running ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hasRun ? (
                  <RotateCcw className="h-3 w-3 opacity-80" />
                ) : (
                  <span className="h-3 w-3" />
                )}
              </button>

              {running && (
                <div className="mt-3 space-y-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-[#1A1A1A]/50">
                  <p className="text-[#1A4BFF]">› Segmenting claims…</p>
                  <p>› Scoring narrative axes…</p>
                  <p>› Locating omissions…</p>
                </div>
              )}

              {showResults && (
                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
                  {/* Metrics */}
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col border border-[#1A1A1A]/15 bg-[#FDFBF7] p-1.5">
                      <span className="font-mono text-[6px] uppercase tracking-[0.18em] text-[#1A1A1A]/45">
                        Narrative profile
                      </span>
                      <svg
                        viewBox="0 0 100 100"
                        className="mx-auto mt-0.5 h-[62px] w-[62px] overflow-visible"
                        role="img"
                        aria-label={`Narrative profile for ${doc.label}`}
                      >
                        {[34, 23, 12].map((reach) => (
                          <polygon
                            key={reach}
                            points={ring(reach)}
                            fill="none"
                            stroke="#1A1A1A"
                            strokeOpacity={0.12}
                            strokeWidth={0.6}
                          />
                        ))}
                        {AXES.map((axis) => {
                          const radians = (axis.angle * Math.PI) / 180;
                          return (
                            <line
                              key={axis.key}
                              x1={50}
                              y1={50}
                              x2={50 + Math.cos(radians) * 34}
                              y2={50 + Math.sin(radians) * 34}
                              stroke="#1A1A1A"
                              strokeOpacity={0.12}
                              strokeWidth={0.6}
                            />
                          );
                        })}
                        <polygon
                          points={pointsFor(doc.radar, 34)}
                          fill="#1A4BFF"
                          fillOpacity={0.14}
                          stroke="#1A4BFF"
                          strokeWidth={1.6}
                          strokeLinejoin="miter"
                        />
                        {AXES.map((axis) => {
                          const radians = (axis.angle * Math.PI) / 180;
                          const x = 50 + Math.cos(radians) * 45;
                          const y = 50 + Math.sin(radians) * 45;
                          const cos = Math.cos(radians);
                          return (
                            <text
                              key={axis.key}
                              x={x}
                              y={y}
                              fill="#1A1A1A"
                              fillOpacity={0.55}
                              fontSize={5}
                              fontWeight={700}
                              fontFamily="JetBrains Mono, monospace"
                              letterSpacing={0.3}
                              textAnchor={cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle"}
                              dominantBaseline={Math.sin(radians) > 0.5 ? "hanging" : "auto"}
                            >
                              {axis.label}
                            </text>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex w-[76px] flex-col justify-between border border-[#1A1A1A]/15 bg-[#FDFBF7] p-1.5">
                      <span className="font-mono text-[6px] uppercase tracking-[0.18em] text-[#1A1A1A]/45">
                        Friction
                      </span>
                      <div className="text-center">
                        <div className="font-display text-[26px] leading-none text-[#1A4BFF]">
                          {doc.friction}
                        </div>
                        <div className="font-mono text-[6px] tracking-[0.16em] text-[#1A1A1A]/35">
                          /100
                        </div>
                      </div>
                      <div className="flex h-1 w-full gap-[2px]">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-full flex-1",
                              i * 10 < doc.friction ? "bg-[#1A4BFF]" : "bg-[#1A1A1A]/10",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-l-4 border-[#1A4BFF] bg-[#FDFBF7] py-1.5 pl-2 pr-1.5">
                    <span className="mb-0.5 block font-mono text-[6px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
                      Executive summary
                    </span>
                    <p className="text-[8px] leading-[1.5] text-[#1A1A1A]/80">{doc.summary}</p>
                  </div>

                  {/* Notes */}
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                    {doc.notes.map((note) => {
                      const meta = NOTE_STYLE[note.kind];
                      const hot = note.id === active;
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onMouseEnter={() => setHovered(note.id)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(note.id)}
                          onBlur={() => setHovered(null)}
                          onClick={() => setPinned(note.id)}
                          aria-pressed={hot}
                          className={cn(
                            "block w-full border bg-white p-1.5 text-left transition-colors duration-150",
                            hot
                              ? "border-[#1A4BFF] bg-[#1A4BFF]/[0.04]"
                              : "border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35",
                          )}
                        >
                          <div className="mb-1 flex items-center gap-1.5">
                            <meta.Icon
                              className="h-2.5 w-2.5"
                              strokeWidth={2.5}
                              style={{ color: meta.ink }}
                            />
                            <span className="font-mono text-[6px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/50">
                              {meta.label}
                            </span>
                            {hot && (
                              <span className="ml-auto font-mono text-[6px] uppercase tracking-[0.18em] text-[#1A4BFF]">
                                linked
                              </span>
                            )}
                          </div>
                          <b className="block font-display text-[9.5px] leading-tight text-[#1A1A1A]">
                            {note.title}
                          </b>
                          <p className="mt-0.5 text-[7.5px] leading-[1.45] text-[#1A1A1A]/55">
                            {note.body}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <p className="border-t border-dashed border-[#1A1A1A]/20 pt-1 text-center font-mono text-[6px] uppercase tracking-[0.16em] text-[#1A1A1A]/35">
                    {activeNote ? `Linked to “${activeNote.title}”` : "Hover a note to trace it"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col bg-[#FDFBF7] p-4">
            <div className="mb-3 flex items-center gap-2 border-b-2 border-[#1A1A1A] pb-2">
              <GitCompare className="h-3.5 w-3.5 text-[#1A4BFF]" />
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em]">
                Comparative analysis
              </span>
              <span className="ml-auto font-mono text-[7px] uppercase tracking-[0.16em] text-[#1A1A1A]/40">
                Divergence {divergence}/100
              </span>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
              {[
                { key: "A", doc, quote: firstQuote },
                { key: "B", doc: compareDoc, quote: secondQuote },
              ].map((side) => (
                <div key={side.key} className="flex flex-col border border-[#1A1A1A]/15 bg-white p-3">
                  <span className="mb-2 block font-mono text-[7px] uppercase tracking-[0.18em] text-[#1A1A1A]/45">
                    Source {side.key} · {side.doc.label}
                  </span>
                  <p className="font-display text-[10px] leading-[1.7] text-[#1A1A1A]/85">
                    “{side.quote}”
                  </p>
                  <div className="mt-auto flex items-end justify-between border-t border-dashed border-[#1A1A1A]/20 pt-2">
                    <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-[#1A1A1A]/40">
                      Friction
                    </span>
                    <span className="font-display text-lg leading-none text-[#1A4BFF]">
                      {side.doc.friction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
