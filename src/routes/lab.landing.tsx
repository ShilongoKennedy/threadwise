import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "A note to self — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NoteLanding,
});

function NoteLanding() {
  return (
    <div className="note-lab">
      <header className="note-nav">
        <Link to="/" className="note-brand">
          <span className="note-brand__thread" aria-hidden="true" />
          threadwise
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <span className="note-nav__aside">a reading desk</span>
      </header>

      <main className="note-main">
        <section className="note-copy">
          <p className="note-kicker">For the source you keep meaning to check.</p>
          <h1>
            You don’t have to <span className="note-underline">believe</span><br />
            everything you read.
          </h1>
          <p className="note-lede">
            Start with one source. Work out what it says, what it leaves out, and what would change
            your mind. That’s it. No infinite scroll.
          </p>
          <div className="note-actions">
            <Link to="/analyst" className="note-cta">Put a source on the desk <span aria-hidden="true">↗</span></Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="note-link">or read the IAEA one first <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="note-small">Free while in beta · bring a link, a PDF, or a screenshot.</p>
        </section>

        <aside className="note-collage" aria-label="A note about reading">
          <div className="note-sheet">
            <span className="note-tape" aria-hidden="true" />
            <p className="note-hand">a note to self</p>
            <p className="note-strike"><s>read everything</s></p>
            <p className="note-sheet__line">read one thing properly.</p>
            <div className="note-rule" />
            <ol className="note-list">
              <li>what the story says</li>
              <li>what it leaves out</li>
              <li>what would change it</li>
            </ol>
            <span className="note-stamp" aria-hidden="true">READ<br />SLOWLY</span>
          </div>

          <div className="note-blue">
            <p>“The point is not to have an opinion. The point is to know what the evidence supports.”</p>
            <span>— the desk</span>
          </div>

          <span className="note-margin">the rest is noise.</span>
        </aside>
      </main>

      <footer className="note-foot">
        <span>threadwise / made for reading, not scrolling</span>
        <span>read carefully · verify before you act</span>
      </footer>
    </div>
  );
}
