import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, RotateCcw, Search } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import type { Seminar, SeminarTheory } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";
import { SeminarLessonView } from "@/components/threadwise/SeminarLessonView";
import { SeminarLoupe, LoupeSelectionButton, LookCloserButton, useLoupeSelection, type LoupeTarget } from "@/components/threadwise/SeminarLoupe";
import { supabase } from "@/integrations/supabase/client";
import { ReadingFocusToggle, ReadingMarker, ReadingProgress } from "@/components/threadwise/BlueprintUI";
import { fieldColorAt } from "@/lib/threadwise/palette";

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

const TONES = [
  {
    bg: "#000000",
    ink: "#FFFFFF",
    header: "rgba(255, 255, 255, 0.035)",
    border: "rgba(255, 255, 255, 0.2)",
    accent: "#FFFFFF",
    wave: "light" as const,
    brandFilter: "brightness(0) invert(1)",
  },
];

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

const SEMINAR_SECTIONS = [
  { id: "s-question", n: "01", label: "The question" },
  { id: "s-readings", n: "02", label: "Two readings" },
  { id: "s-crux", n: "03", label: "The crux" },
  { id: "s-verdict", n: "04", label: "The verdict" },
  { id: "s-lesson", n: "05", label: "The lesson" },
];

function SeminarReadingNav() {
  const [active, setActive] = useState("s-question");

  useEffect(() => {
    const nodes = SEMINAR_SECTIONS.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -62% 0px", threshold: [0, 0.1, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Seminar sections" className="seminar-reading-nav mb-8">
      <div className="flex min-w-max items-center gap-1">
        {SEMINAR_SECTIONS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "true" : undefined}
            className={`inline-flex items-center gap-2 border-b-2 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
              active === item.id
                ? "border-[#B9D7FF] text-white"
                : "border-transparent text-white/50 hover:border-white/25 hover:text-white"
            }`}
          >
            <span className={active === item.id ? "text-white" : "text-white/55"}>{item.n}</span>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

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
  const [toneIndex, setToneIndex] = useState(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = fieldRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / max));
      const light = progress > 0.88;
      const ink = light ? "#111111" : "#FFFFFF";
      root.style.backgroundColor = fieldColorAt(progress);
      root.style.color = ink;
      root.style.setProperty("--seminar-bg", fieldColorAt(progress));
      root.style.setProperty("--seminar-ink", ink);
      root.style.setProperty("--seminar-header-ink", ink);
      root.style.setProperty("--seminar-header-accent", ink);
      root.style.setProperty("--seminar-header-border", light ? "rgba(17,17,17,0.22)" : "rgba(255,255,255,0.2)");
      root.style.setProperty("--wave-art", light ? 'url("/blueprint-waves-bright.svg")' : 'url("/blueprint-waves.svg")');
      root.style.setProperty("--wave-opacity", light ? "0.7" : "0.72");
      root.dataset.fieldInk = light ? "light" : "dark";
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-seminar-tone]"));
    if (nodes.length === 0) return;

    let frame = 0;
    const updateTone = () => {
      const probe = window.scrollY + Math.min(window.innerHeight * 0.38, 300);
      let active = 0;
      for (const node of nodes) {
        const top = node.getBoundingClientRect().top + window.scrollY;
        if (top <= probe) active = Number(node.dataset.seminarTone ?? 0);
      }
      setToneIndex(active);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTone);
    };

    updateTone();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [seminar, revealed, verdictOpen, lesson]);

  const tone = TONES[toneIndex % TONES.length] ?? TONES[0];

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
    try {
      const response = await fetch("/api/seminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const body = (await response.json()) as { seminar?: Seminar; error?: string };
      if (!response.ok || !body.seminar) throw new Error(body.error ?? "The seminar could not be convened.");
      setSeminar(body.seminar);
      setStand(null);
      setRevealed(false);
      setVerdictOpen(false);
      setSavedId(null);
      setSaveState("idle");
      setLesson(null);
      setLessonBusy(false);
      setLessonError(null);
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
    <div
      ref={fieldRef}
      className="seminar-color-page min-h-[100dvh]"
      data-field-ink="dark"
      style={{
        backgroundColor: tone.bg,
        color: tone.ink,
        "--seminar-bg": tone.bg,
        "--seminar-ink": tone.ink,
        "--seminar-grid": "rgba(247, 234, 214, 0.16)",
        "--seminar-header-bg": tone.header,
        "--seminar-header-border": tone.border,
        "--seminar-header-ink": tone.ink,
        "--seminar-header-accent": tone.accent,
        "--seminar-brand-filter": tone.brandFilter,
        "--wave-art": tone.wave === "dark" ? 'url("/blueprint-waves-bright.svg")' : 'url("/blueprint-waves.svg")',
        "--wave-opacity": tone.wave === "dark" ? "0.7" : "0.72",
      } as CSSProperties}
    >
      <ReadingProgress />
      <div className="seminar-header contents">
        <AppHeader section="seminar" />
      </div>

      <section data-seminar-tone="0" className="relative overflow-hidden text-white">

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-16">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white">
              The seminar
            </p>
            <span className="h-3 w-px bg-white/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/65">
              Two theories · one crux
            </p>
            <ReadingFocusToggle className="ml-auto" />
          </div>

          <h1 className="mt-3 max-w-[12ch] font-display text-[48px] leading-[0.92] tracking-[-0.03em] md:text-[76px]">
            Put it on the table.
          </h1>
          <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-white/75">
            Bring a quote or a question you cannot settle. The seminar builds the strongest
            version of two rival explanations, then shows the exact point where they part.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void convene();
            }}
            className="bp-card mt-8 text-white"
          >
            <div className="bp-card__header">
              <div>
                <p className="bp-card__eyebrow">The seminar</p>
                <p className="bp-card__title">What are we putting on the table?</p>
              </div>
              <span className="bp-badge">No verdict unless asked</span>
            </div>

            <div className="bp-card__body">
              <label htmlFor="seminar-text" className="bp-field__label">
                The quote or question
              </label>
              <textarea
                id="seminar-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                maxLength={3000}
                placeholder="Paste the sentence you cannot stop thinking about…"
                className="bp-input mt-2 min-h-[180px] resize-none font-display text-[21px] leading-[1.3] md:text-[26px]"
              />
            </div>

            <div className="bp-card__footer">
              <div className="min-w-0 flex-1">
                <label htmlFor="seminar-context" className="bp-field__label">
                  Context, if it matters
                </label>
                <input
                  id="seminar-context"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  maxLength={1000}
                  placeholder="Who said it, where, and what was being argued"
                  className="bp-input mt-2"
                />
              </div>
              <button
                type="submit"
                disabled={busy || text.trim().length < 20}
                className="bp-button bp-button--primary w-full md:w-auto"
              >
                {busy ? "Setting the room…" : "Convene the seminar"}
                {!busy && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-4">
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE);
                  setContext("A podcast conversation about foreign aid and statecraft.");
                }}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-white underline underline-offset-4 transition-colors hover:text-white"
              >
                Use the foreign-aid quote
              </button>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
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
        <section data-seminar-tone="5" className="seminar-dark-ink bp-card mx-auto mt-8 w-full max-w-[1100px] px-5 py-6 md:px-7">
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
                    <span className="block truncate font-serif text-[14px] leading-snug text-[#1A1A1A]/80 group-hover:text-white">
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
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white">
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
          <SeminarReadingNav />
          <section id="s-question" data-reading-section="s-question" data-loupe-section="The question underneath" data-seminar-tone="1" className="seminar-dark-ink reading-section grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:gap-12">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                  The question underneath
                </p>
                <LookCloserButton
                  text={`${seminar.question} ${seminar.restatement}`.slice(0, 680)}
                  section="The question underneath"
                  onLookCloser={openLoupe}
                />
              </div>
              <p className="mt-2 max-w-[62ch] font-display text-[28px] leading-[1.1] md:text-[38px]">
                {seminar.question}
              </p>
              <p className="mt-3 max-w-[62ch] font-serif text-[16px] leading-relaxed text-[#1A1A1A]/80">
                {seminar.restatement}
              </p>
            </div>
            <div className="border-t border-[#1A1A1A]/15 pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                You brought
              </p>
              <p className="mt-1 line-clamp-4 font-serif text-[12px] italic leading-relaxed text-[#1A1A1A]/70">
                “{text}”
              </p>
            </div>
          </section>

          <section id="s-readings" data-reading-section="s-readings" data-loupe-section="Two readings" data-seminar-tone="2" className="seminar-dark-ink reading-section mt-8">
            <div className="flex items-end justify-between gap-4 pb-1">
              <h2 className="font-display text-[32px] leading-none md:text-[40px]">Two readings of the same thing.</h2>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35 sm:inline">
                  steelmanned
                </span>
                <LookCloserButton
                  text={seminar.theories.map((theory) => `${theory.name}: ${theory.claim}`).join(" · ").slice(0, 680)}
                  section="Two readings"
                  onLookCloser={openLoupe}
                />
              </div>
            </div>
            <div className="reading-rule mt-2" />
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
              Arguments to test, not sourced findings.
              <span className="inline-flex items-center gap-1 text-white/65">
                <Search className="h-2.5 w-2.5" /> select a line, or hover “closer”
              </span>
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {seminar.theories.map((theory, index) => (
                <TheoryColumn key={index} theory={theory} index={index} onLookCloser={openLoupe} />
              ))}
            </div>
          </section>

          {!revealed ? (
            <section data-seminar-tone="2" className="seminar-dark-ink reading-section mt-10">
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
                    className="bp-button bp-button--secondary bp-button--sm"
                  >
                    Theory A
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("B")}
                    className="bp-button bp-button--secondary bp-button--sm"
                  >
                    Theory B
                  </button>
                  <button
                    type="button"
                    onClick={() => choose("undecided")}
                    className="bp-button bp-button--ghost bp-button--sm"
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
              <section id="s-crux" data-reading-section="s-crux" data-loupe-section="The crux" data-seminar-tone="3" className="seminar-dark-ink reading-section mt-10 overflow-hidden">
                <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                  <div className="border-b border-white/15 px-5 py-4 md:border-b-0 md:border-r md:border-white/15 md:px-6 md:py-8">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                        The crux
                      </p>
                      <LookCloserButton
                        text={`${seminar.crux} ${seminar.settle}`.slice(0, 680)}
                        section="The crux"
                        onLookCloser={openLoupe}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-white/40">
                      {DISAGREEMENT[seminar.disagreement]}
                    </p>
                    {stand && (
                      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                        You stood with{" "}
                        <span className="text-white">
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

              <section id="s-verdict" data-reading-section="s-verdict" data-loupe-section="The provisional verdict" data-seminar-tone="4" className="seminar-dark-ink reading-section mt-6">
                {!verdictOpen ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5">
                    <p className="max-w-[54ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/60">
                      The tension is the point. If you want the evidence weighed, ask for a
                      provisional — not moral — verdict.
                    </p>
                    <button
                      type="button"
                      onClick={() => setVerdictOpen(true)}
                      className="bp-button bp-button--secondary bp-button--sm"
                    >
                      Show a provisional verdict
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-white/15 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                          Provisional verdict
                        </p>
                        <LookCloserButton
                          text={`${seminar.verdict.why} ${seminar.verdict.change}`.slice(0, 680)}
                          section="The provisional verdict"
                          onLookCloser={openLoupe}
                        />
                      </div>
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
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white">
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

              <section id="s-lesson" data-reading-section="s-lesson" data-loupe-section="The deeper lesson" data-seminar-tone="5" className="seminar-dark-ink reading-section mt-10">
                <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                        If the argument is clear but the subject is not
                      </p>
                      {lesson ? (
                        <LookCloserButton
                          text={lesson.summary.slice(0, 680)}
                          section="The deeper lesson"
                          onLookCloser={openLoupe}
                        />
                      ) : null}
                    </div>
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
                    className="bp-button bp-button--primary"
                  >
                    {lessonBusy ? "Building the lesson…" : lesson ? "Rebuild the lesson" : "Go deeper"}
                    {lessonBusy ? <BookOpen className="h-3.5 w-3.5 animate-pulse" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F7EAD6]/20 px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/50 md:px-6">
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

              {lesson ? (
                <SeminarLessonView
                  lesson={lesson}
                  text={text}
                  context={context}
                  seminar={seminar}
                  tutorSeed={tutorSeed}
                  onAskTutor={askTutorAbout}
                  onLookCloser={openLoupe}
                />
              ) : null}

              <div className="seminar-dark-ink mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#F7EAD6]/20 pt-4">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/45">
                    Put this on the record
                  </p>
                  {userId ? (
                    <button
                      type="button"
                      onClick={save}
                      disabled={saveState === "saving" || saveState === "saved"}
                      className="bp-button bp-button--ghost bp-button--sm"
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
                      className="bp-button bp-button--ghost bp-button--sm"
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
                  className="bp-button bp-button--ghost bp-button--sm"
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
  onLookCloser,
}: {
  theory: SeminarTheory;
  index: number;
  onLookCloser: (target: LoupeTarget) => void;
}) {
  const letter = theory.key === "A" || theory.key === "B" ? theory.key : index === 0 ? "A" : "B";
  const tint = "bg-transparent";
  return (
    <article
      data-loupe-section={`Theory ${letter}: ${theory.name}`}
      className={`${tint} theory-panel theory-panel--${letter.toLowerCase()} group/theory px-5 pb-6 pt-7 md:px-7 md:pb-8 md:pt-8`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/40">
            Theory {letter}
          </p>
          <h3 className="mt-1 max-w-[16ch] font-display text-[28px] leading-[1.02]">{theory.name}</h3>
        </div>
        <div className="theory-letter-ring grid h-16 w-16 shrink-0 place-items-center rounded-full">
          <span className="font-display text-[36px] leading-none" aria-hidden>
            {letter}
          </span>
        </div>
      </div>

      <div className="reading-rule mt-5" />
      <div className="group/line group mt-3 flex items-start gap-2">
        <p className="font-serif text-[15.5px] leading-relaxed text-[#1A1A1A]/80">{theory.claim}</p>
        <LookCloserButton text={theory.claim} section={`Theory ${letter} · claim`} onLookCloser={onLookCloser} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            The mechanism
          </p>
          <LookCloserButton
            text={theory.mechanism.slice(0, 680)}
            section={`Theory ${letter} · mechanism`}
            onLookCloser={onLookCloser}
            className="group-hover/theory:opacity-100"
          />
        </div>
        <div className="reading-rule mt-1.5" />
        {theory.mechanism_steps?.length ? (
          <div className="mechanism-flow mt-3">
            {theory.mechanism_steps.map((step, stepIndex) => (
              <div key={`${step.label}-${stepIndex}`} className="mechanism-step">
                <span className="mechanism-step__n">{String(stepIndex + 1).padStart(2, "0")}</span>
                <span className="mechanism-step__label">{step.label}</span>
                <span className="mechanism-step__detail">{step.detail}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 max-w-[62ch] font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/70">
            {theory.mechanism}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            It predicts
          </p>
          <div className="reading-rule mt-1.5" />
          <ul className="mt-1.5 space-y-1.5">
            {theory.predictions.map((prediction) => (
              <li
                key={prediction}
                className="group flex items-start gap-2 rounded-sm px-0.5 py-0.5 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65 transition-colors hover:bg-[#1A4BFF]/[0.035]"
              >
                <ReadingMarker variant="arrow" />
                <span className="flex-1">{prediction}</span>
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
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            Evidence to check
          </p>
          <div className="reading-rule mt-1.5" />
          <ul className="mt-1.5 space-y-1.5">
            {theory.evidence.map((item) => (
              <li
                key={item}
                className="group flex items-start gap-2 rounded-sm px-0.5 py-0.5 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65 transition-colors hover:bg-[#1A4BFF]/[0.035]"
              >
                <ReadingMarker variant="check" />
                <span className="flex-1">{item}</span>
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

      <div className="group mt-4 border-l-2 border-[#1A1A1A]/30 pl-3 transition-colors hover:border-[#1A4BFF]/50">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">
            It would be wrong if
          </p>
          <LookCloserButton text={theory.falsifier} section={`Theory ${letter} · falsifier`} onLookCloser={onLookCloser} />
        </div>
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
