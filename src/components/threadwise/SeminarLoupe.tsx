import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import type { Seminar } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";

export type LoupeTarget = {
  selected: string;
  paragraph: string;
  section: string;
};

type Candidate = LoupeTarget & {
  left: number;
  top: number;
};

type LoupeResponse = {
  kind: "term" | "claim" | "sentence" | "background";
  plain: string;
  here: string;
  watch_for: string | null;
};

const KIND_LABEL: Record<LoupeResponse["kind"], string> = {
  term: "A term in context",
  claim: "A claim to test",
  sentence: "A sentence at work",
  background: "Background, just enough",
};

function nodeElement(node: Node | null): Element | null {
  if (!node) return null;
  return node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
}

/**
 * Watches a reading surface for native text selection. We keep this separate from
 * the note panel so the reader can select, change their mind, or keep reading.
 */
export function useLoupeSelection(scopeRef: RefObject<HTMLElement | null>) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const selection = window.getSelection();
        const scope = scopeRef.current;
        if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !scope) {
          setCandidate(null);
          return;
        }
        const range = selection.getRangeAt(0);
        const common = nodeElement(range.commonAncestorContainer);
        if (!common || !scope.contains(common)) {
          setCandidate(null);
          return;
        }
        const selected = selection.toString().replace(/\s+/g, " ").trim();
        if (selected.length < 3 || selected.length > 700) {
          setCandidate(null);
          return;
        }
        const paragraphEl =
          nodeElement(range.startContainer)?.closest("p, li, blockquote, [data-loupe-paragraph]") ?? null;
        const sectionEl = nodeElement(range.startContainer)?.closest("[data-loupe-section]") ?? null;
        const paragraph = (paragraphEl?.textContent ?? selected).replace(/\s+/g, " ").trim();
        const section = sectionEl?.getAttribute("data-loupe-section") ?? "Seminar passage";
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setCandidate(null);
          return;
        }
        const top = rect.bottom + 44 > window.innerHeight ? rect.top - 52 : rect.bottom + 10;
        const left = Math.min(window.innerWidth - 84, Math.max(84, rect.left + rect.width / 2));
        setCandidate({ selected, paragraph, section, left, top: Math.max(80, top) });
      });
    };

    const clear = () => setCandidate(null);

    document.addEventListener("selectionchange", read);
    document.addEventListener("mouseup", read);
    document.addEventListener("keyup", read);
    window.addEventListener("scroll", clear, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", read);
      document.removeEventListener("mouseup", read);
      document.removeEventListener("keyup", read);
      window.removeEventListener("scroll", clear, true);
    };
  }, [scopeRef]);

  return {
    candidate,
    clearCandidate: () => setCandidate(null),
  };
}

export function LoupeSelectionButton({
  candidate,
  onOpen,
}: {
  candidate: Candidate;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-loupe-trigger
      onMouseDown={(event) => event.preventDefault()}
      onClick={onOpen}
      className="tw-loupe-trigger fixed z-[80] inline-flex h-9 -translate-x-1/2 items-center gap-2 rounded-full border border-[#1A1A1A]/20 bg-[#1A1A1A] px-2.5 pr-3 text-[#FDFBF7] shadow-[0_8px_24px_-10px_rgba(26,26,26,0.7)]"
      style={{ left: candidate.left, top: candidate.top }}
      aria-label="Look closer at the selected passage"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1A4BFF]">
        <Search className="h-3 w-3" strokeWidth={2.2} />
      </span>
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em]">Look closer</span>
    </button>
  );
}

export function LookCloserButton({
  text,
  section,
  onLookCloser,
  className = "",
}: {
  text: string;
  section: string;
  onLookCloser: (target: LoupeTarget) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onLookCloser({ selected: text, paragraph: text, section })}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-[#1A4BFF]/70 opacity-0 transition-all hover:border-[#1A4BFF]/30 hover:bg-[#1A4BFF]/5 focus:opacity-100 group-hover:opacity-100 ${className}`}
      aria-label="Look closer at this line"
    >
      <Search className="h-2.5 w-2.5" />
      closer
    </button>
  );
}

export function SeminarLoupe({
  target,
  text,
  context,
  seminar,
  lesson,
  onClose,
  onAskTutor,
}: {
  target: LoupeTarget | null;
  text: string;
  context: string;
  seminar: Seminar;
  lesson?: SeminarLesson | null;
  onClose: () => void;
  onAskTutor?: (selected: string) => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loupe, setLoupe] = useState<LoupeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    setState("loading");
    setLoupe(null);
    setError(null);
    fetch("/api/seminar-loupe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        context,
        seminar,
        lesson: lesson ?? null,
        selected: target.selected,
        paragraph: target.paragraph,
        section: target.section,
      }),
    })
      .then(async (response) => {
        const body = (await response.json()) as { loupe?: LoupeResponse; error?: string };
        if (!response.ok || !body.loupe) throw new Error(body.error ?? "The lens could not focus.");
        setLoupe(body.loupe);
        setState("ready");
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "The lens could not focus.");
        setState("error");
      });
    return () => controller.abort();
  }, [attempt, context, lesson, seminar, target, text]);

  useEffect(() => {
    if (!target) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focus = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focus);
    };
  }, [onClose, target]);

  if (!target) return null;

  return (
    <>
      <div className="fixed inset-0 z-[74] bg-[#1A1A1A]/[0.03] md:hidden" aria-hidden onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label="Loupe note"
        className="tw-loupe-panel fixed inset-x-3 bottom-3 z-[80] max-h-[76dvh] overflow-y-auto border border-[#1A1A1A]/20 bg-[#FBF6EC] text-[#1A1A1A] shadow-[10px_16px_0_-3px_rgba(26,26,26,0.12),0_28px_60px_-28px_rgba(26,26,26,0.45)] md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:max-h-[calc(100dvh-8rem)] md:w-[382px]"
      >
        <div className="relative border-b border-[#1A1A1A]/15 px-5 pb-4 pt-5">
          <span className="absolute left-0 top-5 h-16 w-1 bg-[#1A4BFF]" aria-hidden />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[#1A4BFF]/30 bg-[#1A4BFF]/[0.07] text-[#1A4BFF]">
                <Search className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">The Loupe</p>
                <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">Close read · {target.section}</p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close the Loupe"
              className="grid h-7 w-7 place-items-center rounded-full text-[#1A1A1A]/40 transition-colors hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <blockquote className="mt-5 border-l border-[#1A4BFF]/30 pl-3 font-serif text-[14px] italic leading-relaxed text-[#1A1A1A]/65">
            “{target.selected.length > 280 ? `${target.selected.slice(0, 277)}…` : target.selected}”
          </blockquote>
        </div>

        <div className="px-5 py-5" aria-live="polite">
          {state === "loading" ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
                <Loader2 className="h-3 w-3 animate-spin" /> Focusing the lens
              </p>
              <div className="h-2.5 w-11/12 animate-pulse rounded-full bg-[#1A1A1A]/10" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-[#1A1A1A]/8" />
              <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-[#1A1A1A]/6" />
            </div>
          ) : null}

          {state === "error" ? (
            <div>
              <p className="font-serif text-[14px] leading-relaxed text-[#C1121F]">{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-3 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {state === "ready" && loupe ? (
            <div className="space-y-5">
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/35">{KIND_LABEL[loupe.kind]}</p>
              <div>
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">Plain terms</p>
                <p className="mt-1.5 font-serif text-[14.5px] leading-[1.65] text-[#1A1A1A]/82">{loupe.plain}</p>
              </div>
              <div className="border-t border-[#1A1A1A]/12 pt-4">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">In the argument</p>
                <p className="mt-1.5 font-serif text-[14.5px] leading-[1.65] text-[#1A1A1A]/72">{loupe.here}</p>
              </div>
              {loupe.watch_for ? (
                <div className="border-l-2 border-[#C49A67] pl-3">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#8A6A43]">Watch for</p>
                  <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#1A1A1A]/60">{loupe.watch_for}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A1A]/12 px-5 py-3">
          <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">A reading aid, not a source</p>
          <div className="flex items-center gap-3">
            {lesson && onAskTutor ? (
              <button
                type="button"
                onClick={() => {
                  onAskTutor(target.selected);
                  onClose();
                }}
                className="inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#1A4BFF] hover:underline hover:underline-offset-4"
              >
                Ask the tutor <ArrowUpRight className="h-3 w-3" />
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/45 hover:text-[#1A1A1A]">
              Back to reading
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
