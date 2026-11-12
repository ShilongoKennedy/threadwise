import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { LiveGlobe, type GlobePlace } from "@/components/threadwise/LiveGlobe";

export const Route = createFileRoute("/globe")({
  head: () => ({
    meta: [
      { title: "The live plate — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An integration study: a dark live-earth chapter inside the paper atlas.",
      },
    ],
  }),
  component: GlobePage,
});

const PLACES: GlobePlace[] = [
  { key: "vienna", label: "Vienna", lat: 48.2082, lon: 16.3738 },
  { key: "tehran", label: "Tehran", lat: 35.6892, lon: 51.389 },
  { key: "natanz", label: "Natanz", lat: 33.724, lon: 51.726 },
  { key: "new-york", label: "New York", lat: 40.7128, lon: -74.006 },
  { key: "tokyo", label: "Tokyo", lat: 35.6762, lon: 139.6503 },
];

function GlobePage() {
  const [focus, setFocus] = useState<GlobePlace | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const match = PLACES.find((place) =>
      place.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (match) setFocus(match);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader marketing />

      <main>
        <section className="mx-auto w-full max-w-[1200px] px-5 pb-12 pt-24 md:px-8 md:pb-16 md:pt-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A4BFF]">
            The live plate / integration study
          </p>
          <h1 className="mt-3 max-w-[14ch] font-display text-[44px] leading-[0.94] tracking-[-0.035em] md:text-[68px]">
            The map at day. The earth at night.
          </h1>
          <p className="mt-5 max-w-[48ch] font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/65 md:text-[18px]">
            A proposed dark chapter inside the paper landing — not a replacement for it. The same
            three places, the same route, seen at a different scale.
          </p>
        </section>

        <section className="relative h-[82svh] min-h-[700px] w-full overflow-hidden bg-[#060a0f] text-[#FDFBF7]">
          <ClientOnly fallback={<div className="absolute inset-0 bg-[#060a0f]" />}>
            <LiveGlobe
              embedded
              focus={focus}
              onPick={(lat, lon) => setPicked({ lat, lon })}
            />
          </ClientOnly>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(6,10,15,0.55)_100%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,#060a0f_0%,rgba(6,10,15,0.8)_36%,transparent_100%)] max-md:hidden" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-[linear-gradient(0deg,#060a0f_0%,#060a0f_18%,rgba(6,10,15,0.94)_46%,rgba(6,10,15,0.38)_72%,transparent_100%)] md:hidden" />

          <main className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-5 pb-6 pt-8 md:justify-center md:px-8 md:pb-12">
            <div className="pointer-events-auto w-full max-w-[480px]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7890ff]">
                Night plate / 02
              </p>
              <h2 className="mt-2 max-w-[11ch] font-display text-[clamp(42px,5.4vw,68px)] leading-[0.92] tracking-[-0.04em]">
                The world the read lives in.
              </h2>
              <p className="mt-3 max-w-[38ch] font-serif text-[15px] leading-[1.6] text-[#FDFBF7]/60 md:text-[16px]">
                Turn the earth. Pick a place. The route follows the read — not a feed.
              </p>

              <form onSubmit={submit} className="mt-5 flex items-center gap-3 border-b border-[#FDFBF7]/25 pb-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#FDFBF7]/35">
                  Find
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a demo place"
                  className="min-w-0 flex-1 bg-transparent font-serif text-[14px] text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/30"
                />
                <button type="submit" className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7890ff]">
                  Go →
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {PLACES.slice(0, 3).map((place) => (
                  <button
                    key={place.key}
                    type="button"
                    onClick={() => setFocus(place)}
                    className={`border px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] transition-colors ${
                      focus?.key === place.key
                        ? "border-[#7890ff] bg-[#7890ff] text-[#060a0f]"
                        : "border-[#FDFBF7]/20 text-[#FDFBF7]/60 hover:border-[#FDFBF7]/50"
                    }`}
                  >
                    {place.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFocus(PLACES[Math.floor(Math.random() * PLACES.length)]!)}
                  className="border border-[#D25A4A]/60 px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#D25A4A] transition-colors hover:bg-[#D25A4A] hover:text-[#060a0f]"
                >
                  Surprise me
                </button>
              </div>

              <Link
                to="/read/$token"
                params={{ token: "mn4qvf4bhu" }}
                className="mt-4 inline-flex items-center gap-2 border-b border-[#7890ff]/40 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7890ff]"
              >
                Open the IAEA read <ArrowUpRight className="h-3 w-3" />
              </Link>
              {picked ? (
                <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/35">
                  Pin · {Math.abs(picked.lat).toFixed(1)}°{picked.lat >= 0 ? "N" : "S"}{" "}
                  {Math.abs(picked.lon).toFixed(1)}°{picked.lon >= 0 ? "E" : "W"}
                </p>
              ) : null}
            </div>
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden flex-wrap items-end justify-between gap-3 px-5 pb-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/30 md:flex md:px-8">
            <p>
              {picked
                ? `Pin · ${Math.abs(picked.lat).toFixed(1)}°${picked.lat >= 0 ? "N" : "S"} ${Math.abs(picked.lon).toFixed(1)}°${picked.lon >= 0 ? "E" : "W"}`
                : "Drag to turn · click the earth to drop a pin"}
            </p>
            <p className="hidden text-right md:block">
              Simulated orbits / no live feed
              <br />
              Procedural earth / demo constellation
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
              Back to the record
            </p>
            <Link
              to="/read/$token"
              params={{ token: "mn4qvf4bhu" }}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45 underline underline-offset-4 hover:text-[#1A4BFF]"
            >
              The IAEA read →
            </Link>
          </div>
          <p className="mt-4 max-w-[52ch] font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/65">
            The live plate ends where the record begins. The paper page does not become dark; it
            gives the globe one deliberate chapter, then returns.
          </p>
        </section>
      </main>
    </div>
  );
}
