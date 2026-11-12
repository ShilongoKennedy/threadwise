import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/experiment")({
  head: () => ({
    meta: [
      { title: "Threadwise — The load-bearing claim" },
      {
        name: "description",
        content:
          "Every argument has a claim the rest depends on. Threadwise finds it, pulls the thread, and keeps the receipt.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperimentPage,
});

type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
  text: string;
  layer: "outer" | "inner" | "core";
  tone?: "red";
  role: string;
};

const NODES: Node[] = [
  { id: "reason", x: 38, y: 24, label: "Stated reason", text: "Development.", layer: "outer", role: "What the donor says the money is for." },
  { id: "mechanism", x: 38, y: 54, label: "Mechanism", text: "Budget support.", layer: "outer", role: "The route through which money could change behaviour." },
  { id: "claim", x: 58, y: 46, label: "The claim", text: "Aid buys influence.", layer: "core", role: "The sentence the rest of the story depends on." },
  { id: "counter", x: 80, y: 23, label: "Counter-claim", text: "A bribe.", layer: "outer", role: "The opposite description of the same transaction." },
  { id: "evidence", x: 86, y: 53, label: "Evidence", text: "UN vote alignment.", layer: "outer", role: "The observation that would make the claim plausible." },
  { id: "question", x: 48, y: 82, label: "Open question", text: "Does conditionality bite?", layer: "inner", role: "The unresolved condition the claim still needs." },
  { id: "falsifier", x: 70, y: 82, label: "The falsifier", text: "Votes don't move.", layer: "core", tone: "red", role: "The observation that would make the claim fail." },
];

const EDGES = [
  { from: "reason", to: "claim", label: "because", outer: true },
  { from: "mechanism", to: "claim", label: "through", outer: true },
  { from: "counter", to: "claim", label: "or", outer: true },
  { from: "evidence", to: "claim", label: "if", outer: true },
  { from: "claim", to: "falsifier", label: "would break", outer: false, red: true },
  { from: "claim", to: "question", label: "unless", outer: false, dashed: true },
] as const;

const COPY = [
  {
    eyebrow: "Field 01 / the load-bearing claim",
    headline: "Most of an argument is decoration.",
    body: "The rest is load-bearing. Threadwise finds the sentence the argument cannot survive without.",
  },
  {
    eyebrow: "01 / pull the thread",
    headline: "Not every claim carries the weight.",
    body: "The claims around the centre are not equally important. Some hold the argument up. Most only decorate it.",
  },
  {
    eyebrow: "02 / what remains",
    headline: "This is what has to be true.",
    body: "If aid does not change behaviour, the story can still be moving. It just cannot be true in the way it claims.",
  },
  {
    eyebrow: "03 / the claim",
    headline: "Aid buys influence.",
    body: "One sentence. One falsifier. A record that can be checked.",
  },
] as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (edge0: number, edge1: number, value: number) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

function ExperimentPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const element = scrollRef.current;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const spacer = element.querySelector<HTMLElement>("[data-scroll-spacer]");
      const total = spacer?.offsetHeight ?? 1;
      setProgress(clamp((window.scrollY - top) / Math.max(1, total)));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const phase = progress < 0.28 ? 0 : progress < 0.58 ? 1 : progress < 0.82 ? 2 : 3;
  const copy = COPY[phase]!;
  const outerOpacity = 1 - smooth(0.18, 0.52, progress);
  const innerOpacity = 1 - smooth(0.48, 0.78, progress);
  const coreScale = 1 + progress * 0.16;
  const falsifierScale = 1 + progress * 0.06;
  const hoveredNode = NODES.find((node) => node.id === hovered) ?? null;
  const chapter = phase === 0 ? 0 : phase === 3 ? 2 : 1;

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: (event.clientX - bounds.left) / bounds.width - 0.5,
      y: (event.clientY - bounds.top) / bounds.height - 0.5,
    });
  };

  return (
    <div className="lab-root min-h-[100dvh]">
      <style>{`
        .lab-root {
          --ink: #070706;
          --bone: #E9E0D0;
          --oxide: #B6432E;
          --dim: #8E8475;
          background: var(--ink);
          color: var(--bone);
        }
        .lab-serif {
          font-family: "Bodoni 72", Didot, "Times New Roman", serif;
          font-weight: 400;
          letter-spacing: -0.035em;
        }
        .lab-sans {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .lab-mono {
          font-family: "Courier New", Courier, monospace;
        }
        .lab-stage::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.15;
          background-image: radial-gradient(rgba(233, 224, 208, 0.45) 0.5px, transparent 0.55px);
          background-size: 5px 5px;
        }
        .lab-node {
          transition: opacity 220ms linear, transform 280ms ease-out;
          will-change: transform, opacity;
        }
        .lab-float {
          animation: labFloat 8s ease-in-out infinite;
        }
        .lab-orbit {
          animation: labOrbit 80s linear infinite;
        }
        @keyframes labFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -7px, 0); }
        }
        @keyframes labOrbit {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lab-float, .lab-orbit { animation: none; }
        }
        .lab-link {
          text-decoration-color: var(--oxide);
          text-decoration-thickness: 2px;
          text-underline-offset: 5px;
        }
        .lab-link:hover { color: var(--oxide); }
        .lab-focus:focus-visible { outline: 2px solid var(--oxide); outline-offset: 4px; }
        ::selection { background: var(--oxide); color: var(--bone); }
      `}</style>

      <header className="sticky top-0 z-50 h-[61px] border-b border-[#E9E0D0]/15 bg-[#070706]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8">
          <Link to="/" className="lab-sans flex items-baseline gap-3">
            <span className="text-[13px] font-semibold tracking-[0.22em]">THREADWISE</span>
            <span className="lab-mono hidden text-[8px] uppercase tracking-[0.15em] text-[#E9E0D0]/35 sm:inline">
              a thinking instrument
            </span>
          </Link>
          <nav className="lab-mono hidden items-center gap-7 text-[9px] uppercase tracking-[0.15em] text-[#E9E0D0]/55 md:flex">
            <Link to="/analyst" className="hover:text-[#E9E0D0]">Analyst</Link>
            <Link to="/seminar" className="hover:text-[#E9E0D0]">Seminar</Link>
            <Link to="/digest" className="hover:text-[#E9E0D0]">Record</Link>
          </nav>
          <Link
            to="/analyst"
            className="lab-focus lab-mono border border-[#E9E0D0]/40 px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#E9E0D0] transition-colors hover:border-[#E9E0D0] hover:bg-[#E9E0D0] hover:text-[#070706]"
          >
            Begin →
          </Link>
        </div>
      </header>

      <div ref={scrollRef} className="relative">
        <div className="lab-stage sticky top-[61px] grid h-[calc(100svh-61px)] grid-rows-[0.82fr_1.18fr] overflow-hidden lg:block">
          <div className="relative z-20 order-1 flex flex-col justify-between border-b border-[#E9E0D0]/15 bg-[#070706] px-5 py-6 md:px-8 md:py-8 lg:absolute lg:bottom-0 lg:left-0 lg:w-[400px] lg:border-b-0 lg:bg-gradient-to-tr lg:from-[#070706] lg:via-[#070706]/92 lg:to-transparent lg:px-8 lg:pb-8 lg:pt-24">
            <div className="flex flex-wrap items-center gap-3">
              <span className="lab-mono border border-[#E9E0D0]/20 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-[#E9E0D0]/55">
                {copy.eyebrow}
              </span>
            </div>

            <div className="mt-5 lg:mt-0">
              <h1 className="lab-serif max-w-[12ch] text-[38px] leading-[0.92] sm:text-[48px] lg:text-[46px] min-[1400px]:text-[52px]">
                {copy.headline}
              </h1>
              <p className="lab-sans mt-4 max-w-[34ch] text-[13px] leading-[1.5] text-[#E9E0D0]/60 md:text-[14px]">
                {copy.body}
              </p>

              <div
                className="mt-6 flex flex-wrap items-center gap-4 transition-opacity duration-300"
                style={{ opacity: progress > 0.74 ? 1 : 0, pointerEvents: progress > 0.74 ? "auto" : "none" }}
              >
                <Link
                  to="/analyst"
                  className="lab-focus lab-mono bg-[#E9E0D0] px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#070706] transition-colors hover:bg-[#B6432E] hover:text-[#E9E0D0]"
                >
                  Bring a source →
                </Link>
                <Link
                  to="/seminar"
                  className="lab-focus lab-mono lab-link text-[9px] uppercase tracking-[0.12em] text-[#E9E0D0]/60"
                >
                  Put a quote on trial
                </Link>
              </div>
            </div>

            <div className="mt-8 border-t border-[#E9E0D0]/15 pt-3">
              <div className="mb-3 flex items-center gap-4">
                {["Surface", "Structure", "Claim"].map((label, index) => (
                  <span
                    key={label}
                    className={`lab-mono text-[8px] uppercase tracking-[0.12em] transition-colors ${
                      index === chapter ? "text-[#B6432E]" : "text-[#E9E0D0]/25"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")} {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E9E0D0]/35">
                <span>Pull the thread</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="mt-2 h-px w-full bg-[#E9E0D0]/15">
                <div className="h-px bg-[#B6432E] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="lab-mono mt-3 text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#E9E0D0]/30">
                Scroll
                <br />
                to strip the decoration
              </p>
            </div>
          </div>

          <div
            className="relative order-2 overflow-hidden lg:absolute lg:inset-0"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setPointer({ x: 0, y: 0 })}
          >
            <div
              aria-hidden
              className="lab-orbit pointer-events-none absolute left-[58%] top-[46%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E9E0D0]/10 sm:h-[460px] sm:w-[460px] lg:h-[540px] lg:w-[540px]"
            >
              <span className="absolute inset-4 rounded-full border border-dashed border-[#E9E0D0]/8" />
              <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6432E]/70" />
            </div>

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              {EDGES.map((edge) => {
                const a = NODES.find((node) => node.id === edge.from)!;
                const b = NODES.find((node) => node.id === edge.to)!;
                const connected = hovered === edge.from || hovered === edge.to;
                const opacity = edge.red
                  ? 0.25 + progress * 0.75
                  : edge.outer
                    ? outerOpacity * 0.35
                    : innerOpacity * 0.4;
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={edge.red ? "#B6432E" : "#E9E0D0"}
                    strokeWidth={edge.red ? 1.4 : 0.7}
                    strokeDasharray={edge.dashed ? "1.5 2.5" : undefined}
                    pathLength={edge.red ? 1 : undefined}
                    strokeDashoffset={edge.red ? 1 - progress : undefined}
                    vectorEffect="non-scaling-stroke"
                    style={{ opacity: Math.min(1, opacity * (connected ? 1.9 : 1)) }}
                    className={edge.outer || edge.from === "question" || edge.to === "question" ? "hidden sm:block" : ""}
                  />
                );
              })}
              <circle r="0.55" fill="#B6432E" opacity={0.35 + progress * 0.65}>
                <animateMotion dur="4.5s" repeatCount="indefinite" path="M 58 46 L 70 82" />
              </circle>
            </svg>

            {EDGES.map((edge) => {
              const a = NODES.find((node) => node.id === edge.from)!;
              const b = NODES.find((node) => node.id === edge.to)!;
              const connected = hovered === edge.from || hovered === edge.to;
              const opacity = edge.outer ? outerOpacity : innerOpacity;
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              return (
                <span
                  key={`label-${edge.from}-${edge.to}`}
                  className="lab-mono pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 bg-[#070706] px-1 text-[7px] uppercase tracking-[0.12em] text-[#E9E0D0]/35 md:block"
                  style={{ left: `${midX}%`, top: `${midY}%`, opacity: Math.min(1, opacity * (connected ? 1.6 : 0.8)) }}
                >
                  {edge.label}
                </span>
              );
            })}

            {NODES.map((node, index) => {
              const isCore = node.layer === "core";
              const isInner = node.layer === "inner";
              const isHovered = hovered === node.id;
              const opacity = isCore ? 1 : isInner ? innerOpacity : outerOpacity;
              const scale = (isCore
                ? node.id === "falsifier"
                  ? falsifierScale
                  : coreScale
                : 1 - progress * 0.08) * (isHovered ? 1.04 : 1);
              const depth = isCore ? 7 : 13;
              const transform = `translate(-50%, -50%) translate(${pointer.x * depth}px, ${pointer.y * depth}px) scale(${scale})`;

              return (
                <div
                  key={node.id}
                  className={`lab-node pointer-events-none absolute ${isCore ? "z-20" : "z-10"} ${
                    node.layer === "outer" || node.id === "question" ? "hidden sm:block" : ""
                  }`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    opacity,
                    transform,
                  }}
                >
                  <div className="lab-float" style={{ animationDelay: `-${index * 1.3}s` }}>
                    <button
                      type="button"
                      aria-pressed={isHovered}
                      aria-label={`${node.label}: ${node.text}. ${node.role}`}
                      onPointerEnter={() => setHovered(node.id)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered(node.id)}
                      onBlur={() => setHovered(null)}
                      onClick={() => setHovered(node.id)}
                      className={`lab-focus pointer-events-auto block cursor-default text-center ${
                        isCore ? "w-[260px] sm:w-[380px]" : "w-[150px] sm:w-[180px]"
                      }`}
                    >
                      <span
                        className={`lab-mono block text-[8px] uppercase tracking-[0.16em] transition-colors ${
                          isHovered
                            ? "text-[#E9E0D0]"
                            : node.tone === "red"
                              ? "text-[#B6432E]"
                              : "text-[#E9E0D0]/35"
                        }`}
                      >
                        {node.label}
                      </span>
                      <span
                        className={`lab-serif mt-1 block leading-[1.05] transition-colors ${
                          node.id === "claim"
                            ? "text-[30px] sm:text-[44px]"
                            : node.id === "falsifier"
                              ? "text-[19px] sm:text-[22px] text-[#B6432E]"
                              : "text-[17px] sm:text-[19px] text-[#E9E0D0]/75"
                        } ${isHovered && node.id !== "falsifier" ? "text-[#E9E0D0]" : ""}`}
                      >
                        {node.text}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pointer-events-none absolute right-4 top-4 z-20 hidden max-w-[280px] border-t border-[#E9E0D0]/15 pt-2 sm:right-6 sm:top-6 md:block">
              <p className={`lab-mono text-[8px] uppercase tracking-[0.14em] ${hoveredNode ? "text-[#B6432E]" : "text-[#E9E0D0]/30"}`}>
                {hoveredNode ? hoveredNode.label : "The load-bearing graph"}
              </p>
              <p className="lab-sans mt-1 text-[11px] leading-[1.4] text-[#E9E0D0]/55">
                {hoveredNode ? hoveredNode.role : "Hover a node. Pull the thread to strip the argument."}
              </p>
            </div>

            <div className="lab-mono pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 text-[7px] uppercase tracking-[0.14em] text-[#E9E0D0]/25 sm:bottom-6 sm:right-6">
              <span className="h-1 w-1 rounded-full bg-[#B6432E]" />
              sample argument / not a news event
            </div>
          </div>
        </div>
        <div data-scroll-spacer className="h-[240vh]" aria-hidden />

        <section id="instrument" className="relative z-30 min-h-[100svh] border-t border-[#E9E0D0]/15 bg-[#E9E0D0] px-5 py-16 text-[#070706] md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="lab-mono border-t border-[#070706]/20 pt-3 text-[9px] uppercase tracking-[0.16em] text-[#070706]/45">
            02 / The instrument
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <h2 className="lab-serif max-w-[13ch] text-[52px] leading-[0.88] md:text-[76px]">
              The graph is the argument.
            </h2>
            <p className="lab-sans max-w-[35ch] text-[14px] leading-[1.55] text-[#070706]/60">
              Threadwise reads a source, names the claims, tests the mechanism, and keeps the
              falsifier. The point is not another opinion. The point is a claim you can check.
            </p>
          </div>

          <div className="mt-12 grid border-t border-[#070706]/20 md:grid-cols-3">
            {[
              { to: "/analyst", label: "01 / Read", title: "Bring a source.", body: "A link, a quote, a PDF. Get the machinery, not the mood." },
              { to: "/seminar", label: "02 / Doubt", title: "Put it on trial.", body: "Two steelmanned theories. One crux. Commit before the verdict." },
              { to: "/digest", label: "03 / Record", title: "Keep the receipt.", body: "Claims, questions, predictions. Score the misses, not only the hits." },
            ].map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={`lab-focus group py-5 md:px-6 md:py-6 ${index > 0 ? "border-t border-[#070706]/15 md:border-l md:border-t-0" : "md:pl-0"}`}
              >
                <p className="lab-mono text-[8px] uppercase tracking-[0.14em] text-[#070706]/40">{item.label}</p>
                <p className="lab-serif mt-3 text-[28px] leading-none group-hover:text-[#B6432E]">{item.title}</p>
                <p className="lab-sans mt-3 max-w-[32ch] text-[12px] leading-[1.5] text-[#070706]/55">{item.body}</p>
                <span className="lab-mono mt-4 inline-block border-b border-[#B6432E] pb-0.5 text-[8px] uppercase tracking-[0.12em] group-hover:text-[#B6432E]">
                  Open →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[#070706]/20 pt-4">
            <p className="lab-mono max-w-[42ch] text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#070706]/35">
              A claim you cannot falsify is not a belief. It is furniture.
            </p>
            <Link
              to="/analyst"
              className="lab-focus lab-mono bg-[#070706] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#E9E0D0] transition-colors hover:bg-[#B6432E]"
            >
              Bring a source →
            </Link>
          </div>
        </div>
        </section>
      </div>

      <footer className="border-t border-[#E9E0D0]/15 px-5 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E9E0D0]/35">
            Threadwise / a thinking instrument / experiment 01
          </p>
          <div className="lab-mono flex gap-5 text-[8px] uppercase tracking-[0.12em] text-[#E9E0D0]/40">
            <Link to="/" className="hover:text-[#E9E0D0]">Current site</Link>
            <Link to="/seminar" className="hover:text-[#E9E0D0]">Seminar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
