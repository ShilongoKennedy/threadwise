import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Highlighter, Trash2, X } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";

export const Route = createFileRoute("/lab/paper")({
  head: () => ({
    meta: [
      { title: "Paper reading — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaperLab,
});

type MarginEntry = {
  term: string;
  plain: string;
  deeper: string;
  watch: string;
};

type MarginNoteState = {
  phrase: string;
  left: number;
  top: number;
  kind: "recommended" | "manual";
  data?: MarginEntry;
  loading?: boolean;
  error?: string;
};

const MARGIN_NOTES: Record<string, MarginEntry> = {
  "planning and scenario work": {
    term: "Planning ≠ operation",
    plain: "Planning can mean exploring a menu of options. It does not mean one option has been chosen, funded or scheduled.",
    deeper: "Intelligence reporting often describes capability and contingency work. The same sentence can be alarming in a headline and unremarkable in a briefing.",
    watch: "Look for language that moves from “options” to “ordered”, “approved” or “underway”.",
  },
  "no credible, immediate threat": {
    term: "The official brake",
    plain: "This is an official assessment that no immediate attack is currently judged credible. It qualifies the reporting; it does not erase it.",
    deeper: "The sentence is doing two jobs at once: calming the public and preserving the possibility of a future threat. Read both halves.",
    watch: "Whether later official language changes the level of immediacy, or only repeats the same formula.",
  },
  "asymmetric options": {
    term: "Asymmetric pressure",
    plain: "A weaker actor avoids a direct fight and uses unconventional, cheaper or harder-to-attribute pressure instead.",
    deeper: "The term describes a strategic logic, not a specific plot. It tells you what kind of action might be considered and what the actor is trying to signal.",
    watch: "A move from general asymmetric options to a named capability, target or timeline.",
  },
  "political and diplomatic signal": {
    term: "A signal, not an attack",
    plain: "The timing may be meant to influence negotiations, domestic politics or alliance behaviour.",
    deeper: "Signals can be real and consequential without being operational plans. The question is who is meant to receive the message and what they are expected to do.",
    watch: "Whether the timing aligns with a negotiation, a vote, a visit or a public dispute.",
  },
  directive: {
    term: "Directive",
    plain: "A decision or instruction. Something has been authorised or ordered.",
    deeper: "This is a much higher evidentiary rung than “exploring options”. It requires evidence of an order, not just a capability.",
    watch: "A named decision-maker, an approval date, a funding line or a movement order.",
  },
  exploratory: {
    term: "Exploratory",
    plain: "A range of possibilities is being examined. No single course has necessarily been chosen.",
    deeper: "Exploratory planning is still planning. It can be serious without being imminent, and it can be designed to create leverage rather than to be executed.",
    watch: "Whether the reporting describes one selected option or several open ones.",
  },
};

function PaperHighlight({ phrase, active, onOpen }: { phrase: string; active: boolean; onOpen: (phrase: string, target: HTMLElement) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(phrase, event.currentTarget)}
      className={`paper-highlight ${active ? "is-active" : ""}`}
      aria-expanded={active}
      aria-label={`Open margin note: ${phrase}`}
    >
      {phrase}
    </button>
  );
}

const CONTENTS = [
  ["the-event", "The event"],
  ["the-disagreement", "The disagreement"],
  ["the-spin", "The spin"],
  ["the-reality", "The reality"],
  ["the-blind-spot", "The blind spot"],
  ["what-to-watch", "What to watch"],
  ["who-gains", "Who gains, who pays"],
  ["what-it-echoes", "What it echoes"],
  ["what-would-prove", "What would prove this wrong"],
  ["the-signals", "The signals"],
  ["what-this-rests-on", "What this rests on"],
] as const;

function PaperLab() {
  const [read, setRead] = useState<Set<string>>(new Set(["the-event", "the-disagreement", "the-spin", "the-reality"]));
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [note, setNote] = useState<MarginNoteState | null>(null);
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const manualRangesRef = useRef<Array<{ range: Range; text: string; context: string }>>([]);
  const noteRequestRef = useRef(0);
  const manualHighlightRef = useRef<{ add: (range: Range) => void; size?: number } | null>(null);
  const [manualCount, setManualCount] = useState(0);
  const [manualSupported, setManualSupported] = useState(false);
  const [selectionAction, setSelectionAction] = useState<{ left: number; top: number } | null>(null);

  const openNote = (phrase: string, target: HTMLElement) => {
    if (note?.phrase === phrase) {
      setNote(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 28);
    const left = Math.min(window.innerWidth - width - 14, Math.max(14, rect.right + 12));
    const top = Math.max(76, Math.min(window.innerHeight - 330, rect.top - 10));
    setNote({ phrase, left, top, kind: "recommended", data: MARGIN_NOTES[phrase] });
  };

  const openManualNote = async (hit: { range: Range; text: string; context: string }, x: number, y: number) => {
    if (note?.kind === "manual" && note.phrase === hit.text) {
      setNote(null);
      return;
    }
    const width = Math.min(360, window.innerWidth - 28);
    const left = Math.min(window.innerWidth - width - 14, Math.max(14, x + 18));
    const top = Math.max(76, Math.min(window.innerHeight - 330, y - 24));
    const requestId = noteRequestRef.current + 1;
    noteRequestRef.current = requestId;
    setNote({ phrase: hit.text, left, top, kind: "manual", loading: true });
    try {
      const response = await fetch("/api/paper-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: hit.text, context: hit.context }),
      });
      const body = (await response.json()) as { note?: MarginEntry; error?: string };
      if (noteRequestRef.current !== requestId) return;
      if (!response.ok || !body.note) throw new Error(body.error ?? "The note could not be written.");
      setNote((current) => current && current.kind === "manual" ? { ...current, data: body.note, loading: false } : current);
    } catch (caught) {
      if (noteRequestRef.current !== requestId) return;
      setNote((current) => current && current.kind === "manual" ? { ...current, loading: false, error: caught instanceof Error ? caught.message : "The note could not be written." } : current);
    }
  };

  const handlePaperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a")) return;
    const x = event.clientX;
    const y = event.clientY;
    const hit = manualRangesRef.current.find(({ range }) =>
      Array.from(range.getClientRects()).some((rect) => x >= rect.left - 1 && x <= rect.right + 1 && y >= rect.top - 1 && y <= rect.bottom + 1),
    );
    if (!hit) return;
    event.preventDefault();
    void openManualNote(hit, x, y);
  };

  useEffect(() => {
    if (!note) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNote(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".paper-margin-note") || target.closest(".paper-highlight")) return;
      setNote(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [note]);

  useEffect(() => {
    const HighlightCtor = (window as unknown as { Highlight?: new (...ranges: Range[]) => { add: (range: Range) => void; size?: number } }).Highlight;
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    setManualSupported(Boolean(HighlightCtor && registry));
    if (!HighlightCtor || !registry) return;
    manualHighlightRef.current = new HighlightCtor();
    registry.set("tw-manual", manualHighlightRef.current);
    return () => {
      registry.delete("tw-manual");
      manualHighlightRef.current = null;
    };
  }, []);

  useEffect(() => {
    const readSelection = () => {
      if (!manualSupported) return;
      const selection = window.getSelection();
      const root = sheetContentRef.current;
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !root) {
        setSelectionAction(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        setSelectionAction(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        setSelectionAction(null);
        return;
      }
      setSelectionAction({
        left: Math.max(16, Math.min(window.innerWidth - 132, rect.left + rect.width / 2 - 44)),
        top: Math.max(70, rect.top - 42),
      });
    };
    const hide = () => setSelectionAction(null);
    document.addEventListener("mouseup", readSelection);
    document.addEventListener("keyup", readSelection);
    document.addEventListener("selectionchange", readSelection);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("mouseup", readSelection);
      document.removeEventListener("keyup", readSelection);
      document.removeEventListener("selectionchange", readSelection);
      window.removeEventListener("scroll", hide);
    };
  }, [manualSupported]);

  const addManualHighlight = () => {
    const selection = window.getSelection();
    const root = sheetContentRef.current;
    const highlight = manualHighlightRef.current;
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !root || !highlight) return;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const clone = range.cloneRange();
    const start = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as Element)
      : range.startContainer.parentElement;
    const context = start?.closest("p, li, blockquote")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    highlight.add(clone);
    manualRangesRef.current.push({ range: clone, text: range.toString().replace(/\s+/g, " ").trim(), context });
    setManualCount((count) => count + 1);
    selection.removeAllRanges();
    setSelectionAction(null);
  };

  const clearManualHighlights = () => {
    const HighlightCtor = (window as unknown as { Highlight?: new () => { add: (range: Range) => void } }).Highlight;
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    if (!HighlightCtor || !registry) return;
    manualHighlightRef.current = new HighlightCtor();
    registry.set("tw-manual", manualHighlightRef.current);
    manualRangesRef.current = [];
    setManualCount(0);
    setNote(null);
  };

  const toggleRead = (id: string) => {
    setRead((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="paper-lab min-h-[100dvh]">
      <AppHeader section="analyst" />
      <main className="paper-lab__main">
        <aside className="paper-contents">
          <p className="paper-contents__label">Contents</p>
          <p className="paper-contents__count">{read.size} / {CONTENTS.length} read</p>
          <div className="paper-contents__bar"><span style={{ width: `${(read.size / CONTENTS.length) * 100}%` }} /></div>
          <ol>
            {CONTENTS.map(([id, label], index) => (
              <li key={id}>
                <button type="button" onClick={() => toggleRead(id)} className={`paper-contents__check ${read.has(id) ? "is-read" : ""}`} aria-label={`Mark ${label} as read`}>
                  {read.has(id) ? <Check className="h-3 w-3" /> : null}
                </button>
                <a href={`#${id}`} className={read.has(id) ? "is-read" : ""}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <div className="paper-contents__foot">
            <p>Paper prototype</p>
            <span>11 sections · one sheet</span>
            {manualSupported && manualCount > 0 ? (
              <button type="button" onClick={clearManualHighlights} className="paper-contents__clear">
                <Trash2 className="h-2.5 w-2.5" /> Clear {manualCount === 1 ? "my highlight" : `${manualCount} highlights`}
              </button>
            ) : null}
            <Link to="/seminar">← Live Seminar</Link>
          </div>
        </aside>

        <article className="paper-sheet">
          <div className="paper-spiral" aria-hidden="true">
            {Array.from({ length: 80 }).map((_, index) => <span key={index} />)}
          </div>
          <div className="paper-sheet__content" ref={sheetContentRef} onClick={handlePaperClick}>
            <header className="paper-head">
              <p className="paper-kicker">The read · field note 001</p>
              <h1>Analysis: US intel on Iran — a dirty bomb plot?</h1>
              <p className="paper-draft">Draft — 17 Nov 2026</p>
            </header>

            <section id="the-event">
              <h2><span>1.</span> What we know <em>(high confidence)</em></h2>
              <ul>
                <li>Seven US officials told CNN that US intelligence indicates Iran is planning options that could include a dirty bomb or chemical attack in Washington.</li>
                <li>The sources frame this as <PaperHighlight phrase="planning and scenario work" active={note?.phrase === "planning and scenario work"} onOpen={openNote} />, not an imminent attack.</li>
                <li>The White House says there is <PaperHighlight phrase="no credible, immediate threat" active={note?.phrase === "no credible, immediate threat"} onOpen={openNote} /> to the homeland.</li>
              </ul>
              <p className="paper-note">Note: the same reporting contains its own brake. Keep both halves.</p>
            </section>

            <section id="the-disagreement">
              <h2><span>2.</span> The disagreement</h2>
              <p>The fight is not “is Iran dangerous?” The fight is what this reporting actually establishes.</p>
              <div className="paper-two">
                <p><strong>Reading A</strong> — planning options is normal coercive signalling. The leak is the story, not the plot.</p>
                <p><strong>Reading B</strong> — a named Washington target changes the threshold. Even contingency planning requires a response.</p>
              </div>
            </section>

            <section id="the-spin">
              <h2><span>3.</span> The spin</h2>
              <p>The headline compresses “options,” “planning” and “attack” into one word. That compression is doing more work than the intelligence.</p>
              <p className="paper-note">A leak is also a move. Ask who chose the word “plot”.</p>
            </section>

            <section id="the-reality">
              <h2><span>4.</span> The reality</h2>
              <p>What is actually established: unnamed officials describe intelligence assessments, and the White House denies an immediate threat. What is not established: that an operation is ordered, funded, or close.</p>
            </section>

            <section id="the-blind-spot">
              <h2><span>5.</span> The blind spot</h2>
              <p>We have not seen the underlying intelligence. We do not know whether the planning is <PaperHighlight phrase="directive" active={note?.phrase === "directive"} onOpen={openNote} /> (a decision) or <PaperHighlight phrase="exploratory" active={note?.phrase === "exploratory"} onOpen={openNote} /> (a range of options). The credibility and independence of the sources cannot be fully verified.</p>
            </section>

            <section id="what-to-watch">
              <h2><span>6.</span> What it suggests</h2>
              <ul>
                <li>Iran appears to be exploring <PaperHighlight phrase="asymmetric options" active={note?.phrase === "asymmetric options"} onOpen={openNote} /> to increase pressure on the US.</li>
                <li>The timing suggests a <PaperHighlight phrase="political and diplomatic signal" active={note?.phrase === "political and diplomatic signal"} onOpen={openNote} />, not a ready operation.</li>
                <li>The leak itself may be part of a pressure strategy by the US administration.</li>
              </ul>
            </section>

            <section id="who-gains">
              <h2><span>7.</span> Who gains, who pays</h2>
              <div className="paper-two">
                <p><strong>Gains</strong> — officials who want a harder line get a vivid Washington-target story.</p>
                <p><strong>Pays</strong> — the public gets fear before it gets evidence; diplomacy gets less room.</p>
              </div>
            </section>

            <section id="what-it-echoes">
              <h2><span>8.</span> What it echoes</h2>
              <p>Pre-war intelligence leaks, “mushroom cloud” framing, and the recurring pattern of anonymous officials arriving before documents. The echo is a warning, not a proof.</p>
            </section>

            <section id="what-would-prove">
              <h2><span>9.</span> What would prove this wrong</h2>
              <p>Contemporaneous intelligence showing the planning was exploratory; no movement of materials or people; a statement from the sources that the “plot” was not operational; or a White House correction that goes beyond “no immediate threat.”</p>
            </section>

            <section id="the-signals">
              <h2><span>10.</span> The signals</h2>
              <ul className="paper-checks">
                {["New, verifiable intelligence", "Changes in US or Iranian official statements", "Concrete indicators of operational preparation"].map((label, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setChecked((current) => {
                        const next = new Set(current);
                        if (next.has(index)) next.delete(index);
                        else next.add(index);
                        return next;
                      })}
                      className={checked.has(index) ? "is-checked" : ""}
                      aria-pressed={checked.has(index)}
                    >
                      {checked.has(index) ? <Check className="h-3 w-3" /> : null}
                    </button>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="paper-red">→ What to watch next</p>
            </section>

            <section id="what-this-rests-on">
              <h2><span>11.</span> What this rests on</h2>
              <p>CNN reporting; anonymous US officials; the public White House statement. Read the original documents if they appear. Nothing here is an independent confirmation of the underlying intelligence.</p>
            </section>

            <footer className="paper-foot">
              <span>Threadwise / paper prototype</span>
              <span>01 — 11</span>
              <span>Not a live record</span>
            </footer>
          </div>
        </article>
      </main>
      {selectionAction && manualSupported ? (
        <button
          type="button"
          className="paper-highlight-action"
          style={{ left: selectionAction.left, top: selectionAction.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addManualHighlight}
        >
          <Highlighter className="h-3 w-3" /> Highlight
        </button>
      ) : null}
      {note ? (
        <aside className="paper-margin-note" style={{ left: note.left, top: note.top }} role="dialog" aria-label={`Margin note: ${note.phrase}`}>
          <span className="paper-margin-note__tape" aria-hidden="true" />
          <div className="paper-margin-note__head">
            <p>{note.kind === "manual" ? "Your highlight" : "Margin note"}</p>
            <button type="button" onClick={() => setNote(null)} aria-label="Close margin note">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <h3>{note.data?.term ?? (note.loading ? "Reading this passage…" : "Your highlight")}</h3>
          {note.loading ? (
            <div className="paper-margin-note__loading" aria-live="polite">
              <span /><span /><span />
            </div>
          ) : null}
          {note.data ? (
            <>
              <p className="paper-margin-note__plain">{note.data.plain}</p>
              <p className="paper-margin-note__label">Deeper</p>
              <p>{note.data.deeper}</p>
              <p className="paper-margin-note__label paper-margin-note__label--watch">Watch for</p>
              <p>{note.data.watch}</p>
            </>
          ) : null}
          {note.error ? <p className="paper-margin-note__error">{note.error}</p> : null}
          <p className="paper-margin-note__foot">A reading note, not a verdict.</p>
        </aside>
      ) : null}
    </div>
  );
}
