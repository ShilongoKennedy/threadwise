import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, BookOpen, Check } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";

export const Route = createFileRoute("/lab/paper")({
  head: () => ({
    meta: [
      { title: "Paper reading — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaperLab,
});

const CONTENTS = [
  ["the-event", "The event"],
  ["the-disagreement", "The disagreement"],
  ["the-spin", "The spin"],
  ["the-reality", "The reality"],
  ["the-blind-spot", "The blind spot"],
  ["what-to-watch", "What to watch"],
  ["who-gains", "Who gains, who pays"],
  ["what-it-echoes", "What it echoes"],
  ["what-would-prove", "What would prove this wrong"],
  ["the-signals", "The signals"],
  ["what-this-rests-on", "What this rests on"],
] as const;

function PaperLab() {
  const [read, setRead] = useState<Set<string>>(new Set(["the-event", "the-disagreement", "the-spin", "the-reality"]));
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleRead = (id: string) => {
    setRead((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="paper-lab min-h-[100dvh]">
      <AppHeader section="analyst" />
      <main className="paper-lab__main">
        <aside className="paper-contents">
          <p className="paper-contents__label">Contents</p>
          <p className="paper-contents__count">{read.size} / {CONTENTS.length} read</p>
          <div className="paper-contents__bar"><span style={{ width: `${(read.size / CONTENTS.length) * 100}%` }} /></div>
          <ol>
            {CONTENTS.map(([id, label], index) => (
              <li key={id}>
                <button type="button" onClick={() => toggleRead(id)} className={`paper-contents__check ${read.has(id) ? "is-read" : ""}`} aria-label={`Mark ${label} as read`}>
                  {read.has(id) ? <Check className="h-3 w-3" /> : null}
                </button>
                <a href={`#${id}`} className={read.has(id) ? "is-read" : ""}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <div className="paper-contents__foot">
            <p>Paper prototype</p>
            <span>11 sections · one sheet</span>
            <Link to="/seminar">← Live Seminar</Link>
          </div>
        </aside>

        <article className="paper-sheet">
          <div className="paper-spiral" aria-hidden="true">
            {Array.from({ length: 80 }).map((_, index) => <span key={index} />)}
          </div>
          <div className="paper-sheet__content">
            <header className="paper-head">
              <p className="paper-kicker">The read · field note 001</p>
              <h1>Analysis: US intel on Iran — a dirty bomb plot?</h1>
              <p className="paper-draft">Draft — 17 Nov 2026</p>
            </header>

            <section id="the-event">
              <h2><span>1.</span> What we know <em>(high confidence)</em></h2>
              <ul>
                <li>Seven US officials told CNN that US intelligence indicates Iran is planning options that could include a dirty bomb or chemical attack in Washington.</li>
                <li>The sources frame this as <mark>planning and scenario work</mark>, not an imminent attack.</li>
                <li>The White House says there is <mark className="mark-cool">no credible, immediate threat</mark> to the homeland.</li>
              </ul>
              <p className="paper-note">Note: the same reporting contains its own brake. Keep both halves.</p>
            </section>

            <section id="the-disagreement">
              <h2><span>2.</span> The disagreement</h2>
              <p>The fight is not “is Iran dangerous?” The fight is what this reporting actually establishes.</p>
              <div className="paper-two">
                <p><strong>Reading A</strong> — planning options is normal coercive signalling. The leak is the story, not the plot.</p>
                <p><strong>Reading B</strong> — a named Washington target changes the threshold. Even contingency planning requires a response.</p>
              </div>
            </section>

            <section id="the-spin">
              <h2><span>3.</span> The spin</h2>
              <p>The headline compresses “options,” “planning” and “attack” into one word. That compression is doing more work than the intelligence.</p>
              <p className="paper-note">A leak is also a move. Ask who chose the word “plot”.</p>
            </section>

            <section id="the-reality">
              <h2><span>4.</span> The reality</h2>
              <p>What is actually established: unnamed officials describe intelligence assessments, and the White House denies an immediate threat. What is not established: that an operation is ordered, funded, or close.</p>
            </section>

            <section id="the-blind-spot">
              <h2><span>5.</span> The blind spot</h2>
              <p>We have not seen the underlying intelligence. We do not know whether the planning is <strong>directive</strong> (a decision) or <strong>exploratory</strong> (a range of options). The credibility and independence of the sources cannot be fully verified.</p>
            </section>

            <section id="what-to-watch">
              <h2><span>6.</span> What it suggests</h2>
              <ul>
                <li>Iran appears to be exploring <mark>asymmetric options</mark> to increase pressure on the US.</li>
                <li>The timing suggests a <mark>political and diplomatic signal</mark>, not a ready operation.</li>
                <li>The leak itself may be part of a pressure strategy by the US administration.</li>
              </ul>
            </section>

            <section id="who-gains">
              <h2><span>7.</span> Who gains, who pays</h2>
              <div className="paper-two">
                <p><strong>Gains</strong> — officials who want a harder line get a vivid Washington-target story.</p>
                <p><strong>Pays</strong> — the public gets fear before it gets evidence; diplomacy gets less room.</p>
              </div>
            </section>

            <section id="what-it-echoes">
              <h2><span>8.</span> What it echoes</h2>
              <p>Pre-war intelligence leaks, “mushroom cloud” framing, and the recurring pattern of anonymous officials arriving before documents. The echo is a warning, not a proof.</p>
            </section>

            <section id="what-would-prove">
              <h2><span>9.</span> What would prove this wrong</h2>
              <p>Contemporaneous intelligence showing the planning was exploratory; no movement of materials or people; a statement from the sources that the “plot” was not operational; or a White House correction that goes beyond “no immediate threat.”</p>
            </section>

            <section id="the-signals">
              <h2><span>10.</span> The signals</h2>
              <ul className="paper-checks">
                {["New, verifiable intelligence", "Changes in US or Iranian official statements", "Concrete indicators of operational preparation"].map((label, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setChecked((current) => {
                        const next = new Set(current);
                        if (next.has(index)) next.delete(index);
                        else next.add(index);
                        return next;
                      })}
                      className={checked.has(index) ? "is-checked" : ""}
                      aria-pressed={checked.has(index)}
                    >
                      {checked.has(index) ? <Check className="h-3 w-3" /> : null}
                    </button>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="paper-red">→ What to watch next</p>
            </section>

            <section id="what-this-rests-on">
              <h2><span>11.</span> What this rests on</h2>
              <p>CNN reporting; anonymous US officials; the public White House statement. Read the original documents if they appear. Nothing here is an independent confirmation of the underlying intelligence.</p>
            </section>

            <footer className="paper-foot">
              <span>Threadwise / paper prototype</span>
              <span>01 — 11</span>
              <span>Not a live record</span>
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
