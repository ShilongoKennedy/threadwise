import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/sort")({
  head: () => ({
    meta: [
      { title: "Put it where it belongs — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SortingTable,
});

const BINS = [
  { id: "claim", label: "Claim", note: "Attributed, not established.", color: "claim" },
  { id: "record", label: "Record", note: "A checkable fact about what exists.", color: "record" },
  { id: "inference", label: "Inference", note: "A leap beyond the record.", color: "inference" },
  { id: "test", label: "Test", note: "What would settle the question.", color: "test" },
] as const;

type BinId = (typeof BINS)[number]["id"];

const ROUNDS: { text: string; answer: BinId; why: string }[] = [
  {
    text: "A confidential IAEA report has raised concerns about Iran’s enrichment programme.",
    answer: "claim",
    why: "The sentence attributes a finding to an unpublished report. The claim is real; the finding is not yet in the open.",
  },
  {
    text: "The report has not been published, and no finding from it has been quoted.",
    answer: "record",
    why: "This is checkable: what is public, what is not, and what has actually been quoted.",
  },
  {
    text: "The timing suggests the briefing was meant as a signal.",
    answer: "inference",
    why: "It moves from when the briefing happened to why it happened. That may be right; it is not evidence.",
  },
  {
    text: "A named finding or a published annex would settle the question.",
    answer: "test",
    why: "This names the observation that would change the reading. A test, not a conclusion.",
  },
];

function SortingTable() {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string; answer: BinId } | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => () => { if (timeout.current) window.clearTimeout(timeout.current); }, []);

  const place = (bin: BinId) => {
    if (feedback || done) return;
    const round = ROUNDS[step];
    const ok = round.answer === bin;
    setFeedback({ ok, text: round.why, answer: round.answer });
    if (ok) setScore((value) => value + 1);
    timeout.current = window.setTimeout(() => {
      setFeedback(null);
      if (step === ROUNDS.length - 1) setDone(true);
      else setStep((value) => value + 1);
    }, 1450);
  };

  const reset = () => {
    setStep(0);
    setScore(0);
    setDone(false);
    setFeedback(null);
  };

  const round = ROUNDS[step];

  return (
    <div className="sort-lab">
      <header className="sort-nav">
        <Link to="/" className="sort-brand">THREADWISE</Link>
        <span className="sort-nav__label">A reading exercise / sorting table</span>
        <span className="sort-nav__progress">{done ? "done" : `${String(step + 1).padStart(2, "0")} / 04`}</span>
        <Link to="/analyst" className="sort-nav__cta">Try a real source <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="sort-main">
        {!done ? (
          <>
            <div className="sort-intro">
              <p className="sort-kicker">Four sentences / four trays</p>
              <h1>Put it where it belongs.</h1>
              <p>Read the sentence. Decide what it is doing. Drag it into a tray — or tap the tray.</p>
            </div>

            <div className="sort-board">
              <div className="sort-progress" aria-hidden="true">
                {ROUNDS.map((_, index) => <span key={index} className={index < step ? "is-done" : index === step ? "is-current" : ""} />)}
              </div>

              <div className="sort-card-wrap">
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragging(true)}
                  onDragEnd={() => setDragging(false)}
                  className={`sort-card ${dragging ? "is-dragging" : ""}`}
                  aria-label={`Sentence ${step + 1}: ${round.text}. Tap a tray to classify it.`}
                >
                  <span className="sort-card__n">0{step + 1}</span>
                  <span className="sort-card__text">{round.text}</span>
                  <span className="sort-card__hint">drag it — or tap a tray</span>
                </button>
              </div>

              <div className="sort-bins" role="group" aria-label="Sort the sentence">
                {BINS.map((bin) => (
                  <button
                    key={bin.id}
                    type="button"
                    onClick={() => place(bin.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); setDragging(false); place(bin.id); }}
                    className={`sort-bin sort-bin--${bin.color} ${feedback?.answer === bin.id ? "is-answer" : ""}`}
                  >
                    <span className="sort-bin__label">{bin.label}</span>
                    <span className="sort-bin__note">{bin.note}</span>
                    <span className="sort-bin__drop">drop here</span>
                  </button>
                ))}
              </div>

              {feedback ? (
                <div className={`sort-feedback ${feedback.ok ? "is-right" : "is-wrong"}`} role="status">
                  <span>{feedback.ok ? "Yes." : "Not quite."}</span>
                  <p>{feedback.text}</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="sort-result">
            <p className="sort-kicker">The table is clear</p>
            <h1>{score === 4 ? "You read it correctly." : `You placed ${score} of 4.`}</h1>
            <p className="sort-result__deck">
              A story can contain all four moves at once. The useful reading is knowing which sentence is doing which job.
            </p>
            <ol className="sort-result__list">
              {ROUNDS.map((round, index) => (
                <li key={round.text}>
                  <span>0{index + 1}</span>
                  <p>{round.text}</p>
                  <b>{BINS.find((bin) => bin.id === round.answer)?.label}</b>
                </li>
              ))}
            </ol>
            <div className="sort-result__actions">
              <button type="button" onClick={reset}>Sort it again</button>
              <Link to="/analyst">Put a source on the desk <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        )}
      </main>

      <footer className="sort-foot">
        <span>Threadwise / a reading desk</span>
        <span>Claim · Record · Inference · Test</span>
        <span>Exercise 01</span>
      </footer>
    </div>
  );
}
