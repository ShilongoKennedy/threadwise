import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/briefs")({
  head: () => ({
    meta: [
      { title: "Morning Briefs — Threadwise" },
      {
        name: "description",
        content:
          "The archive: one news story per day, dissected for framing, omissions and historical echo.",
      },
      { property: "og:title", content: "Morning Briefs — Threadwise" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BriefsPage,
});

type Row = {
  id: string;
  headline: string;
  bluf: string;
  threat_level: string | null;
  created_at: string;
};

const THREAT: Record<string, string> = {
  CRITICAL: "#C1121F",
  ELEVATED: "#1A4BFF",
  MODERATE: "#1A1A1A",
  LOW: "#1A1A1A",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const excerpt = (text: string) => {
  const first = text.split(/\n\s*\n/)[0]?.trim() ?? text.trim();
  return first.length > 180 ? `${first.slice(0, 179).trimEnd()}…` : first;
};

function BriefsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("news_briefs")
          .select("id, headline, bluf, threat_level, created_at")
          .order("created_at", { ascending: false })
          .limit(60);
        if (!active) return;
        if (error) {
          setStatus("error");
          return;
        }
        setRows((data as Row[]) ?? []);
        setStatus((data ?? []).length ? "ready" : "empty");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              Threadwise
            </Link>
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
              Intelligence <span className="text-[#1A4BFF]">//</span> Brief Archive
            </span>
          </div>
          <Link
            to="/briefing"
            className="group flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#1A4BFF] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_0_#1A1A1A] transition-all hover:bg-[#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Today&rsquo;s brief
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-[#1A1A1A] pb-3">
          <h1 className="font-display text-[34px] leading-none md:text-[52px]">The archive.</h1>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">
            {rows.length} dossier{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        {status === "loading" && (
          <p className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40">
            Loading the record…
          </p>
        )}

        {status === "empty" && (
          <div className="border-2 border-dashed border-[#1A1A1A]/25 p-10 text-center">
            <p className="font-display text-2xl">No briefs filed yet.</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/40">
              The agent files one every day.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="border-2 border-[#1A1A1A] p-10 text-center">
            <p className="font-display text-2xl">The archive could not be read.</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/40">
              Check the news_briefs table and its read policy.
            </p>
          </div>
        )}

        {status === "ready" && (
          <ol className="border-t border-[#1A1A1A]/15">
            {rows.map((row) => {
              const level = (row.threat_level ?? "MODERATE").toUpperCase();
              return (
                <li key={row.id} className="border-b border-[#1A1A1A]/15">
                  <Link
                    to="/briefing"
                    search={{ b: row.id }}
                    className="group grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 px-1 py-4 transition-colors hover:bg-[#1A4BFF]/[0.04] md:grid-cols-[110px_84px_1fr_auto] md:items-center"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/45 md:text-[10px]">
                      {shortDate(row.created_at)}
                    </span>
                    <span
                      className="justify-self-start px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white"
                      style={{ backgroundColor: THREAT[level] ?? "#1A1A1A" }}
                    >
                      {level}
                    </span>
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <h2 className="font-display text-lg leading-tight transition-colors group-hover:text-[#1A4BFF] md:text-xl">
                        {row.headline}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-[#1A1A1A]/50">
                        {excerpt(row.bluf)}
                      </p>
                    </div>
                    <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-[#1A1A1A]/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1A4BFF] md:block" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </main>

      <footer className="mx-auto w-full max-w-[1100px] px-4 pb-10 md:px-6">
        <p className="flex items-center gap-2 border-t border-[#1A1A1A]/15 pt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/35">
          <Lock className="h-3 w-3" /> Machine assessment · verify before action
        </p>
      </footer>
    </div>
  );
}
