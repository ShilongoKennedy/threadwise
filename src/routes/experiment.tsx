import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/experiment")({
  head: () => ({
    meta: [
      { title: "Threadwise — Every claim has a geography" },
      {
        name: "description",
        content:
          "A read in places. Threadwise traces the locations, institutions and routes a claim depends on.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperimentPage,
});

/** Equirectangular projection used by Natural Earth's 1:110m boundaries. */
function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * 1000, ((90 - lat) / 180) * 500];
}

const PLACES = {
  vienna: project(16.3738, 48.2082),
  tehran: project(51.389, 35.6892),
  natanz: project(51.726, 33.724),
  washington: project(-77.0369, 38.9072),
};

const ROUTES = [
  { d: `M ${PLACES.washington[0]} ${PLACES.washington[1]} Q 380 72 ${PLACES.vienna[0]} ${PLACES.vienna[1]}`, label: "the board" },
  { d: `M ${PLACES.vienna[0]} ${PLACES.vienna[1]} Q 610 112 ${PLACES.tehran[0]} ${PLACES.tehran[1]}`, label: "the report" },
  { d: `M ${PLACES.tehran[0]} ${PLACES.tehran[1]} Q 652 148 ${PLACES.natanz[0]} ${PLACES.natanz[1]}`, label: "the site" },
];

function ExperimentPage() {
  return (
    <div className="atlas-root min-h-[100svh]">
      <style>{`
        .atlas-root {
          --ink: #0D0C0A;
          --bone: #E9DFCE;
          --copper: #B56A3D;
          --dim: #8D8375;
          background: var(--ink);
          color: var(--bone);
        }
        .atlas-serif {
          font-family: "Iowan Old Style", "Baskerville", "Palatino Linotype", Palatino, Georgia, serif;
          font-weight: 400;
          letter-spacing: -0.035em;
        }
        .atlas-sans { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .atlas-mono { font-family: "Courier New", Courier, monospace; }
        .atlas-map {
          opacity: 0.7;
          mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 100%);
        }
        .atlas-label {
          font-family: "Courier New", Courier, monospace;
          font-size: 7px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          fill: rgba(233, 223, 206, 0.8);
        }
        .atlas-label-strong { fill: rgba(233, 223, 206, 1); }
        .atlas-route {
          fill: none;
          stroke: var(--copper);
          stroke-width: 1.7;
          stroke-dasharray: 4 5;
          animation: atlasDash 26s linear infinite;
          vector-effect: non-scaling-stroke;
        }
        .atlas-route-solid {
          fill: none;
          stroke: var(--copper);
          stroke-width: 1.7;
          vector-effect: non-scaling-stroke;
        }
        .atlas-pin {
          fill: var(--copper);
          stroke: var(--ink);
          stroke-width: 0.8;
        }
        .atlas-pin-ring {
          fill: none;
          stroke: var(--copper);
          stroke-width: 0.9;
          opacity: 0.8;
        }
        .atlas-pulse {
          fill: none;
          stroke: var(--copper);
          stroke-width: 0.7;
          transform-box: fill-box;
          transform-origin: center;
          animation: atlasPulse 3.8s ease-out infinite;
        }
        @keyframes atlasDash { to { stroke-dashoffset: -40; } }
        @keyframes atlasPulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .atlas-focus:focus-visible { outline: 2px solid var(--copper); outline-offset: 4px; }
        ::selection { background: var(--copper); color: var(--bone); }
        @media (max-width: 767px) {
          .atlas-shift { transform: translateX(-24%); }
          .atlas-label { display: none; }
          .atlas-overlay { display: none; }
          .atlas-map {
            opacity: 0.8;
            mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .atlas-route, .atlas-pulse { animation: none; }
        }
      `}</style>

      <header className="absolute inset-x-0 top-0 z-40 border-b border-[#E9DFCE]/15">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-3.5 md:px-10">
          <Link to="/" className="atlas-sans flex items-baseline gap-3">
            <span className="text-[13px] font-semibold tracking-[0.22em]">THREADWISE</span>
            <span className="atlas-mono hidden text-[8px] uppercase tracking-[0.16em] text-[#E9DFCE]/35 sm:inline">
              the atlas / 01
            </span>
          </Link>
          <nav className="atlas-mono hidden items-center gap-7 text-[9px] uppercase tracking-[0.15em] text-[#E9DFCE]/55 md:flex">
            <Link to="/analyst" className="hover:text-[#E9DFCE]">Read</Link>
            <Link to="/seminar" className="hover:text-[#E9DFCE]">Seminar</Link>
            <Link to="/digest" className="hover:text-[#E9DFCE]">Record</Link>
          </nav>
          <Link
            to="/analyst"
            className="atlas-focus atlas-mono border border-[#E9DFCE]/40 px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#E9DFCE] transition-colors hover:border-[#E9DFCE] hover:bg-[#E9DFCE] hover:text-[#0D0C0A]"
          >
            Begin →
          </Link>
        </div>
      </header>

      <main className="relative min-h-[100svh] overflow-hidden">
        <section className="relative min-h-[100svh] overflow-hidden pt-[61px]">
          <div className="atlas-map atlas-shift absolute inset-0">
            <svg
              viewBox="0 0 1000 500"
              preserveAspectRatio="xMidYMid slice"
              className="h-full w-full"
              aria-hidden
            >
              <rect width="1000" height="500" fill="#0D0C0A" />

              <g stroke="#E9DFCE" strokeWidth="0.18" opacity="0.09" vectorEffect="non-scaling-stroke">
                {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
                  const x = ((lon + 180) / 360) * 1000;
                  return <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2="500" />;
                })}
                {[-60, -30, 0, 30, 60].map((lat) => {
                  const y = ((90 - lat) / 180) * 500;
                  return <line key={`lat-${lat}`} x1="0" y1={y} x2="1000" y2={y} />;
                })}
              </g>

              <image href="/world-dots.svg" x="0" y="0" width="1000" height="500" opacity="0.62" />

            </svg>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#0D0C0A_0%,rgba(13,12,10,0.92)_34%,rgba(13,12,10,0.35)_62%,transparent_82%)] max-md:bg-[linear-gradient(180deg,rgba(13,12,10,0.92)_0%,rgba(13,12,10,0.6)_62%,rgba(13,12,10,0.15)_100%)]" />
          <svg
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid slice"
            className="atlas-overlay atlas-shift pointer-events-none absolute inset-0 z-10 h-full w-full"
            aria-hidden
          >
            <path d={`M ${PLACES.vienna[0]} ${PLACES.vienna[1]} Q 610 112 ${PLACES.tehran[0]} ${PLACES.tehran[1]}`} className="atlas-route" />
            <g>
              <circle cx={PLACES.vienna[0]} cy={PLACES.vienna[1]} r="5.5" className="atlas-pin-ring" />
              <circle cx={PLACES.vienna[0]} cy={PLACES.vienna[1]} r="2.1" className="atlas-pin" />
              <text
                x={PLACES.vienna[0] - 2}
                y={PLACES.vienna[1] - 13}
                textAnchor="end"
                className="atlas-label atlas-label-strong"
                stroke="#0D0C0A"
                strokeWidth="2"
                paintOrder="stroke"
              >
                Vienna / IAEA
              </text>
            </g>
            <g>
              <circle cx={PLACES.tehran[0]} cy={PLACES.tehran[1]} r="5.5" className="atlas-pin-ring" />
              <circle cx={PLACES.tehran[0]} cy={PLACES.tehran[1]} r="2.1" className="atlas-pin" />
              <circle cx={PLACES.tehran[0]} cy={PLACES.tehran[1]} r="4" className="atlas-pulse" />
              <text
                x={PLACES.tehran[0] + 10}
                y={PLACES.tehran[1] + 2}
                textAnchor="start"
                className="atlas-label atlas-label-strong"
                stroke="#0D0C0A"
                strokeWidth="2"
                paintOrder="stroke"
              >
                Tehran
              </text>
            </g>
            <text
              x={(PLACES.vienna[0] + PLACES.tehran[0]) / 2}
              y={(PLACES.vienna[1] + PLACES.tehran[1]) / 2 - 12}
              textAnchor="middle"
              className="atlas-label"
              style={{ fill: "#B56A3D", fontSize: 6 }}
              stroke="#0D0C0A"
              strokeWidth="2"
              paintOrder="stroke"
            >
              the report
            </text>
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(0deg,#0D0C0A_0%,rgba(13,12,10,0.75)_45%,transparent_100%)] md:h-[28%]" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-61px)] w-full max-w-[1600px] flex-col justify-between px-5 py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="atlas-mono border border-[#E9DFCE]/25 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-[#E9DFCE]/60">
                The atlas / field 01
              </span>
              <span className="atlas-mono text-[8px] uppercase tracking-[0.14em] text-[#E9DFCE]/35">
                A read in places
              </span>
            </div>

            <div className="max-w-[640px] pb-8 md:pb-16">
              <h1 className="atlas-serif text-[52px] leading-[0.9] sm:text-[68px] md:text-[82px] lg:text-[96px]">
                Every claim
                <br />
                has a
                <br />
                geography.
              </h1>
              <p className="atlas-sans mt-6 max-w-[43ch] text-[14px] leading-[1.55] text-[#E9DFCE]/65 md:text-[16px]">
                A read is not only a story. It has places, institutions and routes. Threadwise
                traces them, then shows what would have to move for the claim to be true.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to="/analyst"
                  className="atlas-focus atlas-mono bg-[#E9DFCE] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0D0C0A] transition-colors hover:bg-[#B56A3D] hover:text-[#E9DFCE]"
                >
                  Read a source →
                </Link>
                <Link
                  to="/seminar"
                  className="atlas-focus atlas-mono atlas-link text-[10px] uppercase tracking-[0.12em] text-[#E9DFCE]/65"
                >
                  Put a quote on trial ↗
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5 border-t border-[#E9DFCE]/15 pt-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 atlas-mono text-[8px] uppercase tracking-[0.12em] text-[#E9DFCE]/40">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B56A3D]" /> the claim
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-px w-5 bg-[#E9DFCE]/50" /> evidence
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-px w-5 border-t border-dashed border-[#B56A3D]" /> what would settle it
                </span>
              </div>
              <div className="text-left atlas-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#E9DFCE]/35 md:text-right">
                <p className="text-[#E9DFCE]/60">Fig. 01 — IAEA / Iran</p>
                <p>Vienna · Tehran · Natanz · Washington</p>
                <p>09 Nov 2026</p>
              </div>
            </div>

            <p className="mt-4 atlas-mono text-[7px] uppercase tracking-[0.12em] text-[#E9DFCE]/20">
              Geography: Natural Earth 1:110m · equirectangular · sample read
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
