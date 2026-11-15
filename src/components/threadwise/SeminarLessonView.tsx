import { BookOpen, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { ReadingMarker } from "@/components/threadwise/BlueprintUI";
import { LookCloserButton } from "@/components/threadwise/SeminarLoupe";
import type { LoupeTarget } from "@/components/threadwise/SeminarLoupe";
import type { Seminar } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";
import { SeminarTutor } from "@/components/threadwise/SeminarTutor";

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

function SectionHead({ number, title, kicker, closer }: { number: string; title: string; kicker?: string; closer?: ReactNode }) {
  return (
    <div>
      <div className="reading-section__head">
        <div className="reading-section__meta">
          <span className="reading-section__number">{number}</span>
          <span className="reading-section__eyebrow">{kicker ?? "The deeper lesson"}</span>
        </div>
        {closer ? <div className="reading-section__aside">{closer}</div> : null}
      </div>
      <h3 className="reading-section__title">{title}</h3>
      <div className="reading-section__rule" />
    </div>
  );
}

export function SeminarLessonView({ lesson, text, context, seminar, tutorSeed, onAskTutor, onLookCloser }: { lesson: SeminarLesson; text: string; context: string; seminar: Seminar; tutorSeed?: string | null; onAskTutor?: (selected: string) => void; onLookCloser?: (target: LoupeTarget) => void }) {
  const words = JSON.stringify(lesson).split(/\s+/).length;
  const minutes = Math.max(4, Math.round(words / 190));

  return (
    <section aria-labelledby="deeper-lesson" className="seminar-dark-ink mt-12 scroll-mt-24">
      <div className="border-b border-[#F7EAD6]/20 pb-7">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#FFE8D6]">The deeper lesson</p>
            <span className="h-3 w-px bg-white/20" />
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/40">Built from this seminar</p>
          </div>
          <h2 id="deeper-lesson" className="mt-3 max-w-[20ch] font-display text-[36px] leading-[0.96] tracking-[-0.03em] md:text-[52px]">
            {lesson.title}
          </h2>
          <p className="mt-4 max-w-[68ch] font-serif text-[15px] leading-[1.7] text-[#F4EBDD]/70 md:text-[16px]">
            {lesson.summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#F4EBDD]/40">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> {minutes} min read</span>
            <span>No new verdict</span>
            <span>Verify claims before you use them</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[170px_minmax(0,1fr)] md:gap-12">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/40">Inside the lesson</p>
            <ol className="mt-3 space-y-2 border-l border-white/15 pl-3">
              {CONTENTS.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#lesson-${id}`}
                    className="group flex items-baseline gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-white/45 transition-colors hover:text-white"
                  >
                    <span className="text-[#E7A574]/70">{String(index + 1).padStart(2, "0")}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0 space-y-12">
          <section id="lesson-terms" data-loupe-section="The terms" className="reading-section scroll-mt-24">
            <SectionHead number="01" title="The terms that make the question legible." kicker="Start here" closer={onLookCloser ? <LookCloserButton text={lesson.key_terms.map((term) => `${term.term}: ${term.plain}`).join(" · ").slice(0, 680)} section="The terms" onLookCloser={onLookCloser} /> : null} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {lesson.key_terms.map((term) => (
                <div key={term.term} className="lesson-card">
                  <h4 className="font-display text-[19px] leading-tight">{term.term}</h4>
                  <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/72">{term.plain}</p>
                  <p className="mt-2 border-t border-[#1A1A1A]/10 pt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#1A1A1A]/40">
                    Why it matters · {term.why_it_matters}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-background" data-loupe-section="The background" className="reading-section scroll-mt-24">
            <SectionHead number="02" title="The minimum background." kicker="What you need before the argument" closer={onLookCloser ? <LookCloserButton text={lesson.background.map((block) => `${block.heading}: ${block.body}`).join(" · ").slice(0, 680)} section="The background" onLookCloser={onLookCloser} /> : null} />
            <div className="mt-5 space-y-5">
              {lesson.background.map((block) => (
                <div key={block.heading} className="lesson-card">
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/60">{block.heading}</h4>
                  <p className="mt-2 max-w-[68ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/75">{block.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-mechanisms" data-loupe-section="Two mechanisms" className="reading-section scroll-mt-24">
            <SectionHead number="03" title="Two engines, not two slogans." kicker="How each theory actually works" closer={onLookCloser ? <LookCloserButton text={lesson.mechanisms.map((item) => `${item.heading}: ${item.body}`).join(" · ").slice(0, 680)} section="Two mechanisms" onLookCloser={onLookCloser} /> : null} />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {lesson.mechanisms.map((mechanism) => (
                <div key={mechanism.theory} className="lesson-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#E7A574]">Theory {mechanism.theory}</p>
                      <h4 className="mt-1 font-display text-[23px] leading-[1.05]">{mechanism.heading}</h4>
                    </div>
                    <span className="font-display text-[46px] leading-[0.7] text-[#E7A574]/30" aria-hidden>{mechanism.theory}</span>
                  </div>
                  <p className="mt-4 font-serif text-[14px] leading-[1.65] text-[#1A1A1A]/75">{mechanism.body}</p>
                  <div className="mt-4 space-y-2 border-t border-[#1A1A1A]/12 pt-3">
                    <p className="font-serif text-[12.5px] leading-snug text-[#1A1A1A]/60"><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">Best at · </span>{mechanism.strength}</p>
                    <p className="font-serif text-[12.5px] leading-snug text-[#1A1A1A]/60"><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#C1121F]/65">Weakest at · </span>{mechanism.weakness}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-crux" data-loupe-section="The crux as a test" className="reading-section scroll-mt-24">
            <SectionHead number="04" title={lesson.crux.heading} kicker="The test that separates them" closer={onLookCloser ? <LookCloserButton text={`${lesson.crux.explanation} ${lesson.crux.test}`.slice(0, 680)} section="The crux as a test" onLookCloser={onLookCloser} /> : null} />
            <div className="lesson-card mt-5">
              <p className="max-w-[62ch] font-serif text-[15px] leading-[1.7] text-white/75">{lesson.crux.explanation}</p>
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#FFE8D6]">Try this on the next piece of evidence</p>
                <p className="mt-1 max-w-[62ch] font-serif text-[14px] leading-relaxed text-white/80">{lesson.crux.test}</p>
              </div>
            </div>
          </section>

          <section id="lesson-misreadings" data-loupe-section="Where careful readers slip" className="reading-section scroll-mt-24">
            <SectionHead number="05" title="Where careful readers still slip." kicker="Common misreadings" closer={onLookCloser ? <LookCloserButton text={lesson.misconceptions.map((item) => `${item.mistake}: ${item.correction}`).join(" · ").slice(0, 680)} section="Where readers slip" onLookCloser={onLookCloser} /> : null} />
            <div className="lesson-card mt-5 divide-y divide-white/12">
              {lesson.misconceptions.map((item) => (
                <div key={item.mistake} className="grid gap-2 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                  <p className="font-serif text-[13.5px] leading-snug text-[#C1121F]/75">“{item.mistake}”</p>
                  <p className="font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">{item.correction}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-example" data-loupe-section="Worked example" className="reading-section scroll-mt-24">
            <SectionHead number="06" title={lesson.worked_example.heading} kicker="One concrete walk-through" closer={onLookCloser ? <LookCloserButton text={`${lesson.worked_example.scenario} ${lesson.worked_example.walkthrough}`.slice(0, 680)} section="Worked example" onLookCloser={onLookCloser} /> : null} />
            <div className="lesson-card mt-5">
              <p className="font-serif text-[14px] leading-[1.7] text-[#1A1A1A]/60">{lesson.worked_example.scenario}</p>
              <p className="mt-4 max-w-[68ch] font-serif text-[15px] leading-[1.75] text-[#1A1A1A]/80">{lesson.worked_example.walkthrough}</p>
              <p className="mt-4 max-w-[62ch] border-t border-[#1A1A1A]/12 pt-3 font-serif text-[13.5px] leading-relaxed text-[#E7A574]/80">
                {lesson.worked_example.lesson}
              </p>
            </div>
          </section>

          <section id="lesson-check" data-loupe-section="Check yourself" className="reading-section scroll-mt-24">
            <SectionHead number="07" title="Check yourself." kicker="Answer before opening" closer={onLookCloser ? <LookCloserButton text={lesson.check.map((item) => item.question).join(" · ").slice(0, 680)} section="Check yourself" onLookCloser={onLookCloser} /> : null} />
            <div className="mt-5 space-y-2">
              {lesson.check.map((item, index) => (
                <details key={item.question} className="group border-b border-white/12 py-3 last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-start gap-3 font-serif text-[14px] leading-snug text-[#1A1A1A]/80 marker:content-none">
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#E7A574]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{item.question}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/35 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 border-t border-[#1A1A1A]/10 pt-3 pl-6 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/65">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="lesson-next" data-loupe-section="What to explore" className="reading-section scroll-mt-24">
            <SectionHead number="08" title="What to look for next." kicker="Source types, not fake citations" closer={onLookCloser ? <LookCloserButton text={lesson.next_sources.map((source) => `${source.kind}: ${source.why}`).join(" · ").slice(0, 680)} section="What to explore" onLookCloser={onLookCloser} /> : null} />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {lesson.next_sources.map((source) => (
                <div key={source.kind} className="lesson-card flex items-start gap-3">
                  <ReadingMarker variant="check" />
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/65">{source.kind}</p>
                    <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#1A1A1A]/55">{source.why}</p>
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
            <p className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
              <Compass className="h-3 w-3 text-[#E7A574]" /> The lesson is a map, not a verdict.
            </p>
            <a href="#deeper-lesson" className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#E7A574] underline underline-offset-4">
              Back to the top ↑
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
