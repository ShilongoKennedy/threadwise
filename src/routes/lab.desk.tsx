import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/desk")({
  head: () => ({
    meta: [
      { title: "The desk — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeskExperiment,
});

const CLAIMS = [
  { text: "A confidential report was circulated to member states.", confidence: "high", kind: "fact" },
  { text: "The report names a specific enrichment figure.", confidence: "low", kind: "gap" },
  { text: "The timing of the briefing was intended as a signal.", confidence: "medium", kind: "inference" },
  { text: "A published finding would settle the question.", confidence: "high", kind: "test" },
];

const SOURCES = [
  { outlet: "Briefing note", date: "14 Nov", title: "The confidential circulation" },
  { outlet: "Board record", date: "12 Nov", title: "The formal agenda item" },
  { outlet: "Agency filing", date: "09 Nov", title: "The unpublished annex" },
];

function DeskExperiment() {
  return (
    <div className="desk-lab">
      <header className="desk-nav">
        <Link to="/" className="desk-brand">threadwise</Link>
        <span className="desk-nav__edition">The desk / reading 014</span>
        <nav aria-label="Lenses">
          <Link to="/analyst" data-active className="desk-lens">Analyst</Link>
          <Link to="/seminar" className="desk-lens">Seminar</Link>
          <Link to="/anatomy" className="desk-lens">Anatomy</Link>
        </nav>
        <Link to="/analyst" className="desk-nav__cta">New source <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="desk-main">
        <aside className="desk-rail desk-rail--left">
          <div className="desk-rail__block">
            <p className="desk-label">The reading</p>
            <div className="desk-lens-list">
              <Link to="/analyst" className="is-active"><span>01</span>Analyst</Link>
              <Link to="/seminar"><span>02</span>Seminar</Link>
              <Link to="/anatomy"><span>03</span>Anatomy</Link>
            </div>
          </div>

          <div className="desk-rail__block">
            <p className="desk-label">The source</p>
            <p className="desk-source-title">A confidential briefing on Iran’s enrichment programme.</p>
            <dl className="desk-meta">
              <div><dt>Bureau</dt><dd>Vienna</dd></div>
              <div><dt>Status</dt><dd>Unpublished</dd></div>
              <div><dt>Evidence</dt><dd>6 reports</dd></div>
            </dl>
          </div>

          <div className="desk-rail__block desk-rail__block--foot">
            <p className="desk-label">Reading note</p>
            <p className="desk-hand">The document is the missing exhibit.</p>
            <p className="desk-small">The read changes if the report is published.</p>
          </div>
        </aside>

        <article className="desk-read">
          <header className="desk-read__head">
            <p className="desk-kicker">The Analyst / adaptive read</p>
            <h1>the story has a source. the claim does not.</h1>
            <p className="desk-deck">
              A briefing is circulating. Its findings are not. What follows is not a summary of the
              story; it is the shape of the evidence underneath it.
            </p>
            <div className="desk-read__meta">
              <span>24 Nov 2026</span>
              <span>6 min read</span>
              <span>Analyst</span>
            </div>
          </header>

          <section className="desk-section">
            <div className="desk-section__head"><span>01</span><p>What is established</p></div>
            <p>
              A confidential report has been circulated to member states. Officials describe its
              contents as a warning. No figure, site or finding has been quoted in public. Those are
              the only facts the story actually carries.
            </p>
          </section>

          <section className="desk-section desk-section--exhibit">
            <div className="desk-section__head"><span>02</span><p>The document</p></div>
            <blockquote>
              “A confidential IAEA report has raised concerns about Iran’s enrichment programme.
              No finding from it has been quoted.”
            </blockquote>
            <div className="desk-exhibit__meta">
              <span>At second hand</span>
              <span>Not independently reviewed</span>
            </div>
            <p className="desk-exhibit__reading">
              The quote establishes that a document exists and that someone wants its existence
              known. It does not establish what the document says.
            </p>
          </section>

          <section className="desk-section">
            <div className="desk-section__head"><span>03</span><p>The sequence</p></div>
            <ol className="desk-timeline">
              <li><span>09 Nov</span><p>The annex is filed but not published.</p></li>
              <li><span>12 Nov</span><p>The item is placed on the board agenda.</p></li>
              <li><span>14 Nov</span><p>The briefing reaches member states.</p></li>
              <li><span>15 Nov</span><p>Officials describe the timing as a signal.</p></li>
            </ol>
          </section>

          <section className="desk-section desk-section--gap">
            <div className="desk-section__head"><span>04</span><p>The gap</p></div>
            <p>
              The story moves from “the report exists” to “the programme is advancing” without
              producing the sentence where the report says so. That is the seam.
            </p>
            <p className="desk-cannot"><span>cannot say · </span>Whether the finding concerns capability, intent or access.</p>
          </section>

          <section className="desk-section desk-section--test">
            <div className="desk-section__head"><span>05</span><p>The test</p></div>
            <p className="desk-test__claim">The briefings are a signal that the record has changed.</p>
            <p className="desk-test__change"><span>would change it · </span>A published annex, a named site, or a measured quantity that did not appear in the previous report.</p>
          </section>

          <footer className="desk-read__foot">
            <p>Read carefully. The source is not the story.</p>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }}>Open the live sample <span aria-hidden="true">↗</span></Link>
          </footer>
        </article>

        <aside className="desk-rail desk-rail--right">
          <div className="desk-rail__block">
            <div className="desk-label-row"><p className="desk-label">Claims</p><span>04</span></div>
            <ul className="desk-claims">
              {CLAIMS.map((claim) => (
                <li key={claim.text}>
                  <span className={`desk-dot desk-dot--${claim.confidence}`} aria-hidden="true" />
                  <div><p>{claim.text}</p><em>{claim.kind} / {claim.confidence}</em></div>
                </li>
              ))}
            </ul>
          </div>

          <div className="desk-rail__block">
            <div className="desk-label-row"><p className="desk-label">On the record</p><span>{SOURCES.length}</span></div>
            <ol className="desk-sources">
              {SOURCES.map((source) => (
                <li key={source.title}>
                  <span>{source.date}</span>
                  <p>{source.title}</p>
                  <em>{source.outlet}</em>
                </li>
              ))}
            </ol>
          </div>

          <div className="desk-rail__block">
            <p className="desk-label">Next move</p>
            <p className="desk-small">Bring a source you already distrust. The desk will find the sentence that carries the weight.</p>
            <Link to="/analyst" className="desk-rail__cta">Start a read <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
      </main>

      <footer className="desk-foot">
        <span>Threadwise / a reading desk</span>
        <span>Evidence first · verdict later</span>
        <span>Lab experiment / 01</span>
      </footer>
    </div>
  );
}
