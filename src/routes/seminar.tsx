import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, RotateCcw, Search } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import type { Seminar, SeminarTheory } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";
import { SeminarLessonView } from "@/components/threadwise/SeminarLessonView";
import { HighlightedText, WordChips, WordCloudBubble, type GlossaryWord, type OpenWord } from "@/components/threadwise/SeminarWords";
import { SeminarLoupe, LoupeSelectionButton, LookCloserButton, useLoupeSelection, type LoupeTarget } from "@/components/threadwise/SeminarLoupe";
import { InkArrow, InkCircle, InkRule, InkTick } from "@/components/threadwise/InkMarks";
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
  const readingRef = useRef<HTMLElement | null>(null);
  const [loupeTarget, setLoupeTarget] = useState<LoupeTarget | null>(null);
  const [tutorSeed, setTutorSeed] = useState<string | null>(null);
  const { candidate: loupeCandidate, clearCandidate } = useLoupeSelection(readingRef);

  const openLoupe = (target: LoupeTarget) => {
    setLoupeTarget(target);
    clearCandidate();
  };

  const askTutorAbout = (selected: string) => {
    setTutorSeed(selected);
    window.setTimeout(() => {
      document.getElementById("seminar-tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };
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
  const [openWord, setOpenWord] = useState<OpenWord | null>(null);

  const openGlossaryWord = (word: GlossaryWord, tone: number, element: HTMLElement) => {
    setOpenWord({ word, tone, rect: element.getBoundingClientRect() });
  };

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
    setLoupeTarget(null);
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

  const glossary = seminar?.glossary ?? [];

  return (
    <div className="seminar-paper min-h-[100dvh] bg-[#F8F1E6] text-[#29302A]">
      <AppHeader section="seminar" />

      <section className="relative overflow-hidden border-b border-[#E0D2C0] bg-[#F2E3D2] text-[#29302A]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url('/world-land-dark.svg')",
            backgroundSize: "min(1600px, 130vw) auto",
            backgroundPosition: "78% 46%",
            backgroundRepeat: "no-repeat",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[37%] bg-[#E3EDF1] md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-[37%] hidden w-px bg-[#D8C3AA] md:block" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_88%_6%,rgba(174,201,217,0.5),transparent_52%),radial-gradient(ellipse_at_2%_100%,rgba(248,211,181,0.5),transparent_52%)]" />
        <span aria-hidden className="pointer-events-none absolute -right-6 top-16 select-none font-display text-[30vw] leading-none text-[#B1674C]/15">“</span>
        <div className="pointer-events-none absolute left-5 top-28 hidden flex-col gap-3 font-mono text-[6.5px] uppercase tracking-[0.16em] text-[#7A5B45]/45 xl:flex">
          <span className="flex items-center gap-2"><span className="h-px w-4 bg-[#B1674C]/50" /> 01 / the passage</span>
          <span className="flex items-center gap-2 text-[#597486]/55"><span className="h-px w-4 bg-[#788FA0]/40" /> 02 / two readings</span>
          <span className="flex items-center gap-2 text-[#597486]/55"><span className="h-px w-4 bg-[#788FA0]/40" /> 03 / one crux</span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-10 pt-12 md:px-8 md:pb-14 md:pt-16">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#7A5B45]">
              The seminar
            </p>
            <span className="h-3 w-px bg-[#2F332C]/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#29302A]/38">
              Two theories · one crux
            </p>
          </div>

          <div className="mt-3 grid gap-6 md:grid-cols-[minmax(0,1fr)_270px] md:items-end md:gap-12">
            <div>
              <h1 className="max-w-[12ch] font-display text-[50px] leading-[0.9] tracking-[-0.035em] text-[#29302A] md:text-[78px]">
                Put it on
                <br />
                <span className="italic text-[#A3644E]">the table.</span>
              </h1>
              <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-[1.65] text-[#4D4E45]/68 md:text-[16px]">
                Bring a quote or a question you cannot settle. The seminar builds the strongest
                version of two rival explanations, then shows the exact point where they part.
              </p>
            </div>
            <div className="hidden border-l border-[#788FA0]/45 pl-5 md:block">
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#597486]">A quiet room for</p>
              <p className="mt-2 font-serif text-[13px] italic leading-relaxed text-[#4D4E45]/62">
                two serious readings, one honest disagreement, and the evidence that would move you.
              </p>
              <p className="mt-3 font-mono text-[7px] uppercase tracking-[0.11em] text-[#29302A]/35">
                No verdict unless you ask.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void convene();
            }}
            className="mt-8 overflow-hidden rounded-[18px] border border-[#D8C3AA] border-t-[5px] border-t-[#B1674C] bg-[#FFFCF5] text-[#29302A] shadow-[8px_8px_0_rgba(143,163,184,0.16),0_28px_60px_-46px_rgba(66,51,35,0.35)]"
          >
            <div className="grid md:grid-cols-[minmax(0,1fr)_286px]">
              <div className="p-5 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="seminar-text" className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#4D4E45]/55">
                    The quote or question
                  </label>
                  <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#4D4E45]/28">
                    One passage is enough
                  </span>
                </div>
                <textarea
                  id="seminar-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={7}
                  maxLength={3000}
                  placeholder="Paste the sentence you cannot stop thinking about…"
                  className="mt-3 w-full resize-none bg-transparent font-display text-[21px] leading-[1.35] tracking-[-0.01em] outline-none placeholder:text-[#4D4E45]/32 md:text-[28px]"
                />

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#29302A]/10 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setText(SAMPLE);
                      setContext("A podcast conversation about foreign aid and statecraft.");
                    }}
                    className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#7A5B45] underline decoration-[#C49A67]/50 underline-offset-4 hover:text-[#3F5A48]"
                  >
                    Use the foreign-aid quote
                  </button>
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#4D4E45]/30">
                    {text.length}/3000
                  </span>
                </div>
              </div>

              <aside className="flex flex-col border-t border-[#C8D6DE]/80 bg-[#E7F0F3]/68 p-5 md:border-l md:border-t-0 md:p-6">
                <label htmlFor="seminar-context" className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#4D4E45]/45">
                  Context, if it matters
                </label>
                <input
                  id="seminar-context"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  maxLength={1000}
                  placeholder="Who said it, where, and what was being argued"
                  className="mt-2 w-full border-b border-[#29302A]/18 bg-transparent pb-2 font-serif text-[13px] outline-none placeholder:text-[#4D4E45]/30 focus:border-[#3F5A48]"
                />

                <div className="mt-5 border-t border-[#29302A]/10 pt-4">
                  <p className="font-mono text-[7px] font-bold uppercase tracking-[0.14em] text-[#597486]">A quiet room for</p>
                  <p className="mt-2 font-serif text-[12.5px] italic leading-[1.55] text-[#4D4E45]/60">
                    two serious readings, one honest disagreement, and the evidence that would move you.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={busy || text.trim().length < 20}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#3F5A48] bg-[#3F5A48] px-5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FCF7ED] transition-colors hover:border-[#2F4637] hover:bg-[#2F4637] disabled:cursor-not-allowed disabled:border-[#2F332C]/15 disabled:bg-transparent disabled:text-[#2F332C]/25"
                >
                  {busy ? "Setting the room…" : "Convene the seminar"}
                  {!busy && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
                <p className="mt-3 text-center font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#4D4E45]/28">
                  No verdict unless asked
                </p>
              </aside>
            </div>
          </form>

          <div className="mt-4 grid gap-3 border-t border-[#29302A]/12 pt-4 sm:grid-cols-3">
            {[
              ["01", "One passage", "A quote, a claim, a question."],
              ["02", "Two readings", "Steelmanned, not caricatured."],
              ["03", "One crux", "The exact point where they part."],
            ].map(([number, title, note]) => (
              <div key={number} className="flex gap-2.5 sm:block">
                <span className="font-mono text-[7px] font-bold tracking-[0.12em] text-[#A3644E]/70">{number}</span>
                <p className="font-serif text-[12px] leading-snug text-[#4D4E45]/62">
                  <span className="font-semibold text-[#29302A]/80">{title}.</span> {note}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 border-l-2 border-[#B65C43] pl-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#B65C43]">
              {error}
            </p>
          )}
        </div>
      </section>

      {saved.length > 0 && (
        <section className="mx-auto w-full max-w-[1100px] px-5 pt-8 md:px-8">
          <div className="flex items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3">
            <h2 className="font-display text-[26px] leading-none">The archive.</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/35">
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
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-[14px] leading-snug text-[#2F332C]/80 group-hover:text-[#4F705C]">
                      {item.question}
                    </span>
                    <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35">
                      {item.stand ? `stood with ${item.stand}` : "held the tension"} ·{" "}
                      {new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#4F705C]">
                    reopen →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {seminar && (
        <main ref={readingRef} className="seminar-reading-surface mx-auto w-full max-w-[1100px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
          <section data-loupe-section="The question underneath" className="grid gap-6 border-y border-[#1A1A1A]/15 py-6 md:grid-cols-[minmax(0,1fr)_240px] md:gap-12 md:py-8">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5B45]">
                The question underneath
              </p>
              <p className="mt-2 max-w-[62ch] font-display text-[28px] leading-[1.1] md:text-[38px]">
                <HighlightedText text={seminar.question} glossary={glossary} onWord={openGlossaryWord} />
              </p>
              <p className="mt-3 max-w-[62ch] font-serif text-[16px] leading-relaxed text-[#4D4E45]/70">
                <HighlightedText text={seminar.restatement} glossary={glossary} onWord={openGlossaryWord} />
              </p>
            </div>
            <div className="border-t border-[#1A1A1A]/15 pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/40">
                You brought
              </p>
              <p className="mt-1 line-clamp-4 font-serif text-[12px] italic leading-relaxed text-[#2F332C]/55">
                “<HighlightedText text={text} glossary={glossary} onWord={openGlossaryWord} />”
              </p>
            </div>
          </section>

          <section data-loupe-section="Two readings" className="mt-8">
            <div className="flex items-end justify-between gap-4 pb-1">
              <h2 className="font-display text-[32px] leading-none md:text-[40px]">Two readings of the <span className="italic text-[#A3644E]">same thing.</span></h2>
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/35 sm:inline">
                steelmanned
              </span>
            </div>
            <InkRule className="mt-2" />
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35">
              Arguments to test, not sourced findings.
              <span className="inline-flex items-center gap-1 text-[#4F705C]/65">
                <Search className="h-2.5 w-2.5" /> select a line, or hover “closer”
              </span>
              <span className="text-[#B77A5B]/75">· tinted words open a note</span>
            </p>
            {glossary.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-y border-[#1A1A1A]/10 py-2.5">
                <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.14em] text-[#2F332C]/35">
                  Words to keep
                  <span className="h-1 w-1 rounded-full bg-[#C49A67]" />
                </span>
                <WordChips glossary={glossary} onWord={openGlossaryWord} />
                <span className="ml-1 font-serif text-[10px] italic text-[#2F332C]/32">Tap a tinted word for a note.</span>
              </div>
            ) : null}

            <div className="grid border-y border-[#1A1A1A]/15 md:grid-cols-2 md:divide-x md:divide-[#1A1A1A]/15">
              {seminar.theories.map((theory, index) => (
                <TheoryColumn key={index} theory={theory} index={index} glossary={glossary} onWord={openGlossaryWord} onLookCloser={openLoupe} />
              ))}
            </div>
          </section>

          {!revealed ? (
            <section className="mt-10 border-y border-[#1A1A1A]/15 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]">Before the crux</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35">
                  choose before reading on
                </p>
              </div>
              <div className="pt-3">
                <h2 className="max-w-[20ch] font-display text-[30px] leading-[1.02] md:text-[36px]">Which reading survives the evidence?</h2>
                <p className="mt-2 max-w-[56ch] font-serif text-[14px] leading-relaxed text-[#2F332C]/60">
                  This is not a vote on what is good. It is a bet on which causal account explains more
                  of what happened.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => choose("A")}
                    className="rounded-full border border-[#3F5A47] px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#2F332C] transition-colors hover:bg-[#3F5A47] hover:text-[#FCF7ED]"
                  >
                    Theory A
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("B")}
                    className="rounded-full border border-[#3F5A47] px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#2F332C] transition-colors hover:bg-[#3F5A47] hover:text-[#FCF7ED]"
                  >
                    Theory B
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("undecided")}
                    className="border-2 border-[#1A1A1A]/25 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#2F332C]/55 transition-colors hover:border-[#1A1A1A]"
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
                  className="mt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/35 underline underline-offset-4"
                >
                  Reveal the crux without choosing
                </button>
              </div>
            </section>
          ) : (
            <>
              <section data-loupe-section="The crux" className="mt-10 overflow-hidden rounded-[18px] border border-[#DCC9A7] bg-[#F2E4C9] text-[#29302A] shadow-[6px_6px_0_rgba(177,103,76,0.12)]">
                <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                  <div className="border-b border-[#29302A]/12 px-5 py-4 md:border-b-0 md:border-r md:border-[#29302A]/12 md:px-6 md:py-8">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#A3644E]">
                      The crux
                    </p>
                    <p className="mt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#29302A]/42">
                      {DISAGREEMENT[seminar.disagreement]}
                    </p>
                    {stand && (
                      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.12em] text-[#2F332C]/55">
                        You stood with{" "}
                        <span className="font-bold text-[#4F705C]">
                          {stand === "undecided" ? "neither yet" : `theory ${stand}`}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-5 md:px-8 md:py-8">
                    <p className="max-w-[38ch] font-display text-[26px] leading-[1.12] md:text-[34px]">
                      <HighlightedText text={seminar.crux} glossary={glossary} onWord={openGlossaryWord} />
                    </p>
                    <div className="mt-6 border-t border-[#29302A]/15 pt-4">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/38">
                        What would settle it
                      </p>
                      <p className="mt-1 max-w-[62ch] font-serif text-[14px] leading-relaxed text-[#29302A]/75">
                        <HighlightedText text={seminar.settle} glossary={glossary} onWord={openGlossaryWord} />
                      </p>
                    </div>
                    {seminar.sources_needed.length > 0 && (
                      <div className="mt-4">
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/38">
                          Look for
                        </p>
                        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {seminar.sources_needed.map((source) => (
                            <li key={source} className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#2F332C]/52">
                              → {source}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section data-loupe-section="The provisional verdict" className="mt-6">
                {!verdictOpen ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#1A1A1A]/15 py-5">
                    <p className="max-w-[54ch] font-serif text-[14px] leading-relaxed text-[#2F332C]/60">
                      The tension is the point. If you want the evidence weighed, ask for a
                      provisional — not moral — verdict.
                    </p>
                    <button
                      type="button"
                      onClick={() => setVerdictOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#3F5A47] px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#2F332C] transition-colors hover:bg-[#3F5A47] hover:text-[#FCF7ED]"
                    >
                      Show a provisional verdict
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-y border-[#1A1A1A]/15 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#4F705C]">
                        Provisional verdict
                      </p>
                      <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35">
                        empirical only · {seminar.verdict.confidence} confidence
                      </p>
                    </div>
                    <div className="pt-3">
                      <p className="max-w-[52ch] font-display text-[30px] leading-[1.05] md:text-[36px]">
                        {seminar.verdict.lean === "undecided"
                          ? "The evidence does not separate them yet."
                          : `The evidence currently leans toward theory ${seminar.verdict.lean}.`}
                      </p>
                      <p className="mt-3 max-w-[64ch] font-serif text-[14px] leading-relaxed text-[#2F332C]/65">
                        <HighlightedText text={seminar.verdict.why} glossary={glossary} onWord={openGlossaryWord} />
                      </p>
                      <p className="mt-3 border-l-2 border-[#4F705C] pl-3 font-serif text-[13px] leading-relaxed text-[#2F332C]/60">
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#4F705C]">
                          What would change it ·{" "}
                        </span>
                        <HighlightedText text={seminar.verdict.change} glossary={glossary} onWord={openGlossaryWord} />
                      </p>
                      <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/30">
                        This is a judgement about explanation, not about what is right.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section data-loupe-section="The deeper lesson" className="mt-10 overflow-hidden rounded-[18px] border border-[#C8D6DE] bg-[#E9F0F3] shadow-[6px_6px_0_rgba(143,163,184,0.14)]">
                <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-6">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5B45]">
                      If the argument is clear but the subject is not
                    </p>
                    <h2 className="mt-2 max-w-[22ch] font-display text-[30px] leading-[1.02] md:text-[38px]">
                      Take the deeper lesson.
                    </h2>
                    <p className="mt-2 max-w-[58ch] font-serif text-[14px] leading-[1.65] text-[#2F332C]/62">
                      The terms, the background, both mechanisms, the crux as a test, the mistakes to
                      avoid, and a worked example — taught from the question you brought.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openDeeperLesson()}
                    disabled={lessonBusy}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#3F5A47] px-5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FCF7ED] transition-colors hover:bg-[#2F4637] disabled:cursor-wait disabled:opacity-60"
                  >
                    {lessonBusy ? "Building the lesson…" : lesson ? "Rebuild the lesson" : "Go deeper"}
                    {lessonBusy ? <BookOpen className="h-3.5 w-3.5 animate-pulse" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A1A]/10 px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35 md:px-6">
                  <span>One deeper model pass · built from this seminar</span>
                  <span>~5–7 min read</span>
                </div>
              </section>

              {lessonBusy ? (
                <div className="mt-6 space-y-3" aria-live="polite">
                  <div className="h-3 w-36 animate-pulse rounded-full bg-[#2F332C]/8" />
                  <div className="h-10 w-3/4 animate-pulse rounded-xl bg-[#2F332C]/8" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#2F332C]/7" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#2F332C]/7" />
                </div>
              ) : null}

              {lessonError ? (
                <p className="mt-6 border-l-2 border-[#A3644E] pl-3 font-mono text-[9px] uppercase tracking-[0.1em] text-[#A3644E]">
                  {lessonError}{" "}
                  <button type="button" onClick={() => void openDeeperLesson()} className="underline underline-offset-4">
                    Try again
                  </button>
                </p>
              ) : null}

              {lesson ? (
                <SeminarLessonView
                  lesson={lesson}
                  text={text}
                  context={context}
                  seminar={seminar}
                  tutorSeed={tutorSeed}
                  onAskTutor={askTutorAbout}
                  glossary={glossary}
                  onWord={openGlossaryWord}
                />
              ) : null}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-4">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/45">
                    Put this on the record
                  </p>
                  {userId ? (
                    <button
                      type="button"
                      onClick={save}
                      disabled={saveState === "saving" || saveState === "saved"}
                      className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4F705C] underline underline-offset-4 disabled:text-[#2F332C]/35 disabled:no-underline"
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
                      className="mt-1 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-[#4F705C] underline underline-offset-4"
                    >
                      Sign in to save this seminar
                    </Link>
                  )}
                  {saveState === "error" && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#A3644E]">
                      Could not save. Try again.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#2F332C]/50 underline underline-offset-4 hover:text-[#4F705C]"
                >
                  <RotateCcw className="h-3 w-3" /> New seminar
                </button>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/30">
                  Hold the tension · verify before you act
                </p>
              </div>
            </>
          )}
        </main>
      )}

      {loupeCandidate && !loupeTarget ? (
        <LoupeSelectionButton candidate={loupeCandidate} onOpen={() => openLoupe(loupeCandidate)} />
      ) : null}
      {seminar ? (
        <SeminarLoupe
          target={loupeTarget}
          text={text}
          context={context}
          seminar={seminar}
          lesson={lesson}
          onClose={() => setLoupeTarget(null)}
          onAskTutor={lesson ? askTutorAbout : undefined}
        />
      ) : null}
      <WordCloudBubble open={openWord} onClose={() => setOpenWord(null)} />
    </div>
  );
}

const DISAGREEMENT: Record<Seminar["disagreement"], string> = {
  empirical: "an empirical disagreement",
  definitional: "a definitional disagreement",
  scope: "a disagreement about scope",
  mixed: "empirical and conceptual",
};

function TheoryColumn({
  theory,
  index,
  glossary,
  onWord,
  onLookCloser,
}: {
  theory: SeminarTheory;
  index: number;
  glossary: GlossaryWord[];
  onWord: (word: GlossaryWord, tone: number, element: HTMLElement) => void;
  onLookCloser: (target: LoupeTarget) => void;
}) {
  const letter = theory.key === "A" || theory.key === "B" ? theory.key : index === 0 ? "A" : "B";
  const tint =
    letter === "A"
      ? "border-[#E0C9B1] border-t-[4px] border-t-[#B1674C] bg-[#FBECDD] shadow-[5px_5px_0_rgba(177,103,76,0.11)]"
      : "border-[#C8D6DE] border-t-[4px] border-t-[#788FA0] bg-[#E9F0F3] shadow-[5px_5px_0_rgba(120,143,160,0.12)]";
  const accent = letter === "A" ? "text-[#A3644E]" : "text-[#597486]";
  return (
    <article
      data-loupe-section={`Theory ${letter}: ${theory.name}`}
      className={`${tint} group/theory rounded-[16px] border p-5 md:p-7`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#2F332C]/40">
            Theory {letter}
          </p>
          <h3 className="mt-1 max-w-[16ch] font-display text-[28px] leading-[1.02]">{theory.name}</h3>
        </div>
        <div className="relative grid h-14 w-14 shrink-0 place-items-center">
          <InkCircle className={`absolute inset-0 ${accent} opacity-50`} />
          <span className={`font-display text-[54px] leading-[0.7] ${accent}`} aria-hidden>
            {letter}
          </span>
        </div>
      </div>

      <InkRule className="mt-5" />
      <div className="group/line group mt-3 flex items-start gap-2">
        <p className="font-serif text-[15.5px] leading-relaxed text-[#2F332C]/80">
          <HighlightedText text={theory.claim} glossary={glossary} onWord={onWord} />
        </p>
        <LookCloserButton text={theory.claim} section={`Theory ${letter} · claim`} onLookCloser={onLookCloser} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/40">
            The mechanism
          </p>
          <LookCloserButton
            text={theory.mechanism.slice(0, 680)}
            section={`Theory ${letter} · mechanism`}
            onLookCloser={onLookCloser}
            className="group-hover/theory:opacity-100"
          />
        </div>
        <InkRule className="mt-1.5" />
        <p className="mt-2 max-w-[62ch] font-serif text-[13.5px] leading-relaxed text-[#2F332C]/70">
          <HighlightedText text={theory.mechanism} glossary={glossary} onWord={onWord} />
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/40">
            It predicts
          </p>
          <InkRule className="mt-1.5" />
          <ul className="mt-1.5 space-y-1.5">
            {theory.predictions.map((prediction) => (
              <li
                key={prediction}
                className="group flex items-start gap-2 rounded-sm px-0.5 py-0.5 font-serif text-[12.5px] leading-snug text-[#2F332C]/65 transition-colors hover:bg-[#4F705C]/[0.035]"
              >
                <InkArrow className="mt-0.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-rotate-3" />
                <span className="flex-1"><HighlightedText text={prediction} glossary={glossary} onWord={onWord} /></span>
                <LookCloserButton
                  text={prediction}
                  section={`Theory ${letter} · prediction`}
                  onLookCloser={onLookCloser}
                />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/40">
            Evidence to check
          </p>
          <InkRule className="mt-1.5" />
          <ul className="mt-1.5 space-y-1.5">
            {theory.evidence.map((item) => (
              <li
                key={item}
                className="group flex items-start gap-2 rounded-sm px-0.5 py-0.5 font-serif text-[12.5px] leading-snug text-[#2F332C]/65 transition-colors hover:bg-[#4F705C]/[0.035]"
              >
                <InkTick className="mt-0.5" />
                <span className="flex-1"><HighlightedText text={item} glossary={glossary} onWord={onWord} /></span>
                <LookCloserButton
                  text={item}
                  section={`Theory ${letter} · evidence`}
                  onLookCloser={onLookCloser}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="group mt-4 border-l-2 border-[#1A1A1A]/30 pl-3 transition-colors hover:border-[#4F705C]/50">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/40">
            It would be wrong if
          </p>
          <LookCloserButton text={theory.falsifier} section={`Theory ${letter} · falsifier`} onLookCloser={onLookCloser} />
        </div>
        <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#2F332C]/65">
          <HighlightedText text={theory.falsifier} glossary={glossary} onWord={onWord} />
        </p>
      </div>

      <p className="mt-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#2F332C]/35">
        Assumes · {theory.assumes}
      </p>
    </article>
  );
}
