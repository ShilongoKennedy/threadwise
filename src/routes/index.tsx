import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Menu,
  Search,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Threadwise — read the evidence, not just the framing" },
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

const MOBILE_LINKS = [
  { to: "/analyst", label: "The analyst" },
  { to: "/questions", label: "Questions" },
  { to: "/digest", label: "Record" },
  { to: "/cases", label: "Cases" },
  { to: "/profile", label: "Profile" },
] as const;

const LOOP = [
  {
    n: "01",
    icon: FileText,
    title: "Read the move",
    body: "A link, a PDF, a screenshot. The read separates what happened from what the source wants you to think happened.",
  },
  {
    n: "02",
    icon: Search,
    title: "Keep the questions",
    body: "File evidence for and against. When a question is one-sided, the record says so instead of pretending it is settled.",
  },
  {
    n: "03",
    icon: Target,
    title: "Predict and score",
    body: "Date a claim, come back when it resolves. The record keeps the Brier score, not only the hits.",
  },
  {
    n: "04",
    icon: Activity,
    title: "Practise the gap",
    body: "A weekly drill targets the falsifier or steelman you are weakest at, then shows whether you are improving.",
  },
] as const;

function LandingPage() {
  const [session, setSession] = useState<unknown>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

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

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1A1A1A]/10 bg-[#FDFBF7]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-5 py-3.5 md:px-8">
          <BrandLockup size="md" asLink />

          <nav className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/65 lg:flex">
            <Link to="/analyst" className="text-[#1A4BFF] transition-colors hover:text-[#1A1A1A]">
              The analyst
            </Link>
            <Link to="/questions" className="transition-colors hover:text-[#1A1A1A]">
              Questions
            </Link>
            <Link to="/digest" className="transition-colors hover:text-[#1A1A1A]">
              Record
            </Link>
            <Link to="/cases" className="transition-colors hover:text-[#1A1A1A]">
              Cases
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {session ? (
              <Link
                to="/analyst"
                className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 transition-colors hover:text-[#1A4BFF] sm:inline"
              >
                Workspace
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 transition-colors hover:text-[#1A4BFF] sm:inline"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/analyst"
              className="group inline-flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] md:px-4 md:text-[10px]"
            >
              <span className="hidden sm:inline">Read a source</span>
              <span className="sm:hidden">Read</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#1A1A1A] lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-nav" className="border-t border-[#1A1A1A]/10 bg-[#FDFBF7] px-5 py-4 lg:hidden">
            <nav className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              {MOBILE_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-[#1A1A1A]/10 pb-2 text-[#1A1A1A]/75 hover:text-[#1A4BFF]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!session && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-4 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </header>

      <main id="main" className="relative z-10 flex-1">
        {/* HERO */}
        <section className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
          <div className="grid items-end gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
            <div>
              <div className="flex items-center gap-4">
                <div className="h-px w-10 bg-[#1A4BFF]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                  Forensic intelligence, without the oracle
                </span>
              </div>

              <h1 className="mt-5 max-w-[13ch] font-display text-[clamp(46px,7.2vw,96px)] leading-[0.92] tracking-[-0.035em]">
                See what the story{" "}
                <span className="italic text-[#1A4BFF]">hides.</span>
              </h1>

              <p className="mt-6 max-w-[54ch] font-serif text-[17px] font-light leading-[1.6] text-[#1A1A1A]/70 md:text-[20px]">
                Paste a link, a PDF or a screenshot. Threadwise reads the framing, checks the claims
                against primary sources, and shows you what would prove it wrong.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  to="/analyst"
                  className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
                >
                  Read a source now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/read/$token"
                  params={{ token: SAMPLE_TOKEN }}
                  className="group inline-flex items-center gap-2 border-b-2 border-[#1A4BFF]/30 pb-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] transition-colors hover:border-[#1A4BFF]"
                >
                  See a real read
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/50">
                Free in beta · Google sign-in · your work stays yours
              </p>
            </div>

            <HeroRead />
          </div>
        </section>

        {/* ONE REAL READ */}
        <section id="read" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <h2 className="font-display text-[30px] leading-none md:text-[42px]">
              One source, read properly.
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
              not a summary
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ReadCard label="What it actually did" body={REAL_READ.whatItDid} />
            <ReadCard label="What its word is worth" body={REAL_READ.wordWorth} />
            <ReadCard label="The counter-reading" body={REAL_READ.counter} />
            <ReadCard label="What would prove this wrong" body={REAL_READ.falsifier} tone="red" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <p className="max-w-[74ch] font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/65">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                What to watch ·{" "}
              </span>
              {REAL_READ.watch}
            </p>
            <Link
              to="/read/$token"
              params={{ token: SAMPLE_TOKEN }}
              className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              Open the full read
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
            From a real run of the Analyst · IAEA / Iran · 9 Nov 2026
          </p>
        </section>

        {/* THE LOOP */}
        <section id="loop" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <h2 className="max-w-[18ch] font-display text-[30px] leading-none md:text-[42px]">
              A read is the start, not the product.
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
              read · question · predict · practise
            </span>
          </div>

          <ol className="mt-5 grid grid-cols-1 border-b border-[#1A1A1A]/15 md:grid-cols-4">
            {LOOP.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.n}
                  className={`px-1 py-6 ${index > 0 ? "border-t border-[#1A1A1A]/15 md:border-l md:border-t-0 md:pl-5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
                      {step.n}
                    </span>
                    <Icon className="h-4 w-4 text-[#1A1A1A]/35" />
                  </div>
                  <h3 className="mt-3 font-display text-[21px] leading-tight">{step.title}</h3>
                  <p className="mt-2 max-w-[36ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
                    {step.body}
                  </p>
                </li>
              );
            })}
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

        {/* THE DIFFERENCE */}
        <section className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
          <div className="border-y-2 border-[#1A1A1A] py-9 md:py-12">
            <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-14">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                  The difference
                </span>
                <h2 className="mt-3 max-w-[18ch] font-display text-[32px] leading-[0.98] md:text-[50px]">
                  Not a portal. A workbench.
                </h2>
                <p className="mt-4 max-w-[44ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/70">
                  A chat window hides the work: you ask, something answers, you nod. Threadwise puts
                  the source beside what you already believe and keeps the thread visible long enough
                  to argue with.
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Claims, not vibes", "Every load-bearing claim gets a source and a falsifier."],
                  ["Both sides, or a warning", "Questions with one-sided evidence are flagged, not averaged."],
                  ["A record that keeps score", "Dated predictions resolve into a Brier score; practice shows the gap."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t-2 border-[#1A1A1A] pt-3">
                    <dt className="font-display text-[17px] leading-tight">{title}</dt>
                    <dd className="mt-2 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/60">
                      {body}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="mx-auto w-full max-w-[1200px] px-5 pb-20 pt-6 md:px-8 md:pb-28">
          <div className="border-2 border-[#1A1A1A] bg-white px-6 py-11 md:px-10 md:py-14">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
              Nothing here is generated for you to nod at
            </span>
            <h2 className="mt-4 max-w-[16ch] font-display text-[38px] leading-[0.95] tracking-tight md:text-[60px]">
              Read one article properly.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#1A1A1A]/65">
              Ten minutes with a source you already distrust will teach you more than a month of
              summaries. Start with the one you have open in another tab.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/analyst"
                className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
              >
                Read a source now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/read/$token"
                params={{ token: SAMPLE_TOKEN }}
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                See a real read
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              Free while in beta · Google sign-in · your work stays yours
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
                A workbench for reading sources, keeping the receipts, and getting better at the
                argument.
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
                  A real read
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
    <aside className="border-2 border-[#1A1A1A] bg-white p-5 shadow-[6px_6px_0_0_rgba(26,26,26,.10)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#1A1A1A]/15 pb-2">
        <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
          A real read
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
          <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/50">
            What it did
          </dt>
          <dd className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/70">
            A confidential report to member states, not a public finding against Iran.
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#C1121F]">
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
        Open this read <ArrowUpRight className="h-3 w-3" />
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
      className={`border-2 bg-white p-5 md:p-6 ${
        tone === "red" ? "border-[#C1121F]" : "border-[#1A1A1A]"
      }`}
    >
      <p
        className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${
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
