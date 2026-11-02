import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DepthLine, type DepthCard } from "@/components/lab/DepthLine";
import { WorldMap, type Pinned } from "@/components/lab/WorldMap";
import { inferPlace } from "@/components/lab/world";
import { listSuggestedFor, type Watch } from "@/lib/threadwise/watches";

export const Route = createFileRoute("/lab-archive")({
  head: () => ({
    meta: [
      { title: "Experiment — archive in depth" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArchiveDepth,
});

type Row = {
  id: string;
  headline: string;
  bluf: string;
  threat_level: string | null;
  created_at: string;
};

const firstLine = (text: string) => {
  const paragraph = (text ?? "").split(/\n\s*\n/)[0] ?? "";
  const sentence = paragraph.split(/(?<=\.)\s/)[0] ?? paragraph;
  return sentence.length > 150 ? `${sentence.slice(0, 149).trimEnd()}…` : sentence;
};

function ArchiveDepth() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [focus, setFocus] = useState(0);
  const [pinsFor, setPinsFor] = useState<number>(0);
  const [signals, setSignals] = useState<Watch[]>([]);

  useEffect(() => {
    let active = true;
    void supabase
      .from("news_briefs")
      .select("id, headline, bluf, threat_level, created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!active) return;
        const list = (data as Row[]) ?? [];
        setRows(list);
        setStatus(list.length ? "ready" : "empty");
      });
    return () => {
      active = false;
    };
  }, []);

  const places = useMemo(
    () =>
      rows.map((row) => {
        const hit = inferPlace(`${row.headline} ${row.bluf ?? ""}`);
        return hit ? hit : null;
      }),
    [rows],
  );

  const pins = useMemo<Pinned[]>(() => {
    const list: Pinned[] = [];
    rows.forEach((row, index) => {
      const hit = places[index];
      if (!hit) return;
      const collide = list.filter(
        (pin) => Math.hypot(pin.x - hit.x, pin.y - hit.y) < 6,
      ).length;
      list.push({
        id: row.id,
        x: hit.x + collide * 7,
        y: hit.y + collide * 5,
        name: hit.place.name,
        label: row.headline,
        active: index === pinsFor,
        past: index <= pinsFor,
      });
    });
    return list;
  }, [rows, places, pinsFor]);

  const cards = useMemo<DepthCard[]>(
    () =>
      rows.map((row, index) => ({
        key: row.id,
        eyebrow: `${index === 0 ? "Today" : `${index} back`} · ${new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
        title: row.headline,
        line: firstLine(row.bluf),
        tone:
          row.threat_level === "CRITICAL" || row.threat_level === "ELEVATED" ? "red" : "ink",
      })),
    [rows],
  );

  useEffect(() => {
    const focused = rows[focus];
    if (!focused) return;
    let active = true;
    setSignals([]);
    void listSuggestedFor(focused.headline)
      .then((list) => {
        if (active) setSignals(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [focus, rows]);

  return (
    <div className="flex h-[100dvh] flex-col bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            to="/briefs"
            className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowLeft className="h-3 w-3" /> Archive
          </Link>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
            Experiment <span className="text-[#1A4BFF]">//</span> archive in depth
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/60">
          The past recedes · {rows.length} briefs
        </span>
      </header>

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/60">
          Reading the record…
        </div>
      )}

      {status === "empty" && (
        <div className="flex flex-1 items-center justify-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/60">
          No briefs to walk through yet.
        </div>
      )}

      {status === "ready" && (
        <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(220px,46%)_minmax(240px,54%)] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(220px,46%)_minmax(240px,54%)]">
          <section className="relative min-h-0 overflow-hidden border-b-2 border-[#1A1A1A] lg:col-start-1 lg:row-start-1">
            {pins.length > 0 ? (
              <>
                <WorldMap pins={pins} />
                <div className="pointer-events-none absolute left-4 top-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">
                  Where the record has been
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/45">
                No location could be read from these briefs
              </div>
            )}
          </section>

          <div className="relative flex min-h-0 flex-col lg:col-start-1 lg:row-start-2">
        <DepthLine
          label="Brief archive, newest in front"
          cards={cards}
          onFocus={(index) => {
            setFocus(index);
            setPinsFor(index);
          }}
        />
          </div>

          <aside className="hidden min-h-0 overflow-y-auto border-l-2 border-[#1A1A1A] bg-[#faf8f3] px-5 py-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block">
            <Dossier row={rows[focus]} place={places[focus] ?? null} signals={signals} />
          </aside>
        </main>
      )}
    </div>
  );
}

function Dossier({
  row,
  place,
  signals,
}: {
  row: Row | undefined;
  place: { place: { name: string } } | null;
  signals: Watch[];
}) {
  if (!row) return null;
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1A4BFF]">
          {new Date(row.created_at).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h2 className="mt-2 font-display text-[24px] leading-[1.05]">{row.headline}</h2>
        {place && (
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
            {place.place.name}
          </p>
        )}
        <p className="mt-3 font-serif text-[13.5px] leading-[1.6] text-[#1A1A1A]/70">
          {firstLine(row.bluf)}
        </p>
        <Link
          to="/briefing"
          search={{ b: row.id }}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4"
        >
          Read this brief <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="border-t border-[#1A1A1A]/15 pt-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
          Dated claims in it
        </p>
        {signals.length === 0 ? (
          <p className="mt-2 font-serif text-[13px] leading-[1.6] text-[#1A1A1A]/60">
            This brief committed to no dates.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {signals.map((signal) => (
              <li key={signal.id} className="border-l-2 border-l-[#1A4BFF] pl-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/60">
                  {signal.due_date}
                </span>
                <p className="font-display text-[13px] leading-tight">{signal.claim}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
