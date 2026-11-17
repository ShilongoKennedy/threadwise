import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/lab/home")({
  head: () => ({
    meta: [
      { title: "The reading desk — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeLab,
});

const TOOLS = [
  ["01", "The Analyst", "Read a source", "What is this document doing?"],
  ["02", "Seminar", "Compare explanations", "Where do two accounts part?"],
  ["03", "The Anatomy", "Find the break", "How was this belief built?"],
] as const;

function HomeLab() {
  const [note, setNote] = useState(false);

  return (
    <div className="home-lab">
      <header className="home-nav">
        <Link to="/" className="home-brand">
          <span aria-hidden="true" />
          threadwise
        </Link>
        <span className="home-nav__meta">A reading desk / vol. 01</span>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="home-nav__enter">Enter ↗</Link>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-copy">
            <p className="home-kicker">For sources you do not trust yet.</p>
            <h1>Look past<br /><em>the story.</em></h1>
            <p className="home-lede">
              A headline is a claim. A story is a frame. Threadwise is a desk for the evidence
              underneath — the source, the gap, and the sentence that goes one step too far.
            </p>
            <div className="home-actions">
              <Link to="/analyst" className="home-cta">Put a source on the desk <span aria-hidden="true">↗</span></Link>
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="home-link">Open the IAEA sample <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="home-proof">
              <span><b>01</b> Read the move</span>
              <span><b>02</b> Keep the question</span>
              <span><b>03</b> Record what would change it</span>
            </div>
          </div>

          <aside className="home-rail">
            <p className="home-rail__label">Three instruments</p>
            <div className="home-rail__tools">
              {TOOLS.map(([n, name, note, question], index) => (
                <Link key={n} to={["/analyst", "/seminar", "/anatomy"][index]} className="home-tool">
                  <span>{n}</span>
                  <div>
                    <h2>{name}</h2>
                    <p>{note}</p>
                    <em>{question}</em>
                  </div>
                  <span className="home-tool__arrow">↗</span>
                </Link>
              ))}
            </div>
            <div className="home-rail__foot">
              <span>No infinite scroll.</span>
              <span>No verdict before the evidence.</span>
            </div>
            <span className="home-rail__seal" aria-hidden="true">read<br />carefully</span>
          </aside>
        </section>

        <section className="home-method">
          <div className="home-method__head">
            <p>The method</p>
            <h2>Three moves, not three answers.</h2>
          </div>
          <div className="home-method__rows">
            <div><span>01</span><h3>Read the move.</h3><p>Separate what happened from how the story tells it.</p></div>
            <div><span>02</span><h3>Keep the question.</h3><p>A claim can be serious without being settled.</p></div>
            <div><span>03</span><h3>Leave a test.</h3><p>Write down what would change your mind.</p></div>
          </div>
        </section>

        <section className="home-sample">
          <p className="home-kicker">From the desk / a live sample</p>
          <div className="home-sample__grid">
            <h2>“A confidential report has raised <button type="button" onClick={() => setNote((value) => !value)} className={note ? "is-open" : ""} aria-label="Open the note on the word concerns">concerns<sup>01</sup></button> about Iran’s enrichment programme.”</h2>
            <div className={`home-note ${note ? "is-open" : ""}`}>
              <p>Note 01 / the word</p>
              <p>
                “Concerns” can mean a capability, an intention, a gap in access, or a political
                judgement. The sentence does not tell us which. That is the work.
              </p>
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }}>Read the full sample ↗</Link>
            </div>
          </div>
          <p className="home-sample__hint">If a sentence sounds certain, ask what it is standing on.</p>
        </section>

        <section className="home-close">
          <p className="home-kicker">The last page</p>
          <h2>Read one thing<br /><em>properly.</em></h2>
          <div>
            <p>Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.</p>
            <Link to="/analyst" className="home-cta home-cta--dark">Start with a source <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </main>

      <footer className="home-foot">
        <span>threadwise / made for reading, not scrolling</span>
        <span>Read carefully · verify before you act</span>
        <span>Lab home · no. 01</span>
      </footer>
    </div>
  );
}
