import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/manifesto")({
  head: () => ({
    meta: [
      { title: "A reading manifesto — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Manifesto,
});

const PANELS = [
  {
    n: "01",
    label: "The claim",
    title: <>The story is<br /><em>not</em> the evidence.</>,
    body: "A claim arrives with a mood, a deadline and a headline. The evidence arrives later, if it arrives at all. Keep them apart.",
    tone: "ink",
  },
  {
    n: "02",
    label: "The source",
    title: <>The headline is<br /><em>not</em> the source.</>,
    body: "A summary is a description of a description. Start with the thing itself, then decide what the summary left out.",
    tone: "paper",
  },
  {
    n: "03",
    label: "The proof",
    title: <>Confidence is<br /><em>not</em> proof.</>,
    body: "Certainty is a tone. Evidence is a trail. The useful question is not how sure someone sounds, but what they can show.",
    tone: "cobalt",
  },
  {
    n: "04",
    label: "The verdict",
    title: <>A question is<br /><em>not</em> a verdict.</>,
    body: "You can hold a question open without being indecisive. Naming what would settle it is more honest than pretending it is settled.",
    tone: "acid",
  },
  {
    n: "05",
    label: "The practice",
    title: <>Read one thing<br /><em>properly.</em></>,
    body: "Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.",
    tone: "forest",
  },
] as const;

function Manifesto() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const panels = Array.from(scroller.querySelectorAll<HTMLElement>(".manifesto-panel"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = panels.indexOf(visible.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      { root: scroller, threshold: [0.4, 0.6, 0.8] },
    );
    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  const current = PANELS[active];

  return (
    <div className="manifesto-lab">
      <header className="manifesto-nav">
        <Link to="/" className="manifesto-brand">threadwise</Link>
        <span className="manifesto-nav__label">A reading manifesto / 2026</span>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="manifesto-enter">Enter ↗</Link>
      </header>

      <div className="manifesto-scroll" ref={scrollerRef}>
        {PANELS.map((panel, index) => (
          <section key={panel.n} className={`manifesto-panel tone-${panel.tone}`}>
            <div className="manifesto-panel__grid">
              <div className="manifesto-panel__head">
                <p>{panel.label}</p>
                <span>{panel.n} / 05</span>
              </div>
              <div className="manifesto-panel__copy">
                <h1>{panel.title}</h1>
                <p>{panel.body}</p>
                {index === 0 ? (
                  <span className="manifesto-scrollhint">Scroll to read on ↓</span>
                ) : null}
                {index === PANELS.length - 1 ? (
                  <div className="manifesto-actions">
                    <Link to="/analyst">Put a source on the desk <span aria-hidden="true">↗</span></Link>
                    <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }}>Read the IAEA sample <span aria-hidden="true">↗</span></Link>
                  </div>
                ) : null}
              </div>
              <span className="manifesto-ghost" aria-hidden="true">{panel.n}</span>
            </div>
          </section>
        ))}
      </div>

      <aside className="manifesto-index" aria-hidden="true">
        <div className="manifesto-index__count"><span>{current.n}</span><span>/ 05</span></div>
        <div className="manifesto-index__lines">
          {PANELS.map((panel, index) => (
            <span key={panel.n} className={index === active ? "is-active" : ""} />
          ))}
        </div>
        <span className="manifesto-index__label">{current.label}</span>
      </aside>

      <span className="manifesto-corner">Evidence first / verdict later</span>
    </div>
  );
}
