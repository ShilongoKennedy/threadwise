import { useEffect, useRef, useState } from "react";

/**
 * "hides." arrives under a redaction bar. Dragging across it erases the ink and
 * uncovers the word — the product's own thesis, performed on the page.
 * It uncovers itself after four seconds so nobody is ever blocked by it.
 */
export function RedactedWord({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLSpanElement>(null);
  const rubbed = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(true);
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  const move = (event: React.PointerEvent) => {
    const node = host.current;
    if (!node || open) return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    node.style.setProperty("--rub-x", `${x}px`);
    node.style.setProperty("--rub-y", `${y}px`);
    node.style.setProperty("--rub-radius", "120px");

    const previous = last.current;
    last.current = { x: event.clientX, y: event.clientY };
    if (previous) {
      rubbed.current += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      if (rubbed.current > 520) setOpen(true);
    }
  };

  return (
    <span
      ref={host}
      className={`tw-redacted${open ? " is-open" : ""}`}
      onPointerMove={move}
      onPointerLeave={() => {
        last.current = null;
      }}
    >
      <span className="tw-redacted-word">{children}</span>
      <span className="tw-redacted-bar" aria-hidden />
      <span className={`tw-redacted-hint${open ? " is-gone" : ""}`} aria-hidden>
        rub to read
      </span>
    </span>
  );
}
