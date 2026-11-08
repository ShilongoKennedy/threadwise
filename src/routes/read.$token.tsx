import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/read/$token")({
  head: () => ({ meta: [{ title: "A read — Threadwise" }] }),
  component: SharedRead,
});

type Report = {
  move: string;
  why_now: string;
  stakes: { actor: string; gains: string; loses: string }[];
  precedent: { name: string; when: string; parallel: string; breaks: string }[];
  second_order: string;
  counter_reading: string;
  watch: { signal: string; when: string }[];
  falsifier: string;
  confidence: string;
  sources: { title: string; url: string }[];
};

function SharedRead() {
  const { token } = Route.useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [input, setInput] = useState<string>("");
  const [at, setAt] = useState<string | null>(null);
  const [again, setAgain] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "missing" | "ready">("loading");

  useEffect(() => {
    let alive = true;
    fetch(`/api/read/${token}`)
      .then(async (response) =>
        response.ok ? ((await response.json()) as { report: Report; input?: string; at?: string | null }) : null,
      )
      .then((body) => {
        if (!alive) return;
        if (!body?.report) return setStatus("missing");
        setReport(body.report);
        setInput(body.input ?? "");
        setAt(body.at ?? null);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("missing"));
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">A saved read</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-8">
        {status === "loading" && <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">Opening…</p>}
        {status === "missing" && (
          <div className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-4 py-3">
            <p className="font-serif text-[15px]">That read does not exist, or the link is wrong.</p>
            <Link to="/analyst" className="mt-2 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4">
              Ask the analyst something new →
            </Link>
          </div>
        )}
        {status === "ready" && report && (
          <article className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em]">
                The read · {report.confidence}
                {at && (
                  <span className="ml-2 font-normal text-[#1A1A1A]/50">
                    as of {new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </span>
              {input && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      setAgain(null);
                      try {
                        const response = await fetch("/api/analyst", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: input }),
                        });
                        const body = (await response.json()) as { token?: string | null };
                        setAgain(body.token ?? "none");
                      } catch {
                        setAgain("none");
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4 disabled:opacity-40"
                >
                  {busy ? "Re-reading…" : "Re-read with today's reporting"}
                </button>
              )}
            </div>

            {again && (
              <div className="border-2 border-[#1A4BFF] bg-[#1A4BFF]/5 px-3 py-2">
                <p className="font-serif text-[14px]">
                  A fresh read has been written from the same move.{" "}
                  {again !== "none" ? (
                    <Link to="/read/$token" params={{ token: again }} className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4">
                      Open it →
                    </Link>
                  ) : (
                    <span className="text-[#1A1A1A]/60">It could not be saved, so it is not available by link.</span>
                  )}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">
                  This page keeps the original, as written.
                </p>
              </div>
            )}
            {[
              ["01", "The move", report.move],
              ["02", "Why now", report.why_now],
              ["05", "What it changes downstream", report.second_order],
              ["06", "The counter-reading", report.counter_reading],
            ].map(([n, title, body]) => (
              <section key={n as string}>
                <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">{n} · {title}</p>
                <p className="font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/85">{body}</p>
              </section>
            ))}
            <section>
              <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">03 · Who gains, who pays</p>
              <ul className="space-y-2">
                {report.stakes.map((stake) => (
                  <li key={stake.actor} className="border-l-2 border-[#1A1A1A] pl-3">
                    <p className="font-display text-[15px]">{stake.actor}</p>
                    <p className="text-[13.5px] text-[#1A1A1A]/75">gains · {stake.gains}</p>
                    <p className="text-[13.5px] text-[#1A1A1A]/60">loses · {stake.loses}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">07 · What would prove this wrong</p>
              <p className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-3 py-2 font-serif text-[15px]">{report.falsifier}</p>
            </section>
            <p className="border-t border-[#1A1A1A]/15 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              Produced by The Analyst · verify before you act
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
