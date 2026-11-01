import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowUpRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listResolvedWatches, WATCH_LABEL, type Watch } from "@/lib/threadwise/watches";

export const Route = createFileRoute("/briefing")({
  validateSearch: (search: Record<string, unknown>): { b?: string | undefined } => ({
    b: typeof search["b"] === "string" ? search["b"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Morning Brief — Threadwise" },
      {
        name: "description",
        content:
          "One story a day, dissected: the event, the spin, the reality beneath it, and the framing that got you there.",
      },
      { property: "og:title", content: "Morning Brief — Threadwise" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: BriefingPage,
});

type NewsBrief = {
  id: string;
  headline: string;
  bluf: string;
  framing: unknown;
  omission: unknown;
  historical_echo: string;
  threat_level: string | null;
  source_url: string;
  created_at: string;
};

/** The assessment arrives as 3–4 paragraphs separated by blank lines. */
const toParagraphs = (text: string): string[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const blocks = trimmed
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;
  // Some models separate paragraphs with single newlines instead.
  return trimmed
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

/** Legacy rows stored these as plain text; keep them renderable as one bullet. */
const toBullets = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const THREAT_STYLE: Record<string, { bg: string; fg: string; rank: number }> = {
  LOW: { bg: "#1A1A1A", fg: "#FDFBF7", rank: 1 },
  MODERATE: { bg: "#1A1A1A", fg: "#FDFBF7", rank: 2 },
  ELEVATED: { bg: "#1A4BFF", fg: "#FFFFFF", rank: 3 },
  CRITICAL: { bg: "#C1121F", fg: "#FFFFFF", rank: 4 },
};

const FALLBACK_THREAT = { bg: "#1A1A1A", fg: "#FDFBF7", rank: 2 };

const threatOf = (value: string | null) =>
  THREAT_STYLE[(value ?? "MODERATE").toUpperCase()] ?? FALLBACK_THREAT;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const filedDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

const filedTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function RailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-[#1A1A1A]/12 pb-3 last:border-0 last:pb-0">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-[#1A1A1A]/35">
        {label}
      </div>
      {children}
    </div>
  );
}

function BriefingPage() {
  const { b } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [brief, setBrief] = useState<NewsBrief | null>(null);
  const [resolved, setResolved] = useState<Watch[]>([]);

  useEffect(() => {
    let active = true;
    void listResolvedWatches()
      .then((rows) => {
        if (active) setResolved(rows);
      })
      .catch(() => {
        /* anonymous readers have no watches; that is not an error */
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const columns =
          "id, headline, bluf, framing, omission, historical_echo, threat_level, source_url, created_at";
        const query = supabase.from("news_briefs").select(columns);
        const { data, error } = await (b
          ? query.eq("id", b).maybeSingle()
          : query.order("created_at", { ascending: false }).limit(1).maybeSingle());
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
  }, [b]);

  const threat = brief ? threatOf(brief.threat_level) : FALLBACK_THREAT;
  const level = (brief?.threat_level ?? "MODERATE").toUpperCase();
  const dossier = brief ? `D-${brief.id.slice(0, 6).toUpperCase()}` : "D-000000";
  const assessment = toParagraphs(brief?.bluf ?? "");
  const framing = brief ? toBullets(brief.framing) : [];
  const omission = brief ? toBullets(brief.omission) : [];

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* faint instrument grid, same language as the canvas */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <span className="font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.26em] text-[#1A1A1A] md:text-[10px]">
            Threadwise Intelligence <span className="text-[#1A4BFF]">//</span> Morning Brief
          </span>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <span className="inline-flex items-center gap-1.5 border border-[#C1121F] bg-[#C1121F]/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#C1121F] shadow-[0_0_18px_rgba(193,18,31,0.4)] md:text-[10px]">
              <Lock className="h-2.5 w-2.5" />
              Classified
            </span>
            <Link
              to="/briefs"
              className="hidden items-center gap-1.5 border-2 border-[#1A1A1A] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7] sm:flex"
            >
              Archive
            </Link>
            <Link
              to="/app"
              className="group flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              Workspace
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* threat rail — the page's only colour until the content starts */}
      <div className="h-1 w-full" style={{ backgroundColor: threat.bg }} />

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-9">
        {status === "loading" && (
          <div className="flex min-h-[64vh] flex-col items-center justify-center gap-3 border-2 border-dashed border-[#1A1A1A]/20">
            <span className="h-2.5 w-2.5 animate-pulse bg-[#1A4BFF]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#1A1A1A]/45">
              Acquiring target…
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="mx-auto flex min-h-[64vh] max-w-xl flex-col items-start justify-center gap-4 border-2 border-dashed border-[#1A1A1A]/25 bg-white/60 p-9">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#1A4BFF]">
              No target acquired
            </span>
            <h1 className="font-display text-3xl leading-[1.05]">
              No dossier has been generated yet.
            </h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/50">
              The agent files one every day. Check the archive for previous briefs.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto flex min-h-[64vh] max-w-xl flex-col items-start justify-center gap-3 border-2 border-[#1A1A1A] bg-white p-9">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C1121F]">
              Signal lost
            </span>
            <h1 className="font-display text-2xl leading-tight">The dossier could not be retrieved.</h1>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/50">
              Sign in, or confirm the news_briefs table is reachable.
            </p>
          </div>
        )}

        {status === "ready" && brief && (
          <>
            {resolved.length > 0 && (
              <section className="mb-4 border-2 border-[#1A1A1A] bg-white">
                <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
                    Watches resolved
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A4BFF]">
                    {resolved.length} settled
                  </span>
                </div>
                <ul>
                  {resolved.map((watch) => {
                    const contradicted = watch.status === "contradicted";
                    return (
                      <li
                        key={watch.id}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#1A1A1A]/10 px-3 py-2 last:border-b-0"
                      >
                        <span
                          className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
                          style={{ backgroundColor: contradicted ? "#C1121F" : "#1A1A1A" }}
                        >
                          {WATCH_LABEL[watch.status]}
                        </span>
                        <span className="font-display text-sm leading-tight text-[#1A1A1A]">
                          {watch.claim}
                        </span>
                        {watch.resolution && (
                          <span className="text-xs leading-snug text-[#1A1A1A]/55">{watch.resolution}</span>
                        )}
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/35">
                          {watch.due_date}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <article className="grid grid-cols-1 border-2 border-[#1A1A1A] bg-white lg:grid-cols-[228px_minmax(0,1fr)]">
            {/* ── Cover rail ─────────────────────────────────────── */}
            <aside className="flex flex-col gap-4 border-b-2 border-[#1A1A1A] bg-[#FDFBF7] p-4 lg:border-b-0 lg:border-r-2">
              <RailField label="Dossier">
                <div className="font-display text-[26px] leading-none tracking-tight">{dossier}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">
                  Single target
                </div>
              </RailField>

              <RailField label="Filed">
                <div className="font-mono text-[12px] tracking-[0.08em]">{filedDate(brief.created_at)}</div>
                <div className="font-mono text-[12px] tracking-[0.08em] text-[#1A1A1A]/45">
                  {filedTime(brief.created_at)} local
                </div>
              </RailField>

              <RailField label="Source">
                <a
                  href={brief.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex max-w-full items-center gap-1 font-mono text-[12px] uppercase tracking-[0.06em] text-[#1A4BFF] underline decoration-[#1A4BFF]/40 underline-offset-2 hover:decoration-[#1A4BFF]"
                  title={brief.source_url}
                >
                  <span className="truncate">{hostOf(brief.source_url)}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                </a>
              </RailField>

              <RailField label="Threat level">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className="h-3.5 flex-1"
                      style={{
                        backgroundColor: step <= threat.rank ? threat.bg : "#1A1A1A",
                        opacity: step <= threat.rank ? 1 : 0.12,
                      }}
                    />
                  ))}
                </div>
                <div
                  className="mt-2 inline-block px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: threat.bg, color: threat.fg }}
                >
                  {level}
                </div>
              </RailField>

              <RailField label="Confidence">
                <div className="font-mono text-[12px] tracking-[0.08em]">SINGLE SOURCE</div>
                <p className="mt-1 text-[12px] leading-snug text-[#1A1A1A]/45">
                  One article, no independent corroboration in this run.
                </p>
              </RailField>
            </aside>

            {/* ── Assessment ─────────────────────────────────────── */}
            <div className="flex min-w-0 flex-col">
              <div className="border-b-2 border-[#1A1A1A] px-5 py-5 md:px-7 md:py-6">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40">
                  <span className="h-1.5 w-1.5 bg-[#1A4BFF]" />
                  Target headline
                </div>
                <h1 className="max-w-[24ch] font-display text-[clamp(30px,4.2vw,62px)] leading-[0.95] tracking-[-0.02em]">
                  {brief.headline}
                </h1>
              </div>

              {/* Executive assessment */}
              <section className="border-y-2 border-[#1A4BFF] bg-white">
                <div className="flex items-center justify-between border-b border-[#1A4BFF]/25 px-5 py-1.5">
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#1A4BFF]">
                    Executive Assessment
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
                    01
                  </span>
                </div>
                <div className="px-5 py-6 md:px-7 md:py-7">
                  {assessment.map((paragraph, index) => (
                    <p
                      key={index}
                      className={`font-serif text-xl leading-relaxed text-[#1A1A1A]/90 md:text-2xl ${
                        index === 0
                          ? "first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:font-display first-letter:text-7xl first-letter:text-[#1A4BFF]"
                          : "mt-5"
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>

              {/* Findings grid */}
              <div className="grid grid-cols-1 divide-y divide-[#1A1A1A] md:grid-cols-3 md:divide-x md:divide-y-0">
                <section className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 px-4 py-1.5">
                    <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                      Framing
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
                      02
                    </span>
                  </div>
                  <ul className="flex-1 divide-y divide-[#1A1A1A]/10">
                    {framing.map((bullet, index) => (
                      <li key={index} className="flex gap-2.5 px-4 py-2.5">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#1A4BFF]" />
                        <span className="font-serif text-[14px] leading-[1.55] text-[#1A1A1A]/85">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-dashed border-[#1A1A1A]/25 px-4 py-1.5">
                    <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]">
                      Omission
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
                      03
                    </span>
                  </div>
                  <ul className="flex-1 divide-y divide-dashed divide-[#1A1A1A]/12">
                    {omission.map((bullet, index) => (
                      <li key={index} className="flex gap-2.5 px-4 py-2.5">
                        <AlertTriangle className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#C1121F]" />
                        <span className="font-serif text-[14px] leading-[1.55] text-[#1A1A1A]/85">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="flex flex-col bg-[#1A1A1A] text-[#FDFBF7]">
                  <div className="flex items-center justify-between border-b border-[#FDFBF7]/20 px-4 py-1.5">
                    <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                      Historical echo
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FDFBF7]/30">
                      04
                    </span>
                  </div>
                  <p className="flex-1 px-4 py-3 font-serif text-[14px] leading-[1.6] text-[#FDFBF7]/85">
                    {brief.historical_echo}
                  </p>
                </section>
              </div>

              {/* Footer */}
              <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#1A1A1A] px-5 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/35">
                  End of dossier · machine assessment · verify before action
                </span>
                <a
                  href={brief.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1.5 border border-[#1A1A1A]/20 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 transition-colors hover:border-[#1A4BFF] hover:text-[#1A4BFF]"
                >
                  Open source
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </footer>
            </div>
            </article>
          </>
        )}
      </main>
    </div>
  );
}
