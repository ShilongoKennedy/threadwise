import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/lab/seam")({
  head: () => ({
    meta: [
      { title: "The seam — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SeamStudy,
});

function SeamStudy() {
  const [seam, setSeam] = useState(98);
  const [touched, setTouched] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const update = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setSeam(Math.max(2, Math.min(98, next)));
    setTouched(true);
  };

  return (
    <div className="seam-lab">
      <header className="seam-nav">
        <Link to="/" className="seam-brand">THREADWISE</Link>
        <span className="seam-nav__title">The seam / instrument 01</span>
        <nav aria-label="The desk">
          <Link to="/analyst">Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">Anatomy</Link>
        </nav>
        <span className="seam-nav__hint">Drag the sentence apart</span>
      </header>

      <main
        ref={stageRef}
        className="seam-stage"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button, a, input")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) update(event.clientX);
        }}
      >
        <section className="seam-layer seam-layer--record" aria-hidden={seam < 55}>
          <p className="seam-meta"><span>02</span> The record</p>
          <h1>No finding from it<br />has been quoted.</h1>
          <p className="seam-body">Six reports repeat the same fact. The document remains out of sight. Repetition is not corroboration.</p>
          <p className="seam-side">The public record</p>
        </section>

        <section
          className="seam-layer seam-layer--claim"
          style={{ clipPath: `inset(0 ${100 - seam}% 0 0)` }}
          aria-hidden={seam > 45}
        >
          <p className="seam-meta"><span>01</span> The claim</p>
          <h1>A confidential report<br />has raised concerns.</h1>
          <p className="seam-body">The briefing exists. The sentence is moving. The document is not attached.</p>
          <p className="seam-side">The supplied line</p>
        </section>

        <div className="seam-cut" style={{ left: `${seam}%` }} aria-hidden="true">
          <span className="seam-cut__top">THE SEAM</span>
          <span className="seam-cut__line" />
          <span className="seam-cut__handle">↔</span>
          <span className="seam-cut__bottom">DRAG</span>
        </div>

        <div className="seam-labels" aria-hidden="true">
          <span>Claim</span>
          <span>Record</span>
        </div>

        <p className={`seam-prompt ${touched ? "is-gone" : ""}`}>
          Drag the seam left. Read what the sentence is covering.
        </p>

        <div className={`seam-end ${seam < 18 ? "is-visible" : ""}`}>
          <span>A published annex would settle it.</span>
          <Link to="/analyst">Put the source on the desk <span aria-hidden="true">↗</span></Link>
        </div>

        <label className="seam-range">
          <span className="sr-only">Reveal the record beneath the claim</span>
          <input
            type="range"
            min="2"
            max="98"
            value={seam}
            onChange={(event) => { setSeam(Number(event.target.value)); setTouched(true); }}
            aria-label="Reveal the record beneath the claim"
          />
        </label>
      </main>

      <footer className="seam-foot">
        <span>Threadwise / a reading desk</span>
        <span>One sentence / two readings / no verdict</span>
        <span>Seam 01 / 2026</span>
      </footer>
    </div>
  );
}
