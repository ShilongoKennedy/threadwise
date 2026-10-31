import { useEffect, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { relationLabel } from "@/lib/threadwise/model";
import { cordSag } from "@/lib/threadwise/graph";
import type { TEdge } from "@/lib/threadwise/store";

let snapAt = 0;
/** Marks the next cord(s) to mount as freshly latched, so they ink-snap into their port. */
export function markSnap() { snapAt = performance.now(); }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Damped spring that lags behind moving endpoints, giving the cord inertia. */
function useCordSpring(sx: number, sy: number, tx: number, ty: number) {
  const prev = useRef({ sx, sy, tx, ty });
  const state = useRef({ ox: 0, oy: 0, vx: 0, vy: 0, tension: 0 });
  const [, force] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    const p = prev.current;
    const dx = (sx - p.sx + tx - p.tx) / 2, dy = (sy - p.sy + ty - p.ty) / 2;
    const stretch = Math.abs(Math.hypot(tx - sx, ty - sy) - Math.hypot(p.tx - p.sx, p.ty - p.sy));
    prev.current = { sx, sy, tx, ty };
    if (reduced() || (!dx && !dy && !stretch)) return;
    const s = state.current;
    s.ox -= dx * 0.9; s.oy -= dy * 0.9; s.tension = Math.min(1, s.tension + stretch / 40);
    cancelAnimationFrame(frame.current);
    const step = () => {
      s.vx = (s.vx - s.ox * 0.16) * 0.78; s.vy = (s.vy - s.oy * 0.16) * 0.78;
      s.ox += s.vx; s.oy += s.vy; s.tension *= 0.9;
      s.ox = Math.max(-120, Math.min(120, s.ox)); s.oy = Math.max(-120, Math.min(120, s.oy));
      force((n) => n + 1);
      if (Math.abs(s.ox) + Math.abs(s.oy) + Math.abs(s.vx) + Math.abs(s.vy) + s.tension > 0.3) frame.current = requestAnimationFrame(step);
      else { s.ox = s.oy = s.vx = s.vy = s.tension = 0; force((n) => n + 1); }
    };
    frame.current = requestAnimationFrame(step);
  }, [sx, sy, tx, ty]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return state.current;
}

export function RelationEdge(p: EdgeProps<TEdge>) {
  const { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty } = p;
  const spring = useCordSpring(sx, sy, tx, ty);
  const [snapping] = useState(() => !p.data?.ghost && performance.now() - snapAt < 700);
  const dist = Math.hypot(tx - sx, ty - sy);
  const sag = cordSag(dist, spring.tension);
  const reach = Math.min(160, Math.max(40, dist * 0.35));
  
  // Ports leave horizontally; gravity pulls the belly of the cord down.
  const c1x = sx + reach + spring.ox * 0.6, c1y = sy + sag + spring.oy * 0.6;
  const c2x = tx - reach + spring.ox * 0.6, c2y = ty + sag + spring.oy * 0.6;
  const path = `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`;
  
  // Offset path for the 3D shadow
  const shadowPath = `M${sx},${sy + 2} C${c1x},${c1y + 4} ${c2x},${c2y + 4} ${tx},${ty + 2}`;
  
  const lx = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx;
  const ly = 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty;
  const rel = p.data?.relation ?? "leads_to";
  const contradicts = rel === "contradicts";
  const ghost = !!p.data?.ghost;
  const traced = !!p.data?.traced;
  const provenance = !!p.data?.provenance;
  const fault = !!p.data?.fault;
  const width = (provenance ? 2.5 : traced || fault ? 2 : p.selected ? 1.75 : 1.1) * (1 - spring.tension * 0.35);

  return (
    <>
      {/* 3D Shadow Path */}
      {!ghost && (
        <path 
          d={shadowPath} 
          fill="none" 
          stroke="var(--foreground)" 
          strokeWidth={width + 1} 
          opacity={0.05} 
          style={{ pointerEvents: "none" }}
        />
      )}

      <BaseEdge
        className={cn("tw-cord", traced && "tw-thread-traced", provenance && "tw-provenance", fault && "tw-fault-thread", snapping && "tw-ink-snap")}
        id={p.id}
        path={path}
        {...(p.markerEnd ? { markerEnd: p.markerEnd } : {})}
        style={{
          stroke: provenance || fault || contradicts ? "var(--accent-ink)" : traced || p.selected ? "var(--foreground)" : "var(--edge)",
          strokeWidth: width,
          strokeDasharray: ghost ? "2 5" : rel === "needs_evidence_from" || rel === "similar_to" ? "5 4" : undefined,
          opacity: p.data?.dimmed ? 0.12 : ghost && !provenance ? 0.6 : 1,
        }}
      />
      {snapping && <circle className="tw-ink-bleed" cx={tx} cy={ty} r="4" />}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "nodrag nopan pointer-events-auto absolute cursor-pointer rounded-md bg-background px-1.5 py-px font-display text-[12px] italic text-muted-foreground transition-colors hover:text-foreground",
            p.selected && "bg-foreground text-background hover:text-background",
            contradicts && "text-accent-ink",
            ghost && "opacity-60",
            p.data?.dimmed && "opacity-10",
          )}
          style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}
        >
          {relationLabel(rel, p.data?.customLabel)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}