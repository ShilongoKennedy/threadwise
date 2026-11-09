import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/read/$token")({
  // Rendered on the server so a shared link previews properly and never flashes.
  loader: async ({ params }) => {
    const { loadRead } = await import("@/lib/threadwise/analyst");
    return (await loadRead(params.token)) ?? null;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "A read — Threadwise" }, { name: "robots", content: "noindex" }] };
    }
    const move = loaderData.input.replace(/\s+/g, " ").trim().slice(0, 150);
    const description = (loaderData.report as Report).falsifier.slice(0, 200);
    return {
      meta: [
        { title: `${move} — The Analyst` },
        { name: "description", content: description },
        { property: "og:title", content: move },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: "https://threadwise-beta.vercel.app/og-canvas.jpg" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
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
  const loaded = Route.useLoaderData();
  const report = (loaded?.report ?? null) as Report | null;
  const input = loaded?.input ?? "";
  const at = loaded?.at ?? null;
  const [again, setAgain] = useState<{ token: string | null; report: Report } | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<boolean | null>(null);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const status = loaded ? "ready" : "missing";

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
              {loaded && (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { data } = await supabase.auth.getSession();
                      const jwt = data.session?.access_token;
                      if (!jwt) {
                        setPublishNote("Sign in to publish a read.");
                        return;
                      }
                      const response = await fetch("/api/publish-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
                        body: JSON.stringify({ token, publish: published !== true }),
                      });
                      const body = (await response.json()) as { error?: string };
                      if (response.ok) {
                        setPublished(published !== true);
                        setPublishNote(published !== true ? "Private." : "On the index.");
                      } else {
                        setPublishNote(body.error ?? "Could not publish.");
                      }
                    })();
                  }}
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/55 underline underline-offset-4 hover:text-[#1A4BFF]"
                >
                  {published ? "Published · unpublish" : "Publish to the index"}
                </button>
              )}
              {publishNote && (
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">{publishNote}</span>
              )}
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
                        const body = (await response.json()) as { token?: string | null; report?: Report };
                        if (body.report) setAgain({ token: body.token ?? null, report: body.report });
                        else setAgain({ token: null, report });
                      } catch {
                        setAgain(null);
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
                  {again.token ? (
                    <Link
                      to="/read/$token"
                      params={{ token: again.token }}
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4"
                    >
                      Open it →
                    </Link>
                  ) : (
                    <span className="text-[#1A1A1A]/60">It could not be saved, so it is not available by link.</span>
                  )}
                </p>

                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
                  What changed since this one
                </p>
                <ul className="mt-1 space-y-1">
                  {changedSince(report, again.report).map((change) => (
                    <li key={change} className="flex gap-2 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/85">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#1A4BFF]" />
                      {change}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
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
            <FileFinding token={token} note={report.falsifier} />

            <RedTeam report={report} />

            <p className="border-t border-[#1A1A1A]/15 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              Produced by The Analyst · verify before you act
            </p>
          </article>
        )}
      </main>
    </div>
  );
}


/** A short, honest list of what a re-read changed — or that nothing did. */
function changedSince(before: Report, after: Report): string[] {
  const changes: string[] = [];

  if (before.confidence !== after.confidence) {
    changes.push(`Confidence moved from ${before.confidence} to ${after.confidence}.`);
  }
  if (before.falsifier.trim() !== after.falsifier.trim()) {
    changes.push("The falsifier is different — the read now hinges on another fact.");
  }

  const oldSignals = new Set(before.watch.map((item) => item.signal.toLowerCase().trim()));
  const newSignals = new Set(after.watch.map((item) => item.signal.toLowerCase().trim()));
  const added = after.watch.filter((item) => !oldSignals.has(item.signal.toLowerCase().trim()));
  const dropped = before.watch.filter((item) => !newSignals.has(item.signal.toLowerCase().trim()));
  if (added.length) changes.push(`${added.length} new signal${added.length > 1 ? "s" : ""} to watch: ${added[0]!.signal}`);
  if (dropped.length) changes.push(`${dropped.length} signal${dropped.length > 1 ? "s" : ""} no longer expected: ${dropped[0]!.signal}`);

  if (before.counter_reading.trim().slice(0, 80) !== after.counter_reading.trim().slice(0, 80)) {
    changes.push("The counter-reading shifted.");
  }

  return changes.length ? changes : ["Nothing material changed — the same facts still support the same read."];
}


type Round = { attack: string; strongest: string; concession: string; settle: string };

function RedTeam({ report }: { report: Report }) {
  const [position, setPosition] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spar = async (text: string) => {
    const claim = text.trim();
    if (claim.length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setPosition("");
    try {
      const response = await fetch("/api/analyst-redteam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, position: claim }),
      });
      const body = (await response.json()) as Round & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No argument came back.");
      setRounds([...rounds, body]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No argument came back.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">Red team</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">argue with the read</span>
      </div>

      <div className="px-4 py-4">
        {rounds.length === 0 && (
          <p className="max-w-[58ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">
            State your own position on this move. The analyst will attack it with the evidence in the
            read — and tell you where you are right.
          </p>
        )}

        {rounds.map((round, index) => (
          <div key={index} className="mb-5 space-y-3 border-b border-[#1A1A1A]/10 pb-4 last:border-b-0">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C1121F]">the attack</p>
              <p className="mt-1 whitespace-pre-line font-serif text-[15px] leading-relaxed">{round.attack}</p>
            </div>
            <div className="border-l-2 border-[#1A1A1A]/30 pl-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/60">strongest point for you</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.strongest}</p>
            </div>
            <div className="border-l-2 border-[#1A4BFF] pl-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">where you are right</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.concession}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/60">what would settle it</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.settle}</p>
            </div>
          </div>
        ))}

        {error && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C1121F]">{error}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void spar(position);
          }}
          className="flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-2"
        >
          <input
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="I think the reward is a sign of weakness, not strength…"
            className="min-w-0 flex-1 bg-transparent font-serif text-[15px] outline-none placeholder:text-[#1A1A1A]/35"
          />
          <button
            type="submit"
            disabled={busy || position.trim().length < 20}
            className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] disabled:opacity-40"
          >
            {busy ? "Thinking…" : "Argue →"}
          </button>
        </form>
      </div>
    </section>
  );
}


/** Files one line of evidence from this read against an open question. */
function FileFinding({ token, note }: { token: string; note: string }) {
  const [questions, setQuestions] = useState<{ id: string; question: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [text, setText] = useState(note.slice(0, 240));
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data } = await supabase
        .from("analyst_questions")
        .select("id, question")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (!alive) return;
      setQuestions((data as { id: string; question: string }[]) ?? []);
      if (data?.[0]) setSelected((data[0] as { id: string }).id);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (questions.length === 0) return null;

  const file = async (stance: "for" | "against") => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("analyst_findings").insert({
      question_id: selected,
      read_token: token,
      stance,
      note: text.trim().slice(0, 400),
    });
    setDone(error ? error.message : `Filed ${stance} — it is on the question now.`);
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">File a finding</span>
        <Link to="/questions" className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
          questions →
        </Link>
      </div>
      <div className="space-y-3 px-4 py-4">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="w-full border-2 border-[#1A1A1A] bg-white px-2 py-2 font-serif text-[14px] outline-none"
        >
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.question}
            </option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="w-full resize-none border-2 border-[#1A1A1A] px-2 py-2 font-serif text-[14px] leading-relaxed outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void file("for")}
            className="border-2 border-[#1A4BFF] bg-[#1A4BFF] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
          >
            This supports it
          </button>
          <button
            type="button"
            onClick={() => void file("against")}
            className="border-2 border-[#C1121F] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#C1121F]"
          >
            This argues against it
          </button>
          {done && <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">{done}</span>}
        </div>
      </div>
    </section>
  );
}
