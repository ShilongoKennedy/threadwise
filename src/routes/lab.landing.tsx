import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "A working note — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkingNote,
});

function WorkingNote() {
  return (
    <div className="letter-lab">
      <header className="letter-nav">
        <Link to="/" className="letter-brand">threadwise</Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <span className="letter-date">a working note · 18.11.26</span>
      </header>

      <main className="letter-main">
        <article className="letter-note">
          <p className="letter-kicker">A working note / on reading</p>
          <h1>A note from<br />the desk.</h1>
          <p className="letter-salutation">Dear reader,</p>
          <p className="letter-body">
            I built Threadwise because I kept mistaking a confident paragraph for evidence. A story
            can be vivid, urgent and beautifully written, and still leave the important thing out.
          </p>
          <p className="letter-body">
            So this is a small reading desk, not an answer machine. Bring a source. Work out what it
            says, what it leaves out, and what would change your mind. Then keep the questions
            somewhere you can find them again.
          </p>
          <p className="letter-body">
            It will not tell you what to think. It will show you where the thinking is thin.
          </p>
          <p className="letter-ps">
            <em>P.S.</em> If a sentence sounds certain, ask what it is standing on.
          </p>
          <div className="letter-actions">
            <Link to="/analyst" className="letter-cta">Start with one source <span aria-hidden="true">↗</span></Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="letter-link">or read the IAEA sample first <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="letter-sign">— threadwise</p>
        </article>

        <aside className="letter-band" aria-label="A note for the reader">
          <span className="letter-band__index">01 / the habit</span>
          <div className="letter-band__words">
            <span>Read</span>
            <span>one</span>
            <span>thing</span>
            <span>properly.</span>
          </div>
          <div className="letter-band__foot">
            <span>no infinite scroll</span>
            <span>no verdict before the evidence</span>
          </div>
          <span className="letter-band__seal" aria-hidden="true">✓</span>
        </aside>
      </main>

      <footer className="letter-index">
        <Link to="/analyst"><b>01</b><span>The Analyst</span><em>read a source</em></Link>
        <Link to="/seminar"><b>02</b><span>Seminar</span><em>compare explanations</em></Link>
        <Link to="/anatomy"><b>03</b><span>The Anatomy</span><em>find the break</em></Link>
        <span className="letter-index__end">read carefully · verify before you act</span>
      </footer>
    </div>
  );
}
