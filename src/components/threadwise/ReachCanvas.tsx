import { useEffect, useRef } from "react";

const TEXT =
  "The IAEA sent a confidential report to member states. The contents are unpublished. Inspectors have not been allowed back to the sites bombed in June 2025. The stockpile figure is unknown.";

type Word = {
  text: string;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  pinned: boolean;
};

type Props = {
  held: boolean;
};

export function ReachCanvas({ held }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heldRef = useRef(held);

  useEffect(() => {
    heldRef.current = held;
  }, [held]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let words: Word[] = [];
    let width = 0;
    let height = 0;
    let pointer = { x: -1000, y: -1000, active: false };
    let reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = width < 640;
      const fontSize = mobile ? 26 : 40;
      const lineHeight = mobile ? 35 : 55;
      const margin = mobile ? 24 : 148;
      const maxWidth = width - margin * 2;
      ctx.font = `${fontSize}px Newsreader, Georgia, serif`;
      ctx.textBaseline = "alphabetic";

      const tokens = TEXT.split(" ");
      const next: Word[] = [];
      let x = margin;
      let y = mobile ? 390 : 500;
      for (const token of tokens) {
        const tokenWidth = ctx.measureText(token).width;
        if (x > margin && x + tokenWidth > margin + maxWidth) {
          x = margin;
          y += lineHeight;
        }
        next.push({
          text: token,
          homeX: x,
          homeY: y,
          x,
          y,
          vx: 0,
          vy: 0,
          width: tokenWidth,
          pinned: false,
        });
        x += tokenWidth + ctx.measureText(" ").width;
      }
      words = next;
    };

    const onResize = () => {
      layout();
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };
    window.addEventListener("resize", onResize);
    layout();

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const mobile = width < 640;
      const fontSize = mobile ? 26 : 40;
      const hit = words.find(
        (word) =>
          px > word.x - 4 &&
          px < word.x + word.width + 4 &&
          py > word.y - fontSize &&
          py < word.y + 8,
      );
      if (!hit) return;
      hit.pinned = !hit.pinned;
      if (hit.pinned) {
        hit.y = hit.homeY;
        hit.vy = 0;
      }
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const mobile = width < 640;
      const fontSize = mobile ? 26 : 40;
      const lineHeight = mobile ? 35 : 55;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px Newsreader, Georgia, serif`;
      ctx.textBaseline = "alphabetic";

      for (const word of words) {
        word.x = word.homeX;

        if (pointer.active && !heldRef.current && !word.pinned && !reduce) {
          const centerX = word.homeX + word.width / 2;
          const dx = centerX - pointer.x;
          const dy = word.homeY - pointer.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const radius = mobile ? 150 : 210;
          if (distance < radius) {
            const force = (1 - distance / radius) * (mobile ? 1.2 : 1.7);
            const direction = word.homeY >= pointer.y ? 1 : -1;
            word.vy += direction * force;
          }
        }

        if (word.pinned) {
          word.y += (word.homeY - word.y) * 0.2;
          word.vy = 0;
        } else {
          word.vy += (word.homeY - word.y) * 0.045;
          word.vy *= 0.84;
          word.y += word.vy;
        }

        ctx.fillStyle = word.pinned ? "#3F5BFF" : "#F4EBDD";
        ctx.fillText(word.text, word.homeX, word.y);
      }

      if (pointer.active && !reduce) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, mobile ? 22 : 30, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 90, 60, 0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-label="A paragraph whose words move away from the cursor. Click a word to pin it." />;
}
