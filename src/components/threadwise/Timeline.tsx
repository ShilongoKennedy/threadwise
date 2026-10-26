import { ChevronLeft, ChevronRight, History, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread } from "@/lib/threadwise/store";

export function Timeline() {
  const s = useThread();
  const index = s.replayIndex ?? Math.max(0, s.history.length - 1);
  const moment = s.history[index];
  return <div className="tw-timeline absolute left-4 right-4 top-[126px] z-10 flex items-center gap-1 border-y border-border-strong bg-background/95 px-1 py-1 sm:left-6 sm:right-6 md:right-[490px]" aria-label="Idea lineage">
    <History className="mx-2 h-4 w-4 shrink-0 text-muted-foreground" />
    <Button variant="ghost" size="icon" title="Previous moment" aria-label="Previous moment" disabled={index === 0} onClick={() => s.setReplay(index - 1)}><ChevronLeft /></Button>
    <input type="range" aria-label="Timeline scrubber" min={0} max={Math.max(0, s.history.length - 1)} value={index} onChange={(e) => s.setReplay(Number(e.target.value))} className="min-w-8 flex-1 accent-foreground" />
    <Button variant="ghost" size="icon" title="Next moment" aria-label="Next moment" disabled={s.replayIndex === null || index >= s.history.length - 1} onClick={() => s.setReplay(index + 1)}><ChevronRight /></Button>
    <span className="hidden w-36 truncate font-mono text-[9px] text-muted-foreground lg:block" title={moment ? new Date(moment.at).toLocaleString() : ""}>{s.replayIndex === null ? "NOW" : `${index + 1}/${s.history.length} · ${moment?.label}`}</span>
    <Button variant={s.replayIndex === null ? "ghost" : "default"} size="sm" className="shrink-0" onClick={() => s.setReplay(null)} aria-label="Return to live canvas"><Radio className="h-3 w-3" />Live</Button>
  </div>;
}