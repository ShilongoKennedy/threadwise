import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Snapshot } from "@/lib/threadwise/store";
import { TYPE_COLOR } from "./ThreadNode";

/** Replays the canvas's real snapshots as a short film of how a conclusion emerged. */
export function ThoughtPlayback({ history, title, onExit }: { history: Snapshot[]; title: string; onExit: () => void }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const frames = history.slice(-36);
  const current = frames[frame];
  useEffect(() => {
    if (!playing || frame >= frames.length - 1) return;
    const timer = window.setTimeout(() => setFrame((v) => v + 1), 1150);
    return () => window.clearTimeout(timer);
  }, [playing, frame, frames.length]);
  useEffect(() => { if (frame >= frames.length - 1) setPlaying(false); }, [frame, frames.length]);
  const bounds = useMemo(() => {
    const nodes = current?.nodes ?? [];
    const xs = nodes.map((n) => n.position.x), ys = nodes.map((n) => n.position.y);
    return { left: Math.min(...xs, 0) - 80, top: Math.min(...ys, 0) - 80, width: Math.max(700, Math.max(...xs, 0) - Math.min(...xs, 0) + 420), height: Math.max(470, Math.max(...ys, 0) - Math.min(...ys, 0) + 320) };
  }, [current]);
  if (!frames.length) return null;
  return <section className="tw-playback" role="dialog" aria-modal="true" aria-label="Thought playback">
    <header><div><span className="tw-kicker">Thought playback</span><h2>{title}</h2></div><Button variant="ghost" size="icon" aria-label="Exit thought playback" onClick={onExit}><X /></Button></header>
    <div className="tw-playback-stage">
      <svg viewBox={`${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}`} aria-label={`Snapshot ${frame + 1} of ${frames.length}`}>
        {(current?.edges ?? []).map((edge) => { const a = current?.nodes.find((n) => n.id === edge.source), b = current?.nodes.find((n) => n.id === edge.target); return a && b ? <path key={edge.id} d={`M ${a.position.x + 238} ${a.position.y + 68} C ${a.position.x + 300} ${a.position.y + 68}, ${b.position.x - 62} ${b.position.y + 68}, ${b.position.x} ${b.position.y + 68}`} className="tw-playback-thread" /> : null; })}
        {(current?.nodes ?? []).map((node) => <g key={node.id} className="tw-playback-node" transform={`translate(${node.position.x} ${node.position.y})`} style={{ color: TYPE_COLOR[node.data.kind] }}><rect width="238" height="136" rx="12" /><rect width="4" height="82" x="14" y="26" rx="2" fill="currentColor" /><text x="32" y="37" className="kind">{node.data.kind}</text><text x="32" y="68" className="title">{node.data.title}</text><text x="32" y="111" className="meta">{node.data.epistemic}</text></g>)}
      </svg>
      <div className="tw-playback-caption" key={current?.id}><span>{String(frame + 1).padStart(2, "0")}</span><div><p>{current?.label}</p><small>{current ? new Date(current.at).toLocaleString() : ""}</small></div></div>
    </div>
    <footer><Button variant="ghost" size="icon" aria-label={playing ? "Pause playback" : "Play playback"} onClick={() => setPlaying((v) => !v)}>{playing ? <Pause /> : <Play />}</Button><input aria-label="Playback position" type="range" min={0} max={Math.max(0, frames.length - 1)} value={frame} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} /><Button variant="ghost" size="icon" aria-label="Restart playback" onClick={() => { setFrame(0); setPlaying(true); }}><RotateCcw /></Button></footer>
  </section>;
}
