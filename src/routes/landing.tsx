import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SignatureHeadline } from "@/components/threadwise/SignatureHeadline";
import { ATLAS_LOCATIONS, GeoGlobe } from "@/components/record/GeoGlobe";
import { GlassHeader } from "@/components/threadwise/GlassHeader";
import { AtlasDock } from "@/components/threadwise/AtlasDock";


export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Landing experiment — Threadwise" },
      {
        name: "description",
        content:
          "Paste a link, a PDF or a screenshot. Threadwise shows the framing, checks the claims against primary sources, and tells you what would prove the read wrong.",
      },
      { property: "og:title", content: "Landing experiment — Threadwise" },
      {
        property: "og:description",
        content:
          "Paste a link, a PDF or a screenshot. Threadwise shows the framing, checks the claims against primary sources, and tells you what would prove the read wrong.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://threadwise-beta.vercel.app/" },
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Landing experiment — Threadwise" },
      {
        name: "twitter:description",
        content:
          "Paste a link, a PDF or a screenshot. Threadwise shows the framing, checks the claims against primary sources, and tells you what would prove the read wrong.",
      },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
  component: LandingExperiment,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const LOOP = [
  {
    n: "01",
    title: "Read the move",
    body: "A link, a PDF, a screenshot. The read separates what happened from what the source wants you to think happened.",
  },
  {
    n: "02",
    title: "Keep the questions",
    body: "File evidence for and against. When a question is one-sided, the record says so instead of pretending it is settled.",
  },
  {
    n: "03",
    title: "Predict and score",
    body: "Date a claim, come back when it resolves. The record keeps the Brier score, not only the hits.",
  },
  {
    n: "04",
    title: "Practise the gap",
    body: "A weekly drill targets the falsifier or steelman you are weakest at, then shows whether you are improving.",
  },
] as const;

const PLACE_INDEX = [
  { id: "vienna", no: "01", name: "Vienna / IAEA", coords: "48.2N 16.4E", note: "The confidential report is circulated to the Board of Governors." },
  { id: "tehran", no: "02", name: "Tehran", coords: "35.7N 51.4E", note: "The government that must let the inspectors back in." },
  { id: "natanz", no: "03", name: "Natanz", coords: "33.7N 51.7E", note: "One of the enrichment sites the report cannot verify." },
] as const;

const LOCATION_CONTEXT: Record<string, {
  number: string;
  name: string;
  coords: string;
  description: string;
  featured: string;
  connected: string;
  status: string;
}> = {
  vienna: {
    number: "01",
    name: "VIENNA",
    coords: "48.2°N 16.4°E",
    description: "International Atomic Energy Agency.",
    featured: "IAEA–Iran: The demand, the permission and the unanswered questions.",
    connected: "Vienna · Tehran · Natanz",
    status: "ACTIVE CASE",
  },
  tehran: {
    number: "02",
    name: "TEHRAN",
    coords: "35.7°N 51.4°E",
    description: "The government that controls the permission.",
    featured: "The demand is public. The permission is not.",
    connected: "Vienna · Tehran · Natanz",
    status: "PERMISSION HELD",
  },
  natanz: {
    number: "03",
    name: "NATANZ",
    coords: "33.7°N 51.7°E",
    description: "An enrichment site the record cannot yet verify.",
    featured: "The site is known. The answer is still missing.",
    connected: "Vienna · Tehran · Natanz",
    status: "UNVERIFIED",
  },
};

function LandingExperiment() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) setSelected("vienna");
  }, []);

  const selectedLocation = selected
    ? ATLAS_LOCATIONS.find((location) => location.id === selected)
    : undefined;
  const context = selected ? LOCATION_CONTEXT[selected] : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#080604] font-sans text-[#F4EBDD] selection:bg-[#1A4BFF] selection:text-white">
      <main className="relative h-full w-full overflow-hidden">
        <section className="atlas-page relative h-full w-full overflow-hidden">
          {/* architectural atmosphere */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#382416_0%,#170e09_46%,#050403_100%)]" />
            <div className="absolute left-1/2 top-[42%] h-[58%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(216,158,94,0.18),transparent_64%)] blur-2xl" />
            <div className="absolute inset-y-0 left-0 w-[15%] bg-[linear-gradient(90deg,#030201_0%,#160e09_38%,rgba(22,14,9,0)_100%)] opacity-90" />
            <div className="absolute inset-y-0 right-0 w-[15%] bg-[linear-gradient(270deg,#030201_0%,#160e09_38%,rgba(22,14,9,0)_100%)] opacity-90" />
            <div className="absolute inset-y-0 left-[3%] w-[7%] border-r border-[#C49A67]/10 bg-[linear-gradient(90deg,#030201_0%,#24160e_52%,#070403_100%)] opacity-80" />
            <div className="absolute inset-y-0 right-[3%] w-[7%] border-l border-[#C49A67]/10 bg-[linear-gradient(270deg,#030201_0%,#24160e_52%,#070403_100%)] opacity-80" />
            <div className="atlas-column absolute inset-y-0 left-[13%] w-px bg-[#C49A67]/15" />
            <div className="atlas-column absolute inset-y-0 right-[13%] w-px bg-[#C49A67]/15" />
            <div className="absolute left-[18%] top-[-20%] h-[125%] w-[34%] rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(235,185,125,0.09),transparent)] blur-2xl" />
            <div className="absolute right-[10%] top-[-10%] h-[120%] w-[22%] -rotate-[17deg] bg-[linear-gradient(90deg,transparent,rgba(235,185,125,0.06),transparent)] blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(214,158,97,0.24),transparent_58%),linear-gradient(0deg,#030201_0%,#22150d_70%,transparent_100%)]" />
            <div className="absolute bottom-[12%] left-1/2 h-[34%] w-[24%] -translate-x-1/2 bg-[linear-gradient(0deg,rgba(245,200,140,0.11),transparent)] blur-2xl" />
            <div className="absolute left-1/2 top-[73%] h-[8%] w-[35%] -translate-x-1/2 rounded-[50%] border border-[#E8C28D]/35 bg-[radial-gradient(ellipse_at_50%_50%,rgba(244,206,151,0.24),transparent_66%)] shadow-[0_0_120px_rgba(193,138,79,0.28)]" />
            <div className="absolute left-1/2 top-[78%] h-[1.8%] w-[22%] -translate-x-1/2 rounded-[50%] bg-[#F1C98E]/20 blur-xl" />
            <svg viewBox="0 0 240 420" className="pointer-events-none absolute bottom-[15%] left-0 z-0 h-[42%] w-[20%] opacity-45" aria-hidden="true">
              <g fill="#24301D">
                <path d="M20 400 C40 300 68 225 145 160 C105 210 75 280 55 400 Z" />
                <path d="M54 382 C70 285 110 205 188 142 C142 200 100 276 87 382 Z" opacity=".75" />
                <path d="M92 360 C118 280 166 216 222 174 C176 236 138 300 125 366 Z" opacity=".6" />
                <path d="M36 320 C55 250 102 193 168 150 C120 200 80 256 62 330 Z" opacity=".65" />
                <path d="M80 300 C106 245 148 205 203 178 C160 220 126 260 108 306 Z" opacity=".45" />
              </g>
            </svg>
            <svg viewBox="0 0 200 360" className="pointer-events-none absolute bottom-[20%] right-0 z-0 h-[32%] w-[15%] opacity-35" aria-hidden="true">
              <g fill="#1F2A19">
                <path d="M190 340 C165 275 126 225 58 180 C105 220 145 270 165 342 Z" />
                <path d="M168 330 C142 270 112 230 44 195 C92 230 130 280 145 332 Z" opacity=".68" />
                <path d="M140 310 C118 260 90 230 30 205 C75 235 106 270 120 312 Z" opacity=".5" />
              </g>
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_12%,rgba(0,0,0,0.44)_78%)]" />
          </div>

          {/* globe */}
          <div className="absolute inset-0 z-10">
            <GeoGlobe selectedId={selected} onSelect={setSelected} />
          </div>

          <GlassHeader section="atlas" />

          {/* introduction */}
          <div
            className={`atlas-intro pointer-events-none absolute left-[7.2%] top-[17%] z-30 w-[25%] max-w-[410px] transition-all duration-500 max-md:left-5 max-md:right-5 max-md:top-[14%] max-md:w-auto ${selected ? "max-md:pointer-events-none max-md:opacity-0" : ""}`}
          >
            <p className="inline-block border-b border-[#C49A67]/35 pb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#AFC0FF]">
              The read / IAEA–Iran
            </p>
            <SignatureHeadline
              text="See what the story hides."
              className="atlas-headline mt-2 max-w-[560px] text-[clamp(48px,5.3vw,84px)] leading-[0.84] text-[#F4EBDD]"
            />
            <p className="mt-10 max-w-[31ch] font-serif text-[16px] leading-[1.65] text-[#F4EBDD]/62">
              Explore sources, connect the evidence, question the assumptions and uncover what
              others overlook.
            </p>
            <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-2 rounded-full bg-[#F4EBDD] px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#15100C] transition-colors hover:bg-[#AFC0FF]"
              >
                Explore the globe
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <Link
                to="/cases"
                className="inline-flex items-center gap-2 rounded-full border border-[#C9A77D]/30 px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#F4EBDD]/70 transition-colors hover:border-[#AFC0FF]/50 hover:text-[#AFC0FF]"
              >
                Enter a case
              </Link>
            </div>
          </div>

          {/* contextual investigation panel */}
          <aside
            className={`atlas-panel fixed bottom-[86px] left-3 right-3 z-40 max-h-[54dvh] overflow-y-auto transition-all duration-500 md:absolute md:bottom-auto md:left-auto md:right-[3.5%] md:top-[22%] md:max-h-none md:w-[25%] md:max-w-[360px] ${
              context ? "pointer-events-auto translate-y-0 opacity-100 md:translate-x-0" : "pointer-events-none translate-y-4 opacity-0 md:translate-x-4"
            }`}
          >
            <div className="relative rounded-[20px] border border-[#C9A77D]/20 bg-[#120D09]/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-[22px] md:p-6">
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close location panel"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#F4EBDD]/15 font-mono text-[10px] text-[#F4EBDD]/45 transition-colors hover:border-[#AFC0FF]/40 hover:text-[#AFC0FF]"
              >
                ×
              </button>
              {context ? (
                <>
                  <p className="inline-block border-b border-[#1A4BFF]/40 pb-1 font-mono text-[8px] uppercase tracking-[0.17em] text-[#AFC0FF]">
                    {context.number} / Location
                  </p>
                  <h2 className="mt-2 font-display text-[34px] leading-none tracking-[-0.02em] text-[#F4EBDD]">
                    {context.name}
                  </h2>
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F4EBDD]/35">
                    {context.coords}
                  </p>
                  <p className="mt-5 font-serif text-[14px] leading-[1.6] text-[#F4EBDD]/65">
                    {context.description}
                  </p>
                  <div className="mt-6 border-t border-[#C9A77D]/15 pt-4">
                    <p className="font-mono text-[7px] uppercase tracking-[0.17em] text-[#C9A77D]/65">
                      Featured investigation
                    </p>
                    <p className="mt-2 font-serif text-[14px] leading-[1.55] text-[#F4EBDD]/75">
                      {context.featured}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#C9A77D]/15 pt-4">
                    <div>
                      <p className="font-mono text-[7px] uppercase tracking-[0.13em] text-[#F4EBDD]/30">
                        Connected
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase leading-[1.6] tracking-[0.08em] text-[#F4EBDD]/55">
                        {context.connected}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[7px] uppercase tracking-[0.13em] text-[#F4EBDD]/30">
                        Status
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase leading-[1.6] tracking-[0.08em] text-[#C1121F]/80">
                        {context.status}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/read/$token"
                    params={{ token: SAMPLE_TOKEN }}
                    className="mt-6 inline-flex w-full items-center justify-between border-t border-[#C9A77D]/20 pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#AFC0FF] transition-colors hover:text-[#F4EBDD]"
                  >
                    Explore investigation
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : null}
            </div>
          </aside>

          <div className="pointer-events-none absolute bottom-5 left-6 z-30 hidden font-mono text-[7px] uppercase tracking-[0.17em] text-[#F4EBDD]/30 md:block">
            Interactive atlas / 01
          </div>
          <div className="pointer-events-none absolute bottom-5 right-6 z-30 hidden font-mono text-[7px] uppercase tracking-[0.17em] text-[#F4EBDD]/30 md:block">
            Scroll to explore ↓
          </div>

          <AtlasDock onExplore={() => setSelected(null)} />
        </section>
      </main>
    </div>
  );
}

const ATLAS_PLACES = {
  vienna: [((16.3738 + 180) / 360) * 2000, ((90 - 48.2082) / 180) * 1000] as const,
  tehran: [((51.389 + 180) / 360) * 2000, ((90 - 35.6892) / 180) * 1000] as const,
  natanz: [((51.726 + 180) / 360) * 2000, ((90 - 33.724) / 180) * 1000] as const,
};

function AtlasMap({ active, onActive, mobile = false, band = false, overlay = false }: { active: string | null; onActive: (id: string | null) => void; mobile?: boolean; band?: boolean; overlay?: boolean }) {
  const vienna = ATLAS_PLACES.vienna;
  const tehran = ATLAS_PLACES.tehran;
  const natanz = ATLAS_PLACES.natanz;
  const demandActive = active === "vienna" || active === "tehran";
  const permissionActive = active === "tehran" || active === "natanz";
  const demandPath = `M ${vienna[0]} ${vienna[1]} Q 1220 224 ${tehran[0]} ${tehran[1]}`;
  const holdPulse =
    active === "vienna"
      ? { x: vienna[0], y: vienna[1], color: "#1A4BFF" }
      : active === "tehran"
        ? { x: tehran[0], y: tehran[1], color: "#1A4BFF" }
        : active === "natanz"
          ? { x: 1362, y: 352, color: "#C1121F" }
          : null;
  return (
    <div className={`atlas-map-reveal atlas-plate pointer-events-none overflow-hidden ${
      mobile
        ? "relative h-[280px] w-full"
        : overlay
          ? "absolute inset-0 z-0 hidden md:block"
          : band
            ? "relative h-[260px] w-full md:h-[400px]"
            : "relative h-[400px] w-full"
    }`} aria-hidden>
      <style>{`
        .atlas-plate {
          background: #FDFBF7;
        }
        .atlas-map-reveal {
          animation: atlasReveal 1.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .atlas-plate {
          transform-origin: 64% 31%;
          transition: transform 1.15s cubic-bezier(0.7, 0, 0.2, 1), filter 0.8s ease;
        }
        .atlas-copy {
          transition: opacity 0.4s ease, transform 0.7s cubic-bezier(0.7, 0, 0.2, 1);
        }
        .atlas-meta {
          transition: opacity 0.35s ease;
        }
        .atlas-hero.is-entering .atlas-plate {
          transform: scale(2.15);
          filter: contrast(1.02);
        }
        .atlas-hero.is-entering .atlas-copy {
          opacity: 0;
          transform: translateX(-22px);
        }
        .atlas-hero.is-entering .atlas-meta {
          opacity: 0;
        }
        .atlas-enter-curtain {
          position: absolute;
          inset: 0;
          z-index: 30;
          background: #FDFBF7;
          clip-path: inset(100% 0 0 0);
          transition: clip-path 0.95s cubic-bezier(0.7, 0, 0.2, 1);
          pointer-events: none;
        }
        .atlas-hero.is-entering .atlas-enter-curtain {
          clip-path: inset(0 0 0 0);
          pointer-events: auto;
        }
        @keyframes atlasReveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0); }
        }
        .atlas-route {
          fill: none;
          stroke: #1A4BFF;
          stroke-width: 1.15;
          vector-effect: non-scaling-stroke;
          stroke-dasharray: 4 4;
          animation: atlasDash 22s linear infinite;
        }
        .atlas-route-solid {
          fill: none;
          stroke: #1A4BFF;
          stroke-width: 1.5;
          vector-effect: non-scaling-stroke;
        }
        .atlas-route-denied {
          stroke: #C1121F;
          stroke-width: 1.35;
        }
        .atlas-route-active {
          stroke-width: 2.4;
        }
        .atlas-route-denied.atlas-route-active {
          stroke-width: 2.1;
        }
        .atlas-pin {
          fill: #1A4BFF;
          stroke: #FDFBF7;
          stroke-width: 1;
        }
        .atlas-pin-red {
          fill: #C1121F;
        }
        .atlas-pin-ring {
          fill: none;
          stroke: #1A4BFF;
          stroke-width: 0.65;
          opacity: 0.5;
        }
        .atlas-pin-ring-red {
          stroke: #C1121F;
        }
        .atlas-line-label {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          font-size: 16px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          fill: #1A4BFF;
        }
        .atlas-line-label-red { fill: #C1121F; }
        .atlas-hold-pulse { opacity: 0.95; }
        .atlas-marker {
          fill: #FDFBF7;
          stroke: #1A4BFF;
          stroke-width: 1;
        }
        .atlas-marker-red { stroke: #C1121F; }
        .atlas-marker-text {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          fill: #1A4BFF;
          text-anchor: middle;
          dominant-baseline: central;
        }
        .atlas-marker-text-red { fill: #C1121F; }
        .atlas-pin-group {
          cursor: pointer;
          pointer-events: auto;
        }
        .atlas-callout {
          fill: none;
          stroke: #C1121F;
          stroke-width: 1.1;
          vector-effect: non-scaling-stroke;
        }
        @keyframes atlasDash { to { stroke-dashoffset: -40; } }
        @media (prefers-reduced-motion: reduce) {
          .atlas-route { animation: none; }
          .atlas-demand-pulse { display: none; }
          .atlas-map-reveal { animation: none; }
          .atlas-plate, .atlas-copy, .atlas-meta, .atlas-enter-curtain { transition: none; }
          .atlas-hero.is-entering .atlas-plate { transform: none; }
        }
      `}</style>
      <svg
        viewBox={mobile ? "900 0 600 430" : "0 0 2000 850"}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <rect width="2000" height="1000" fill="#FDFBF7" />
        <g stroke="#1A1A1A" strokeWidth="0.18" opacity="0.08" vectorEffect="non-scaling-stroke">
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
            const x = ((lon + 180) / 360) * 2000;
            return <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2="1000" />;
          })}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = ((90 - lat) / 180) * 1000;
            return <line key={`lat-${lat}`} x1="0" y1={y} x2="2000" y2={y} />;
          })}
        </g>
        <image href="/world-land.svg" x="0" y="0" width="2000" height="1000" />
        <path
          d={demandPath}
          className={`atlas-route-solid ${demandActive ? "atlas-route-active" : ""}`}
        />
        <path
          d={`M ${tehran[0]} ${tehran[1]} Q 1296 298 ${natanz[0]} ${natanz[1]}`}
          className={`atlas-route atlas-route-denied ${permissionActive ? "atlas-route-active" : ""}`}
        />

        {holdPulse ? (
          <circle
            cx={holdPulse.x}
            cy={holdPulse.y}
            r="5"
            fill={holdPulse.color}
            className="atlas-hold-pulse"
          />
        ) : (
          <circle r="5" className="atlas-demand-pulse" fill="#1A4BFF">
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              path={demandPath}
              keyPoints="0;1;1"
              keyTimes="0;0.58;1"
              calcMode="linear"
            />
            <animate
              attributeName="opacity"
              dur="9s"
              repeatCount="indefinite"
              values="0;1;1;0;0"
              keyTimes="0;0.06;0.56;0.64;1"
            />
          </circle>
        )}

        <text
          x={(vienna[0] + tehran[0]) / 2}
          y={(vienna[1] + tehran[1]) / 2 - 32}
          textAnchor="middle"
          className="atlas-line-label"
          stroke="#FDFBF7"
          strokeWidth="5"
          paintOrder="stroke"
        >
          the demand
        </text>
        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("vienna")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx={vienna[0]} cy={vienna[1]} r={active === "vienna" ? 18 : 16} className="atlas-marker" />
          <text x={vienna[0]} y={vienna[1] + 0.4} className="atlas-marker-text">01</text>
        </g>

        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("tehran")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx={tehran[0]} cy={tehran[1]} r={active === "tehran" ? 18 : 16} className="atlas-marker" />
          <text x={tehran[0]} y={tehran[1] + 0.4} className="atlas-marker-text">02</text>
        </g>

        <circle cx={natanz[0]} cy={natanz[1]} r="5" className="atlas-pin atlas-pin-red" />
        <path d={`M ${natanz[0]} ${natanz[1]} L 1348 346`} className="atlas-callout" />
        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("natanz")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx="1362" cy="352" r={active === "natanz" ? 18 : 16} className="atlas-marker atlas-marker-red" />
          <text x="1362" y="352.4" className="atlas-marker-text atlas-marker-text-red">03</text>
        </g>

      </svg>
    </div>
  );
}
