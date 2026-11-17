import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { GeoGlobe } from "@/components/record/GeoGlobe";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The index — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingLab,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const TOOLS = [
  {
    key: "analyst",
    label: "The Analyst",
    note: "Read a source",
    title: "What is this source doing?",
    body: "A link, a PDF, a screenshot. The read separates what happened from what the source wants you to think happened.",
    rows: [
      ["The move", "A confidential report is being used as a public signal before it is a public document."],
      ["What it leaves out", "The report itself is not quoted. Its date is not established."],
      ["Red team", "Argue with the read and see where the evidence pushes back."],
    ],
  },
  {
    key: "seminar",
    label: "Seminar",
    note: "Compare explanations",
    title: "Two accounts, one crux.",
    body: "The strongest version of each explanation, the mechanism that drives it, and the exact test that would separate them.",
    rows: [
      ["Theory A", "The timing was ordinary bureaucratic signalling."],
      ["Theory B", "The timing was a deliberate message to the Board."],
      ["The crux", "Whether the release was coordinated with a political decision."],
    ],
  },
  {
    key: "anatomy",
    label: "The Anatomy",
    note: "Where evidence stops",
    title: "How a belief is built.",
    body: "Trace a claim from observation to conclusion. Each rung gets a status: established, supported, contested, unsupported or unfalsifiable.",
    rows: [
      ["01 Observation", "The photograph exists and can be described."],
      ["03 Interpretation", "The headwear is read as a deliberate symbol."],
      ["04 Intention", "No document shows anyone chose it for that meaning."],
    ],
  },
] as const;

const LOOP = [
  ["01", "Read the move", "Separate what happened from the frame."],
  ["02", "Keep the questions", "File evidence for and against."],
  ["03", "Predict and score", "Date the claim. Check the calibration."],
  ["04", "Practise the gap", "Drill the falsifier you avoid."],
] as const;

const RECORD = [
  ["01", "Question", "Does a confidential report to governments count as a finding against Iran at all?", "Filed · open", "is-open"],
  ["02", "Correction", "Removed an unsupported reporting date added beyond the move.", "Patched · 01", "is-patch"],
  ["03", "Watch", "Whether the Board puts Iran on the formal agenda at its next meeting.", "Vienna · pending", "is-wait"],
] as const;

function LandingLab() {
  const [active, setActive] = useState<(typeof TOOLS)[number]["key"]>("analyst");
  const tool = TOOLS.find((item) => item.key === active) ?? TOOLS[0];

  return (
    <div className="index-lab min-h-[100dvh]">
      <AppHeader section="home" marketing />

      <main className="index-main">
        <section className="index-hero">
          <div className="index-hero__meta">
            <span>Threadwise / reading desk</span>
            <span>Vol. 01 · 2026</span>
          </div>

          <div className="index-hero__grid">
            <div className="index-hero__copy">
              <p className="index-kicker">Evidence first. Verdict later.</p>
              <h1>See what the <em>story</em> hides.</h1>
              <p className="index-lede">
                A reading desk for sources you do not trust yet. Bring a link, a PDF or a screenshot.
                Separate the event from the framing, the claim from the evidence, and the evidence
                from the verdict.
              </p>
              <div className="index-actions">
                <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="index-button index-button--light">
                  Open the IAEA read <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/analyst" className="index-button">
                  Bring your own source <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="index-caption">
                <span>No summaries.</span>
                <span>No verdicts you didn’t ask for.</span>
                <span>Free while in beta.</span>
              </div>
            </div>

            <aside className="index-console">
              <div className="index-console__top">
                <p>Three instruments</p>
                <span>01 / 03</span>
              </div>
              <div className="index-tabs" role="tablist" aria-label="Threadwise tools">
                {TOOLS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active === item.key}
                    onClick={() => setActive(item.key)}
                    className={active === item.key ? "is-active" : ""}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="index-preview" role="tabpanel">
                <p className="index-preview__label">{tool.note}</p>
                <h2>{tool.title}</h2>
                <p className="index-preview__body">{tool.body}</p>
                <div className="index-preview__rows">
                  {tool.rows.map(([label, body]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
                <Link to={active === "analyst" ? "/analyst" : active === "seminar" ? "/seminar" : "/anatomy"} className="index-preview__link">
                  Open {tool.label} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="index-console__globe">
                <GeoGlobe theme="blueprint" layout="center" minimal mobileScale={0.8} />
                <span>The record · Vienna / Tehran / Natanz</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="index-section index-method">
          <div className="index-section__head">
            <p className="index-kicker">02 / The method</p>
            <h2>What happens after the read.</h2>
            <p>A read is the beginning. The questions, predictions and corrections make it checkable later.</p>
          </div>
          <ol className="index-steps">
            {LOOP.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="index-section index-record">
          <div className="index-record__head">
            <div>
              <p className="index-kicker">03 / The record</p>
              <h2>What the read leaves behind.</h2>
            </div>
            <p>A chat window forgets. This keeps the question, the correction and the thing to watch.</p>
          </div>
          <div className="index-ledger">
            {RECORD.map(([number, label, text, meta, state]) => (
              <article key={number} className={`index-ledger__row ${state}`}>
                <span className="index-ledger__number">{number}</span>
                <span className="index-ledger__label">{label}</span>
                <p>{text}</p>
                <span className="index-ledger__meta">{meta}</span>
              </article>
            ))}
          </div>
          <div className="index-record__foot">
            <span>From the IAEA read · not a live record</span>
            <Link to="/digest">Open the record <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </section>

        <section className="index-close">
          <p className="index-kicker">04 / The last page</p>
          <div className="index-close__grid">
            <h2>Read one<br /><em>article</em> properly.</h2>
            <div>
              <p>Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.</p>
              <p>It will not tell you what to conclude. It will show you where the evidence stops.</p>
              <div className="index-actions">
                <Link to="/analyst" className="index-button index-button--light">
                  Read a source <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="index-button index-button--text">
                  Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="index-foot">
          <span className="index-wordmark">threadwise</span>
          <span>A reading desk for sources you do not trust yet.</span>
          <span>Paper prototype · not the live homepage</span>
        </footer>
      </main>
    </div>
  );
}
