import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Threadwise — Morning Brief" },
      {
        name: "description",
        content:
          "The autonomous daily intelligence brief: cross-source synthesis, contradictions and omissions.",
      },
      { property: "og:title", content: "Threadwise — Morning Brief" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: BriefingPage,
});

type NewsBrief = {
  headline: string;
  summary: string;
  sources: string[];
  analysis: string[];
  tags: string[];
  created_at: string;
};

type Row = {
  headline: string;
  summary: string;
  sources: Json;
  analysis: Json;
  tags: string[] | null;
  created_at: string;
};

const strings = (value: Json): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const toBrief = (row: Row): NewsBrief => ({
  headline: row.headline,
  summary: row.summary,
  sources: strings(row.sources),
  analysis: strings(row.analysis),
  tags: row.tags ?? [],
  created_at: row.created_at,
});

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

function BriefingPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [brief, setBrief] = useState<NewsBrief | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("news_briefs")
          .select("headline, summary, sources, analysis, tags, created_at")
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
        setBrief(toBrief(data as Row));
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="text-[#1A1A1A] group-hover:text-[#1A4BFF] transition-colors"
            >
              <circle cx="6" cy="18" r="2.5" fill="currentColor" />
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="18" cy="6" r="2.5" fill="currentColor" />
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
            <span className="font-display text-lg italic font-medium tracking-tight">threadwise</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/45 sm:flex">
              <Newspaper className="h-3 w-3" /> Morning Brief
            </span>
            <Link
              to="/app"
              className="group flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A4BFF] px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[3px_3px_0_0_#1A1A1A] transition-all hover:bg-[#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#1A1A1A]"
            >
              Return to Workspace
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-10 md:px-8 md:py-16">
        {status === "loading" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <span className="h-3 w-3 animate-pulse bg-[#1A4BFF]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#1A1A1A]/50">
              Waiting for intelligence…
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 border-2 border-dashed border-[#1A1A1A]/25 p-10 text-center">
            <Newspaper className="h-8 w-8 text-[#1A1A1A]/25" />
            <h1 className="font-display text-3xl leading-tight">No briefing generated yet.</h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[#1A1A1A]/50">
              Run the /api/news-brief endpoint to commission today&rsquo;s brief.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-3 border-2 border-[#1A1A1A] p-10 text-center">
            <h1 className="font-display text-2xl">The brief could not be retrieved.</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/50">
              Sign in, or check that the news_briefs table is reachable.
            </p>
          </div>
        )}

        {status === "ready" && brief && (
          <article>
            <div className="flex flex-wrap items-center justify-between gap-2 border-y-2 border-[#1A1A1A] py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#1A1A1A]">
                Threadwise Intelligence · Daily Brief
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#1A1A1A]/45">
                {longDate(brief.created_at)}
              </span>
            </div>

            <h1 className="mt-9 font-display text-[40px] leading-[0.95] tracking-tight md:text-[72px]">
              {brief.headline}
            </h1>

            <p className="mt-6 max-w-3xl border-l-4 border-[#1A4BFF] pl-5 font-display text-xl italic leading-snug text-[#1A1A1A]/75 md:text-2xl">
              {brief.summary}
            </p>

            {brief.tags.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2 border-t border-[#1A1A1A]/15 pt-5">
                {brief.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#1A4BFF]/35 bg-[#1A4BFF]/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 grid gap-10 border-t-2 border-[#1A1A1A] pt-9 md:grid-cols-[minmax(0,1fr)_250px]">
              <div className="space-y-6">
                {brief.analysis.map((paragraph, index) => (
                  <p key={index} className="font-serif text-lg leading-relaxed text-[#1A1A1A]/90">
                    {index === 0 ? (
                      <>
                        <span className="float-left mr-2 mt-1 font-display text-[54px] leading-[0.75] text-[#1A4BFF]">
                          {paragraph.slice(0, 1)}
                        </span>
                        {paragraph.slice(1)}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>

              <aside className="md:border-l-2 md:border-[#1A1A1A] md:pl-6">
                <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                  Sources · {brief.sources.length}
                </h2>
                <ol className="mt-3 space-y-3">
                  {brief.sources.map((source, index) => (
                    <li key={source} className="flex gap-2">
                      <span className="font-mono text-[9px] leading-5 text-[#1A4BFF]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="truncate font-mono text-[10px] leading-5 text-[#1A1A1A]/60 underline decoration-[#1A4BFF]/40 underline-offset-2 transition-colors hover:text-[#1A4BFF]"
                        title={source}
                      >
                        {hostOf(source)}
                      </a>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/35">
              <span>Machine-generated · every claim verified against the sources above</span>
              <span>End of brief</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
