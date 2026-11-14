import { BookOpen, Check, Compass } from "lucide-react";
import type { Seminar } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";
import { SeminarTutor } from "@/components/threadwise/SeminarTutor";
import { HighlightedText, WordChips, type GlossaryWord } from "@/components/threadwise/SeminarWords";
import { InkRule } from "@/components/threadwise/InkMarks";

const CONTENTS = [
  ["terms", "The terms"],
  ["background", "The background"],
  ["mechanisms", "Two mechanisms"],
  ["crux", "The crux as a test"],
  ["misreadings", "Where readers slip"],
  ["example", "Worked example"],
  ["check", "Check yourself"],
  ["next", "What to explore"],
] as const;

function SectionHead({ number, title, kicker }: { number: string; title: string; kicker?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#4F705C]">{number}</span>
        <div>
          <h3 className="font-display text-[28px] leading-none tracking-[-0.02em] md:text-[34px]">{title}</h3>
          {kicker ? <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/35">{kicker}</p> : null}
        </div>
      </div>
      <InkRule className="mt-3" />
    </div>
  );
}

export function SeminarLessonView({
  lesson,
  text,
  context,
  seminar,
  tutorSeed,
  onAskTutor,
  glossary,
  onWord,
}: {
  lesson: SeminarLesson;
  text: string;
  context: string;
  seminar: Seminar;
  tutorSeed?: string | null;
  onAskTutor?: (selected: string) => void;
  glossary: GlossaryWord[];
  onWord: (word: GlossaryWord, tone: number, element: HTMLElement) => void;
}) {
  const words = JSON.stringify(lesson).split(/\s+/).length;
  const minutes = Math.max(4, Math.round(words / 190));

  return (
    <section aria-labelledby="deeper-lesson" className="mt-12 scroll-mt-24">
      <div className="relative overflow-hidden rounded-[26px] border border-[#D8CCBA] bg-[#EAF0E7] px-5 py-7 text-[#2F332C] shadow-[0_24px_60px_-40px_rgba(47,51,44,0.45)] md:px-8 md:py-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_12%,rgba(255,248,232,0.75),transparent_58%)]" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#B9CCB7]/50" />
        <div className="pointer-events-none absolute -right-2 -top-8 h-44 w-44 rounded-full border border-[#B9CCB7]/35" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#4F705C]">The deeper lesson</p>
            <span className="h-3 w-px bg-[#2F332C]/20" />
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/42">Built from this seminar</p>
          </div>
          <h2 id="deeper-lesson" className="mt-3 max-w-[20ch] font-display text-[36px] leading-[0.96] tracking-[-0.03em] md:text-[52px]">
            {lesson.title}
          </h2>
          <p className="mt-4 max-w-[68ch] font-serif text-[15px] leading-[1.7] text-[#2F332C]/65 md:text-[16px]">
            <HighlightedText text={lesson.summary} glossary={glossary} onWord={onWord} />
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/38">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> {minutes} min read</span>
            <span>No new verdict</span>
            <span>Verify claims before you use them</span>
          </div>
        </div>
        {glossary.length > 0 ? (
          <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-[#2F332C]/12 pt-4">
            <span className="mr-1 font-mono text-[7px] font-bold uppercase tracking-[0.14em] text-[#2F332C]/38">Words to keep</span>
            <WordChips glossary={glossary} onWord={onWord} />
            <span className="ml-1 font-serif text-[10px] italic text-[#2F332C]/30">Tap a tinted word for a note.</span>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[170px_minmax(0,1fr)] md:gap-12">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#2F332C]/40">Inside the lesson</p>
            <ol className="mt-3 space-y-2 border-l border-[#8A745C]/25 pl-3">
              {CONTENTS.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#lesson-${id}`}
                    className="group flex items-baseline gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[#2F332C]/45 transition-colors hover:text-[#4F705C]"
                  >
                    <span className="text-[#4F705C]/70">{String(index + 1).padStart(2, "0")}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0 space-y-12">
          <section id="lesson-terms" data-loupe-section="The terms" className="scroll-mt-24">
            <SectionHead number="01" title="The terms that make the question legible." kicker="Start here" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {lesson.key_terms.map((term) => (
                <div key={term.term} className="rounded-[18px] border border-[#DED3C1] bg-[#FBF6EC] p-4 shadow-[0_10px_26px_-24px_rgba(61,43,27,0.35)]">
                  <h4 className="font-display text-[19px] leading-tight">{term.term}</h4>
                  <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-[#2F332C]/72">
                    <HighlightedText text={term.plain} glossary={glossary} onWord={onWord} />
                  </p>
                  <p className="mt-2 border-t border-[#1A1A1A]/10 pt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#2F332C]/40">
                    Why it matters · <HighlightedText text={term.why_it_matters} glossary={glossary} onWord={onWord} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-background" data-loupe-section="The background" className="scroll-mt-24">
            <SectionHead number="02" title="The minimum background." kicker="What you need before the argument" />
            <div className="mt-5 space-y-5">
              {lesson.background.map((block) => (
                <div key={block.heading} className="border-l border-[#C49A67]/35 pl-4">
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#2F332C]/60">{block.heading}</h4>
                  <p className="mt-2 max-w-[68ch] font-serif text-[15px] leading-[1.7] text-[#2F332C]/75">
                    <HighlightedText text={block.body} glossary={glossary} onWord={onWord} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-mechanisms" data-loupe-section="Two mechanisms" className="scroll-mt-24">
            <SectionHead number="03" title="Two engines, not two slogans." kicker="How each theory actually works" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {lesson.mechanisms.map((mechanism) => (
                <div key={mechanism.theory} className="rounded-[20px] border border-[#D8CCBA] bg-[#F6F0E5] p-5 shadow-[0_14px_34px_-30px_rgba(61,43,27,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#4F705C]">Theory {mechanism.theory}</p>
                      <h4 className="mt-1 font-display text-[23px] leading-[1.05]">{mechanism.heading}</h4>
                    </div>
                    <span className="font-display text-[46px] leading-[0.7] text-[#4F705C]/30" aria-hidden>{mechanism.theory}</span>
                  </div>
                  <p className="mt-4 font-serif text-[14px] leading-[1.65] text-[#2F332C]/75">
                    <HighlightedText text={mechanism.body} glossary={glossary} onWord={onWord} />
                  </p>
                  <div className="mt-4 space-y-2 border-t border-[#1A1A1A]/12 pt-3">
                    <p className="font-serif text-[12.5px] leading-snug text-[#2F332C]/60"><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#2F332C]/35">Best at · </span><HighlightedText text={mechanism.strength} glossary={glossary} onWord={onWord} /></p>
                    <p className="font-serif text-[12.5px] leading-snug text-[#2F332C]/60"><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#A3644E]/65">Weakest at · </span><HighlightedText text={mechanism.weakness} glossary={glossary} onWord={onWord} /></p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-crux" data-loupe-section="The crux as a test" className="scroll-mt-24">
            <SectionHead number="04" title={lesson.crux.heading} kicker="The test that separates them" />
            <div className="mt-5 rounded-[24px] border border-[#C9D8C4] bg-[#E5EEE1] px-5 py-6 text-[#2F332C] md:px-7">
              <p className="max-w-[62ch] font-serif text-[15px] leading-[1.7] text-[#2F332C]/75">
                <HighlightedText text={lesson.crux.explanation} glossary={glossary} onWord={onWord} />
              </p>
              <div className="mt-5 border-t border-[#2F332C]/15 pt-4">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#4F705C]">Try this on the next piece of evidence</p>
                <p className="mt-1 max-w-[62ch] font-serif text-[14px] leading-relaxed text-[#2F332C]/80">
                  <HighlightedText text={lesson.crux.test} glossary={glossary} onWord={onWord} />
                </p>
              </div>
            </div>
          </section>

          <section id="lesson-misreadings" data-loupe-section="Where careful readers slip" className="scroll-mt-24">
            <SectionHead number="05" title="Where careful readers still slip." kicker="Common misreadings" />
            <div className="mt-5 divide-y divide-[#1A1A1A]/12 border-y border-[#1A1A1A]/12">
              {lesson.misconceptions.map((item) => (
                <div key={item.mistake} className="grid gap-2 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                  <p className="font-serif text-[13.5px] leading-snug text-[#A3644E]/75">“<HighlightedText text={item.mistake} glossary={glossary} onWord={onWord} />”</p>
                  <p className="font-serif text-[14px] leading-relaxed text-[#2F332C]/70"><HighlightedText text={item.correction} glossary={glossary} onWord={onWord} /></p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-example" data-loupe-section="Worked example" className="scroll-mt-24">
            <SectionHead number="06" title={lesson.worked_example.heading} kicker="One concrete walk-through" />
            <div className="mt-5 border-l-2 border-[#C49A67]/55 pl-5">
              <p className="font-serif text-[14px] leading-[1.7] text-[#2F332C]/60">{lesson.worked_example.scenario}</p>
              <p className="mt-4 max-w-[68ch] font-serif text-[15px] leading-[1.75] text-[#2F332C]/80">{lesson.worked_example.walkthrough}</p>
              <p className="mt-4 max-w-[62ch] border-t border-[#1A1A1A]/12 pt-3 font-serif text-[13.5px] leading-relaxed text-[#4F705C]/80">
                {lesson.worked_example.lesson}
              </p>
            </div>
          </section>

          <section id="lesson-check" data-loupe-section="Check yourself" className="scroll-mt-24">
            <SectionHead number="07" title="Check yourself." kicker="Answer before opening" />
            <div className="mt-5 space-y-2">
              {lesson.check.map((item, index) => (
                <details key={item.question} className="group tw-glass-strip px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-start gap-3 font-serif text-[14px] leading-snug text-[#2F332C]/80 marker:content-none">
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#4F705C]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1"><HighlightedText text={item.question} glossary={glossary} onWord={onWord} /></span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#2F332C]/35 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 border-t border-[#1A1A1A]/10 pt-3 pl-6 font-serif text-[13.5px] leading-relaxed text-[#2F332C]/65">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="lesson-next" data-loupe-section="What to explore" className="scroll-mt-24">
            <SectionHead number="08" title="What to look for next." kicker="Source types, not fake citations" />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {lesson.next_sources.map((source) => (
                <div key={source.kind} className="flex items-start gap-2 border-t border-[#1A1A1A]/15 pt-3">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4F705C]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#2F332C]/65">{source.kind}</p>
                    <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#2F332C]/55">{source.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <SeminarTutor
            text={text}
            context={context}
            seminar={seminar}
            lesson={lesson}
            seed={tutorSeed ?? null}
            onSeedConsumed={() => undefined}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-5">
            <p className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#2F332C]/35">
              <Compass className="h-3 w-3 text-[#4F705C]" /> The lesson is a map, not a verdict.
            </p>
            <a href="#deeper-lesson" className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#4F705C] underline underline-offset-4">
              Back to the top ↑
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
