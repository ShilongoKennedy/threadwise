import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/home")({
  head: () => ({
    meta: [
      { title: "The scrapbook — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaperHome,
});

const TINY_NEWS = `The report was circulated before the Board met. Officials described the briefing as a warning, while the Agency said only that concerns remained. No figure was published. No site was named. The timing of the release has become part of the story, and the document itself has not been made available. A second official said the language had been carefully limited. The question now is whether the Board will place the item on the formal agenda, and whether a public finding will follow the private one.`;

function PaperHome() {
  return (
    <div className="paperhome">
      <header className="paperhome-nav">
        <Link to="/" className="paperhome-brand">threadwise</Link>
        <span>a field book / no. 01</span>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
      </header>

      <main className="paperhome-stage">
        <div className="paperhome-clip paperhome-clip--left" aria-hidden="true">
          <p>{TINY_NEWS}</p>
        </div>
        <div className="paperhome-clip paperhome-clip--right" aria-hidden="true">
          <p>{TINY_NEWS}</p>
        </div>

        <div className="paperhome-sheet">
          <span className="paperhome-tape paperhome-tape--top" aria-hidden="true" />
          <span className="paperhome-tape paperhome-tape--side" aria-hidden="true" />
          <span className="paperhome-star paperhome-star--one" aria-hidden="true" />
          <span className="paperhome-star paperhome-star--two" aria-hidden="true" />
          <span className="paperhome-star paperhome-star--three" aria-hidden="true" />

          <div className="paperhome-content">
            <div className="paperhome-meta">
              <span>The reading desk</span>
              <span>Vol. 01 / 18.11.26</span>
            </div>

            <p className="paperhome-kicker">For the source you keep meaning to check.</p>
            <h1>Read what<br />the story is <em>hiding.</em></h1>

            <div className="paperhome-lower">
              <div>
                <p className="paperhome-lede">
                  A headline is a claim. A story is a frame. This is a desk for the source
                  underneath — the part that did not make the first paragraph.
                </p>
                <p className="paperhome-hand">not another summary. a second look.</p>
                <div className="paperhome-actions">
                  <Link to="/analyst" className="paperhome-cta">Put a source on the desk <span aria-hidden="true">↗</span></Link>
                  <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="paperhome-link">Open the IAEA sample <span aria-hidden="true">↗</span></Link>
                </div>
              </div>

              <nav className="paperhome-tools" aria-label="The three tools">
                <Link to="/analyst"><span>01</span><strong>The Analyst</strong><em>What is this source doing?</em><b aria-hidden="true">↗</b></Link>
                <Link to="/seminar"><span>02</span><strong>Seminar</strong><em>Where do two accounts part?</em><b aria-hidden="true">↗</b></Link>
                <Link to="/anatomy"><span>03</span><strong>The Anatomy</strong><em>Where does the evidence stop?</em><b aria-hidden="true">↗</b></Link>
              </nav>
            </div>
          </div>

          <span className="paperhome-stamp" aria-hidden="true">READ<br />CAREFULLY</span>
        </div>
      </main>

      <footer className="paperhome-foot">
        <span>Threadwise / made for reading, not scrolling</span>
        <span>Evidence first · verdict later</span>
      </footer>
    </div>
  );
}
