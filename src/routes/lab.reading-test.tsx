import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/lab/reading-test")({
  head: () => ({
    meta: [
      { title: "The reading test — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReadingTest,
});

const SENTENCES = [
  {
    text: "A confidential IAEA report has raised concerns about Iran’s enrichment programme.",
    kind: "Attributed claim",
    note: "This is a claim attributed to officials. It is not the report itself.",
  },
  {
    text: "The report has not been published, and no finding from it has been quoted.",
    kind: "Fact about the record",
    note: "This tells us what is publicly available. It is checkable and narrow.",
  },
  {
    text: "The timing suggests the briefing was meant as a signal.",
    kind: "Inference",
    note: "This moves from timing to intention. It may be right, but it is not evidence.",
  },
  {
    text: "What would change the reading is a published document or a named finding.",
    kind: "Falsifier / test",
    note: "This names what would settle it. It is a test, not a finding.",
  },
] as const;

function ReadingTest() {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === 2;

  return (
    <div className="readtest-lab">
      <header className="readtest-nav">
        <Link to="/" className="readtest-brand">
          <span aria-hidden="true" />
          THREADWISE
        </Link>
        <span className="readtest-nav__center">The reading test / no. 01</span>
        <Link to="/analyst" className="readtest-enter">Skip to the desk ↗</Link>
      </header>

      <main className="readtest-main">
        <section className="readtest-exam">
          <p className="readtest-kicker">Thirty seconds / no sign-up</p>
          <h1>Which sentence is an <em>inference?</em></h1>
          <p className="readtest-lede">
            A story contains claims, facts, inferences and tests. They do different work. Read the
            four sentences and choose the one that moves beyond what is actually established.
          </p>

          <div className="readtest-sentences" role="group" aria-label="Choose the inference">
            {SENTENCES.map((sentence, index) => {
              const chosen = selected === index;
              const isAnswer = index === 2;
              const state = selected === null ? "" : chosen && isAnswer ? "is-correct" : chosen ? "is-wrong" : isAnswer ? "is-answer" : "is-dim";
              return (
                <button
                  key={sentence.text}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={`readtest-sentence ${state}`}
                  aria-pressed={chosen}
                >
                  <span className="readtest-number">0{index + 1}</span>
                  <span className="readtest-text">{sentence.text}</span>
                  {selected !== null ? <span className="readtest-kind">{sentence.kind}</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="readtest-panel" aria-live="polite">
          {selected === null ? (
            <>
              <p className="readtest-panel__eyebrow">The task</p>
              <h2>Pick the sentence that makes a leap.</h2>
              <p>
                Not the claim. Not the fact. Not the test. The sentence that quietly turns one thing
                into another.
              </p>
              <div className="readtest-rule" />
              <p className="readtest-hint">A useful reading habit: ask what each sentence is doing before asking whether you agree with it.</p>
            </>
          ) : (
            <>
              <p className="readtest-panel__eyebrow">Result / {correct ? "you found it" : "not quite"}</p>
              <h2>{correct ? "That is the inference." : "The inference is sentence 03."}</h2>
              <p className="readtest-verdict">
                {correct
                  ? "03 moves from timing to intention. It may be true, but it is not evidence."
                  : `0${selected + 1} is ${SENTENCES[selected].kind.toLowerCase()}. ${SENTENCES[selected].note}`}
              </p>
              <div className="readtest-rule" />
              <p className="readtest-explainer">
                <span>03</span> “The timing suggests the briefing was meant as a signal.” That is an
                interpretation of motive. It might be right. It still needs evidence.
              </p>
              <button type="button" className="readtest-reset" onClick={() => setSelected(null)}>
                Try it again
              </button>
              <div className="readtest-panel__actions">
                <Link to="/analyst">Try it on your own source ↗</Link>
                <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }}>Read the IAEA sample ↗</Link>
              </div>
            </>
          )}
        </aside>
      </main>

      <footer className="readtest-foot">
        <span>Threadwise / a reading desk</span>
        <span>Reading is a practice. This is one rep.</span>
        <span>No. 01 / inference</span>
      </footer>
    </div>
  );
}
