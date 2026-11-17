import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The darkroom — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Darkroom,
});

function Darkroom() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const move = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty("--light-x", `${event.clientX - rect.left}px`);
      stage.style.setProperty("--light-y", `${event.clientY - rect.top}px`);
    };
    stage.addEventListener("pointermove", move);
    return () => stage.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className={`darkroom ${revealed ? "is-revealed" : ""}`} ref={stageRef}>
      <header className="darkroom-nav">
        <Link to="/" className="darkroom-brand">
          <span aria-hidden="true" />
          THREADWISE
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="darkroom-enter">Enter the desk ↗</Link>
      </header>

      <main className="darkroom-main">
        <div className="darkroom-ghost" aria-hidden="true">
          <span>Look closer.</span>
          <span>01 / the read</span>
        </div>

        <div className="darkroom-reveal">
          <div className="darkroom-copy">
            <p className="darkroom-kicker">Threadwise / a reading desk</p>
            <h1>The story is<br /><em>not</em> the evidence.</h1>
            <p className="darkroom-lede">
              A claim arrives with a mood, a deadline and a headline. The evidence arrives later, if
              it arrives at all. Threadwise is a place to keep the two apart.
            </p>

            <div className="darkroom-specimen">
              <p className="darkroom-specimen__label">The read / specimen</p>
              <p>
                “A confidential IAEA report has raised <mark>concerns</mark> about Iran’s enrichment
                programme. No figure or finding from the report has been quoted.”
              </p>
              <span className="darkroom-margin">
                <b>↳</b> a word that sounds like a finding without being one.
              </span>
            </div>

            <div className="darkroom-actions">
              <Link to="/analyst" className="darkroom-cta">Bring a source <span aria-hidden="true">↗</span></Link>
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="darkroom-link">Read the IAEA sample ↗</Link>
            </div>
          </div>
        </div>

        <div className="darkroom-lamp" aria-hidden="true" />

        <div className="darkroom-hint">
          <span>Move the light to read.</span>
          <button type="button" onClick={() => setRevealed((value) => !value)}>
            {revealed ? "Back to the dark" : "Show everything"}
          </button>
        </div>

        <Link to="/analyst" className="darkroom-quick">Put a source on the desk <span aria-hidden="true">↗</span></Link>

        <span className="darkroom-coord darkroom-coord--a">48.2N / 16.4E</span>
        <span className="darkroom-coord darkroom-coord--b">look / again</span>
      </main>

      <footer className="darkroom-foot">
        <span>Threadwise / evidence first. Verdict later.</span>
        <span>read carefully · verify before you act</span>
      </footer>
    </div>
  );
}
