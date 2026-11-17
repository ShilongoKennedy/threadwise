import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "Follow the thread — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadHero,
});

function ThreadHero() {
  return (
    <div className="thread-hero">
      <header className="thread-nav">
        <Link to="/" className="thread-brand">
          <span aria-hidden="true" />
          THREADWISE
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="thread-enter">Enter the desk <ArrowUpRight className="h-3 w-3" /></Link>
      </header>

      <main className="thread-main">
        <section className="thread-copy">
          <p className="thread-kicker">Threadwise / a reading desk</p>
          <h1>Follow the <em>thread.</em></h1>
          <p className="thread-lede">
            Every claim starts somewhere. Threadwise follows it from the first appearance to the
            evidence — and shows you where the trail stops.
          </p>
          <div className="thread-actions">
            <Link to="/analyst" className="thread-cta">
              Bring a source <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="thread-link">
              Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="thread-key">
            <span><b>01</b> Read the move</span>
            <span><b>02</b> Compare explanations</span>
            <span><b>03</b> See where evidence stops</span>
          </div>
        </section>

        <figure className="thread-art">
          <div className="thread-art__field">
            <svg viewBox="0 0 680 680" aria-hidden="true">
              <defs>
                <clipPath id="thread-disc">
                  <circle cx="350" cy="340" r="208" />
                </clipPath>
              </defs>
              <circle cx="350" cy="340" r="260" fill="none" stroke="rgba(244,240,230,0.18)" strokeWidth="1" />
              <circle cx="350" cy="340" r="288" fill="none" stroke="rgba(244,240,230,0.1)" strokeWidth="1" strokeDasharray="2 13" />
              <circle cx="350" cy="340" r="208" fill="#121027" />
              <g clipPath="url(#thread-disc)" fill="none">
                <path d="M120 344 C165 174 300 130 410 202 C520 274 548 408 438 486 C328 564 194 496 214 394 C234 294 354 252 424 326 C490 396 428 486 350 466" stroke="#C8FF3D" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M120 344 C165 174 300 130 410 202 C520 274 548 408 438 486 C328 564 194 496 214 394 C234 294 354 252 424 326 C490 396 428 486 350 466" stroke="#F4F0E6" strokeWidth="1" strokeDasharray="1 15" opacity="0.65" />
              </g>
              <path d="M120 344 C165 174 300 130 410 202 C520 274 548 408 438 486 C328 564 194 496 214 394 C234 294 354 252 424 326 C490 396 428 486 350 466" fill="none" stroke="#C8FF3D" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="120" cy="344" r="8" fill="#C8FF3D" />
              <circle cx="350" cy="466" r="7" fill="#C8FF3D" />
              <circle cx="350" cy="340" r="3" fill="#F4F0E6" opacity="0.9" />
              <path d="M350 54v32M350 594v32M64 340h32M604 340h32" stroke="rgba(244,240,230,0.32)" strokeWidth="1" />
            </svg>
          </div>
          <figcaption>
            <span>01 / The Analyst</span>
            <span>02 / Seminar</span>
            <span>03 / Anatomy</span>
          </figcaption>
          <div className="thread-label thread-label--a"><b>01</b> Read a source</div>
          <div className="thread-label thread-label--b"><b>02</b> Compare explanations</div>
          <div className="thread-label thread-label--c"><b>03</b> Find the break</div>
        </figure>
      </main>

      <footer className="thread-foot">
        <span>Evidence first. Verdict later.</span>
        <span className="thread-foot__mark" aria-hidden="true">✦</span>
        <span>Read carefully / verify before you act</span>
      </footer>
    </div>
  );
}
