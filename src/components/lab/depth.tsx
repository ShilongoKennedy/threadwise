import { useEffect, useRef, useState } from "react";

/**
 * A line of planes receding to the left. One float `p` is the only state: every
 * card's x, size, blur and opacity is read from a seven-stop table by depth.
 * Layers are laid out once at a base size and only scaled, so text stays sharp.
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
  const target = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const dragging = useRef<{ startX: number; startP: number; moved: number } | null>(null);
  const wheelTimer = useRef<number | undefined>(undefined);
  const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    target.current = clamp(target.current, 0, count - 1);
  }, [count]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let current = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const t = target.current;
      if (calm) current = t;
      else {
        current += (t - current) * (1 - Math.exp(-dt * 0.0072));
        if (Math.abs(t - current) < 0.0004) current = t;
      }
      if (Math.abs(current - p) > 0.0001) {
        setP(current);
        setFocus(Math.round(wrap(current, count)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [calm, count, p]);

  const go = (delta: number) => {
    target.current = clamp(Math.round(target.current) + delta, 0, count - 1);
  };
  const jump = (index: number) => {
    target.current = clamp(index, 0, count - 1);
  };

  const bind = {
    onPointerDown: (event: React.PointerEvent) => {
      const width = stage.current?.clientWidth ?? 800;
      dragging.current = {
        startX: event.clientX,
        startP: target.current,
        moved: 0,
      };
      void width;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent) => {
      const drag = dragging.current;
      if (!drag) return;
      const width = stage.current?.clientWidth ?? 800;
      const dx = event.clientX - drag.startX;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      target.current = clamp(drag.startP + dx / Math.max(150, width * 0.2), 0, count - 1);
    },
    onPointerUp: () => {
      const drag = dragging.current;
      dragging.current = null;
      if (!drag) return;
      target.current = clamp(Math.round(target.current), 0, count - 1);
    },
    onWheel: (event: React.WheelEvent) => {
      event.preventDefault();
      const step = clamp(event.deltaY + event.deltaX, -120, 120) / 420;
      target.current = clamp(target.current + step, 0, count - 1);
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => {
        target.current = clamp(Math.round(target.current), 0, count - 1);
      }, 150);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        go(-1);
      }
    },
  };

  return { p, stage, focus, bind, go, jump };
}

/** Computes the placement of the card at a given index. */
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
