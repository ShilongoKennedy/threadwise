import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Threadwise — Daily Target" },
      {
        name: "description",
        content:
          "A single-target intelligence dossier: bottom line up front, framing, omissions and historical echo.",
      },
      { property: "og:title", content: "Threadwise — Daily Target" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: BriefingPage,
});

type NewsBrief = {
  headline: string;
  bluf: string;
  framing: string;
  omission: string;
  historical_echo: string;
  source_url: string;
  created_at: string;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const stamp = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function BriefingPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [brief, setBrief] = useState<NewsBrief | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("news_briefs")
          .select("headline, bluf, framing, omission, historical_echo, source_url, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!active) return;
        if (error) {
          setStatus("error");
          return;
        }
        if (!data) {
          setStatus("empty");
          return;
        }
        setBrief(data as NewsBrief);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-2.5 md:px-8">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] md:text-[10px]">
            Threadwise Intelligence <span className="text-[#1A4BFF]">//</span> Daily Target
          </span>
          <Link
            to="/app"
            className="group flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7] md:text-[10px]"
          >
            Workspace
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 md:px-8 md:py-14">
        {status === "loading" && (
          <div className="flex min-h-[62vh] flex-col items-center justify-center gap-4 text-center">
            <span className="h-2.5 w-2.5 animate-pulse bg-[#1A4BFF]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#1A1A1A]/45">
              Acquiring target…
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="mx-auto flex min-h-[62vh] max-w-lg flex-col items-start justify-center gap-4 border-2 border-dashed border-[#1A1A1A]/25 p-9">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#1A4BFF]">
              No target acquired
            </span>
            <h1 className="font-display text-3xl leading-[1.05]">
              No dossier has been generated yet.
            </h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/50">
              Run the /api/news-brief endpoint to commission today&rsquo;s target.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto flex min-h-[62vh] max-w-lg flex-col items-start justify-center gap-3 border-2 border-[#1A1A1A] p-9">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#1A4BFF]">
              Access interrupted
            </span>
            <h1 className="font-display text-2xl leading-tight">The dossier could not be retrieved.</h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/50">
              Sign in, or confirm the news_briefs table is reachable.
            </p>
          </div>
        )}

        {status === "ready" && brief && (
          <article>
            {/* ── Classification strip ───────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y-2 border-[#1A1A1A] py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#1A1A1A]">
                {longDate(brief.created_at)}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#1A1A1A]/40">
                Single-source · {hostOf(brief.source_url)} · {stamp(brief.created_at)}
              </span>
            </div>

            {/* ── Headline ───────────────────────────────────────── */}
            <h1 className="mt-8 max-w-[15ch] font-display text-[44px] leading-[0.92] tracking-[-0.02em] md:max-w-[20ch] md:text-[86px]">
              {brief.headline}
            </h1>

            {/* ── Dossier grid ───────────────────────────────────── */}
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
              {/* BLUF — full width, the spine of the page */}
              <section className="relative border-2 border-[#1A1A1A] bg-white md:col-span-12">
                <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-[#FDFBF7]">
                    BLUF · Bottom Line Up Front
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A4BFF]">
                    01
                  </span>
                </div>
                <p className="px-5 py-6 font-serif text-xl leading-[1.45] text-[#1A1A1A] md:px-8 md:py-8 md:text-3xl">
                  {brief.bluf}
                </p>
              </section>

              {/* FRAMING — cobalt rule, white paper */}
              <section className="border-2 border-[#1A1A1A] border-l-[6px] border-l-[#1A4BFF] bg-white md:col-span-6">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 px-4 py-2.5">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                    Framing
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/35">
                    02
                  </span>
                </div>
                <p className="px-4 py-5 font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/90">
                  {brief.framing}
                </p>
              </section>

              {/* OMISSION — dashed, the hole in the record */}
              <section className="border-2 border-dashed border-[#1A1A1A]/40 bg-[#FDFBF7] md:col-span-6">
                <div className="flex items-center justify-between border-b border-dashed border-[#1A1A1A]/25 px-4 py-2.5">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]">
                    Omission
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/35">
                    03
                  </span>
                </div>
                <p className="px-4 py-5 font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/90">
                  {brief.omission}
                </p>
              </section>

              {/* HISTORICAL ECHO — inverted slab */}
              <section className="bg-[#1A1A1A] text-[#FDFBF7] md:col-span-12">
                <div className="flex items-center justify-between border-b border-[#FDFBF7]/20 px-4 py-2.5 md:px-6">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                    Historical Echo
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FDFBF7]/35">
                    04
                  </span>
                </div>
                <p className="px-5 py-6 font-serif text-base leading-[1.75] text-[#FDFBF7]/85 md:px-6 md:text-lg">
                  {brief.historical_echo}
                </p>
              </section>
            </div>

            {/* ── Source footer ──────────────────────────────────── */}
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1A1A1A] pt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                Source of record
              </span>
              <a
                href={brief.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex max-w-full items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A4BFF] underline decoration-[#1A4BFF]/40 underline-offset-4 hover:decoration-[#1A4BFF]"
              >
                <span className="truncate">{brief.source_url}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
