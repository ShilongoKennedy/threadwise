import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A line of planes receding to the left. One float `p` is the only state: every
 * card's x, size, blur and opacity is read from a seven-stop table by depth.
 * Layers are laid out once at a base size and only scaled, so text stays sharp.
 *
 * The animation loop is started once and reads its values from refs. It must
 * never depend on `p`, or every frame would tear down and restart it.
 */

const KX = [1.15, 0.7, 0.47, 0.325, 0.22, 0.145, 0.09];
const KF = [1.06, 0.9, 0.795, 0.72, 0.665, 0.625, 0.6];
const KH = [1.0, 0.66, 0.45, 0.32, 0.23, 0.17, 0.13];
const KB = [0, 0, 2, 5, 9, 13, 18];
const KO = [1, 1, 1, 0.92, 0.7, 0.4, 0];

const wrap = (x: number, n: number) => ((x % n) + n) % n;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const at = (table: number[], k: number) => {
  const a = Math.floor(k);
  const b = Math.min(table.length - 1, a + 1);
  const t = k - a;
  return table[a]! + (table[b]! - table[a]!) * t;
};

export const BASE_W = 380;
export const BASE_H = 520;

export function useDepth(count: number) {
  const [p, setP] = useState(0);
  const [focus, setFocus] = useState(0);
  const [dragging, setDragging] = useState(false);

  const target = useRef(0);
  const value = useRef(0);
  const shown = useRef(0);
  const focusRef = useRef(0);
  const calm = useRef(false);

  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startP: number; moved: number } | null>(null);
  const justDragged = useRef(0);
  const wheelTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    calm.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    target.current = clamp(target.current, 0, Math.max(0, count - 1));
    value.current = clamp(value.current, 0, Math.max(0, count - 1));
  }, [count]);

  // One loop, started once. Values live in refs; React only hears about changes.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      const t = target.current;
      if (calm.current) {
        value.current = t;
      } else {
        value.current += (t - value.current) * (1 - Math.exp(-dt * 0.0072));
        if (Math.abs(t - value.current) < 0.0004) value.current = t;
      }

      if (Math.abs(value.current - shown.current) > 0.0004) {
        shown.current = value.current;
        setP(value.current);
        const next = Math.round(wrap(value.current, count));
        if (next !== focusRef.current) {
          focusRef.current = next;
          setFocus(next);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  const go = useCallback((delta: number) => {
    target.current = clamp(Math.round(target.current) + delta, 0, Math.max(0, count - 1));
  }, [count]);

  const jump = useCallback((index: number) => {
    if (Date.now() - justDragged.current < 250) return;
    target.current = clamp(wrap(index, count), 0, Math.max(0, count - 1));
  }, [count]);

  const bind = {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      drag.current = { startX: event.clientX, startP: target.current, moved: 0 };
      setDragging(true);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent) => {
      const active = drag.current;
      if (!active) return;
      const width = stage.current?.clientWidth ?? 800;
      const dx = event.clientX - active.startX;
      active.moved = Math.max(active.moved, Math.abs(dx));
      target.current = clamp(
        active.startP + dx / Math.max(150, width * 0.2),
        0,
        Math.max(0, count - 1),
      );
    },
    onPointerUp: (event: React.PointerEvent) => {
      const active = drag.current;
      drag.current = null;
      setDragging(false);
      if (!active) return;
      if (active.moved > 6) justDragged.current = Date.now();
      target.current = clamp(Math.round(target.current), 0, Math.max(0, count - 1));
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    },
    onPointerCancel: (event: React.PointerEvent) => {
      drag.current = null;
      setDragging(false);
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    },
    onWheel: (event: React.WheelEvent) => {
      const step = clamp(event.deltaY + event.deltaX, -120, 120) / 420;
      target.current = clamp(target.current + step, 0, Math.max(0, count - 1));
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => {
        target.current = clamp(Math.round(target.current), 0, Math.max(0, count - 1));
      }, 150);
    },
  };

  return { p, stage, focus, dragging, bind, go, jump };
}

/** Where the card at `index` sits, given the current position `p`. */
export function place(index: number, p: number, count: number, width: number, height: number) {
  const d = wrap(index - p, count);
  const depth = d > count - 1 ? d - count : d;
  const k = clamp(depth + 1, 0, 6);
  const h = at(KH, k) * height;
  const scale = h / BASE_H;
  const x = at(KX, k) * width - (h * (BASE_W / BASE_H)) / 2;
  const y = at(KF, k) * height - h;
  const blur = at(KB, k) / Math.max(scale, 0.05);
  return { depth, x, y, scale, blur, opacity: at(KO, k) };
}
