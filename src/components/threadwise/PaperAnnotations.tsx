import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouterState } from "@tanstack/react-router";
import { Highlighter, Loader2, Trash2, X } from "lucide-react";

const SURFACE_SELECTOR = ".seminar-reading-surface, .read-page .bp-page, .anatomy-report";
const HIGHLIGHT_NAME = "tw-live-manual";

type NoteData = {
  term: string;
  plain: string;
  deeper: string;
  watch: string;
};

type ManualRange = { range: Range; text: string; context: string };

type NoteState = {
  text: string;
  left: number;
  top: number;
  kind: "manual" | "recommended";
  data: NoteData | null;
  loading: boolean;
  error?: string;
};

function elementOf(node: Node | null): Element | null {
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

function isPaper(): boolean {
  return document.documentElement.dataset.surface === "paper";
}

function notePosition(x: number, y: number) {
  const width = Math.min(352, window.innerWidth - 28);
  return {
    left: Math.min(window.innerWidth - width - 14, Math.max(14, x + 16)),
    top: Math.max(76, Math.min(window.innerHeight - 360, y - 40)),
  };
}

export function PaperAnnotations() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const surfaceRanges = useRef<ManualRange[]>([]);
  const recommendedRanges = useRef<Array<{ range: Range; text: string; context: string; data?: NoteData }>>([]);
  const registryHighlight = useRef<{ add: (range: Range) => void } | null>(null);
  const recommendedHighlight = useRef<{ add: (range: Range) => void } | null>(null);
  const cache = useRef<Map<string, NoteData>>(new Map());
  const requestRef = useRef(0);
  const [supported, setSupported] = useState(false);
  const [action, setAction] = useState<{ left: number; top: number } | null>(null);
  const [note, setNote] = useState<NoteState | null>(null);
  const [count, setCount] = useState(0);

  const clearManual = () => {
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    const HighlightCtor = (window as unknown as { Highlight?: new () => { add: (range: Range) => void } }).Highlight;
    if (registry && HighlightCtor) {
      registryHighlight.current = new HighlightCtor();
      registry.set(HIGHLIGHT_NAME, registryHighlight.current);
    }
    surfaceRanges.current = [];
    setCount(0);
    setAction(null);
    setNote(null);
  };

  const clearAll = () => {
    clearManual();
    recommendedRanges.current = [];
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    if (registry) registry.delete("tw-live-recommended");
  };

  useEffect(() => {
    const HighlightCtor = (window as unknown as { Highlight?: new () => { add: (range: Range) => void } }).Highlight;
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    if (!HighlightCtor || !registry) return;
    registryHighlight.current = new HighlightCtor();
    recommendedHighlight.current = new HighlightCtor();
    registry.set(HIGHLIGHT_NAME, registryHighlight.current);
    registry.set("tw-live-recommended", recommendedHighlight.current);
    setSupported(true);
    return () => {
      registry.delete(HIGHLIGHT_NAME);
      registry.delete("tw-live-recommended");
      registryHighlight.current = null;
      recommendedHighlight.current = null;
    };
  }, []);

  useEffect(() => {
    // A route or surface change invalidates the stored DOM ranges.
    clearAll();
    cache.current.clear();
  }, [pathname]);

  useEffect(() => {
    let disposed = false;
    let timer = 0;
    let lastText = "";

    const findRange = (root: HTMLElement, quote: string): Range | null => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const content = node.textContent ?? "";
        const index = content.indexOf(quote);
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + quote.length);
          return range;
        }
        node = walker.nextNode();
      }
      return null;
    };

    const applyLocalRecommendations = (surface: HTMLElement) => {
      if (!recommendedHighlight.current) return;
      const cues = ["because", "evidence", "would settle", "falsif", "therefore", "but ", "however", "suggests", "claim", "assumption", "confidence", "uncertain", "counter", "not established", "mechanism", "decision", "interest", "proof", "wager"];
      const seen = new Set<Element>();
      const picks: Array<{ text: string; context: string; range: Range; score: number }> = [];
      const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        const raw = (node.textContent ?? "").replace(/\s+/g, " ").trim();
        if (parent && raw.length >= 55 && raw.length <= 280 && !parent.closest("button, a, nav, label, .tw-loupe-panel, .live-paper-note")) {
          const tag = parent.closest("p, li, blockquote");
          if (tag && !seen.has(tag)) {
            const sentence = raw.match(/.{40,220}?[.!?](?:\s|$)/)?.[0]?.trim() ?? raw;
            const context = (tag.textContent ?? "").replace(/\s+/g, " ").trim();
            const lower = sentence.toLowerCase();
            const score = cues.reduce((sum, cue) => sum + (lower.includes(cue) ? 1 : 0), 0) + Math.min(3, Math.floor(context.length / 180));
            if (sentence.length >= 45 && sentence.length <= 240) {
              const range = findRange(surface, sentence);
              if (range) {
                seen.add(tag);
                picks.push({ text: sentence, context, range, score });
              }
            }
          }
        }
        node = walker.nextNode();
      }
      const chosen = picks.sort((a, b) => b.score - a.score).slice(0, 4);
      recommendedRanges.current = chosen.map(({ range, text, context }) => ({ range, text, context }));
      for (const item of chosen) recommendedHighlight.current.add(item.range);
      (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.set("tw-live-recommended", recommendedHighlight.current);
    };

    const schedule = () => {
      if (disposed) return;
      const surface = document.querySelector<HTMLElement>(SURFACE_SELECTOR);
      if (!surface) return;
      const text = (surface.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < 300 || text === lastText) return;
      lastText = text;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => applyLocalRecommendations(surface), 1100);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      if (!isPaper()) clearAll();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-surface"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!supported) return;

    const readSelection = () => {
      if (!isPaper()) return setAction(null);
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return setAction(null);
      const range = selection.getRangeAt(0);
      const start = elementOf(range.startContainer);
      if (!start?.closest(SURFACE_SELECTOR) || start.closest(".tw-loupe-panel, .live-paper-note")) return setAction(null);
      if (selection.toString().trim().length < 3) return setAction(null);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) return setAction(null);
      setAction({
        left: Math.max(16, Math.min(window.innerWidth - 128, rect.left + rect.width / 2 - 44)),
        top: Math.max(70, rect.top - 42),
      });
    };

    const hide = () => setAction(null);
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
  }, [supported]);

  const generateNote = async (text: string, context: string, x: number, y: number, kind: "manual" | "recommended" = "manual") => {
    const cached = cache.current.get(text);
    if (cached) {
      setNote({ text, ...notePosition(x, y), kind, data: cached, loading: false });
      return;
    }
    const request = requestRef.current + 1;
    requestRef.current = request;
    setNote({ text, ...notePosition(x, y), kind, data: null, loading: true });
    try {
      const response = await fetch("/api/paper-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const body = (await response.json()) as { note?: NoteData; error?: string };
      if (requestRef.current !== request) return;
      if (!response.ok || !body.note) throw new Error(body.error ?? "The note could not be written.");
      cache.current.set(text, body.note);
      setNote((current) => current && current.text === text ? { ...current, data: body.note, loading: false } : current);
    } catch (caught) {
      if (requestRef.current !== request) return;
      setNote((current) => current && current.text === text ? {
        ...current,
        loading: false,
        error: caught instanceof Error ? caught.message : "The note could not be written.",
      } : current);
    }
  };

  const addHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const start = elementOf(range.startContainer);
    if (!start?.closest(SURFACE_SELECTOR) || !registryHighlight.current) return;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (text.length < 3) return;
    const context = start.closest("p, li, blockquote, [data-loupe-section]")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const clone = range.cloneRange();
    registryHighlight.current.add(clone);
    surfaceRanges.current.push({ range: clone, text, context });
    setCount((current) => current + 1);
    selection.removeAllRanges();
    const rect = clone.getBoundingClientRect();
    void generateNote(text, context, rect.left + 20, rect.top + 16);
    setAction(null);
  };

  useEffect(() => {
    if (!supported) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".live-paper-note") || target.closest(".live-paper-tools") || target.closest(".live-paper-highlight-action")) return;
      if (note) setNote(null);
    };

    const onClick = (event: MouseEvent) => {
      if (!isPaper()) return;
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, summary")) return;
      if (!target.closest(SURFACE_SELECTOR)) return;
      const x = event.clientX;
      const y = event.clientY;
      const recommended = recommendedRanges.current.find(({ range }) =>
        Array.from(range.getClientRects()).some((rect) => x >= rect.left - 1 && x <= rect.right + 1 && y >= rect.top - 1 && y <= rect.bottom + 1),
      );
      if (recommended) {
        event.preventDefault();
        if (recommended.data) {
          setNote({ text: recommended.text, ...notePosition(x, y), kind: "recommended", data: recommended.data, loading: false });
        } else {
          void generateNote(recommended.text, recommended.context, x, y, "recommended");
        }
        return;
      }
      const hit = surfaceRanges.current.find(({ range }) =>
        Array.from(range.getClientRects()).some((rect) => x >= rect.left - 1 && x <= rect.right + 1 && y >= rect.top - 1 && y <= rect.bottom + 1),
      );
      if (!hit) return;
      event.preventDefault();
      void generateNote(hit.text, hit.context, x, y);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNote(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [supported, note]);

  if (!supported) return null;

  return (
    <>
      {action ? (
        <button
          type="button"
          className="live-paper-highlight-action"
          style={{ left: action.left, top: action.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addHighlight}
        >
          <Highlighter className="h-3 w-3" /> Highlight
        </button>
      ) : null}

      {count > 0 && isPaper() ? (
        <div className="live-paper-tools">
          <span>{count} {count === 1 ? "highlight" : "highlights"}</span>
          <button type="button" onClick={clearManual} aria-label="Clear my paper highlights">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      ) : null}

      {note
        ? createPortal(
            <aside className="live-paper-note" style={{ left: note.left, top: note.top }} role="dialog" aria-label="Your paper highlight note">
              <span className="live-paper-note__tape" aria-hidden="true" />
              <header>
                <p>{note.kind === "recommended" ? "Recommended passage" : "Your highlight"}</p>
                <button type="button" onClick={() => setNote(null)} aria-label="Close note">
                  <X className="h-3.5 w-3.5" />
                </button>
              </header>
              <h3>{note.data?.term ?? "Reading this passage…"}</h3>
              {note.loading ? <p className="live-paper-note__loading"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the margin…</p> : null}
              {note.data ? (
                <>
                  <p className="live-paper-note__plain">{note.data.plain}</p>
                  <p className="live-paper-note__label">Deeper</p>
                  <p>{note.data.deeper}</p>
                  <p className="live-paper-note__label live-paper-note__label--watch">Watch for</p>
                  <p>{note.data.watch}</p>
                </>
              ) : null}
              {note.error ? <p className="live-paper-note__error">{note.error}</p> : null}
              <footer>A reading note, not a verdict.</footer>
            </aside>,
            document.body,
          )
        : null}
    </>
  );
}
