import { useEffect, useRef, useState } from "react";

type Fiber = {
  ox: number;
  oy: number;
  phase: number;
  amp: number;
  lean: number;
  width: number;
};

const TITLE = "See what the story hides.";

export function ThreadTitle({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const activeRef = useRef(false);
  const fibersRef = useRef<Fiber[]>([]);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const startedRef = useRef(0);
  const enabledRef = useRef(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    enabledRef.current =
      !window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      stopAnimation();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    startedRef.current = performance.now();
    makeFibers();
    startAnimation();
    return stopAnimation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onResize = () => {
      if (activeRef.current) makeFibers();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAnimation() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function makeFibers() {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    const rootRect = root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, Math.ceil(rootRect.width));
    const cssHeight = Math.max(1, Math.ceil(rootRect.height));
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const all: Fiber[] = [];

    for (const word of wordRefs.current) {
      if (!word) continue;
      const wordRect = word.getBoundingClientRect();
      if (!wordRect.width || !wordRect.height) continue;
      const style = window.getComputedStyle(word);
      const fontSize = Number.parseFloat(style.fontSize);
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) continue;

      const wordWidth = Math.max(1, Math.ceil(wordRect.width * dpr));
      const wordHeight = Math.max(1, Math.ceil(Math.max(wordRect.height, fontSize) * dpr));
      offscreen.width = wordWidth;
      offscreen.height = wordHeight;
      offCtx.scale(dpr, dpr);
      offCtx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      offCtx.fillStyle = "#FFFFFF";
      offCtx.textBaseline = "top";
      offCtx.fillText(word.textContent ?? "", 0, 0);

      const image = offCtx.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const step = Math.max(3, Math.round(5 / dpr));
      const offsetX = wordRect.left - rootRect.left;
      const offsetY = wordRect.top - rootRect.top;
      const candidates: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          if (image[(y * offscreen.width + x) * 4 + 3] > 110) {
            candidates.push({ x: offsetX + x / dpr, y: offsetY + y / dpr });
          }
        }
      }

      const perWordCap = 150;
      const stride = candidates.length > perWordCap ? candidates.length / perWordCap : 1;
      for (let index = 0; index < candidates.length; index += stride) {
        const point = candidates[Math.floor(index)];
        if (!point) continue;
        all.push({
          ox: point.x,
          oy: point.y,
          phase: Math.random() * Math.PI * 2,
          amp: 8 + Math.random() * 20,
          lean: (Math.random() - 0.5) * 1.6,
          width: 0.5 + Math.random() * 0.6,
        });
      }
    }

    fibersRef.current = all;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }

  function startAnimation() {
    stopAnimation();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = (now: number) => {
      if (!activeRef.current) return;
      const elapsed = now - startedRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);

      const pointer = pointerRef.current;
      const visible = Math.min(1, elapsed / 180);
      const fibers = fibersRef.current;

      ctx.lineCap = "round";
      for (let index = 0; index < fibers.length; index += 1) {
        const fiber = fibers[index];
        const pullX = (pointer.x - fiber.ox) * 0.13;
        const pullY = (pointer.y - fiber.oy) * 0.13;
        const swayX = Math.sin(elapsed * 0.0022 + fiber.phase) * fiber.amp;
        const swayY = Math.cos(elapsed * 0.0019 + fiber.phase * 1.3) * fiber.amp * 0.55;
        const x = fiber.ox + swayX + pullX + fiber.lean * 8;
        const y = fiber.oy + swayY + pullY;
        const controlX = (fiber.ox + x) / 2 + (y - fiber.oy) * 0.26;
        const controlY = (fiber.oy + y) / 2 - (x - fiber.ox) * 0.2;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * visible})`;
        ctx.lineWidth = fiber.width;
        ctx.moveTo(fiber.ox, fiber.oy);
        ctx.quadraticCurveTo(controlX, controlY, x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.76 * visible})`;
        ctx.arc(x, y, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };
    frameRef.current = window.requestAnimationFrame(draw);
  }

  return (
    <h1
      ref={rootRef}
      className={`thread-title ${className}`}
      onPointerEnter={() => {
        if (enabledRef.current) setActive(true);
      }}
      onPointerMove={(event) => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) return;
        pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      }}
      onPointerLeave={() => setActive(false)}
    >
      {TITLE.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} className="thread-title__word">
          <span
            ref={(node) => {
              wordRefs.current[index] = node;
            }}
            className={`thread-title__word-text ${active ? "is-unravelling" : ""}`}
          >
            {word}
          </span>
          {index < TITLE.split(" ").length - 1 ? " " : null}
        </span>
      ))}
      <canvas ref={canvasRef} className="thread-title__canvas" aria-hidden="true" />
    </h1>
  );
}
