import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import type { Seminar, SeminarTheory } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";
import { SeminarLessonView } from "@/components/threadwise/SeminarLessonView";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/seminar")({
  head: () => ({
    meta: [
      { title: "The Seminar — Threadwise" },
      {
        name: "description",
        content:
          "Put a quote or question on the table. Two steelmanned theories, one crux, and a provisional verdict only if you ask for it.",
      },
    ],
  }),
  component: SeminarPage,
});

const SAMPLE = `"I am actually in favour of foreign aid as a tool for statecraft, because sometimes foreign aid is easier than bombing people. Sometimes you want to bribe a country to get your way."`;

type SavedSeminar = {
  id: string;
  quote_text: string;
  context: string | null;
  question: string;
  seminar: Seminar & { lesson?: SeminarLesson };
  stand: "A" | "B" | "undecided" | null;
  verdict_shown: boolean;
  created_at: string;
};

function SeminarPage() {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stand, setStand] = useState<"A" | "B" | "undecided" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedSeminar[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lesson, setLesson] = useState<SeminarLesson | null>(null);
  const [lessonBusy, setLessonBusy] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user.id ?? null;
      if (!alive) return;
      setUserId(user);
      if (!user) return;
      const { data: rows, error: readError } = await supabase
        .from("analyst_seminars")
        .select("id, quote_text, context, question, seminar, stand, verdict_shown, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!alive || readError) return;
      setSaved((rows ?? []) as SavedSeminar[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!seminar || !userId || saveState === "saving" || savedId) return;
    setSaveState("saving");
    const { data, error: saveError } = await supabase
      .from("analyst_seminars")
      .insert({
        quote_text: text,
        context: context.trim() || null,
        question: seminar.question,
        seminar: lesson ? { ...seminar, lesson } : seminar,
        stand,
        verdict_shown: verdictOpen,
      })
      .select("id, quote_text, context, question, seminar, stand, verdict_shown, created_at")
      .single();
    if (saveError || !data) {
      setSaveState("error");
      return;
    }
    const row = data as SavedSeminar;
    setSaved((previous) => [row, ...previous.filter((item) => item.id !== row.id)]);
    setSavedId(row.id);
    setSaveState("saved");
  };

  const openSaved = (item: SavedSeminar) => {
    setText(item.quote_text);
    setContext(item.context ?? "");
    setSeminar(item.seminar);
    setLesson(item.seminar.lesson ?? null);
    setLessonBusy(false);
    setLessonError(null);
    setStand(item.stand);
    setRevealed(true);
    setVerdictOpen(item.verdict_shown);
    setSavedId(item.id);
    setSaveState("saved");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const convene = async () => {
    if (text.trim().length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setSeminar(null);
    setStand(null);
    setRevealed(false);
    setVerdictOpen(false);
    setSavedId(null);
    setSaveState("idle");
    setLesson(null);
    setLessonBusy(false);
    setLessonError(null);
    try {
      const response = await fetch("/api/seminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const body = (await response.json()) as { seminar?: Seminar; error?: string };
      if (!response.ok || !body.seminar) throw new Error(body.error ?? "The seminar could not be convened.");
      setSeminar(body.seminar);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The seminar could not be convened.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (next: "A" | "B" | "undecided") => {
    setStand(next);
    setRevealed(true);
  };

  const reset = () => {
    setText("");
    setContext("");
    setSeminar(null);
    setError(null);
    setStand(null);
    setRevealed(false);
    setVerdictOpen(false);
    setSavedId(null);
    setSaveState("idle");
    setLesson(null);
    setLessonBusy(false);
    setLessonError(null);
  };

  const openDeeperLesson = async () => {
    if (!seminar || lessonBusy) return;
    setLessonBusy(true);
    setLessonError(null);
    try {
      const response = await fetch("/api/seminar-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, seminar }),
      });
      const body = (await response.json()) as { lesson?: SeminarLesson; error?: string };
      if (!response.ok || !body.lesson) throw new Error(body.error ?? "The deeper lesson could not be built.");
      setLesson(body.lesson);
      if (savedId && userId) {
        void supabase
          .from("analyst_seminars")
          .update({ seminar: { ...seminar, lesson: body.lesson } })
          .eq("id", savedId);
        setSaved((previous) =>
          previous.map((item) =>
            item.id === savedId ? { ...item, seminar: { ...item.seminar, lesson: body.lesson } } : item,
          ),
        );
      }
      window.setTimeout(() => {
        const target = document.getElementById("deeper-lesson");
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - 140;
        window.scrollTo({ top, behavior: "smooth" });
      }, 80);
    } catch (caught) {
      setLessonError(caught instanceof Error ? caught.message : "The deeper lesson could not be built.");
    } finally {
      setLessonBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader section="seminar" />

      <section className="relative overflow-hidden bg-[#1A1A1A] text-[#FDFBF7]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage: "url('/world-land-dark.svg')",
            backgroundSize: "min(1600px, 130vw) auto",
            backgroundPosition: "78% 46%",
            backgroundRepeat: "no-repeat",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#1A1A1A_0%,rgba(26,26,26,0.94)_30%,rgba(26,26,26,0.55)_56%,rgba(26,26,26,0.08)_82%,transparent_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-16">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#7F9BFF]">
              The seminar
            </p>
            <span className="h-3 w-px bg-white/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
              Two theories · one crux
            </p>
          </div>

          <h1 className="mt-3 max-w-[12ch] font-display text-[48px] leading-[0.92] tracking-[-0.03em] md:text-[76px]">
            Put it on the table.
          </h1>
          <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-white/60">
            Bring a quote or a question you cannot settle. The seminar builds the strongest
            version of two rival explanations, then shows the exact point where they part.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void convene();
            }}
            className="tw-glass-panel mt-8 p-4 text-[#1A1A1A] md:p-6"
          >
            <label htmlFor="seminar-text" className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/55">
              The quote or question
            </label>
            <textarea
              id="seminar-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="Paste the sentence you cannot stop thinking about…"
              className="mt-2 w-full resize-none bg-transparent font-display text-[20px] leading-[1.25] outline-none placeholder:text-[#1A1A1A]/25 md:text-[28px]"
            />

            <div className="mt-4 grid gap-3 border-t border-[#1A1A1A]/12 pt-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <label htmlFor="seminar-context" className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/40">
                  Context, if it matters
                </label>
                <input
                  id="seminar-context"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  maxLength={1000}
                  placeholder="Who said it, where, and what was being argued"
                  className="mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-2 font-serif text-[13px] outline-none placeholder:text-[#1A1A1A]/30 focus:border-[#1A4BFF]"
                />
              </div>
              <button
                type="submit"
                disabled={busy || text.trim().length < 20}
                className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] disabled:cursor-not-allowed disabled:border-[#1A1A1A]/20 disabled:bg-transparent disabled:text-[#1A1A1A]/30"
              >
                {busy ? "Setting the room…" : "Convene the seminar"}
                {!busy && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE);
                  setContext("A podcast conversation about foreign aid and statecraft.");
                }}
                className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
              >
                Use the foreign-aid quote
              </button>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">
                {text.length}/3000 · no verdict unless asked
              </span>
            </div>
          </form>

          {error && (
            <p className="mt-4 border-l-2 border-[#C1121F] pl-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#FF9D9D]">
              {error}
            </p>
          )}
        </div>
      </section>

      {saved.length > 0 && (
        <section className="mx-auto w-full max-w-[1100px] px-5 pt-8 md:px-8">
          <div className="flex items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3">
            <h2 className="font-display text-[26px] leading-none">The archive.</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
              {saved.length} saved
            </span>
          </div>
          <ul>
            {saved.map((item, index) => (
              <li key={item.id} className="border-b border-[#1A1A1A]/12">
                <button
                  type="button"
                  onClick={() => openSaved(item)}
                  className="group grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-baseline gap-3 py-3 text-left"
                >
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-[14px] leading-snug text-[#1A1A1A]/80 group-hover:text-[#1A4BFF]">
                      {item.question}
                    </span>
                    <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
                      {item.stand ? `stood with ${item.stand}` : "held the tension"} ·{" "}
                      {new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A4BFF]">
                    reopen →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {seminar && (
        <main className="mx-auto w-full max-w-[1100px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
          <section className="grid gap-6 border-y border-[#1A1A1A]/15 py-6 md:grid-cols-[minmax(0,1fr)_240px] md:gap-12 md:py-8">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
                The question underneath
              </p>
              <p className="mt-2 max-w-[62ch] font-display text-[28px] leading-[1.1] md:text-[38px]">
                {seminar.question}
              </p>
              <p className="mt-3 max-w-[62ch] font-serif text-[16px] leading-relaxed text-[#1A1A1A]/65">
                {seminar.restatement}
              </p>
            </div>
            <div className="border-t border-[#1A1A1A]/15 pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                You brought
              </p>
              <p className="mt-1 line-clamp-4 font-serif text-[12px] italic leading-relaxed text-[#1A1A1A]/55">
                “{text}”
              </p>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3">
              <h2 className="font-display text-[32px] leading-none md:text-[40px]">Two readings of the same thing.</h2>
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35 sm:inline">
                steelmanned
              </span>
            </div>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
              Arguments to test, not sourced findings.
            </p>

            <div className="grid border-y border-[#1A1A1A]/15 md:grid-cols-2 md:divide-x md:divide-[#1A1A1A]/15">
              {seminar.theories.map((theory, index) => (
                <TheoryColumn key={index} theory={theory} index={index} />
              ))}
            </div>
          </section>

          {!revealed ? (
            <section className="mt-10 border-y border-[#1A1A1A]/15 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]">Before the crux</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
                  choose before reading on
                </p>
              </div>
              <div className="pt-3">
                <h2 className="max-w-[20ch] font-display text-[30px] leading-[1.02] md:text-[36px]">Which reading survives the evidence?</h2>
                <p className="mt-2 max-w-[56ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/60">
                  This is not a vote on what is good. It is a bet on which causal account explains more
                  of what happened.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => choose("A")}
                    className="border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] hover:text-white"
                  >
                    Theory A
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("B")}
                    className="border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] hover:text-white"
                  >
                    Theory B
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("undecided")}
                    className="border-2 border-[#1A1A1A]/25 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]/55 transition-colors hover:border-[#1A1A1A]"
                  >
                    Neither yet
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStand(null);
                    setRevealed(true);
                  }}
                  className="mt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35 underline underline-offset-4"
                >
                  Reveal the crux without choosing
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="mt-10 bg-[#1A1A1A] text-[#FDFBF7]">
                <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                  <div className="border-b border-white/15 px-5 py-4 md:border-b-0 md:border-r md:border-white/15 md:px-6 md:py-8">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#7F9BFF]">
                      The crux
                    </p>
                    <p className="mt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-white/40">
                      {DISAGREEMENT[seminar.disagreement]}
                    </p>
                    {stand && (
                      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                        You stood with{" "}
                        <span className="text-[#7F9BFF]">
                          {stand === "undecided" ? "neither yet" : `theory ${stand}`}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-5 md:px-8 md:py-8">
                    <p className="max-w-[38ch] font-display text-[26px] leading-[1.12] md:text-[34px]">
                      {seminar.crux}
                    </p>
                    <div className="mt-6 border-t border-white/15 pt-4">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">
                        What would settle it
                      </p>
                      <p className="mt-1 max-w-[62ch] font-serif text-[14px] leading-relaxed text-white/75">
                        {seminar.settle}
                      </p>
                    </div>
                    {seminar.sources_needed.length > 0 && (
                      <div className="mt-4">
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">
                          Look for
                        </p>
                        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {seminar.sources_needed.map((source) => (
                            <li key={source} className="font-mono text-[9px] uppercase tracking-[0.08em] text-white/55">
                              → {source}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-6">
                {!verdictOpen ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#1A1A1A]/15 py-5">
                    <p className="max-w-[54ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/60">
                      The tension is the point. If you want the evidence weighed, ask for a
                      provisional — not moral — verdict.
                    </p>
                    <button
                      type="button"
                      onClick={() => setVerdictOpen(true)}
                      className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
                    >
                      Show a provisional verdict
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-y border-[#1A1A1A]/15 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
                        Provisional verdict
                      </p>
                      <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
                        empirical only · {seminar.verdict.confidence} confidence
                      </p>
                    </div>
                    <div className="pt-3">
                      <p className="max-w-[52ch] font-display text-[30px] leading-[1.05] md:text-[36px]">
                        {seminar.verdict.lean === "undecided"
                          ? "The evidence does not separate them yet."
                          : `The evidence currently leans toward theory ${seminar.verdict.lean}.`}
                      </p>
                      <p className="mt-3 max-w-[64ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
                        {seminar.verdict.why}
                      </p>
                      <p className="mt-3 border-l-2 border-[#1A4BFF] pl-3 font-serif text-[13px] leading-relaxed text-[#1A1A1A]/60">
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF]">
                          What would change it ·{" "}
                        </span>
                        {seminar.verdict.change}
                      </p>
                      <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">
                        This is a judgement about explanation, not about what is right.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="mt-10 tw-glass-panel overflow-hidden">
                <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-6">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
                      If the argument is clear but the subject is not
                    </p>
                    <h2 className="mt-2 max-w-[22ch] font-display text-[30px] leading-[1.02] md:text-[38px]">
                      Take the deeper lesson.
                    </h2>
                    <p className="mt-2 max-w-[58ch] font-serif text-[14px] leading-[1.65] text-[#1A1A1A]/62">
                      The terms, the background, both mechanisms, the crux as a test, the mistakes to
                      avoid, and a worked example — taught from the question you brought.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openDeeperLesson()}
                    disabled={lessonBusy}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:bg-[#1A4BFF] disabled:cursor-wait disabled:opacity-60"
                  >
                    {lessonBusy ? "Building the lesson…" : lesson ? "Rebuild the lesson" : "Go deeper"}
                    {lessonBusy ? <BookOpen className="h-3.5 w-3.5 animate-pulse" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A1A]/10 px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35 md:px-6">
                  <span>One deeper model pass · built from this seminar</span>
                  <span>~5–7 min read</span>
                </div>
              </section>

              {lessonBusy ? (
                <div className="mt-6 space-y-3" aria-live="polite">
                  <div className="h-3 w-36 animate-pulse rounded-full bg-[#1A1A1A]/10" />
                  <div className="h-10 w-3/4 animate-pulse rounded-xl bg-[#1A1A1A]/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#1A1A1A]/8" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#1A1A1A]/8" />
                </div>
              ) : null}

              {lessonError ? (
                <p className="mt-6 border-l-2 border-[#C1121F] pl-3 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C1121F]">
                  {lessonError}{" "}
                  <button type="button" onClick={() => void openDeeperLesson()} className="underline underline-offset-4">
                    Try again
                  </button>
                </p>
              ) : null}

              {lesson ? <SeminarLessonView lesson={lesson} /> : null}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-4">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/45">
                    Put this on the record
                  </p>
                  {userId ? (
                    <button
                      type="button"
                      onClick={save}
                      disabled={saveState === "saving" || saveState === "saved"}
                      className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4 disabled:text-[#1A1A1A]/35 disabled:no-underline"
                    >
                      {saveState === "saved"
                        ? "Saved to the record"
                        : saveState === "saving"
                          ? "Saving…"
                          : "Save this seminar →"}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="mt-1 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
                    >
                      Sign in to save this seminar
                    </Link>
                  )}
                  {saveState === "error" && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#C1121F]">
                      Could not save. Try again.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/50 underline underline-offset-4 hover:text-[#1A4BFF]"
                >
                  <RotateCcw className="h-3 w-3" /> New seminar
                </button>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">
                  Hold the tension · verify before you act
                </p>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}

const DISAGREEMENT: Record<Seminar["disagreement"], string> = {
  empirical: "an empirical disagreement",
  definitional: "a definitional disagreement",
  scope: "a disagreement about scope",
  mixed: "empirical and conceptual",
};

function TheoryColumn({ theory, index }: { theory: SeminarTheory; index: number }) {
  const letter = theory.key === "A" || theory.key === "B" ? theory.key : index === 0 ? "A" : "B";
  const tint = letter === "A" ? "bg-[#F4EFE6]/65" : "bg-transparent";
  return (
    <article className={`${tint} px-5 py-6 md:px-7 md:py-8`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/40">
            Theory {letter}
          </p>
          <h3 className="mt-1 max-w-[16ch] font-display text-[28px] leading-[1.02]">{theory.name}</h3>
        </div>
        <span
          className={`font-display text-[64px] leading-[0.7] ${letter === "A" ? "text-[#1A4BFF]" : "text-[#1A1A1A]"}`}
          aria-hidden
        >
          {letter}
        </span>
      </div>

      <p className="mt-5 border-t border-[#1A1A1A]/15 pt-4 font-serif text-[15.5px] leading-relaxed text-[#1A1A1A]/80">
        {theory.claim}
      </p>

      <div className="mt-4">
        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
          The mechanism
        </p>
        <p className="mt-1 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/70">
          {theory.mechanism}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            It predicts
          </p>
          <ul className="mt-1 space-y-1">
            {theory.predictions.map((prediction) => (
              <li key={prediction} className="font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65">
                → {prediction}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            Evidence to check
          </p>
          <ul className="mt-1 space-y-1">
            {theory.evidence.map((item) => (
              <li key={item} className="font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 border-l-2 border-[#1A1A1A]/30 pl-3">
        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
          It would be wrong if
        </p>
        <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#1A1A1A]/65">
          {theory.falsifier}
        </p>
      </div>

      <p className="mt-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#1A1A1A]/35">
        Assumes · {theory.assumes}
      </p>
    </article>
  );
}
