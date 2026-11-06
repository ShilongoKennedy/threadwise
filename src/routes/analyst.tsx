import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/analyst")({
  head: () => ({
    meta: [
      { title: "The Analyst — Threadwise" },
      {
        name: "description",
        content:
          "Bring one move — a post, a quote, a headline — and get a political read: why now, who it costs, what it echoes, and what would prove it wrong.",
      },
    ],
  }),
  component: AnalystPage,
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
  confidence: "documented" | "inferred" | "speculative";
  sources: { title: string; url: string }[];
};

const EXAMPLES = [
  "Trump announces that Stephen Miller will become his new chief of staff.",
  "A minister resigns two weeks before the budget vote, citing personal reasons.",
  "The central bank raises rates the day after the election result.",
];

function AnalystPage() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [reading, setReading] = useState<{ text: string; context: string } | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  const readImage = async (file: File) => {
    if (readingBusy) return;
    setReadingBusy(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("That image could not be opened."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const body = (await response.json()) as { reading?: { text: string; context: string }; error?: string };
      if (!response.ok || !body.reading) throw new Error(body.error ?? "That screenshot could not be read.");
      setReading(body.reading);
      setInput(body.reading.text);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That screenshot could not be read.");
    } finally {
      setReadingBusy(false);
    }
  };

  const run = async (text: string) => {
    const move = text.trim();
    if (move.length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setReport(null);
    setStage(1);

    const ticks = [
      window.setTimeout(() => setStage(2), 1400),
      window.setTimeout(() => setStage(3), 6000),
      window.setTimeout(() => setStage(4), 14000),
    ];

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: move }),
      });
      const body = (await response.json()) as { report?: Report; token?: string | null; error?: string };
      if (!response.ok || !body.report) throw new Error(body.error ?? "The analyst could not finish this read.");
      setReport(body.report);
      setToken(body.token ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      ticks.forEach((tick) => window.clearTimeout(tick));
      setBusy(false);
      setStage(0);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
            >
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
            The Analyst
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10">
        {!report && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#1A4BFF]">
              One move, read properly
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[1.02] md:text-[46px]">
              Bring me a move.
            </h1>
            <p className="mt-3 max-w-[52ch] font-serif text-[16px] leading-[1.65] text-[#1A1A1A]/75">
              A post, a quote, a headline, a sentence you don&rsquo;t trust. You&rsquo;ll get the read: what it
              actually is, why now, who it costs, what it echoes, and the one fact that would prove this
              wrong.
            </p>

            <div className="mt-6 border-2 border-[#1A1A1A] bg-white shadow-[6px_6px_0_0_rgba(26,26,26,.10)]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste the announcement, the tweet, the paragraph…"
                rows={6}
                maxLength={4000}
                className="w-full resize-none bg-transparent px-4 py-4 font-serif text-[16px] leading-relaxed outline-none placeholder:text-[#1A1A1A]/35"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 px-4 py-3">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer border-2 border-[#1A1A1A] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]">
                    {readingBusy ? "Reading image…" : "Screenshot"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void readImage(file);
                      }}
                    />
                  </label>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
                    {input.trim().length}/4000 · ~40s
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void run(input)}
                  disabled={busy || input.trim().length < 20}
                  className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Reading…" : "Read this move"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {busy && (
              <ol className="mt-5 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/60">
                {["Reading the move", "Finding the people and institutions", "Working out who gains", "Writing the read"].map(
                  (label, index) => (
                    <li key={label} className={stage > index ? "text-[#1A4BFF]" : ""}>
                      {stage > index ? "▪" : "▫"} {label}
                    </li>
                  ),
                )}
              </ol>
            )}

            {reading && !report && (
              <div className="mt-4 border-2 border-[#1A4BFF] bg-white px-4 py-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
                  This is what I read — correct anything wrong, then read it
                </p>
                {reading.context && (
                  <p className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/60">{reading.context}</p>
                )}
              </div>
            )}

            {error && (
              <p className="mt-5 border-2 border-[#C1121F] bg-[#C1121F]/5 px-4 py-3 font-serif text-[14px] text-[#C1121F]">
                {error}
              </p>
            )}

            {!busy && (
              <div className="mt-8">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/55">
                  Or try one of these
                </span>
                <ul className="mt-2 divide-y divide-[#1A1A1A]/10 border-y border-[#1A1A1A]/10">
                  {EXAMPLES.map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        onClick={() => {
                          setInput(example);
                          void run(example);
                        }}
                        className="group flex w-full items-center justify-between gap-3 py-3 text-left font-serif text-[14px] leading-snug text-[#1A1A1A]/75 transition-colors hover:text-[#1A4BFF]"
                      >
                        {example}
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {report && (
          <Read
            report={report}
            token={token}
            onAgain={() => {
              setReport(null);
              setToken(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#1A1A1A]/15 py-5 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">{n}</span>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]">{title}</h2>
      </div>
      <div className="font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/85">{children}</div>
    </section>
  );
}

type Turn = { role: "user" | "assistant"; content: string };

function Read({ report, token, onAgain }: { report: Report; token: string | null; onAgain: () => void }) {
  const [thread, setThread] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [watchState, setWatchState] = useState("idle");

  const ask = async (text: string) => {
    const prompt = text.trim();
    if (prompt.length < 4 || asking) return;
    setAsking(true);
    setAskError(null);
    setQuestion("");
    const nextThread: Turn[] = [...thread, { role: "user", content: prompt }];
    setThread(nextThread);

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, question: prompt, history: thread }),
      });
      const body = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !body.answer) throw new Error(body.error ?? "No answer came back.");
      setThread([...nextThread, { role: "assistant", content: body.answer }]);
    } catch (caught) {
      setAskError(caught instanceof Error ? caught.message : "No answer came back.");
      setThread(nextThread);
    } finally {
      setAsking(false);
    }
  };
  return (
    <article>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em]">
          The read · confidence: {report.confidence}
        </span>
        <div className="flex items-center gap-4">
          {token && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(`${window.location.origin}/read/${token}`);
              }}
              className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/60 underline underline-offset-4 hover:text-[#1A4BFF]"
            >
              Copy link
            </button>
          )}
          <button
            type="button"
            onClick={onAgain}
            className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
          >
            Another move
          </button>
        </div>
      </div>

      <Section n="01" title="The move">
        <p>{report.move}</p>
      </Section>

      <Section n="02" title="Why now">
        <p>{report.why_now}</p>
      </Section>

      <Section n="03" title="Who gains, who pays">
        <ul className="space-y-3">
          {report.stakes.map((stake) => (
            <li key={stake.actor} className="border-l-2 border-[#1A1A1A] pl-3">
              <p className="font-display text-[16px] leading-tight">{stake.actor}</p>
              <p className="mt-1 text-[14px] leading-snug text-[#1A1A1A]/80">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A4BFF]">gains · </span>
                {stake.gains}
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-[#1A1A1A]/60">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C1121F]">loses · </span>
                {stake.loses}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section n="04" title="What it echoes">
        <ul className="space-y-4">
          {report.precedent.map((item) => (
            <li key={item.name}>
              <p className="font-display text-[17px] leading-tight">
                {item.name} <span className="font-mono text-[10px] text-[#1A1A1A]/55">{item.when}</span>
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">{item.parallel}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#1A1A1A]/60">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">where it breaks · </span>
                {item.breaks}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section n="05" title="What it changes downstream">
        <p>{report.second_order}</p>
      </Section>

      <Section n="06" title="The counter-reading">
        <p className="border-l-2 border-[#1A4BFF] pl-3">{report.counter_reading}</p>
      </Section>

      <Section n="07" title="What would prove this wrong">
        <p className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-3 py-2 text-[15px] leading-relaxed">
          {report.falsifier}
        </p>
      </Section>

      <Section n="08" title="What to watch">
        <ul className="space-y-2">
          {report.watch.map((item) => (
            <li key={item.signal} className="flex items-baseline justify-between gap-4 border-b border-[#1A1A1A]/10 pb-2">
              <span className="text-[15px] leading-snug">{item.signal}</span>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">
                {item.when}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section n="09" title="Keep these signals">
        {token ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  setWatchState("saving");
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
                    const { data } = await supabase.auth.getSession();
                    const jwt = data.session?.access_token;
                    if (!jwt) {
                      setWatchState("signin");
                      return;
                    }
                    const response = await fetch("/api/analyst-watch", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
                      body: JSON.stringify({ token }),
                    });
                    const body = (await response.json()) as { created?: number; error?: string };
                    if (!response.ok) throw new Error(body.error ?? "Could not keep those signals.");
                    setWatchState(`done:${body.created ?? 0}`);
                  } catch {
                    setWatchState("failed");
                  }
                })();
              }}
              className="border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
            >
              {watchState === "saving" ? "Keeping…" : "Watch these signals"}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60">
              {watchState.startsWith("done:")
                ? `${watchState.split(":")[1]} watches filed · scored each morning`
                : watchState === "signin"
                  ? "Sign in first — watches belong to you"
                  : watchState === "failed"
                    ? "Could not file them just now"
                    : "They go to your calendar and get checked on the date"}
            </span>
          </div>
        ) : (
          <p className="text-[14px] text-[#1A1A1A]/60">
            Signals can be kept once the read is saved.
          </p>
        )}
      </Section>

      <Section n="10" title="Interrogate this read">
        <div className="space-y-3">
          {thread.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={
                turn.role === "user"
                  ? "border-l-2 border-[#1A1A1A]/30 pl-3 text-[14px] text-[#1A1A1A]/70"
                  : "whitespace-pre-line border-l-2 border-[#1A4BFF] pl-3 text-[15px] leading-relaxed"
              }
            >
              {turn.role === "user" ? `You: ${turn.content}` : turn.content}
            </div>
          ))}

          {asking && (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A4BFF]">Thinking…</p>
          )}
          {askError && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C1121F]">{askError}</p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(question);
            }}
            className="flex items-center gap-2 border-2 border-[#1A1A1A] bg-white px-3 py-2"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Why not a career official? Who blocks this?"
              className="min-w-0 flex-1 bg-transparent font-serif text-[15px] outline-none placeholder:text-[#1A1A1A]/35"
            />
            <button
              type="submit"
              disabled={asking || question.trim().length < 4}
              className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] disabled:opacity-40"
            >
              Ask →
            </button>
          </form>
        </div>
      </Section>

      {report.sources.length > 0 && (
        <Section n="11" title="What this rests on">
          <ul className="space-y-1.5">
            {report.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4"
                >
                  {source.title} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
