import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { listWatches, resolveWatch, WATCH_LABEL, type Watch } from "@/lib/threadwise/watches";
import { calibrationStats, isPrediction, predictionConfidence } from "@/lib/threadwise/calibration";
import { VerdictStamp } from "@/components/threadwise/VerdictStamp";

export const Route = createFileRoute("/digest")({
  head: () => ({
    meta: [
      { title: "The record — Threadwise" },
      {
        name: "description",
        content:
          "Every dated claim you filed, and what the reporting actually did: the running track record of the watches.",
      },
      { property: "og:title", content: "The record — Threadwise" },
      { property: "og:type", content: "website" },
    
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
  component: DigestPage,
});

const isoDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return {
    key: `${utc.getUTCFullYear()}-${String(Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)).padStart(2, "0")}`,
    start: new Date(utc.getTime() - 3 * 86_400_000),
  };
};

const span = (start: Date) =>
  `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${new Date(
    start.getTime() + 6 * 86_400_000,
  ).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

type Week = {
  key: string;
  start: Date;
  filed: number;
  resolved: number;
  confirmed: number;
  contradicted: number;
  open: number;
};

function DigestPage() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [reads, setReads] = useState<{ token: string; input: string; at: string }[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      if (!jwt) return;
      const response = await fetch("/api/analyst-recent", { headers: { Authorization: `Bearer ${jwt}` } });
      if (!response.ok) return;
      const body = (await response.json()) as { reads?: { token: string; input: string; at: string }[] };
      if (alive && body.reads) setReads(body.reads);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void listWatches()
      .then((rows) => {
        if (!active) return;
        setWatches(rows.filter((row) => row.scope !== "suggested"));
        setState(rows.length ? "ready" : "empty");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const weeks = useMemo<Week[]>(() => {
    const map = new Map<string, Week>();
    const touch = (key: string, start: Date) => {
      const found = map.get(key);
      if (found) return found;
      const created: Week = { key, start, filed: 0, resolved: 0, confirmed: 0, contradicted: 0, open: 0 };
      map.set(key, created);
      return created;
    };

    for (const watch of watches) {
      const filed = isoDay(watch.due_date);
      touch(filed.key, filed.start).filed += 1;
      if (watch.status === "pending") touch(filed.key, filed.start).open += 1;
      if (watch.checked_at && watch.status !== "pending" && watch.status !== "inconclusive") {
        const settled = isoDay(watch.checked_at);
        const week = touch(settled.key, settled.start);
        week.resolved += 1;
        if (watch.status === "confirmed") week.confirmed += 1;
        if (watch.status === "contradicted") week.contradicted += 1;
      }
    }

    return [...map.values()].sort((a, b) => b.start.getTime() - a.start.getTime()).slice(0, 8);
  }, [watches]);

  const current = weeks.find((week) => week.key === selected) ?? weeks[0];
  const totals = useMemo(
    () =>
      weeks.reduce(
        (acc, week) => ({
          filed: acc.filed + week.filed,
          resolved: acc.resolved + week.resolved,
          confirmed: acc.confirmed + week.confirmed,
          contradicted: acc.contradicted + week.contradicted,
        }),
        { filed: 0, resolved: 0, confirmed: 0, contradicted: 0 },
      ),
    [weeks],
  );
  const settled = totals.confirmed + totals.contradicted;
  const accuracy = settled ? Math.round((totals.confirmed / settled) * 100) : null;
  const peak = Math.max(1, ...weeks.map((week) => week.filed + week.resolved));

  const form = watches
    .filter((watch) => watch.status === "confirmed" || watch.status === "contradicted")
    .sort((a, b) => (b.checked_at ?? "").localeCompare(a.checked_at ?? ""))
    .slice(0, 10);

  const weekWatches = current
    ? watches.filter((watch) => {
        const filed = isoDay(watch.due_date).key;
        const settledKey = watch.checked_at ? isoDay(watch.checked_at).key : null;
        return filed === current.key || settledKey === current.key;
      })
    : [];

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-20 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/analyst"
              className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              <ArrowLeft className="h-3 w-3" /> Workspace
            </Link>
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
              Threadwise <span className="text-[#1A4BFF]">//</span> The record
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/profile"
              className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 transition-colors hover:text-[#1A4BFF] sm:text-[9px]"
            >
              <span className="hidden sm:inline">Thinking profile</span>
              <span className="sm:hidden">Profile</span>
            </Link>
            <Link
              to="/analyst"
              className="group flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#1A4BFF] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_0_#1A1A1A] transition-all hover:bg-[#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Ask the analyst
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <h1 className="font-display text-[38px] leading-none md:text-[58px]">The record.</h1>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-[#1A1A1A]/65">
          Every claim you dated, and what the reporting actually did. Judgements only count when the
          agent could settle them.
        </p>

        {reads.length > 0 && (
          <section className="mt-8 border-2 border-[#1A1A1A]">
            <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
                Reads you kept
              </span>
              <Link to="/analyst" className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
                new read →
              </Link>
            </div>
            <ul>
              {reads.map((read) => (
                <li key={read.token} className="border-b border-[#1A1A1A]/10 last:border-b-0">
                  <Link
                    to="/read/$token"
                    params={{ token: read.token }}
                    className="group flex items-baseline justify-between gap-4 px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate font-serif text-[14px] text-[#1A1A1A]/85 group-hover:text-[#1A4BFF]">
                      {read.input}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                      {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {state === "loading" && (
          <p className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/65">
            Reading the record…
          </p>
        )}

        {state === "error" && (
          <p className="mt-10 border-2 border-[#1A1A1A] p-6 text-center font-mono text-[10px] uppercase tracking-[0.16em]">
            The record could not be read. Check the claim_watches table.
          </p>
        )}

        {state === "empty" && (
          <div className="mt-10 border-2 border-dashed border-[#1A1A1A]/25 p-10 text-center">
            <p className="font-display text-2xl">Nothing filed yet.</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
              Keep a signal from a read and it will start keeping score.
            </p>
          </div>
        )}

        {state === "ready" && current && (
          <>
            <section className="mt-8 grid grid-cols-2 border-2 border-[#1A1A1A] md:grid-cols-4">
              {[
                { label: "filed", value: totals.filed },
                { label: "settled", value: settled },
                { label: "confirmed", value: totals.confirmed },
                { label: "contradicted", value: totals.contradicted },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`px-4 py-4 ${index > 0 ? "border-l border-[#1A1A1A]/12" : ""} ${index === 2 ? "max-md:border-l-0 max-md:border-t" : ""} ${index === 3 ? "max-md:border-t" : ""}`}
                >
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-display text-[32px] leading-none">{stat.value}</div>
                </div>
              ))}
            </section>

            <CalibrationSection
              watches={watches}
              onResolved={(id, status) =>
                setWatches((current) =>
                  current.map((watch) =>
                    watch.id === id
                      ? { ...watch, status, checked_at: new Date().toISOString() }
                      : watch,
                  ),
                )
              }
            />

            <section className="mt-4 flex flex-wrap items-end justify-between gap-3 border-2 border-[#1A1A1A] px-4 py-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
                  reporting called it
                </div>
                <div className="mt-1 font-display text-[28px] leading-none">
                  {accuracy === null ? "—" : `${accuracy}%`}
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                    of {settled} settled
                  </span>
                </div>
              </div>
              <p className="max-w-[40ch] text-xs leading-relaxed text-[#1A1A1A]/65">
                A claim the agent could not settle stays open and is checked again tomorrow. It never
                counts as a miss.
              </p>
            </section>

            <section className="mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-[#1A1A1A] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
                  Form
                </span>
                <span className="flex items-center gap-1.5">
                  {form.length === 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">
                      no verdicts yet
                    </span>
                  )}
                  {form.map((watch) => (
                    <span
                      key={watch.id}
                      title={`${WATCH_LABEL[watch.status]} · ${watch.claim}`}
                      className="h-2.5 w-2.5"
                      style={{
                        background: watch.status === "confirmed" ? "#1A1A1A" : "transparent",
                        border: "1px solid",
                        borderColor: watch.status === "contradicted" ? "#C1121F" : "#1A1A1A",
                      }}
                    />
                  ))}
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                last {form.length} settled · filled held, hollow did not
              </span>
            </section>

            <section className="mt-10">
              <div className="flex items-end justify-between border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
                  By week
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
                  filed · settled
                </span>
              </div>
              <ul>
                {weeks.map((week) => {
                  const active = week.key === current.key;
                  return (
                    <li key={week.key}>
                      <button
                        type="button"
                        onClick={() => setSelected(week.key)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 border-b border-[#1A1A1A]/12 px-1 py-2.5 text-left transition-colors hover:bg-[#1A1A1A]/[0.035] ${active ? "bg-[#1A4BFF]/[0.05]" : ""}`}
                      >
                        <span className="w-[150px] shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1A1A]/65">
                          {span(week.start)}
                        </span>
                        <span className="flex min-w-0 flex-1 items-center gap-1">
                          <span
                            className="h-2 bg-[#1A1A1A]"
                            style={{ width: `${(week.filed / peak) * 45}%` }}
                            aria-hidden
                          />
                          <span
                            className="h-2 bg-[#1A4BFF]"
                            style={{ width: `${(week.resolved / peak) * 45}%` }}
                            aria-hidden
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right font-mono text-[10px] text-[#1A1A1A]/65">
                          {week.filed} · {week.resolved}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-10">
              <div className="flex items-end justify-between border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
                  {span(current.start)}
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
                  {weekWatches.length} claims
                </span>
              </div>
              {weekWatches.length === 0 ? (
                <p className="py-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                  Nothing filed or settled this week.
                </p>
              ) : (
                <ul>
                  {weekWatches.map((watch) => {
                    const contradicted = watch.status === "contradicted";
                    const pending = watch.status === "pending";
                    return (
                      <li
                        key={watch.id}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#1A1A1A]/12 px-1 py-2.5"
                      >
                        {pending ? (
                          <span
                            className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
                            style={{ backgroundColor: "#1A4BFF" }}
                          >
                            {WATCH_LABEL[watch.status]}
                          </span>
                        ) : (
                          <VerdictStamp
                            status={contradicted ? "contradicted" : "confirmed"}
                            sound={false}
                          />
                        )}
                        <span className="font-display text-sm leading-tight">{watch.claim}</span>
                        {watch.resolution && (
                          <span className="text-xs leading-snug text-[#1A1A1A]/65">
                            {watch.resolution}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">
                          {watch.due_date}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/** Prediction calibration: did "high confidence" actually mean high confidence? */
function CalibrationSection({
  watches,
  onResolved,
}: {
  watches: Watch[];
  onResolved: (id: string, status: "confirmed" | "contradicted") => void;
}) {
  const predictions = watches.filter((watch) => isPrediction(watch.origin));
  const stats = calibrationStats(
    predictions.map((watch) => ({
      confidence: predictionConfidence(watch.origin)!,
      status: watch.status,
      origin: watch.origin,
    })),
  );
  const open = predictions
    .filter((watch) => watch.status === "pending")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 4);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const score = async (id: string, status: "confirmed" | "contradicted") => {
    setBusy(id);
    setError(null);
    try {
      await resolveWatch(id, status);
      onResolved(id, status);
    } catch {
      setError("Could not score that prediction just now.");
    } finally {
      setBusy(null);
    }
  };

  if (!predictions.length) {
    return (
      <section className="mt-4 border-2 border-dashed border-[#1A1A1A]/25 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            Calibration
          </span>
          <Link to="/reads" className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
            reads →
          </Link>
        </div>
        <p className="mt-2 font-serif text-[13px] leading-snug text-[#1A1A1A]/60">
          File a prediction from a read and this becomes a track record, not a mood.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 border-2 border-[#1A1A1A] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
          Calibration
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A4BFF]">
          {stats.settled}/{stats.predictions} settled
          {stats.brier !== null ? ` · Brier ${stats.brier.toFixed(2)}` : ""}
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#1A1A1A]/10 border-b border-[#1A1A1A]/10">
        {stats.buckets.map((bucket) => (
          <div key={bucket.confidence} className="px-3 py-3">
            <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              {bucket.confidence}
            </div>
            <div className="mt-1 font-display text-[22px] leading-none">
              {bucket.accuracy === null ? "—" : `${Math.round(bucket.accuracy * 100)}%`}
            </div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
              {bucket.correct}/{bucket.settled} right
            </div>
          </div>
        ))}
      </div>

      {open.length > 0 ? (
        <ul className="divide-y divide-[#1A1A1A]/10">
          {open.map((watch) => (
            <li key={watch.id} className="px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-serif text-[13.5px] leading-snug">{watch.claim}</p>
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                  {watch.due_date}
                </span>
              </div>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  disabled={busy === watch.id}
                  onClick={() => void score(watch.id, "confirmed")}
                  className="border border-[#1A4BFF] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] disabled:opacity-40"
                >
                  Confirmed
                </button>
                <button
                  type="button"
                  disabled={busy === watch.id}
                  onClick={() => void score(watch.id, "contradicted")}
                  className="border border-[#C1121F] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#C1121F] disabled:opacity-40"
                >
                  Contradicted
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-2.5 font-serif text-[12.5px] text-[#1A1A1A]/55">
          No open predictions.
        </p>
      )}

      {error && (
        <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#C1121F]">
          {error}
        </p>
      )}
      <p className="border-t border-[#1A1A1A]/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
        Brier: lower is better · confidence maps to 80 / 55 / 30%
      </p>
    </section>
  );
}
