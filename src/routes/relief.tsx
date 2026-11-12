import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { ReliefMap } from "@/components/threadwise/ReliefMap";

export const Route = createFileRoute("/relief")({
  head: () => ({
    meta: [
      { title: "The relief plate — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experimental 3D paper relief version of the Threadwise atlas.",
      },
    ],
  }),
  component: ReliefPage,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const PLACES = [
  { no: "01", name: "Vienna / IAEA", coords: "48.2N 16.4E" },
  { no: "02", name: "Tehran", coords: "35.7N 51.4E" },
  { no: "03", name: "Natanz", coords: "33.7N 51.7E" },
];

function ReliefPage() {
  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader marketing />

      <section className="relative min-h-[calc(100dvh-64px)] overflow-hidden border-b border-[#1A1A1A]/10 pt-24 md:pt-28">
        <div className="hidden md:block">
          <ClientOnly fallback={<div className="absolute inset-0 bg-[#FDFBF7]" />}>
            <ReliefMap />
          </ClientOnly>
        </div>
        <div className="absolute inset-0 md:hidden">
          <img
            src="/world-land.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#FDFBF7_0%,#FDFBF7_32%,rgba(253,251,247,0.9)_44%,rgba(253,251,247,0.25)_62%,transparent_74%)] max-md:bg-[linear-gradient(0deg,#FDFBF7_0%,rgba(253,251,247,0.9)_55%,transparent_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-160px)] w-full max-w-[1200px] flex-col justify-between px-5 pb-10 pt-10 md:px-8 md:pb-12 md:pt-14">
          <div className="atlas-copy max-w-[650px] pb-8 md:pb-10">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A4BFF]">
              <span>The read / IAEA–Iran</span>
              <span className="h-3 w-px bg-[#1A4BFF]/25" />
              <span className="text-[#1A1A1A]/40">09 Nov 2026</span>
            </div>
            <h1 className="mt-3 max-w-[12ch] font-display text-[clamp(48px,6.2vw,88px)] leading-[0.92] tracking-[-0.035em]">
              See what the story hides.
            </h1>
            <p className="mt-5 max-w-[46ch] font-serif text-[17px] leading-[1.55] text-[#1A1A1A]/70 md:text-[19px]">
              Every claim has a geography. This is the IAEA read, plotted.
            </p>
            <p className="mt-3 max-w-[52ch] font-mono text-[9px] uppercase leading-[1.7] tracking-[0.14em] text-[#1A1A1A]/50 md:text-[10px]">
              Vienna issues the demand · Tehran controls the permission · Natanz stays unverified
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to="/read/$token"
                params={{ token: SAMPLE_TOKEN }}
                className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
              >
                Open the IAEA read
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/analyst"
                className="inline-flex items-center gap-2 border-b-2 border-[#1A4BFF]/30 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] transition-colors hover:border-[#1A4BFF]"
              >
                Bring your own source
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/35">
              Relief plate / experiment 02
            </p>
          </div>

          <div className="atlas-meta flex flex-wrap items-end justify-between gap-5 border-t border-[#1A1A1A]/15 bg-[#FDFBF7] pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
            <div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <span className="flex items-center gap-2"><span className="h-px w-5 bg-[#1A4BFF]" /> the demand</span>
                <span className="flex items-center gap-2"><span className="h-px w-5 border-t border-dashed border-[#C1121F]" /> permission denied</span>
              </div>
              <p className="mt-2 text-[8px] tracking-[0.08em] text-[#1A1A1A]/30">
                Natural Earth 1:110m · paper relief
              </p>
            </div>
            <div className="w-full text-left leading-relaxed md:w-[310px] md:text-right">
              <p className="text-[#1A1A1A]/60">The places</p>
              {PLACES.map((place) => (
                <p key={place.no} className={`mt-1 text-[10px] ${place.no === "03" ? "text-[#C1121F]" : "text-[#1A1A1A]/70"}`}>
                  {place.no} {place.name}{" "}
                  <span className={place.no === "03" ? "text-[#C1121F]/50" : "text-[#1A1A1A]/30"}>
                    {place.coords}
                  </span>
                </p>
              ))}
              <p className="mt-2 text-[8px] tracking-[0.08em] text-[#1A1A1A]/40">
                Move the pointer to tilt the plate
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
            The study
          </p>
          <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45 underline underline-offset-4 hover:text-[#1A4BFF]">
            Back to the paper map →
          </Link>
        </div>
        <p className="mt-4 max-w-[54ch] font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/65">
          The same geometry, lifted into a paper relief. No live data, no sphere. The question is
          whether the map gains depth without becoming a different product.
        </p>
      </section>
    </div>
  );
}
