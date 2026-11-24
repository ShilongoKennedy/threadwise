import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/lab/signal")({
  head: () => ({
    meta: [
      { title: "Signal — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignalStudy,
});

const WIRE = [
  {
    text: "A confidential report has raised concerns.",
    source: "The move / supplied briefing",
    kind: "The claim",
    note: "The sentence names a report and a mood. It does not quote a finding.",
    gap: "No figure, site or sentence from the document is public.",
    test: "A published annex would turn the claim into a finding.",
  },
  {
    text: "The report has not been published.",
    source: "The record / publication status",
    kind: "The record",
    note: "This is checkable. It is also the whole reason the story has room to move.",
    gap: "What the report says cannot be independently tested yet.",
    test: "Publication, or a named finding quoted on the record.",
  },
  {
    text: "No finding from it has been quoted.",
    source: "The record / attribution",
    kind: "The gap",
    note: "The story can describe the document without producing its central sentence.",
    gap: "‘Concerns’ is doing the work of a finding without being one.",
    test: "A direct quote, a figure, or a named site.",
  },
  {
    text: "The timing has become the story.",
    source: "The sequence / interpretation",
    kind: "The inference",
    note: "When a briefing happens is observable. Why it happened is an interpretation of motive.",
    gap: "Intent has not been established by the reporting.",
    test: "An actor saying the timing was deliberate.",
  },
  {
    text: "A published annex would settle it.",
    source: "The test / falsifier",
    kind: "The test",
    note: "This names the observation that would change the reading. A test, not a verdict.",
    gap: "Until then, ‘the record does not say’ is the honest position.",
    test: "Publish the annex.",
  },
] as const;

function SignalStudy() {
  const [live, setLive] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % WIRE.length), 4200);
    return () => window.clearInterval(timer);
  }, [live]);

  const current = WIRE[index];

  return (
    <div className="signal-lab">
      <header className="signal-nav">
        <Link to="/" className="signal-brand">THREADWISE / SIGNAL</Link>
        <span className="signal-nav__status"><i aria-hidden="true" /> {live ? "on air" : "frozen"}</span>
        <span className="signal-nav__channel">CH 01 / THE ANALYST</span>
        <Link to="/analyst" className="signal-nav__enter">New transmission <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="signal-main">
        <div className="signal-stripe signal-stripe--left" aria-hidden="true" />
        <div className="signal-stripe signal-stripe--right" aria-hidden="true" />
        <div className="signal-scan" aria-hidden="true" />
        <div className="signal-noise" aria-hidden="true" />

        <div className="signal-topline">
          <span>{live ? "LIVE READING" : "FRAME HELD"}</span>
          <span>{String(index + 1).padStart(2, "0")} / 05</span>
          <span>{current.source}</span>
        </div>

        <section className="signal-now" aria-live="polite">
          <p className="signal-kind">{current.kind}</p>
          <h1>{current.text}</h1>
          <div className="signal-rule" />
          <div className="signal-controls">
            <button type="button" onClick={() => setLive((value) => !value)} className="signal-freeze">
              {live ? "Freeze the sentence" : "Resume the wire"}
              <span aria-hidden="true">{live ? "■" : "▶"}</span>
            </button>
            <div className="signal-dots" aria-hidden="true">
              {WIRE.map((_, dot) => <span key={dot} className={dot === index ? "is-current" : ""} />)}
            </div>
          </div>
        </section>

        {!live ? (
          <section className="signal-lower" aria-live="polite">
            <div className="signal-lower__head">
              <span>Lower third / the read</span>
              <span>{current.kind}</span>
            </div>
            <div className="signal-lower__grid">
              <div><p>What is here</p><span>{current.note}</span></div>
              <div><p>The gap</p><span>{current.gap}</span></div>
              <div><p>The test</p><span>{current.test}</span></div>
            </div>
          </section>
        ) : null}

        <div className="signal-ticker" aria-hidden="true">
          <div>
            <span>THE WIRE / </span>
            {WIRE.map((item) => <span key={item.text}>{item.text} · </span>)}
            <span>THE WIRE / </span>
            {WIRE.map((item) => <span key={`${item.text}-repeat`}>{item.text} · </span>)}
          </div>
        </div>
      </main>

      <footer className="signal-foot">
        <span>Threadwise / a reading desk</span>
        <span>Freeze the sentence. Read the frame.</span>
        <span>Signal 01 / 2026</span>
      </footer>
    </div>
  );
}
