import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "Case 001 — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CaseFile,
});

const EVIDENCE = [
  {
    n: "01",
    label: "The claim",
    short: "A report raises concerns.",
    note: "A claim attributed to officials is not the same as a finding in the document.",
  },
  {
    n: "02",
    label: "The gap",
    short: "No figure. No finding. No document.",
    note: "The report is confidential and unpublished. That is a fact about the record, not proof of what it says.",
  },
  {
    n: "03",
    label: "The inference",
    short: "The timing means intent.",
    note: "Moving from when a briefing happened to why it happened is an interpretation of motive.",
  },
  {
    n: "04",
    label: "The test",
    short: "Publish the document.",
    note: "A named finding, a measured figure or a published document would change the reading.",
  },
] as const;

function CaseFile() {
  const [active, setActive] = useState(0);
  const evidence = EVIDENCE[active];

  return (
    <div className="case-lab">
      <header className="case-nav">
        <Link to="/" className="case-brand"><span aria-hidden="true" />THREADWISE</Link>
        <span className="case-nav__file">Field bureau / case 001 / 18.11.26</span>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
      </header>

      <main className="case-main">
        <section className="case-folder">
          <span className="case-folder__tab">CONFIDENTIAL / READING FILE</span>
          <span className="case-clip" aria-hidden="true" />
          <article className="case-sheet">
            <div className="case-sheet__meta">
              <span>Bureau / Vienna</span>
              <span>Case 001</span>
              <span>Status: open</span>
            </div>
            <p className="case-kicker">The IAEA briefing / a document we cannot see</p>
            <h1>A report no one<br />can read.</h1>
            <p className="case-dek">
              A confidential briefing has raised concerns about Iran’s enrichment programme. The
              document itself remains out of sight. That gap is the story.
            </p>
            <div className="case-body">
              <p>
                A confidential IAEA report circulated to member states has raised concerns about
                Iran’s enrichment programme, according to officials familiar with the matter.
              </p>
              <p>
                The report has not been published. No figure, site or finding from it has been
                quoted. The White House says there is no immediate threat.
              </p>
              <p>
                The timing has turned the briefing into a public signal. What the Agency actually
                knows — and what it only suspects — remains behind the seal.
              </p>
            </div>
            <blockquote>“A report about a report is not yet evidence of a new capability.”</blockquote>
            <div className="case-sheet__foot">
              <span>Source: confidential · not independently reviewed</span>
              <span>File 001 / page 1</span>
            </div>
            <span className="case-stamp" aria-hidden="true">UNVERIFIED</span>
          </article>
        </section>

        <aside className="case-board">
          <div className="case-board__head">
            <p>Evidence board</p>
            <span>04 items / 01 thread</span>
          </div>
          <div className="case-evidence">
            {EVIDENCE.map((item, index) => (
              <button
                key={item.n}
                type="button"
                onClick={() => setActive(index)}
                className={`case-evidence__item ${active === index ? "is-active" : ""}`}
              >
                <span className="case-pin" aria-hidden="true" />
                <span className="case-evidence__n">{item.n}</span>
                <span className="case-evidence__label">{item.label}</span>
                <span className="case-evidence__short">{item.short}</span>
              </button>
            ))}
          </div>
          <div className="case-note">
            <p className="case-note__label">The note / {evidence.n}</p>
            <p>{evidence.note}</p>
          </div>
          <div className="case-board__foot">
            <span className="case-thread-label">follow the thread →</span>
            <Link to="/analyst">Start your own case <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
      </main>

      <footer className="case-foot">
        <span>Threadwise / a reading desk</span>
        <span>Read the claim. Keep the gap.</span>
        <span>Case 001 / open</span>
      </footer>
    </div>
  );
}
