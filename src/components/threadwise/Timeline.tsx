import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, History, Radio, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread, type TEdge, type TNode } from "@/lib/threadwise/store";

type Snap = { nodes: TNode[]; edges: TEdge[] };

/**
 * Canvas-scoped undo. Snapshots are coalesced into 400ms windows so a drag lands
 * as one step rather than sixty, and replay never records anything.
 */
function useCanvasHistory() {
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const lastAt = useRef(0);
  const [, bump] = useState(0);

  useEffect(() => {
    const unsubscribe = useThread.subscribe((state, prev) => {
      const changed = state.nodes !== prev.nodes || state.edges !== prev.edges;
      if (!changed || state.replayIndex !== null) return;
      if (Date.now() - lastAt.current < 400) return;
      past.current.push({ nodes: prev.nodes, edges: prev.edges });
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      lastAt.current = Date.now();
      bump((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  const apply = (snap: Snap) => {
    useThread.setState({ nodes: snap.nodes, edges: snap.edges, selectedId: null });
    bump((n) => n + 1);
  };

  return {
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undo: () => {
      const snap = past.current.pop();
      if (!snap) return;
      const now = useThread.getState();
      future.current.push({ nodes: now.nodes, edges: now.edges });
      lastAt.current = Date.now();
      apply(snap);
    },
    redo: () => {
      const snap = future.current.pop();
      if (!snap) return;
      const now = useThread.getState();
      past.current.push({ nodes: now.nodes, edges: now.edges });
      lastAt.current = Date.now();
      apply(snap);
    },
  };
}

export function Timeline() {
  const s = useThread();
  const history = useCanvasHistory();
  const index = s.replayIndex ?? Math.max(0, s.history.length - 1);
  const moment = s.history[index];

  return (
    <div className="tw-timeline absolute left-4 right-4 top-[52px] z-10 flex items-center gap-1 border-b border-[#1A1A1A]/12 bg-[#FDFBF7]/80 px-1 py-1 backdrop-blur-md sm:left-6 sm:right-auto sm:w-[min(760px,calc(100%-48px))]">
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
            title="Undo"
            aria-label="Undo the last change"
            disabled={!history.canUndo}
            onClick={history.undo}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Redo"
            aria-label="Redo the last change"
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
