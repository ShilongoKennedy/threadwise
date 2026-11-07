import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft as Back, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DepthLine, type DepthCard } from "@/components/lab/DepthLine";

export const Route = createFileRoute("/lab-brief")({
  head: () => ({
    meta: [{ title: "Experiment — brief in depth" }, { name: "robots", content: "noindex" }],
  }),
  component: BriefDepth,
});

type Row = {
  id: string;
  headline: string;
  bluf: string;
  framing: string[] | null;
  omission: string[] | null;
  created_at: string;
};

const SECTION_NAMES = ["The event", "The spin", "The reality", "What to watch"];

const shorten = (text: string, max = 150) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

function BriefDepth() {
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let active = true;
    void supabase
      .from("news_briefs")
      .select("id, headline, bluf, framing, omission, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setRow((data as Row) ?? null);
        setStatus(data ? "ready" : "empty");
      });
    return () => {
      active = false;
    };
  }, []);

  const paragraphs = useMemo(
    () =>
      (row?.bluf ?? "")
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean),
    [row],
  );

  const cards = useMemo<DepthCard[]>(
    () =>
      paragraphs.map((paragraph, index) => ({
        key: `p${index}`,
        eyebrow: `${String(index + 1).padStart(2, "0")} · ${SECTION_NAMES[index] ?? "Further"}`,
        title: SECTION_NAMES[index] ?? "Further reading",
        line: shorten(paragraph),
        tone: index === 0 ? "ink" : index === 2 ? "cobalt" : "ink",
      })),
    [paragraphs],
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/analyst"
            className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <Back className="h-3 w-3" /> Brief
          </Link>
          <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
            Experiment <span className="text-[#1A4BFF]">//</span> brief in depth
          </span>
        </div>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 sm:inline">
          Walk the argument · {paragraphs.length} sections
        </span>
      </header>

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/60">
          Reading today's brief…
        </div>
      )}

      {status === "empty" && (
        <div className="flex flex-1 items-center justify-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/60">
          No brief filed yet.
        </div>
      )}

      {status === "ready" && row && (
        <DepthLine
          label="The argument, one section per plane"
          cards={cards}
          renderRail={(index) => (
            <div className="space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1A4BFF]">
                {String(index + 1).padStart(2, "0")} — {SECTION_NAMES[index] ?? "Further"}
              </p>
              <p className="font-serif text-[14px] leading-[1.65] text-[#1A1A1A]/85">
                {paragraphs[index] ?? ""}
              </p>

              {index === 0 && (row.framing?.length ?? 0) > 0 && (
                <div className="border-t border-[#1A1A1A]/15 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
                    Framing
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(row.framing ?? []).map((item, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-[#1A1A1A]/75">
                        <span className="mt-1.5 h-1 w-1 shrink-0 bg-[#1A1A1A]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {index === 1 && (row.omission?.length ?? 0) > 0 && (
                <div className="border-t border-[#1A1A1A]/15 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
                    Omissions
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(row.omission ?? []).map((item, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-[#1A1A1A]/75">
                        <span className="mt-1.5 h-1 w-1 shrink-0 bg-[#C1121F]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                to="/analyst"
                className="inline-flex items-center gap-1.5 border-t border-[#1A1A1A]/15 pt-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]"
              >
                The full brief <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        />
      )}
    </div>
  );
}
