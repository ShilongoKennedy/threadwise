import { BookOpen, Check, Compass } from "lucide-react";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";

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
    <div className="flex items-baseline gap-4 border-b border-[#1A1A1A]/15 pb-3">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">{number}</span>
      <div>
        <h3 className="font-display text-[28px] leading-none tracking-[-0.02em] md:text-[34px]">{title}</h3>
        {kicker ? <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">{kicker}</p> : null}
      </div>
    </div>
  );
}

export function SeminarLessonView({ lesson }: { lesson: SeminarLesson }) {
  const words = JSON.stringify(lesson).split(/\s+/).length;
  const minutes = Math.max(4, Math.round(words / 190));

  return (
    <section aria-labelledby="deeper-lesson" className="mt-12 scroll-mt-24">
      <div className="relative overflow-hidden rounded-[24px] border border-[#8A745C]/25 bg-[#15110D] px-5 py-7 text-[#F4EBDD] shadow-[0_28px_70px_-36px_rgba(41,28,17,0.7)] md:px-8 md:py-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_12%,rgba(207,148,86,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/world-land-dark.svg')] bg-[length:1100px_auto] bg-[position:88%_40%] bg-no-repeat opacity-25" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#9FB2FF]">The deeper lesson</p>
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
            <ol className="mt-3 space-y-2 border-l border-[#8A745C]/25 pl-3">
              {CONTENTS.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#lesson-${id}`}
                    className="group flex items-baseline gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[#1A1A1A]/45 transition-colors hover:text-[#1A4BFF]"
                  >
                    <span className="text-[#1A4BFF]/70">{String(index + 1).padStart(2, "0")}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0 space-y-12">
          <section id="lesson-terms" className="scroll-mt-24">
            <SectionHead number="01" title="The terms that make the question legible." kicker="Start here" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {lesson.key_terms.map((term) => (
                <div key={term.term} className="tw-glass-strip p-4">
                  <h4 className="font-display text-[19px] leading-tight">{term.term}</h4>
                  <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/72">{term.plain}</p>
                  <p className="mt-2 border-t border-[#1A1A1A]/10 pt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#1A1A1A]/40">
                    Why it matters · {term.why_it_matters}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-background" className="scroll-mt-24">
            <SectionHead number="02" title="The minimum background." kicker="What you need before the argument" />
            <div className="mt-5 space-y-5">
              {lesson.background.map((block) => (
                <div key={block.heading} className="border-l border-[#C49A67]/35 pl-4">
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/60">{block.heading}</h4>
                  <p className="mt-2 max-w-[68ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/75">{block.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-mechanisms" className="scroll-mt-24">
            <SectionHead number="03" title="Two engines, not two slogans." kicker="How each theory actually works" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {lesson.mechanisms.map((mechanism) => (
                <div key={mechanism.theory} className="tw-glass-panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">Theory {mechanism.theory}</p>
                      <h4 className="mt-1 font-display text-[23px] leading-[1.05]">{mechanism.heading}</h4>
                    </div>
                    <span className="font-display text-[46px] leading-[0.7] text-[#1A4BFF]/30" aria-hidden>{mechanism.theory}</span>
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

          <section id="lesson-crux" className="scroll-mt-24">
            <SectionHead number="04" title={lesson.crux.heading} kicker="The test that separates them" />
            <div className="mt-5 rounded-[20px] bg-[#1A1A1A] px-5 py-6 text-[#F4EBDD] md:px-7">
              <p className="max-w-[62ch] font-serif text-[15px] leading-[1.7] text-white/75">{lesson.crux.explanation}</p>
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#9FB2FF]">Try this on the next piece of evidence</p>
                <p className="mt-1 max-w-[62ch] font-serif text-[14px] leading-relaxed text-white/80">{lesson.crux.test}</p>
              </div>
            </div>
          </section>

          <section id="lesson-misreadings" className="scroll-mt-24">
            <SectionHead number="05" title="Where careful readers still slip." kicker="Common misreadings" />
            <div className="mt-5 divide-y divide-[#1A1A1A]/12 border-y border-[#1A1A1A]/12">
              {lesson.misconceptions.map((item) => (
                <div key={item.mistake} className="grid gap-2 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                  <p className="font-serif text-[13.5px] leading-snug text-[#C1121F]/75">“{item.mistake}”</p>
                  <p className="font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">{item.correction}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="lesson-example" className="scroll-mt-24">
            <SectionHead number="06" title={lesson.worked_example.heading} kicker="One concrete walk-through" />
            <div className="mt-5 border-l-2 border-[#C49A67]/55 pl-5">
              <p className="font-serif text-[14px] leading-[1.7] text-[#1A1A1A]/60">{lesson.worked_example.scenario}</p>
              <p className="mt-4 max-w-[68ch] font-serif text-[15px] leading-[1.75] text-[#1A1A1A]/80">{lesson.worked_example.walkthrough}</p>
              <p className="mt-4 max-w-[62ch] border-t border-[#1A1A1A]/12 pt-3 font-serif text-[13.5px] leading-relaxed text-[#1A4BFF]/80">
                {lesson.worked_example.lesson}
              </p>
            </div>
          </section>

          <section id="lesson-check" className="scroll-mt-24">
            <SectionHead number="07" title="Check yourself." kicker="Answer before opening" />
            <div className="mt-5 space-y-2">
              {lesson.check.map((item, index) => (
                <details key={item.question} className="group tw-glass-strip px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-start gap-3 font-serif text-[14px] leading-snug text-[#1A1A1A]/80 marker:content-none">
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#1A4BFF]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{item.question}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/35 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 border-t border-[#1A1A1A]/10 pt-3 pl-6 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/65">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="lesson-next" className="scroll-mt-24">
            <SectionHead number="08" title="What to look for next." kicker="Source types, not fake citations" />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {lesson.next_sources.map((source) => (
                <div key={source.kind} className="flex items-start gap-2 border-t border-[#1A1A1A]/15 pt-3">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1A4BFF]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/65">{source.kind}</p>
                    <p className="mt-1 font-serif text-[12.5px] leading-relaxed text-[#1A1A1A]/55">{source.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 pt-5">
            <p className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
              <Compass className="h-3 w-3 text-[#1A4BFF]" /> The lesson is a map, not a verdict.
            </p>
            <a href="#deeper-lesson" className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4">
              Back to the top ↑
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
