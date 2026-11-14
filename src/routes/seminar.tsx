import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, RotateCcw, Search } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
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


const CHAT_NAV = [
  { to: "/workspace", label: "Workspace" },
  { to: "/analyst", label: "The analyst" },
  { to: "/seminar", label: "Seminar" },
  { to: "/questions", label: "Questions" },
  { to: "/digest", label: "Record" },
  { to: "/cases", label: "Cases" },
] as const;

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
  const [lessonOpen, setLessonOpen] = useState(false);
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
    setLessonOpen(false);
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
      setLessonOpen(true);
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
    } catch (caught) {
      setLessonError(caught instanceof Error ? caught.message : "The deeper lesson could not be built.");
    } finally {
      setLessonBusy(false);
    }
  };

  const glossary = seminar?.glossary ?? [];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#CFEBDD] p-2 md:p-4">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-[42%] bg-[#FFD1E3] opacity-80 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-[46%] bg-[#F6E96B]/70 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#BFD8FF]/60 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute left-3 top-24 hidden rotate-[-12deg] text-[54px] font-display text-[#FF7A59] lg:block">✺</span>
      <span aria-hidden className="pointer-events-none absolute right-6 top-28 hidden rotate-[14deg] text-[42px] font-display text-[#254BFF] lg:block">✦</span>
      <span aria-hidden className="pointer-events-none absolute bottom-16 left-8 hidden rotate-[8deg] text-[30px] font-mono text-[#1C211C]/30 lg:block">~ ~ ~</span>

      <div className="relative mx-auto flex min-h-[calc(100dvh-16px)] w-full max-w-[1560px] chat-paper flex-col overflow-hidden rounded-[30px] bg-[#FFFCF5] shadow-[0_30px_80px_-30px_rgba(35,49,31,0.35)] md:min-h-[calc(100dvh-32px)] md:rounded-[38px]">
        <ChatHeader seminar={seminar} onReset={reset} />

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_336px]">
          {!seminar ? (
            <>
              <main className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden">
                <div className="flex-1 px-5 pb-7 pt-8 md:px-10 md:pb-8 md:pt-10 lg:px-14">
                  <div className="mx-auto max-w-[800px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-[#DDF3E4] px-2.5 py-1 font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] text-[#2E5A3A]">
                        <i className="h-1.5 w-1.5 rounded-full bg-[#2E9B57]" /> the room is open
                      </span>
                      <span className="font-mono text-[6.5px] uppercase tracking-[0.12em] text-[#5E665D]/55">a seminar in three messages</span>
                    </div>

                    <h1 className="mt-6 max-w-[13ch] font-display text-[clamp(52px,7vw,86px)] leading-[0.92] tracking-[-0.055em] text-[#1C211C]">
                      put it on the table.
                    </h1>
                    <p className="mt-7 max-w-[46ch] font-sans text-[15px] leading-[1.65] text-[#4D534B]">
                      a quote, a claim, a question you cannot settle. two readings will show up, disagree
                      properly, and leave the verdict alone unless you ask.
                    </p>

                    <div className="mt-8 space-y-3">
                      <ChatBubble who="system">no lectures. no hot takes. just the strongest version of two rival readings.</ChatBubble>
                      <ChatBubble who="A">i&apos;ll take the reading you already suspect. i&apos;ll make it stronger.</ChatBubble>
                      <ChatBubble who="B">and i&apos;ll take the one you haven&apos;t met yet. give us something to work with. 👀</ChatBubble>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void convene();
                  }}
                  className="border-t border-[#1C211C]/10 bg-[#FFFCF5]/92 px-3 py-3 backdrop-blur md:px-6 md:py-4"
                >
                  <div className="mx-auto max-w-[800px] rounded-[24px] border border-[#D8CBB8] bg-[#FFFCF5] p-2 shadow-[0_10px_26px_-20px_rgba(35,49,31,0.6)]">
                    <textarea
                      id="seminar-text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      rows={2}
                      maxLength={3000}
                      placeholder="paste the thing you can't stop thinking about…"
                      className="w-full resize-none bg-transparent px-3 pt-2 font-sans text-[16px] leading-[1.5] outline-none placeholder:text-[#1C211C]/30"
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-[#1C211C]/10 px-2 pt-2">
                      <input
                        id="seminar-context"
                        value={context}
                        onChange={(event) => setContext(event.target.value)}
                        maxLength={1000}
                        placeholder="context, if it matters…"
                        className="min-w-[160px] flex-1 bg-transparent px-1 font-sans text-[12px] outline-none placeholder:text-[#1C211C]/28"
                      />
                      <button
                        type="submit"
                        disabled={busy || text.trim().length < 20}
                        aria-label="Open the seminar"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#254BFF] text-[18px] text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:bg-[#1C211C]/12 disabled:text-[#1C211C]/30"
                      >
                        {busy ? "…" : "↗"}
                      </button>
                    </div>
                  </div>
                  <div className="mx-auto mt-2 flex max-w-[800px] flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => { setText(SAMPLE); setContext("a podcast conversation about foreign aid and statecraft."); }} className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#5E665D] underline underline-offset-4 hover:text-[#254BFF]">use a foreign-aid quote</button>
                    </div>
                    <span className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/45">{text.length}/3000</span>
                  </div>
                </form>
                <ChatTicker />
              </main>

              <ChatAside saved={saved} onOpenSaved={openSaved} />
            </>
          ) : (
            <>
              <main ref={readingRef} className="seminar-reading-surface w-full min-w-0 overflow-hidden">
                <div className="border-b border-[#1C211C]/10 px-5 py-3 md:px-8">
                  <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-2 font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] text-[#5E665D]/55">
                    <span className="flex items-center gap-1.5 text-[#2E5A3A]"><i className="h-1.5 w-1.5 rounded-full bg-[#2E9B57]" /> the room is live</span>
                    <span>{seminar.disagreement} · {revealed ? "the crux is open" : "before the crux"} · {text.length} characters</span>
                  </div>
                </div>

                <div className="mx-auto max-w-[820px] px-5 py-8 md:px-8 md:py-10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#FF7A59]">today&apos;s question</p>
                      <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(33px,4.6vw,56px)] leading-[0.96] tracking-[-0.035em]">{seminar.question}</h1>
                    </div>
                    <span className="mt-1 rounded-full bg-[#DDF3E4] px-3 py-1 font-mono text-[6px] uppercase tracking-[0.1em] text-[#2E5A3A]">2 readings · 1 crux</span>
                  </div>
                  <p className="mt-4 max-w-[64ch] font-sans text-[13.5px] leading-[1.7] text-[#4D534B]/80">{seminar.restatement}</p>

                  <div className="mt-7 flex justify-end">
                    <div className="max-w-[78%] rounded-[20px] rounded-tr-[5px] bg-[#D8F77A] px-4 py-3 font-sans text-[13px] leading-[1.6] text-[#1C211C]">
                      {text}
                    </div>
                  </div>
                  <p className="mt-2 text-right font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/40">you · just now</p>

                  <div className="mt-9 space-y-7">
                    <ChatBubble who="system">two readings joined the room. they are going to disagree about what this passage is evidence of.</ChatBubble>
                    <ChatTheory letter="A" theory={seminar.theories[0]} glossary={glossary} onWord={openGlossaryWord} />
                    <ChatTheory letter="B" theory={seminar.theories[1]} glossary={glossary} onWord={openGlossaryWord} />

                    {!revealed ? (
                      <div className="rounded-[22px] border border-dashed border-[#1C211C]/25 bg-[#FFF8E7] p-5">
                        <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#B45B39]">the host is waiting</p>
                        <p className="mt-2 font-sans text-[14px] leading-[1.6] text-[#4D534B]">which reading survives the evidence? or let the room reveal the crux without choosing.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(["A", "B", "undecided"] as const).map((choice) => (
                            <button key={choice} type="button" onClick={() => choose(choice)} className={`rounded-full border px-3.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.1em] transition-colors ${choice === "A" ? "border-[#254BFF] text-[#254BFF] hover:bg-[#254BFF] hover:text-white" : choice === "B" ? "border-[#FF7A59] text-[#C34E31] hover:bg-[#FF7A59] hover:text-white" : "border-[#1C211C]/35 text-[#1C211C]/65 hover:bg-[#1C211C] hover:text-white"}`}>
                              {choice === "undecided" ? "neither yet" : `route ${choice}`}
                            </button>
                          ))}
                          <button type="button" onClick={() => { setStand(null); setRevealed(true); }} className="rounded-full bg-[#F6E96B] px-3.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-[#1C211C]">reveal the crux</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative my-2 rotate-[-0.35deg] rounded-[4px] border border-[#DFC642] bg-[#F6E96B] px-5 py-5 shadow-[0_12px_20px_-18px_rgba(28,33,28,0.65)] md:px-7">
                          <span aria-hidden className="absolute -top-2 left-8 h-4 w-16 rotate-[-4deg] bg-[#FFFCF5]/70" />
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C211C]/20 pb-2">
                            <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#1C211C]">📌 pinned in the middle</p>
                            {stand ? <p className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#1C211C]/60">you picked {stand === "undecided" ? "neither" : `route ${stand}`}</p> : null}
                          </div>
                          <p className="mt-4 max-w-[28ch] font-display text-[clamp(25px,3.1vw,38px)] leading-[1.05] tracking-[-0.025em]"><HighlightedText text={seminar.crux} glossary={glossary} onWord={openGlossaryWord} /></p>
                          <div className="mt-5 border-t border-[#1C211C]/20 pt-3">
                            <p className="font-mono text-[6px] font-bold uppercase tracking-[0.12em] text-[#1C211C]/55">what would settle it</p>
                            <p className="mt-1 font-sans text-[12.5px] leading-[1.6] text-[#1C211C]/80"><HighlightedText text={seminar.settle} glossary={glossary} onWord={openGlossaryWord} /></p>
                          </div>
                          {seminar.sources_needed.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                              {seminar.sources_needed.map((source) => <span key={source} className="rounded-full border border-[#1C211C]/20 px-2 py-1 font-mono text-[6px] uppercase tracking-[0.08em] text-[#1C211C]/60">{source}</span>)}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-[22px] border border-[#1C211C]/12 bg-[#F7F1E5] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#5E665D]/60">the room&apos;s verdict</p>
                            <p className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/40">{seminar.verdict.confidence} confidence</p>
                          </div>
                          {!verdictOpen ? (
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                              <p className="max-w-[45ch] font-sans text-[12.5px] leading-[1.6] text-[#4D534B]/75">the tension is the point. want the evidence weighed anyway?</p>
                              <button type="button" onClick={() => setVerdictOpen(true)} className="rounded-full bg-[#1C211C] px-3.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-white">show a provisional verdict ↗</button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="max-w-[38ch] font-display text-[24px] leading-[1.06] tracking-[-0.02em]">{seminar.verdict.lean === "undecided" ? "the evidence does not separate the routes yet." : `the evidence leans toward route ${seminar.verdict.lean}.`}</p>
                              <p className="mt-2 font-sans text-[12.5px] leading-[1.6] text-[#4D534B]/80"><HighlightedText text={seminar.verdict.why} glossary={glossary} onWord={openGlossaryWord} /></p>
                              <p className="mt-3 border-l-2 border-[#FF7A59] pl-3 font-sans text-[12px] leading-[1.6] text-[#4D534B]/72"><span className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#C34E31]">what would change it · </span><HighlightedText text={seminar.verdict.change} glossary={glossary} onWord={openGlossaryWord} /></p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="rounded-[22px] bg-[#E9EEFF] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#254BFF]">the notebook is still open</p>
                          <p className="mt-1 max-w-[45ch] font-sans text-[12.5px] leading-[1.6] text-[#4D534B]/75">terms, background, both mechanisms, a worked example. stay with the question a little longer.</p>
                        </div>
                        <button type="button" onClick={() => lesson ? setLessonOpen(true) : void openDeeperLesson()} disabled={lessonBusy} className="shrink-0 rounded-full bg-[#254BFF] px-4 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-white transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-60">{lessonBusy ? "writing…" : lesson ? "open the notebook" : "go deeper ↗"}</button>
                      </div>
                      {lessonError ? <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.1em] text-[#C34E31]">{lessonError}</p> : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1C211C]/10 pt-4">
                      <div className="flex items-center gap-3">
                        {userId ? <button type="button" onClick={save} disabled={saveState === "saving" || saveState === "saved"} className="rounded-full border border-[#1C211C]/20 px-3 py-1.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#4D534B] disabled:text-[#5E665D]/35">{saveState === "saved" ? "saved ✓" : saveState === "saving" ? "saving…" : "pin to the record"}</button> : <Link to="/login" className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#254BFF] underline underline-offset-4">sign in to pin this</Link>}
                        <button type="button" onClick={reset} className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#5E665D] underline underline-offset-4">start over</button>
                      </div>
                      <p className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/40">hold the tension · verify before you act</p>
                    </div>
                  </div>
                </div>
                <ChatTicker />
              </main>

              <ChatAside seminar={seminar} text={text} glossary={glossary} onWord={openGlossaryWord} userId={userId} save={save} saveState={saveState} />
            </>
          )}
        </div>
      </div>

      {loupeCandidate && !loupeTarget ? <LoupeSelectionButton candidate={loupeCandidate} onOpen={() => openLoupe(loupeCandidate)} /> : null}
      {seminar ? <SeminarLoupe target={loupeTarget} text={text} context={context} seminar={seminar} lesson={lesson} onClose={() => setLoupeTarget(null)} onAskTutor={lesson ? askTutorAbout : undefined} /> : null}
      <WordCloudBubble open={openWord} onClose={() => setOpenWord(null)} />

      {lesson && lessonOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#1C211C]/45 p-2 backdrop-blur-sm md:p-5">
          <div className="mx-auto my-2 w-full max-w-[1040px] overflow-hidden rounded-[28px] bg-[#FFFCF5] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] md:my-4">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1C211C]/15 bg-[#FFFCF5]/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#254BFF]">the notebook</p>
                <p className="mt-1 font-display text-[24px] leading-none">stay a little longer.</p>
              </div>
              <button type="button" onClick={() => setLessonOpen(false)} className="rounded-full border border-[#1C211C]/20 px-4 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-[#4D534B] hover:border-[#1C211C] hover:text-[#1C211C]">close ×</button>
            </div>
            <div className="px-3 py-4 md:px-6">
              <SeminarLessonView lesson={lesson} text={text} context={context} seminar={seminar!} tutorSeed={tutorSeed} onAskTutor={askTutorAbout} glossary={glossary} onWord={openGlossaryWord} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


function ChatHeader({ seminar, onReset }: { seminar: Seminar | null; onReset: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#1C211C]/10 bg-[#FFFCF5] px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <BrandLockup size="sm" asLink />
        <span className="hidden h-3 w-px bg-[#1C211C]/15 sm:block" />
        <div className="flex min-w-0 items-center gap-2">
          <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E9B57]" />
          <span className="truncate font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] text-[#1C211C]/55">{seminar ? "the seminar / live" : "the seminar / a small room"}</span>
          <span className="hidden font-sans text-[10px] text-[#5E665D]/45 md:block">{seminar ? "two readings are here" : "no lectures, just readings"}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        {seminar ? <button type="button" onClick={onReset} className="font-mono text-[6.5px] font-bold uppercase tracking-[0.1em] text-[#FF7A59] underline underline-offset-4">new</button> : null}
        <Link to="/reads" className="hidden font-mono text-[6.5px] font-bold uppercase tracking-[0.1em] text-[#1C211C]/55 underline underline-offset-4 hover:text-[#254BFF] sm:inline">read a source</Link>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-full border border-[#1C211C]/18 px-3 py-1.5 font-mono text-[6.5px] font-bold uppercase tracking-[0.1em] text-[#1C211C]/65 marker:hidden [&::-webkit-details-marker]:hidden">menu</summary>
          <div className="absolute right-0 top-9 z-50 w-44 rounded-[14px] border border-[#1C211C]/15 bg-[#FFFCF5] p-2 shadow-[0_18px_40px_-20px_rgba(28,33,28,0.45)]">
            {CHAT_NAV.map((item) => (
              <Link key={item.to} to={item.to} className="block rounded-[8px] px-3 py-2 font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#4D534B]/70 hover:bg-[#F7F1E5] hover:text-[#254BFF]">{item.label}</Link>
            ))}
            <Link to="/reads" className="mt-1 block border-t border-[#1C211C]/10 px-3 pt-2 font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#4D534B]/70 hover:text-[#254BFF]">read a source</Link>
            <Link to="/login" className="block px-3 pb-1 pt-1 font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#254BFF]">sign in</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function ChatAvatar({ who, size = "md" }: { who: "A" | "B" | "system"; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  if (who === "system") return <span className={`grid shrink-0 place-items-center rounded-full bg-[#F6E96B] text-[#1C211C] ${size === "sm" ? "text-[12px]" : "text-[15px]"} ${sizeClass}`}>✦</span>;
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full border-2 border-[#FFFCF5] shadow-[0_2px_0_rgba(28,33,28,0.12)] ${sizeClass} ${who === "A" ? "bg-[#254BFF]" : "bg-[#FF7A59]"}`} aria-label={`route ${who}`}>
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
        <circle cx="15" cy="17" r="2.1" fill="#FFFCF5" />
        {who === "A" ? <path d="M22 17h5" stroke="#FFFCF5" strokeWidth="2.1" strokeLinecap="round" /> : <circle cx="25" cy="17" r="2.1" fill="#FFFCF5" />}
        <path d={who === "A" ? "M14 25c3.2 1.7 6.8 1.7 10 0" : "M14 24c3.2 3.3 6.8 3.3 10 0"} fill="none" stroke="#FFFCF5" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={`absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-[#FFFCF5] font-mono font-bold text-[#1C211C] ${size === "sm" ? "h-3 w-3 text-[5px]" : "h-3.5 w-3.5 text-[6px]"}`}>{who}</span>
    </span>
  );
}

function ChatBubble({ who, children }: { who: "A" | "B" | "system"; children: React.ReactNode }) {
  if (who === "system") {
    return (
      <div className="flex items-start gap-3">
        <ChatAvatar who="system" size="sm" />
        <div className="max-w-[80%] rounded-[16px] rounded-tl-[4px] bg-[#F7F1E5] px-3.5 py-2.5 font-sans text-[12px] leading-[1.55] text-[#4D534B]/80">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <ChatAvatar who={who} />
      <div className="max-w-[84%]">
        <div className="mb-1 flex items-center gap-2">
          <span className={`font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] ${who === "A" ? "text-[#254BFF]" : "text-[#C34E31]"}`}>{who === "A" ? "route A" : "route B"}</span>
          <span className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/35">now</span>
        </div>
        <div className={`rounded-[18px] rounded-tl-[4px] px-4 py-3 font-sans text-[13px] leading-[1.6] text-[#1C211C] ${who === "A" ? "bg-[#E9EEFF]" : "bg-[#FFE8DE]"}`}>{children}</div>
      </div>
    </div>
  );
}

function ChatTheory({ letter, theory, glossary, onWord }: { letter: "A" | "B"; theory: SeminarTheory; glossary: GlossaryWord[]; onWord: (word: GlossaryWord, tone: number, element: HTMLElement) => void }) {
  const bubble = letter === "A" ? "bg-[#E9EEFF]" : "bg-[#FFE8DE]";
  const accent = letter === "A" ? "text-[#254BFF]" : "text-[#C34E31]";
  return (
    <div id={`theory-${letter.toLowerCase()}`} data-loupe-section={`Route ${letter}: ${theory.name}`} className="flex items-start gap-3">
      <ChatAvatar who={letter} />
      <div className="min-w-0 max-w-[88%]">
        <div className="mb-1 flex items-center gap-2">
          <span className={`font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] ${accent}`}>route {letter} · {letter === "A" ? "the first reading" : "the other reading"}</span>
          <span className="font-mono text-[6px] uppercase tracking-[0.1em] text-[#5E665D]/35">now</span>
        </div>
        <div className={`rounded-[22px] rounded-tl-[5px] px-4 py-4 md:px-5 md:py-5 ${bubble}`}>
          <h2 className="max-w-[22ch] font-display text-[clamp(23px,3vw,31px)] leading-[1.02] tracking-[-0.025em] text-[#1C211C]">{theory.name}</h2>
          <p className="mt-3 max-w-[60ch] font-sans text-[13px] leading-[1.65] text-[#4D534B]"><HighlightedText text={theory.claim} glossary={glossary} onWord={onWord} /></p>
          <div className="mt-4 border-t border-[#1C211C]/10 pt-3">
            <p className="font-mono text-[6px] font-bold uppercase tracking-[0.12em] text-[#5E665D]/60">how it works</p>
            <p className="mt-1.5 font-sans text-[12.5px] leading-[1.65] text-[#4D534B]/85"><HighlightedText text={theory.mechanism} glossary={glossary} onWord={onWord} /></p>
          </div>
          <div className="mt-4 grid gap-4 border-t border-[#1C211C]/10 pt-3 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[6px] font-bold uppercase tracking-[0.12em] text-[#5E665D]/60">it predicts</p>
              <ul className="mt-1.5 space-y-1.5">
                {theory.predictions.map((prediction) => <li key={prediction} className="flex gap-1.5 font-sans text-[11px] leading-[1.45] text-[#4D534B]/80"><span className={accent}>↳</span><span>{prediction}</span></li>)}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[6px] font-bold uppercase tracking-[0.12em] text-[#5E665D]/60">evidence to check</p>
              <ul className="mt-1.5 space-y-1.5">
                {theory.evidence.map((item) => <li key={item} className="flex gap-1.5 font-sans text-[11px] leading-[1.45] text-[#4D534B]/80"><span className="text-[#4C6653]">✓</span><span>{item}</span></li>)}
              </ul>
            </div>
          </div>
          <p className="mt-4 border-l-2 border-[#1C211C]/15 pl-2 font-sans text-[10.5px] italic leading-[1.5] text-[#4D534B]/65"><span className="font-mono text-[5.5px] not-italic uppercase tracking-[0.1em] text-[#5E665D]/55">wrong if · </span>{theory.falsifier}</p>
        </div>
      </div>
    </div>
  );
}

function ChatAside({ seminar, text, glossary, onWord, userId, save, saveState, saved, onOpenSaved }: { seminar?: Seminar; text?: string; glossary?: GlossaryWord[]; onWord?: (word: GlossaryWord, tone: number, element: HTMLElement) => void; userId?: string | null; save?: () => void; saveState?: "idle" | "saving" | "saved" | "error"; saved?: SavedSeminar[]; onOpenSaved?: (item: SavedSeminar) => void }) {
  return (
    <aside className="border-t border-[#1C211C]/10 bg-[#F8F2E7] p-4 md:p-5 lg:border-l lg:border-t-0">
      <div className="lg:sticky lg:top-4">
        {!seminar ? (
          <>
            <div className="rotate-[-1.3deg] rounded-[12px] border border-[#1C211C]/12 bg-[#FFFCF5] p-4 shadow-[0_8px_18px_-15px_rgba(28,33,28,0.6)]">
              <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#254BFF]">in the room</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2.5"><ChatAvatar who="A" size="sm" /><div><p className="font-sans text-[12px] font-semibold">route A</p><p className="font-sans text-[10.5px] leading-snug text-[#4D534B]/65">the reading you already suspect</p></div></div>
                <div className="flex items-center gap-2.5"><ChatAvatar who="B" size="sm" /><div><p className="font-sans text-[12px] font-semibold">route B</p><p className="font-sans text-[10.5px] leading-snug text-[#4D534B]/65">the one you have not met</p></div></div>
                <div className="flex items-center gap-2.5"><ChatAvatar who="system" size="sm" /><div><p className="font-sans text-[12px] font-semibold">the host</p><p className="font-sans text-[10.5px] leading-snug text-[#4D534B]/65">keeps the question open</p></div></div>
              </div>
            </div>
            <div className="relative mt-4 rotate-[0.8deg] rounded-[4px] bg-[#F6E96B] p-4 shadow-[0_8px_18px_-15px_rgba(28,33,28,0.6)]">
              <span aria-hidden className="absolute -top-2 left-7 h-3 w-14 rotate-[-3deg] bg-[#FFFCF5]/75" /><p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#1C211C]/60">the house rules</p>
              <ul className="mt-2 space-y-1.5 font-sans text-[11.5px] leading-[1.45] text-[#1C211C]/75">
                <li>✦ steelman first.</li><li>✦ no verdict unless asked.</li><li>✦ the crux is the point.</li>
              </ul>
            </div>
            {saved && saved.length > 0 ? (
              <details className="mt-5 border-t border-[#1C211C]/10 pt-4">
                <summary className="cursor-pointer list-none font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#5E665D] marker:hidden [&::-webkit-details-marker]:hidden">
                  the archive · {saved.length} held
                </summary>
                <ul className="mt-2">
                  {saved.slice(0, 6).map((item) => (
                    <li key={item.id} className="border-t border-[#1C211C]/10">
                      <button type="button" onClick={() => onOpenSaved?.(item)} className="block w-full py-2 text-left font-serif text-[11.5px] leading-snug text-[#4D534B]/75 hover:text-[#254BFF]">
                        {item.question}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : (
          <>
            <div className="rotate-[-1deg] rounded-[12px] border border-[#1C211C]/12 bg-[#FFE8DE] p-4 shadow-[0_8px_18px_-15px_rgba(28,33,28,0.6)]">
              <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#C34E31]">on the table</p>
              <p className="mt-2 line-clamp-6 font-display text-[17px] italic leading-[1.35] text-[#1C211C]/80">“{(text ?? "").replace(/^["“”']+|["“”']+$/g, "")}”</p>
              <p className="mt-1 font-sans text-[10px] leading-snug text-[#4D534B]/60">the passage you brought.</p>
            </div>
            {glossary && glossary.length > 0 ? (
              <div className="mt-6">
                <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#5E665D]/55">words to keep</p>
                <div className="mt-2"><WordChips glossary={glossary} onWord={onWord ?? (() => {})} /></div>
              </div>
            ) : null}
            <div className="mt-6 border-t border-[#1C211C]/10 pt-4">
              <p className="font-mono text-[6.5px] font-bold uppercase tracking-[0.14em] text-[#5E665D]/55">still in the room</p>
              <div className="mt-2 flex items-center gap-2"><ChatAvatar who="A" size="sm" /><ChatAvatar who="B" size="sm" /><span className="font-sans text-[10.5px] text-[#4D534B]/60">two readings, one open question.</span></div>
            </div>
            <div className="mt-6 border-t border-[#1C211C]/10 pt-4">
              {userId ? <button type="button" onClick={save} disabled={saveState === "saving" || saveState === "saved"} className="w-full rounded-full bg-[#1C211C] px-3 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-white disabled:bg-[#1C211C]/15 disabled:text-[#1C211C]/35">{saveState === "saved" ? "pinned to the record ✓" : saveState === "saving" ? "pinning…" : "pin this seminar →"}</button> : <Link to="/login" className="flex items-center justify-center rounded-full border border-[#1C211C]/20 px-3 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-[#1C211C]/70 hover:border-[#254BFF] hover:text-[#254BFF]">sign in to pin this →</Link>}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function ChatTicker() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[#1C211C]/10 bg-[#F6E96B] px-4 py-2 font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] text-[#1C211C]/70">
      <span>two readings</span><span aria-hidden>✦</span><span>one crux</span><span aria-hidden>✦</span><span>no verdict unless asked</span><span aria-hidden>✦</span><span>steelman first</span>
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
  const tint = letter === "A" ? "bg-[#F2EEE4]" : "bg-[#D9FF3F]";
  const accent = letter === "A" ? "text-[#1832FF]" : "text-[#151515]";
  return (
    <article
      data-loupe-section={`Theory ${letter}: ${theory.name}`}
      className={`${tint} group/theory border-b border-[#D8D0C2] p-5 md:border-b-0 md:p-7 ${letter === "A" ? "md:border-r" : ""}`}
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
