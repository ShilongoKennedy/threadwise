import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BASE_H, BASE_W, place, useDepth } from "./depth";

export type DepthCard = {
  key: string;
  eyebrow: string;
  title: string;
  line?: string;
  tone?: "ink" | "cobalt" | "red";
};

/**
 * Experimental: the same items as a receding line instead of a list.
 * `renderRail` receives the focused index so the page can show detail in sync.
 */
export function DepthLine({
  cards,
  renderRail,
  label,
  backdrop,
  onFocus,
  jumpTo,
}: {
  cards: DepthCard[];
  renderRail?: (focus: number) => React.ReactNode;
  label: string;
  backdrop?: (focus: number) => React.ReactNode;
  onFocus?: (index: number) => void;
  jumpTo?: { index: number; nonce: number };
}) {
  const depth = useDepth(cards.length);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 700 });

  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () =>
      setSize({ w: node.clientWidth || 1200, h: node.clientHeight || 700 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (jumpTo && jumpTo.nonce > 0) depth.jump(jumpTo.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo?.nonce]);

  useEffect(() => {
    onFocus?.(depth.focus);
  }, [depth.focus, onFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        depth.go(event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [depth.go]);

  return (
    <div className={`grid min-h-0 flex-1 grid-cols-1 ${renderRail ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
      <div
        ref={depth.stage}
        role="region"
        aria-label={label}
        tabIndex={0}
        {...depth.bind}
        className="relative min-h-[420px] overflow-hidden outline-none"
        style={{
          background:
            "linear-gradient(transparent 55%, rgba(253,251,247,.9) 100%), linear-gradient(90deg,#f4f1ea 0%,#faf8f3 55%,#fdfbf7 100%)",
          touchAction: "none",
          cursor: depth.dragging ? "grabbing" : "grab",
          userSelect: "none",
          outline: "none",
        }}
      >
        {backdrop && (
          <div className="absolute inset-0 overflow-hidden">{backdrop(depth.focus)}</div>
        )}

        <div ref={box} className="absolute inset-0">
          {cards.map((card, index) => {
            const spot = place(index, depth.p, cards.length, size.w, size.h);
            const active = index === depth.focus;
            return (
              <div
                key={card.key}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: BASE_W,
                  height: BASE_H,
                  transformOrigin: "0 0",
                  transform: `translate3d(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px, 0) scale(${spot.scale.toFixed(4)})`,
                  filter: spot.blur > 0.2 ? `blur(${spot.blur.toFixed(1)}px)` : "none",
                  opacity: spot.opacity,
                  zIndex: 100 - Math.round(spot.depth * 10),
                  pointerEvents: spot.depth > 2 ? "none" : "auto",
                }}
              >
                <button
                  type="button"
                  onClick={() => depth.jump(index)}
                  draggable={false}
                  className={`flex h-full w-full flex-col justify-between border-2 bg-white p-6 text-left transition-colors ${
                    active ? "border-[#1A1A1A]" : "border-[#1A1A1A]/25"
                  }`}
                  style={{
                    boxShadow: active ? "8px 8px 0 0 rgba(26,26,26,.10)" : "none",
                    borderLeftWidth: 8,
                    borderLeftColor:
                      card.tone === "red"
                        ? "#C1121F"
                        : card.tone === "cobalt"
                          ? "#1A4BFF"
                          : "#1A1A1A",
                  }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                    {card.eyebrow}
                  </span>
                  <span className="font-display text-[30px] leading-[1.02] tracking-tight">
                    {card.title}
                  </span>
                  {card.line && (
                    <span className="font-serif text-[14px] leading-[1.5] text-[#1A1A1A]/70">
                      {card.line}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-5 left-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => depth.go(-1)}
            aria-label="Previous"
            className="pointer-events-auto grid h-9 w-9 place-items-center border-2 border-[#1A1A1A] bg-white/80 transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => depth.go(1)}
            aria-label="Next"
            className="pointer-events-auto grid h-9 w-9 place-items-center border-2 border-[#1A1A1A] bg-white/80 transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
            drag · scroll · arrow keys
          </span>
        </div>
      </div>

      {renderRail && (
        <aside className="hidden min-h-0 overflow-y-auto border-l-2 border-[#1A1A1A] bg-[#faf8f3] px-5 py-6 lg:block">
          {renderRail(depth.focus)}
        </aside>
      )}
    </div>
  );
}
