import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Threadwise — Every claim has a geography" },
      {
        name: "description",
        content:
          "Paste a link, a PDF or a screenshot. Threadwise shows the framing, checks the claims against primary sources, and tells you what would prove the read wrong.",
      },
      { property: "og:title", content: "Threadwise — read the evidence, not just the framing" },
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
      { name: "twitter:title", content: "Threadwise — read the evidence, not just the framing" },
      {
        name: "twitter:description",
        content:
          "Paste a link, a PDF or a screenshot. Threadwise shows the framing, checks the claims against primary sources, and tells you what would prove the read wrong.",
      },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
  component: LandingPage,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const REAL_READ = {
  whatItDid:
    "The IAEA sent a confidential report to member states saying it has concerns about Iran’s enrichment programme. The contents are unpublished; the public record is that inspectors have not been allowed back to the sites bombed in June 2025, and Iran has not said how much of its 60%-enriched uranium survived.",
  wordWorth:
    "A confidential report is a signal to governments, not an enforceable finding. Its authority is the safeguards mandate, not a power to compel access; what it changes depends on whether the Board acts and whether Iran lets inspectors back in.",
  counter:
    "This may be routine. The IAEA has sent confidential reports on Iran to the Board for years; a report saying it cannot verify a stockpile after a bombing campaign may be the expected result, not a rupture.",
  falsifier:
    "If the confidential report contains a specific, verified finding — a measured stockpile figure, a named undeclared site, or evidence of enrichment above 60% — then this is not a report about missing access, and the reading is wrong.",
  watch:
    "Whether the Board puts Iran on the formal agenda at its next meeting, and whether Iran lets inspectors back into Natanz, Fordow or the Isfahan tunnel site.",
};

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

function LandingPage() {
  const [activePlace, setActivePlace] = useState<string | null>(null);
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#FDFBF7] font-sans text-[#1A1A1A] selection:bg-[#1A4BFF] selection:text-white">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-6 top-24 z-0 h-4 w-4 border-l border-t border-[#1A1A1A]/20" />
      <div className="pointer-events-none absolute right-6 top-24 z-0 h-4 w-4 border-r border-t border-[#1A1A1A]/20" />

      <AppHeader marketing />

      <main id="main" className="relative z-10 flex-1">
        {/* ATLAS HERO */}
        <section className="relative w-full overflow-hidden border-b border-[#1A1A1A]/10 pt-24 md:pt-28">
          <AtlasMap active={activePlace} onActive={setActivePlace} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#FDFBF7_0%,rgba(253,251,247,0.96)_28%,rgba(253,251,247,0.42)_48%,rgba(253,251,247,0.06)_68%,transparent_80%)] max-md:bg-[linear-gradient(180deg,#FDFBF7_0%,rgba(253,251,247,0.94)_48%,rgba(253,251,247,0.25)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[26%] bg-[linear-gradient(0deg,#FDFBF7_0%,rgba(253,251,247,0.88)_55%,transparent_100%)] md:hidden" />

          <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-[1200px] flex-col justify-between px-5 pb-10 pt-10 md:min-h-[680px] md:px-8 md:pb-12 md:pt-14">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
              <span className="border border-[#1A1A1A] px-2 py-1 text-[#1A1A1A]/60">
                The atlas / field 01
              </span>
              <span className="text-[#1A1A1A]/40">A read in places</span>
            </div>

            <div className="max-w-[650px] pb-8 md:pb-14">
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A4BFF] md:mt-0">
                <span>The read / IAEA–Iran</span>
                <span className="h-3 w-px bg-[#1A4BFF]/25" />
                <span className="text-[#1A1A1A]/40">09 Nov 2026</span>
              </div>
              <h1 className="mt-3 max-w-[12ch] font-display text-[clamp(46px,7vw,88px)] leading-[0.92] tracking-[-0.035em]">
                See what the story hides.
              </h1>
              <p className="mt-5 max-w-[52ch] font-serif text-[16px] leading-[1.6] text-[#1A1A1A]/70 md:text-[18px]">
                Every claim has a geography. This is the IAEA read, plotted: Vienna, Tehran,
                Natanz. The places are the evidence.
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
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5 border-t border-[#1A1A1A]/15 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
              <div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" /> the report</span>
                  <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#C1121F]" /> access denied</span>
                </div>
                <p className="mt-2 text-[8px] tracking-[0.08em] text-[#1A1A1A]/30">
                  Natural Earth 1:110m · illustrative route
                </p>
              </div>
              <div className="w-full text-left leading-relaxed md:w-[310px] md:text-right">
                <p className="text-[#1A1A1A]/60">The places</p>
                {PLACE_INDEX.map((place) => (
                  <Link
                    key={place.id}
                    to="/read/$token"
                    params={{ token: SAMPLE_TOKEN }}
                    onMouseEnter={() => setActivePlace(place.id)}
                    onMouseLeave={() => setActivePlace(null)}
                    onFocus={() => setActivePlace(place.id)}
                    onBlur={() => setActivePlace(null)}
                    className={`mt-1 block border-b border-transparent pb-0.5 transition-colors hover:border-[#1A4BFF] ${
                      activePlace === place.id ? "text-[#1A4BFF]" : place.id === "natanz" ? "text-[#C1121F]" : "text-[#1A1A1A]/70"
                    }`}
                  >
                    {place.no} {place.name}{" "}
                    <span className={activePlace === place.id ? "text-[#1A4BFF]/50" : place.id === "natanz" ? "text-[#C1121F]/50" : "text-[#1A1A1A]/30"}>
                      {place.coords}
                    </span>
                  </Link>
                ))}
                <p className="mt-2 max-w-[310px] text-[8px] leading-relaxed tracking-[0.08em] text-[#1A1A1A]/40 md:ml-auto">
                  {activePlace
                    ? PLACE_INDEX.find((place) => place.id === activePlace)?.note
                    : "Hover a place to see why it is on the map."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ONE REAL READ */}
        <section id="read" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
          <div className="border-b-2 border-[#1A1A1A] pb-2">
            <h2 className="font-display text-[30px] leading-none md:text-[42px]">
              The IAEA report, read.
            </h2>
          </div>

          <div className="mt-5 grid gap-7 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
            <div className="border-l-2 border-[#1A1A1A] pl-4 md:pl-5">
              <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A4BFF]">
                The source
              </p>
              <p className="mt-2 font-serif text-[17px] leading-[1.65] text-[#1A1A1A]/82 md:text-[18px]">
                {REAL_READ.whatItDid}
              </p>
              <p className="mt-5 font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A1A1A]/50">
                What it can and cannot settle
              </p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/68">
                {REAL_READ.wordWorth}
              </p>
            </div>

            <div className="space-y-3">
              <ReadCard label="The counter-reading" body={REAL_READ.counter} />
              <ReadCard label="What would prove it wrong" body={REAL_READ.falsifier} tone="red" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#1A1A1A]/15 pt-3 md:grid-cols-[1fr_auto] md:items-center">
            <p className="max-w-[74ch] font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/65">
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A1A1A]/50">
                What to watch ·{" "}
              </span>
              {REAL_READ.watch}
            </p>
            <Link
              to="/read/$token"
              params={{ token: SAMPLE_TOKEN }}
              className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              Open the IAEA read
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-[#1A1A1A]/45">
            Source: IAEA report to member states, seen by Reuters. Read filed 9 Nov 2026.
          </p>
        </section>

        {/* THE LOOP */}
        <section id="loop" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
          <div className="border-b-2 border-[#1A1A1A] pb-2">
            <h2 className="max-w-[18ch] font-display text-[30px] leading-none md:text-[42px]">
              What happens after the read.
            </h2>
          </div>

          <ol className="mt-4 border-t border-[#1A1A1A]/15">
            {LOOP.map((step) => (
              <li
                key={step.n}
                className="grid grid-cols-[32px_1fr] gap-x-3 gap-y-1 border-b border-[#1A1A1A]/15 py-5 sm:grid-cols-[48px_190px_1fr] sm:items-baseline sm:gap-5"
              >
                <span className="row-span-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF] sm:row-span-1">
                  {step.n}
                </span>
                <h3 className="font-display text-[20px] leading-tight">{step.title}</h3>
                <p className="col-start-2 max-w-[58ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65 sm:col-start-3">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/questions"
              className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4"
            >
              Open the questions <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/60 underline underline-offset-4 transition-colors hover:text-[#1A4BFF]"
            >
              See the thinking profile <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        {/* THE RECORD, SHOWN */}
        <section className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
          <div className="border-y-2 border-[#1A1A1A] py-9 md:py-12">
            <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start md:gap-14">
              <div>
                <h2 className="max-w-[16ch] font-display text-[32px] leading-[0.98] md:text-[48px]">
                  What the read leaves behind.
                </h2>
                <p className="mt-4 max-w-[44ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/70">
                  A chat window gives you an answer and forgets it. This leaves a record: the claims,
                  the questions they bear on, the predictions that follow, and the score when the
                  date arrives.
                </p>
                <p className="mt-4 max-w-[40ch] font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[#1A1A1A]/45">
                  An example record, not your data.
                </p>
              </div>

              <div className="border-2 border-[#1A1A1A] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/15 px-4 py-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
                    The record
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                    illustrative
                  </span>
                </div>

                <div className="divide-y divide-[#1A1A1A]/12">
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[110px_1fr] sm:gap-4">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                      Calibration
                    </p>
                    <div>
                      <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                        <span className="mr-2 font-display text-[22px]">4 of 5</span>
                        high-confidence predictions were right.
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/40">
                        Brier 0.18 · lower is better
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[110px_1fr] sm:gap-4">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                      Question
                    </p>
                    <div>
                      <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                        Will Iran let inspectors back in?
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#C1121F]">
                        3 for · 0 against · one-sided
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[110px_1fr] sm:gap-4">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                      Drill
                    </p>
                    <div>
                      <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                        This week: steelman practice.
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/40">
                        Weakest exercise · 58% structural checks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="mx-auto w-full max-w-[1200px] px-5 pb-20 pt-6 md:px-8 md:pb-28">
          <div className="border-2 border-[#1A1A1A] bg-white px-6 py-11 md:px-10 md:py-14">
            <h2 className="max-w-[16ch] font-display text-[38px] leading-[0.95] tracking-tight md:text-[60px]">
              Read one article properly.
            </h2>
            <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/68">
              Ten minutes with a source you already distrust will teach you more than a month of
              summaries. Start with the one you have open in another tab.
            </p>
            <p className="mt-3 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/68">
              It will not tell you what to conclude. It will show you where the evidence stops.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/analyst"
                className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
              >
                Read a source
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/read/$token"
                params={{ token: SAMPLE_TOKEN }}
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                Open the IAEA example
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              Free while in beta. Sign in with Google.
            </p>
          </div>
        </section>

      </main>

      <footer className="relative z-30 border-t-2 border-[#1A1A1A] bg-[#FDFBF7] pb-8 pt-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <BrandLockup size="lg" asLink className="mb-4" />
              <p className="text-sm leading-relaxed text-[#1A1A1A]/60">
                A reading desk for sources you do not trust yet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 font-mono text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A]/65 sm:grid-cols-3 md:gap-16">
              <div className="flex flex-col gap-3">
                <span className="mb-1 font-bold text-[#1A1A1A]">Product</span>
                <Link to="/analyst" className="transition-colors hover:text-[#1A4BFF]">
                  The analyst
                </Link>
                <Link to="/questions" className="transition-colors hover:text-[#1A4BFF]">
                  Questions
                </Link>
                <Link to="/digest" className="transition-colors hover:text-[#1A4BFF]">
                  Record
                </Link>
                <Link to="/profile" className="transition-colors hover:text-[#1A4BFF]">
                  Profile
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="mb-1 font-bold text-[#1A1A1A]">Read</span>
                <Link to="/cases" className="transition-colors hover:text-[#1A4BFF]">
                  Cases
                </Link>
                <a href="#read" className="transition-colors hover:text-[#1A4BFF]">
                  The IAEA read
                </a>
                <a href="#loop" className="transition-colors hover:text-[#1A4BFF]">
                  How it works
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="mb-1 font-bold text-[#1A1A1A]">Legal</span>
                <Link to="/terms" className="transition-colors hover:text-[#1A4BFF]">
                  Terms
                </Link>
                <Link to="/privacy" className="transition-colors hover:text-[#1A4BFF]">
                  Privacy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-[#1A1A1A]/10 pt-6 md:flex-row md:items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
              © 2026 Threadwise. All rights reserved.
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/50">
              Built for people who check.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroRead() {
  return (
    <aside className="border-2 border-[#1A1A1A] bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#1A1A1A]/15 pb-2">
        <span className="whitespace-nowrap font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A4BFF]">
          From the record
        </span>
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
          IAEA / Iran · 9 Nov 2026
        </span>
      </div>
      <p className="mt-4 font-serif text-[16px] leading-relaxed text-[#1A1A1A]/85">
        “The report’s contents have not been published; what is known publicly is that the Agency’s
        inspectors have not been allowed back to the enrichment sites bombed in June 2025.”
      </p>
      <dl className="mt-4 space-y-3 border-t border-[#1A1A1A]/10 pt-3">
        <div>
          <dt className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1A1A1A]/50">
            What it did
          </dt>
          <dd className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/70">
            A confidential report to member states, not a public finding against Iran.
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#C1121F]">
            What would prove it wrong
          </dt>
          <dd className="mt-1 font-serif text-[13px] leading-snug text-[#C1121F]/90">
            A specific, verified finding: a stockpile number, a named site, or enrichment above 60%.
          </dd>
        </div>
      </dl>
      <Link
        to="/read/$token"
        params={{ token: SAMPLE_TOKEN }}
        className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4"
      >
        Open the IAEA read <ArrowUpRight className="h-3 w-3" />
      </Link>
    </aside>
  );
}

function ReadCard({
  label,
  body,
  tone = "ink",
}: {
  label: string;
  body: string;
  tone?: "ink" | "red";
}) {
  return (
    <div
      className={`border-l-2 py-1 pl-4 ${
        tone === "red" ? "border-[#C1121F]" : "border-[#1A1A1A]"
      }`}
    >
      <p
        className={`font-mono text-[10px] font-bold tracking-[0.12em] ${
          tone === "red" ? "text-[#C1121F]" : "text-[#1A4BFF]"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 font-serif text-[15px] leading-relaxed text-[#1A1A1A]/80 md:text-[16px]">
        {body}
      </p>
    </div>
  );
}


const ATLAS_PLACES = {
  vienna: [((16.3738 + 180) / 360) * 1000, ((90 - 48.2082) / 180) * 500] as const,
  tehran: [((51.389 + 180) / 360) * 1000, ((90 - 35.6892) / 180) * 500] as const,
  natanz: [((51.726 + 180) / 360) * 1000, ((90 - 33.724) / 180) * 500] as const,
  washington: [((-77.0369 + 180) / 360) * 1000, ((90 - 38.9072) / 180) * 500] as const,
};

function AtlasMap({ active, onActive }: { active: string | null; onActive: (id: string | null) => void }) {
  const vienna = ATLAS_PLACES.vienna;
  const tehran = ATLAS_PLACES.tehran;
  const natanz = ATLAS_PLACES.natanz;
  const washington = ATLAS_PLACES.washington;
  return (
    <div className="atlas-plate pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[38%] overflow-hidden border-t border-[#1A1A1A]/10 md:inset-0 md:h-full md:border-t-0" aria-hidden>
      <style>{`
        .atlas-plate {
          background: #FDFBF7;
        }
        .atlas-plate-image {
          opacity: 0.45;
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
          stroke-width: 1.35;
          vector-effect: non-scaling-stroke;
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
        .atlas-marker {
          fill: #FDFBF7;
          stroke: #1A4BFF;
          stroke-width: 1;
        }
        .atlas-marker-red { stroke: #C1121F; }
        .atlas-marker-text {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          font-size: 5.5px;
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
        }
      `}</style>
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <rect width="1000" height="500" fill="#FDFBF7" />
        <g stroke="#1A1A1A" strokeWidth="0.18" opacity="0.08" vectorEffect="non-scaling-stroke">
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
            const x = ((lon + 180) / 360) * 1000;
            return <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2="500" />;
          })}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = ((90 - lat) / 180) * 500;
            return <line key={`lat-${lat}`} x1="0" y1={y} x2="1000" y2={y} />;
          })}
        </g>
        <image
          href="/world-dots-ink.svg"
          x="0"
          y="0"
          width="1000"
          height="500"
          className="atlas-plate-image"
        />
        <path
          d={`M ${vienna[0]} ${vienna[1]} Q 610 112 ${tehran[0]} ${tehran[1]}`}
          className="atlas-route-solid"
        />
        <path
          d={`M ${tehran[0]} ${tehran[1]} Q 648 149 ${natanz[0]} ${natanz[1]}`}
          className="atlas-route"
        />

        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("vienna")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx={vienna[0]} cy={vienna[1]} r={active === "vienna" ? 7 : 6} className="atlas-marker" />
          <text x={vienna[0]} y={vienna[1] + 0.4} className="atlas-marker-text">01</text>
        </g>

        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("tehran")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx={tehran[0]} cy={tehran[1]} r={active === "tehran" ? 7 : 6} className="atlas-marker" />
          <text x={tehran[0]} y={tehran[1] + 0.4} className="atlas-marker-text">02</text>
        </g>

        <circle cx={natanz[0]} cy={natanz[1]} r="1.8" className="atlas-pin atlas-pin-red" />
        <path d={`M ${natanz[0]} ${natanz[1]} L 674 173`} className="atlas-callout" />
        <g
          className="atlas-pin-group"
          onPointerEnter={() => onActive("natanz")}
          onPointerLeave={() => onActive(null)}
        >
          <circle cx="681" cy="176" r={active === "natanz" ? 7 : 6} className="atlas-marker atlas-marker-red" />
          <text x="681" y="176.4" className="atlas-marker-text atlas-marker-text-red">03</text>
        </g>

      </svg>
    </div>
  );
}
