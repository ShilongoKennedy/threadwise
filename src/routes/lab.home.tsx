import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/home")({
  head: () => ({
    meta: [
      { title: "Read it like a person — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReaderHome,
});

function ReaderHome() {
  return (
    <div className="readerhome-lab">
      <header className="readerhome-nav">
        <Link to="/" className="readerhome-brand">
          <span aria-hidden="true" />
          threadwise
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="readerhome-enter">Enter the desk ↗</Link>
      </header>

      <main className="readerhome-main">
        <section className="readerhome-copy">
          <p className="readerhome-kicker">A reading desk / for the source you keep meaning to check</p>
          <h1>Read it<br />like a <em>person.</em></h1>
          <p className="readerhome-lede">
            Not like a headline. Not like a feed. Start with one source, stay with it long enough to
            see what it says, what it leaves out, and what would change your mind.
          </p>
          <p className="readerhome-note">
            I built this because I kept mistaking a confident paragraph for evidence.
          </p>
          <div className="readerhome-actions">
            <Link to="/analyst" className="readerhome-cta">Put a source on the desk <span aria-hidden="true">↗</span></Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="readerhome-link">Open the IAEA read <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="readerhome-micro">Free while in beta · no infinite scroll</p>
        </section>

        <figure className="readerhome-photo">
          <img
            src="/lab/reader.jpg"
            alt="A woman reading an open book at a wooden table"
            width={1600}
            height={2400}
          />
          <figcaption>
            <span>Fig. 01 / the reader</span>
            <a href="https://unsplash.com/photos/a-woman-sitting-at-a-table-with-an-open-book-d5ShzoPaiv4" target="_blank" rel="noreferrer">
              Priscilla Du Preez / Unsplash ↗
            </a>
          </figcaption>
        </figure>
      </main>

      <section className="readerhome-index">
        <Link to="/analyst"><span>01</span><strong>The Analyst</strong><em>What is this source doing?</em><b aria-hidden="true">↗</b></Link>
        <Link to="/seminar"><span>02</span><strong>Seminar</strong><em>Where do two accounts part?</em><b aria-hidden="true">↗</b></Link>
        <Link to="/anatomy"><span>03</span><strong>The Anatomy</strong><em>How was this belief built?</em><b aria-hidden="true">↗</b></Link>
      </section>

      <footer className="readerhome-foot">
        <span>Threadwise / made for reading, not scrolling</span>
        <span>Evidence first · verdict later</span>
      </footer>
    </div>
  );
}
