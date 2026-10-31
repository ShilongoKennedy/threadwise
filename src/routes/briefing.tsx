import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Threadwise — Target Dossier" },
      {
        name: "description",
        content:
          "A single-target tactical dossier: BLUF, framing techniques, omissions and historical echo.",
      },
      { property: "og:title", content: "Threadwise — Target Dossier" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: BriefingPage,
});

type NewsBrief = {
  headline: string;
  bluf: string;
  framing: unknown;
  omission: unknown;
  historical_echo: string;
  threat_level: string | null;
  source_url: string;
  created_at: string;
};

/** Legacy rows stored these as plain text; keep them renderable as one bullet. */
const toBullets = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const THREAT_STYLE: Record<string, { bg: string; fg: string }> = {
  CRITICAL: { bg: "#C1121F", fg: "#FFFFFF" },
  ELEVATED: { bg: "#1A4BFF", fg: "#FFFFFF" },
  MODERATE: { bg: "#1A1A1A", fg: "#FDFBF7" },
  LOW: { bg: "#FFFFFF", fg: "#1A1A1A" },
};

const FALLBACK_THREAT = { bg: "#1A1A1A", fg: "#FDFBF7" };

const threatOf = (value: string | null) =>
  THREAT_STYLE[(value ?? "MODERATE").toUpperCase()] ?? FALLBACK_THREAT;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const clock = (iso: string) =>
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
          .select(
            "headline, bluf, framing, omission, historical_echo, threat_level, source_url, created_at",
          )
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

  const threat = brief ? threatOf(brief.threat_level) : FALLBACK_THREAT;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* ── Terminal bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <span className="font-mono text-[9px] font-bold uppercase leading-tight tracking-[0.26em] text-[#1A1A1A] md:text-[10px]">
            Threadwise Intelligence <span className="text-[#1A4BFF]">//</span> Target Dossier
          </span>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <span className="inline-flex items-center gap-1.5 border border-[#C1121F] bg-[#C1121F]/10 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-[#C1121F] shadow-[0_0_18px_rgba(193,18,31,0.45)] md:text-[9px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C1121F]" />
              Classified
            </span>
            <Link
              to="/app"
              className="group flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              Workspace
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-8 md:py-12">
        {status === "loading" && (
          <div className="flex min-h-[64vh] flex-col items-center justify-center gap-3 border-2 border-dashed border-[#1A1A1A]/20">
            <span className="h-2.5 w-2.5 animate-pulse bg-[#1A4BFF]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#1A1A1A]/45">
              Acquiring target…
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="mx-auto flex min-h-[64vh] max-w-xl flex-col items-start justify-center gap-4 border-2 border-dashed border-[#1A1A1A]/25 p-9">
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
          <div className="mx-auto flex min-h-[64vh] max-w-xl flex-col items-start justify-center gap-3 border-2 border-[#1A1A1A] p-9">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C1121F]">
              Signal lost
            </span>
            <h1 className="font-display text-2xl leading-tight">The dossier could not be retrieved.</h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/50">
              Sign in, or confirm the news_briefs table is reachable.
            </p>
          </div>
        )}

        {status === "ready" && brief && (
          <article>
            {/* ── Metadata strip ─────────────────────────────────── */}
            <div className="grid grid-cols-1 divide-y divide-[#1A1A1A] border-2 border-[#1A1A1A] sm:grid-cols-[1fr_1fr_auto] sm:divide-x sm:divide-y-0">
              <div className="flex flex-col justify-center px-4 py-2.5">
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                  Filed
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]">
                  {longDate(brief.created_at)} · {clock(brief.created_at)}
                </span>
              </div>

              <div className="flex min-w-0 flex-col justify-center px-4 py-2.5">
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                  Source
                </span>
                <a
                  href={brief.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-[#1A4BFF] underline decoration-[#1A4BFF]/40 underline-offset-2 hover:decoration-[#1A4BFF]"
                  title={brief.source_url}
                >
                  {hostOf(brief.source_url)}
                </a>
              </div>

              <div
                className="flex min-w-[168px] flex-col items-start justify-center px-4 py-2.5"
                style={{ backgroundColor: threat.bg, color: threat.fg }}
              >
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] opacity-60">
                  Threat level
                </span>
                <span className="font-mono text-[13px] font-bold uppercase tracking-[0.18em]">
                  {(brief.threat_level ?? "MODERATE").toUpperCase()}
                </span>
              </div>
            </div>

            {/* ── Headline ───────────────────────────────────────── */}
            <h1 className="mt-7 max-w-[26ch] font-display text-[42px] leading-[0.9] tracking-[-0.02em] md:text-[88px]">
              {brief.headline}
            </h1>

            {/* ── BLUF ───────────────────────────────────────────── */}
            <section className="mt-7 border-2 border-[#1A1A1A] bg-white">
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2">
                <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-[#FDFBF7]">
                  BLUF
                </h2>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1A4BFF]">
                  Bottom line up front
                </span>
              </div>
              <p className="px-5 py-5 font-serif text-2xl font-semibold leading-[1.35] text-[#1A1A1A] md:px-7 md:py-6 md:text-[30px]">
                {brief.bluf}
              </p>
            </section>

            {/* ── Three-column analysis ──────────────────────────── */}
            <div className="mt-4 grid grid-cols-1 divide-y divide-[#1A1A1A] border-2 border-[#1A1A1A] md:grid-cols-3 md:divide-x md:divide-y-0">
              {/* FRAMING */}
              <section className="flex flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 px-4 py-2">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                    Framing
                  </h2>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
                    01
                  </span>
                </div>
                <ul className="flex-1 space-y-3 px-4 py-4">
                  {toBullets(brief.framing).map((bullet, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="mt-[7px] h-2 w-2 shrink-0 rotate-45 bg-[#1A4BFF]" />
                      <span className="font-serif text-[15px] leading-[1.55] text-[#1A1A1A]/90">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* OMISSION */}
              <section className="flex flex-col bg-[#FDFBF7]">
                <div className="flex items-center justify-between border-b border-dashed border-[#1A1A1A]/25 px-4 py-2">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]">
                    Omission
                  </h2>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
                    02
                  </span>
                </div>
                <ul className="flex-1 space-y-3 px-4 py-4">
                  {toBullets(brief.omission).map((bullet, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 border-l-2 border-dashed border-[#C1121F]/45 pl-2.5"
                    >
                      <AlertTriangle className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#C1121F]" />
                      <span className="font-serif text-[15px] leading-[1.55] text-[#1A1A1A]/90">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* HISTORICAL ECHO */}
              <section className="flex flex-col bg-[#1A1A1A] text-[#FDFBF7]">
                <div className="flex items-center justify-between border-b border-[#FDFBF7]/20 px-4 py-2">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                    Historical Echo
                  </h2>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#FDFBF7]/30">
                    03
                  </span>
                </div>
                <p className="flex-1 px-4 py-4 font-serif text-[15px] leading-[1.6] text-[#FDFBF7]/85">
                  {brief.historical_echo}
                </p>
              </section>
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1A1A1A] pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                End of dossier · single-source assessment
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
