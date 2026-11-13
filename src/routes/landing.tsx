import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { SignatureHeadline } from "@/components/threadwise/SignatureHeadline";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { RecordEye } from "@/components/record/RecordEye";
import { CartographicField } from "@/components/record/CartographicField";

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

function LandingExperiment() {
  const [activePlace, setActivePlace] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const openRead = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : window.innerWidth < 768 ? 620 : 1100;
    timerRef.current = window.setTimeout(() => {
      void navigate({ to: "/read/$token", params: { token: SAMPLE_TOKEN } });
    }, delay);
  };
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
        <section className={`atlas-hero relative w-full overflow-hidden border-b border-[#1A1A1A]/10 pt-24 md:pt-28 ${entering ? "is-entering" : ""}`}>
          <div className="absolute inset-0 hidden md:block">
            <CartographicField active={activePlace} />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(90deg,#FDFBF7_0%,#FDFBF7_30%,rgba(253,251,247,0.94)_42%,rgba(253,251,247,0.55)_54%,rgba(253,251,247,0.12)_64%,transparent_72%)] md:block" />

          <div className="pointer-events-none absolute right-[7%] top-[11%] z-[6] hidden aspect-square w-[32%] md:block">
            <div className="h-full w-full drop-shadow-[0_24px_40px_rgba(17,17,15,0.20)]">
              <HeroEyeTear />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[680px] w-full max-w-[1200px] flex-col justify-between px-5 pb-10 pt-10 md:px-8 md:pb-12 md:pt-14">
            <div className="atlas-copy max-w-[650px] pb-8 md:pb-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A4BFF]">
                <span>The read / IAEA–Iran</span>
                <span className="h-3 w-px bg-[#1A4BFF]/25" />
                <span className="text-[#1A1A1A]/40">09 Nov 2026</span>
              </div>
              <SignatureHeadline
                text="See what the story hides."
                className="mt-2 max-w-[720px] -rotate-[1.2deg] text-[clamp(58px,7.6vw,112px)] leading-[0.82]"
              />
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
                  onClick={openRead}
                  aria-busy={entering}
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

            <div className="mt-8 md:hidden">
              <div className="relative h-[320px] overflow-hidden border border-[#1A1A1A]/10">
                <CartographicField active={activePlace} mobile />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="pointer-events-auto h-[190px] w-[190px] drop-shadow-[0_18px_28px_rgba(17,17,15,0.18)]">
                    <HeroEyeTear mobile />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
                <span>The IAEA read / in places</span>
                <span>09 Nov 2026</span>
              </div>
            </div>

            <div className="atlas-meta flex flex-wrap items-end justify-between gap-5 border-t border-[#1A1A1A]/15 bg-[#FDFBF7] pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
              <div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <span className="flex items-center gap-2"><span className="h-px w-5 bg-[#1A4BFF]" /> the demand</span>
                  <span className="flex items-center gap-2"><span className="h-px w-5 border-t border-dashed border-[#C1121F]" /> permission denied</span>
                </div>
                <p className="mt-2 text-[8px] tracking-[0.08em] text-[#1A1A1A]/30">
                  Coordinate field · illustrative route
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
                    className={`mt-1 block border-b border-transparent pb-0.5 text-[10px] transition-colors hover:border-[#1A4BFF] ${
                      activePlace === place.id ? "text-[#1A4BFF]" : place.id === "natanz" ? "text-[#C1121F]" : "text-[#1A1A1A]/70"
                    }`}
                  >
                    {place.no} {place.name}{" "}
                    <span className={activePlace === place.id ? "text-[#1A4BFF]/50" : place.id === "natanz" ? "text-[#C1121F]/50" : "text-[#1A1A1A]/30"}>
                      {place.coords}
                    </span>
                  </Link>
                ))}
                <p className="mt-2 h-[30px] max-w-[310px] overflow-hidden text-[8px] leading-[1.45] tracking-[0.08em] text-[#1A1A1A]/40 line-clamp-2 md:ml-auto">
                  {activePlace
                    ? PLACE_INDEX.find((place) => place.id === activePlace)?.note
                    : "Hover a site to read its note."}
                </p>
              </div>
            </div>
          </div>

          <div className="atlas-enter-curtain" aria-hidden={!entering}>
            <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col justify-between px-5 py-10 md:px-8 md:py-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/45">
                Threadwise / the read
              </p>
              <div className="pb-6">
                <p className="font-display text-[clamp(52px,9vw,112px)] leading-[0.9] tracking-[-0.035em]">
                  IAEA–Iran.
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A4BFF]">
                  Opening the record…
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THE LOOP */}
        <section id="loop" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1A4BFF]/30 pb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A4BFF]">
              The method
            </p>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
            <div>
              <h2 className="max-w-[12ch] font-display text-[34px] leading-[0.95] md:text-[52px]">
                What happens after the read.
              </h2>
              <p className="mt-4 max-w-[38ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/70">
                A read is the beginning. The questions, predictions and corrections are what make it
                checkable later.
              </p>
              <div className="mt-6 flex flex-col items-start gap-2">
                <Link
                  to="/questions"
                  className="group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
                >
                  Open the questions
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/profile"
                  className="group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/55 underline underline-offset-4 transition-colors hover:text-[#1A4BFF]"
                >
                  See the thinking profile
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <ol className="grid border-t border-[#1A1A1A]/12 sm:grid-cols-2">
              {LOOP.map((step, index) => (
                <li
                  key={step.n}
                  className={`border-b border-[#1A1A1A]/10 py-5 ${
                    index % 2 === 0 ? "sm:border-r sm:pr-6" : "sm:pl-6"
                  }`}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[38px] leading-none text-[#1A4BFF]/80">
                      {step.n}
                    </span>
                    <h3 className="font-display text-[22px] leading-tight">{step.title}</h3>
                  </div>
                  <p className="mt-2 max-w-[34ch] font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/65">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* THE RECORD, SHOWN */}
        <section className="relative w-full border-y border-[#1A1A1A]/15 bg-[#FDFBF7] text-[#1A1A1A]">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
            <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em]">
              <p className="text-[#1A4BFF]">The record / from the IAEA read</p>
              <p className="text-[#1A1A1A]/35">09 Nov 2026 · 001</p>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-14">
              <h2 className="max-w-[13ch] font-display text-[38px] leading-[0.94] md:text-[52px]">
                What the read leaves behind.
              </h2>
              <p className="max-w-[50ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/60">
                A chat window gives you an answer and forgets it. This leaves a record: the question
                the read opened, the correction it needed, and what to watch next.
              </p>
            </div>

            <ol className="mt-10 grid border-t border-[#1A1A1A]/15 md:grid-cols-3">
              <li className="border-b border-[#1A1A1A]/15 py-5 md:border-b-0 md:border-r md:pr-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A4BFF]">01</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">Question</span>
                </div>
                <p className="mt-4 max-w-[26ch] font-display text-[25px] leading-[1.05]">
                  Does a confidential report to governments count as a finding against Iran at all?
                </p>
                <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A4BFF]/65">
                  Filed · open
                </p>
              </li>

              <li className="border-b border-[#1A1A1A]/15 py-5 md:border-b-0 md:border-r md:px-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A4BFF]">02</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">Correction</span>
                </div>
                <p className="mt-4 max-w-[24ch] font-display text-[25px] leading-[1.05]">
                  Removed an unsupported reporting date added beyond the move.
                </p>
                <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-[#C1121F]">
                  Patched · 01
                </p>
              </li>

              <li className="border-b border-[#1A1A1A]/15 py-5 md:border-b-0 md:pl-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#1A4BFF]">03</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/45">Watch</span>
                </div>
                <p className="mt-4 max-w-[24ch] font-display text-[25px] leading-[1.05]">
                  Whether the Board puts Iran on the formal agenda at its next meeting.
                </p>
                <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
                  Vienna · pending
                </p>
              </li>
            </ol>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-4">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/30">
                From the IAEA read · not a live record
              </span>
              <Link
                to="/digest"
                className="group inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                Open the record
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="mx-auto w-full max-w-[1200px] px-5 pb-24 pt-8 md:px-8 md:pb-32">
          <div className="border-y border-[#1A1A1A]/15 py-10 md:py-16">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] md:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/45">
                  The last page
                </p>
                <h2 className="mt-4 max-w-[12ch] font-display text-[clamp(44px,5.4vw,76px)] leading-[0.88] tracking-[-0.035em]">
                  Read one article properly.
                </h2>
                <div className="mt-6 max-w-[50ch] space-y-3 font-serif text-[16px] leading-[1.65] text-[#1A1A1A]/68">
                  <p>
                    Ten minutes with a source you already distrust will teach you more than a month
                    of summaries. Start with the one you have open in another tab.
                  </p>
                  <p>It will not tell you what to conclude. It will show you where the evidence stops.</p>
                </div>
              </div>

              <div className="flex flex-col justify-end md:pl-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">
                  Start here
                </p>
                <Link
                  to="/analyst"
                  className="group mt-4 flex items-center justify-between bg-[#1A1A1A] px-4 py-4 text-[#FDFBF7] transition-colors hover:bg-[#1A4BFF]"
                >
                  <span className="font-display text-[24px] leading-none">Read a source</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/read/$token"
                  params={{ token: SAMPLE_TOKEN }}
                  className="group flex items-center justify-between border-b border-[#1A1A1A]/15 py-4 font-serif text-[18px] text-[#1A1A1A]/80 transition-colors hover:text-[#1A4BFF]"
                >
                  Open the IAEA read
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </Link>
                <p className="mt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[#1A1A1A]/40">
                  Free while in beta
                  <br />
                  Sign in with Google
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-30 border-t border-[#1A1A1A]/15 bg-[#FDFBF7] pb-10 pt-12 md:pt-16">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1.9fr] md:gap-16">
            <div>
              <BrandLockup size="md" asLink />
              <p className="mt-5 max-w-[15ch] font-display text-[32px] leading-[0.98] tracking-[-0.025em] md:text-[42px]">
                A reading desk for sources you do not trust yet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-9 font-mono text-[9px] uppercase tracking-[0.12em] sm:grid-cols-3">
              <div>
                <p className="mb-3 text-[#1A1A1A]/40">The desk</p>
                {[
                  { to: "/analyst", label: "The analyst", n: "01" },
                  { to: "/questions", label: "Questions", n: "02" },
                  { to: "/digest", label: "Record", n: "03" },
                  { to: "/profile", label: "Profile", n: "04" },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70">
                    <span className="text-[8px] text-[#1A1A1A]/25">{item.n}</span>
                    <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              <div>
                <p className="mb-3 text-[#1A1A1A]/40">The record</p>
                <Link to="/cases" className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70">
                  <span className="text-[8px] text-[#1A1A1A]/25">05</span>
                  <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">Cases</span>
                </Link>
                <Link
                  to="/read/$token"
                  params={{ token: SAMPLE_TOKEN }}
                  className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70"
                >
                  <span className="text-[8px] text-[#1A1A1A]/25">06</span>
                  <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">The IAEA read</span>
                </Link>
                <a href="#loop" className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70">
                  <span className="text-[8px] text-[#1A1A1A]/25">07</span>
                  <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">How it works</span>
                </a>
              </div>

              <div>
                <p className="mb-3 text-[#1A1A1A]/40">Elsewhere</p>
                <Link to="/terms" className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70">
                  <span className="text-[8px] text-[#1A1A1A]/25">08</span>
                  <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">Terms</span>
                </Link>
                <Link to="/privacy" className="group mt-2 flex items-baseline gap-2 text-[#1A1A1A]/70">
                  <span className="text-[8px] text-[#1A1A1A]/25">09</span>
                  <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[#1A4BFF]/40 group-hover:text-[#1A4BFF]">Privacy</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/40">
            <span>© 2026 Threadwise. All rights reserved.</span>
            <span>Built for people who check.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroEyeTear({ mobile = false }: { mobile?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const tear = "M 381.7 200.0 L 382.6 218.0 L 381.0 236.0 L 374.2 252.8 L 366.9 269.1 L 358.7 284.8 L 348.5 299.2 L 339.3 314.3 L 328.2 328.2 L 315.5 340.8 L 299.5 348.9 L 283.7 356.6 L 266.6 360.9 L 250.4 366.1 L 233.5 368.3 L 216.6 368.7 L 200.0 373.9 L 182.7 375.4 L 165.3 374.4 L 147.9 371.7 L 131.6 365.1 L 116.1 356.9 L 100.6 348.7 L 87.5 337.0 L 73.9 326.1 L 60.8 314.3 L 49.2 300.8 L 37.7 286.8 L 29.9 270.4 L 24.1 253.4 L 23.4 235.1 L 23.6 217.4 L 25.8 200.0 L 27.6 183.0 L 30.7 166.3 L 34.2 149.7 L 36.6 132.3 L 43.2 116.2 L 52.4 101.4 L 63.6 88.0 L 76.6 76.6 L 89.6 65.5 L 102.7 54.4 L 116.8 44.3 L 130.6 32.4 L 146.9 24.8 L 163.7 17.5 L 181.9 16.2 L 200.0 15.1 L 217.9 18.7 L 234.6 26.3 L 251.1 31.6 L 267.9 36.0 L 283.2 44.3 L 299.3 51.4 L 312.4 63.1 L 324.0 76.0 L 335.6 88.7 L 344.7 103.3 L 350.9 119.3 L 357.5 134.7 L 365.3 149.9 L 373.9 165.4 L 379.1 182.4 Z";
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-field`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#171714" />
            <stop offset="0.5" stopColor="#171714" />
            <stop offset="0.5" stopColor="#8E2B2B" />
            <stop offset="1" stopColor="#8E2B2B" />
          </linearGradient>
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FDFBF7" />
            <stop offset="1" stopColor="#E8DECD" />
          </linearGradient>
          <filter id={`${uid}-rough`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path d={tear} fill={`url(#${uid}-field)`} stroke={`url(#${uid}-rim)`} strokeWidth="7" strokeLinejoin="round" filter={`url(#${uid}-rough)`} />
        <path d={tear} fill="none" stroke="#11110F" strokeWidth="1" opacity="0.35" transform="translate(0 3)" />
      </svg>
      <div className={`pointer-events-auto absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 ${mobile ? "w-[64%]" : "w-[76%]"}`}>
        <RecordEye />
      </div>
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
