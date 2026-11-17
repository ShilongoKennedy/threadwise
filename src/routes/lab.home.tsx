import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/home")({
  head: () => ({
    meta: [
      { title: "The scrapbook — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScrapbookHome,
});

function ScrapbookHome() {
  return (
    <div className="scrap-lab">
      <header className="scrap-nav">
        <Link to="/" className="scrap-brand">
          <span aria-hidden="true" />
          threadwise
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="scrap-enter">Enter the desk ↗</Link>
      </header>

      <main className="scrap-main">
        <section className="scrap-copy">
          <p className="scrap-kicker">Threadwise / a reading desk</p>
          <h1>Read what<br />the story is <em>hiding.</em></h1>
          <p className="scrap-lede">
            A headline is a claim. A story is a frame. Threadwise is a desk for the source
            underneath — the part that did not make the first paragraph.
          </p>
          <p className="scrap-note">
            For the article you keep meaning to check.
          </p>
          <div className="scrap-actions">
            <Link to="/analyst" className="scrap-cta">Put a source on the desk <span aria-hidden="true">↗</span></Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="scrap-link">Open the IAEA sample <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="scrap-micro">Free while in beta · no infinite scroll</p>
        </section>

        <figure className="scrap-visual">
          <img src="/lab/scrapbook.jpg" alt="A scrapbook page with blue borders, paper scraps and stars" />
          <figcaption>
            <span>Field book / 001</span>
            <span>Keep the fragments.</span>
          </figcaption>
        </figure>
      </main>

      <nav className="scrap-index" aria-label="The three tools">
        <Link to="/analyst"><span>01</span><strong>The Analyst</strong><em>Read a source</em><b aria-hidden="true">↗</b></Link>
        <Link to="/seminar"><span>02</span><strong>Seminar</strong><em>Compare explanations</em><b aria-hidden="true">↗</b></Link>
        <Link to="/anatomy"><span>03</span><strong>The Anatomy</strong><em>Find the break</em><b aria-hidden="true">↗</b></Link>
      </nav>

      <footer className="scrap-foot">
        <span>Threadwise / made for reading, not scrolling</span>
        <span>Evidence first · verdict later</span>
      </footer>
    </div>
  );
}
