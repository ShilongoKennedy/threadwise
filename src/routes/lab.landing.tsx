import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "A live reading — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingLab,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const NOTES = [
  {
    key: "source",
    number: "01",
    label: "The source",
    title: "A report we cannot see.",
    body: "The document is confidential and has not been published. That does not make it false. It does make it a claim about a source, not a source we can inspect.",
  },
  {
    key: "signal",
    number: "02",
    label: "The move",
    title: "It is being used as a signal.",
    body: "The timing turns the briefing into a public act. The question is who is meant to receive the message — and what they are expected to do.",
  },
  {
    key: "frame",
    number: "03",
    label: "The frame",
    title: "“Concerns” is doing a lot of work.",
    body: "The word carries alarm without a measurable claim. We do not know whether it means a capability, an intention, a gap in access, or a political judgement.",
  },
  {
    key: "test",
    number: "04",
    label: "The test",
    title: "What would change the reading.",
    body: "A published document, a named site, a measurement, or a named decision-maker. Without one of those, the story remains a report about a report.",
  },
] as const;

const PRINCIPLES = [
  ["01", "Separate the event from the frame.", "What happened is not the same as how the story tells it."],
  ["02", "Keep the question open.", "A claim can be serious without being settled."],
  ["03", "Leave a record of what would change it.", "A testable claim is more useful than a confident one."],
] as const;

function LandingLab() {
  const [active, setActive] = useState<string>("source");
  const activeNote = NOTES.find((note) => note.key === active) ?? NOTES[0];

  const activate = (key: string) => setActive(key);

  return (
    <div className="markup-lab min-h-[100dvh]">
      <AppHeader section="home" marketing />

      <main className="markup-main">
        <header className="markup-hero">
          <div className="markup-hero__meta">
            <span>Threadwise / a live reading</span>
            <span>Sample 001 · 08 min</span>
          </div>
          <p className="markup-kicker">A reading desk for sources you do not trust yet.</p>
          <h1>Read the story.<br /><em>Then read what it hides.</em></h1>
          <div className="markup-hero__foot">
            <p>
              This is the desk in one page. The marks in the margin are not decoration: they are the
              questions a careful reader asks before deciding what a source proves.
            </p>
            <div className="markup-actions">
              <Link to="/analyst" className="markup-button">
                Bring your own source <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="markup-link">
                Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <section className="markup-spread" aria-label="An annotated sample reading">
          <aside className="markup-rail">
            <p>01 / The document</p>
            <span>IAEA / Iran</span>
            <span>Confidential report</span>
            <span className="markup-rail__line" />
            <p>Select a mark to read the margin.</p>
          </aside>

          <article className="markup-doc">
            <div className="markup-doc__head">
              <span>THE READ · SAMPLE</span>
              <span>10 NOV 2026</span>
            </div>
            <h2>The report is the story.</h2>
            <p className="markup-doc__byline">A confidential briefing, a public signal, and the evidence that stays out of sight.</p>

            <p>
              A confidential IAEA report circulated to member states has raised concerns about Iran’s
              enrichment programme, according to officials familiar with the matter.
            </p>
            <p>
              The report has not been published.{" "}
              <button
                type="button"
                className={`markup-mark ${active === "source" ? "is-active" : ""}`}
                onMouseEnter={() => activate("source")}
                onFocus={() => activate("source")}
                onClick={() => activate("source")}
              >
                No figure or finding from it has been quoted.<sup>01</sup>
              </button>
            </p>
            <p>
              The timing of the briefing{" "}
              <button
                type="button"
                className={`markup-mark ${active === "signal" ? "is-active" : ""}`}
                onMouseEnter={() => activate("signal")}
                onFocus={() => activate("signal")}
                onClick={() => activate("signal")}
              >
                lands inside a week of diplomatic pressure.<sup>02</sup>
              </button>{" "}
              Officials describe the report as a warning. The White House says there is no immediate
              threat.
            </p>
            <p>
              The word{" "}
              <button
                type="button"
                className={`markup-mark ${active === "frame" ? "is-active" : ""}`}
                onMouseEnter={() => activate("frame")}
                onFocus={() => activate("frame")}
                onClick={() => activate("frame")}
              >
                “concerns”<sup>03</sup>
              </button>{" "}
              carries the weight of the story. It is not a measurement, a finding, or a named
              capability. It is a judgement about what the Agency does not know.
            </p>
            <p>
              What would make the claim concrete?{" "}
              <button
                type="button"
                className={`markup-mark ${active === "test" ? "is-active" : ""}`}
                onMouseEnter={() => activate("test")}
                onFocus={() => activate("test")}
                onClick={() => activate("test")}
              >
                A published document, a named site, or a named decision.<sup>04</sup>
              </button>
            </p>
            <div className="markup-doc__foot">
              <span>From the IAEA read · not a live record</span>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }}>Read the full source <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </article>

          <aside className="markup-margin" aria-live="polite">
            <div className="markup-margin__head">
              <span>Margin</span>
              <span>{activeNote.number} / 04</span>
            </div>
            {NOTES.map((note) => (
              <article
                key={note.key}
                className={`markup-note ${active === note.key ? "is-active" : ""}`}
                onMouseEnter={() => activate(note.key)}
              >
                <button type="button" onClick={() => activate(note.key)}>
                  <span>{note.number}</span>
                  <span>{note.label}</span>
                </button>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </article>
            ))}
          </aside>
        </section>

        <section className="markup-principles">
          <div className="markup-principles__head">
            <p className="markup-kicker">02 / The standard</p>
            <h2>Three habits, not three answers.</h2>
          </div>
          <ol>
            {PRINCIPLES.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="markup-close">
          <p className="markup-kicker">03 / The last page</p>
          <h2>Read one source <em>properly.</em></h2>
          <div>
            <p>Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.</p>
            <div className="markup-actions">
              <Link to="/analyst" className="markup-button">
                Read a source <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="markup-link">
                Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="markup-foot">
          <span className="markup-wordmark">threadwise</span>
          <span>Read carefully · verify before you act</span>
          <span>Prototype · not the live homepage</span>
        </footer>
      </main>
    </div>
  );
}
