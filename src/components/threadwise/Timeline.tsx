import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, History, Radio, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread, type TEdge, type TNode } from "@/lib/threadwise/store";
import { describeChange } from "@/lib/threadwise/history";

type Snap = { nodes: TNode[]; edges: TEdge[]; label: string };


/**
 * Canvas-scoped undo. Snapshots are coalesced into 400ms windows so a drag lands
 * as one step rather than sixty, and replay never records anything.
 */
function useCanvasHistory() {
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const lastAt = useRef(0);
  const [state, setState] = useState({ canUndo: false, canRedo: false, undoLabel: "", redoLabel: "" });

  const sync = useCallback(() => {
    setState({
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
      undoLabel: past.current[past.current.length - 1]?.label ?? "",
      redoLabel: future.current[future.current.length - 1]?.label ?? "",
    });
  }, []);

  useEffect(() => {
    const unsubscribe = useThread.subscribe((next, prev) => {
      const changed = next.nodes !== prev.nodes || next.edges !== prev.edges;
      if (!changed || next.replayIndex !== null) return;
      if (Date.now() - lastAt.current < 400) return;
      past.current.push({ nodes: prev.nodes, edges: prev.edges, label: describeChange(prev, next) });
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      lastAt.current = Date.now();
      sync();
    });
    return unsubscribe;
  }, [sync]);

  const apply = (snap: Snap) => {
    useThread.setState({ nodes: snap.nodes, edges: snap.edges, selectedId: null });
    lastAt.current = Date.now();
    sync();
  };

  const undo = useCallback(() => {
    const snap = past.current.pop();
    if (!snap) return;
    const now = useThread.getState();
    future.current.push({ nodes: now.nodes, edges: now.edges, label: snap.label });
    apply(snap);
  }, [sync]);

  const redo = useCallback(() => {
    const snap = future.current.pop();
    if (!snap) return;
    const now = useThread.getState();
    past.current.push({ nodes: now.nodes, edges: now.edges, label: snap.label });
    apply(snap);
  }, [sync]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (useThread.getState().replayIndex !== null) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return { ...state, undo, redo };
}

export function Timeline() {
  const s = useThread();
  const history = useCanvasHistory();
  const index = s.replayIndex ?? Math.max(0, s.history.length - 1);
  const moment = s.history[index];

  return (
    <div className="tw-timeline absolute inset-x-4 bottom-[74px] z-10 flex items-center gap-1 border-t border-[#1A1A1A]/12 bg-[#FDFBF7]/70 px-1 py-0.5 backdrop-blur-sm sm:inset-x-6">
      <History className="mx-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <Button
        variant="ghost"
        size="icon"
        title="Previous moment"
        aria-label="Previous moment"
        disabled={index === 0}
        onClick={() => s.setReplay(index - 1)}
      >
        <ChevronLeft />
      </Button>
      <input
        type="range"
        aria-label="Timeline scrubber"
        min={0}
        max={Math.max(0, s.history.length - 1)}
        value={index}
        onChange={(e) => s.setReplay(Number(e.target.value))}
        className="tw-scrub min-w-0 flex-1"
      />
      <Button
        variant="ghost"
        size="icon"
        title="Next moment"
        aria-label="Next moment"
        disabled={s.replayIndex === null || index >= s.history.length - 1}
        onClick={() => s.setReplay(index + 1)}
      >
        <ChevronRight />
      </Button>
      <span
        className="hidden w-40 truncate font-mono text-[10px] text-muted-foreground lg:block"
        title={moment ? new Date(moment.at).toLocaleString() : ""}
      >
        {s.replayIndex === null
          ? `${String(index + 1).padStart(2, "0")}/${String(s.history.length).padStart(2, "0")} · ${moment?.label ?? "Canvas"}`
          : `Replay · ${moment?.label ?? ""}`}
      </span>

      {s.replayIndex === null ? (
        <div className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-[#1A1A1A]/12 pl-1">
          <Button
            variant="ghost"
            size="icon"
            title={history.canUndo ? `Undo: ${history.undoLabel} (⌘Z)` : "Nothing to undo"}
            aria-label={history.canUndo ? `Undo ${history.undoLabel}` : "Nothing to undo"}
            disabled={!history.canUndo}
            onClick={history.undo}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={history.canRedo ? `Redo: ${history.redoLabel} (⇧⌘Z)` : "Nothing to redo"}
            aria-label={history.canRedo ? `Redo ${history.redoLabel}` : "Nothing to redo"}
            disabled={!history.canRedo}
            onClick={history.redo}
          >
            <Redo2 />
          </Button>
        </div>
      ) : (
        <Button
          variant="default"
          size="sm"
          className="ml-auto shrink-0"
          onClick={() => s.setReplay(null)}
          aria-label="Return to live canvas"
        >
          <Radio className="mr-1.5 h-3.5 w-3.5" /> Live
        </Button>
      )}
    </div>
  );
}
