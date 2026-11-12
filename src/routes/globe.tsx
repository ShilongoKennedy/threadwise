import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { LiveGlobe, type GlobePlace } from "@/components/threadwise/LiveGlobe";

export const Route = createFileRoute("/globe")({
  head: () => ({
    meta: [
      { title: "The live plate — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experimental, interactive globe for the Threadwise atlas.",
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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#060a0f] text-[#FDFBF7]">
      <ClientOnly fallback={<div className="absolute inset-0 bg-[#060a0f]" />}>
        <LiveGlobe focus={focus} onPick={(lat, lon) => setPicked({ lat, lon })} />
      </ClientOnly>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(6,10,15,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-[linear-gradient(0deg,#060a0f_0%,#060a0f_16%,rgba(6,10,15,0.94)_44%,rgba(6,10,15,0.42)_70%,transparent_100%)] md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,#060a0f_0%,rgba(6,10,15,0.76)_34%,transparent_100%)] max-md:hidden" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" aria-label="Threadwise home" className="font-display text-[24px] italic leading-none text-[#FDFBF7] md:text-[28px]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em]">
          <span className="hidden text-[#FDFBF7]/35 sm:inline">Experiment 01 / live plate</span>
          <Link to="/" className="border-b border-[#FDFBF7]/25 pb-0.5 text-[#FDFBF7]/70 transition-colors hover:text-[#FDFBF7]">
            Close
          </Link>
        </div>
      </header>

      <main className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-5 pb-28 pt-24 md:justify-center md:px-8 md:pb-12">
        <div className="pointer-events-auto w-full max-w-[500px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7890ff]">
            A live plate / experimental
          </p>
          <h1 className="mt-3 max-w-[10ch] font-display text-[clamp(48px,7vw,88px)] leading-[0.9] tracking-[-0.045em]">
            The world the read lives in.
          </h1>
          <p className="mt-4 max-w-[42ch] font-serif text-[16px] leading-[1.65] text-[#FDFBF7]/65 md:text-[18px]">
            Turn the earth. Pick a place. The route follows the read — not a feed.
          </p>

          <form onSubmit={submit} className="mt-7 flex items-center gap-3 border-b border-[#FDFBF7]/25 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#FDFBF7]/35">Find</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a demo place"
              className="min-w-0 flex-1 bg-transparent font-serif text-[15px] text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/30"
            />
            <button type="submit" className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7890ff]">
              Go →
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {PLACES.slice(0, 3).map((place) => (
              <button
                key={place.key}
                type="button"
                onClick={() => setFocus(place)}
                className={`border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
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
              className="border border-[#D25A4A]/60 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#D25A4A] transition-colors hover:bg-[#D25A4A] hover:text-[#060a0f]"
            >
              Surprise me
            </button>
          </div>

          <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/30">
            Simulated orbits · no live feed
          </p>
          <Link
            to="/read/$token"
            params={{ token: "mn4qvf4bhu" }}
            className="mt-4 inline-flex items-center gap-2 border-b border-[#7890ff]/40 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7890ff]"
          >
            Open the IAEA read <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </main>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 px-5 pb-5 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/35 md:px-8">
        <p>
          {picked
            ? `Pin · ${Math.abs(picked.lat).toFixed(1)}°${picked.lat >= 0 ? "N" : "S"} ${Math.abs(picked.lon).toFixed(1)}°${picked.lon >= 0 ? "E" : "W"}`
            : "Drag to turn · scroll to zoom · click the earth to drop a pin"}
        </p>
        <p className="hidden text-right md:block">
          Vienna / Tehran / Natanz
          <br />
          <span className="text-[#FDFBF7]/20">Procedural earth · demo constellation</span>
        </p>
      </div>

    </div>
  );
}
