import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type PointerEvent } from "react";

export const Route = createFileRoute("/lab/loom")({
  head: () => ({
    meta: [
      { title: "The loom — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoomStudy,
});

function LoomStudy() {
  const [reveal, setReveal] = useState(0.18);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    setReveal(Math.max(0.04, Math.min(1, (event.clientX - rect.left) / rect.width)));
  };

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    setDragging(true);
    stage.current?.setPointerCapture(event.pointerId);
    move(event);
  };

  return (
    <div className="loom-lab">
      <header className="loom-nav">
        <Link to="/" className="loom-brand">THREADWISE</Link>
        <span className="loom-nav__note">A reading desk / thread study 01</span>
        <nav aria-label="The desk">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">Anatomy</Link>
        </nav>
        <Link to="/analyst" className="loom-nav__enter">Enter the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main
        ref={stage}
        className={`loom-stage ${dragging ? "is-dragging" : ""}`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <div className="loom-frame loom-frame--left" aria-hidden="true" />
        <div className="loom-frame loom-frame--right" aria-hidden="true" />
        <div className="loom-hem loom-hem--top" aria-hidden="true" />
        <div className="loom-hem loom-hem--bottom" aria-hidden="true" />
        <div className="loom-warp" aria-hidden="true" />
        <div className="loom-weft" aria-hidden="true" style={{ width: `${reveal * 100}%` }} />
        <div className="loom-thread" aria-hidden="true" style={{ width: `${reveal * 100}%` }} />

        <div className="loom-copy">
          <p className="loom-kicker">A reading desk / the first thread</p>
          <h1>A claim is not<br />a finding.</h1>
          <p className="loom-body">
            A claim arrives with a mood, a deadline and a headline. The evidence arrives later,
            if it arrives at all. Pull the shuttle across the cloth and read what the story is
            actually made of.
          </p>
          <p className="loom-hand">Keep the two apart.</p>
        </div>

        <div className="loom-reading" style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
          <p className="loom-reading__label">The weft / the sentence underneath</p>
          <p className="loom-reading__quote">“A confidential report has raised concerns. No finding from it has been quoted.”</p>
          <p className="loom-reading__source">A claim, not a finding — the line the story is standing on.</p>
        </div>

        <div className="loom-shuttle" style={{ left: `${reveal * 100}%` }} aria-hidden="true">
          <span className="loom-shuttle__body" />
          <span className="loom-shuttle__handle" />
          <span className="loom-shuttle__label">pull</span>
        </div>

        <div className="loom-reveal" style={{ left: `${reveal * 100}%` }} aria-hidden="true" />

        <div className="loom-instruction">
          <span>Drag the shuttle to lay the weft</span>
          <span>{Math.round(reveal * 100)} / 100 woven</span>
        </div>

        {reveal > 0.94 ? (
          <div className="loom-finished">
            <p>The cloth is complete. Now bring a source.</p>
            <Link to="/analyst">Put a source on the desk <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <button type="button" className="loom-complete" onClick={() => setReveal(1)}>
            Weave it all <span aria-hidden="true">→</span>
          </button>
        )}
      </main>

      <footer className="loom-foot">
        <span>Threadwise / a reading desk</span>
        <span>Evidence first / verdict later</span>
        <span>Cloth 01 / 2026</span>
      </footer>
    </div>
  );
}
