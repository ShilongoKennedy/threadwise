import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { GeoGlobe } from "@/components/record/GeoGlobe";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The reading desk — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingLab,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const TOOLS = [
  {
    key: "analyst",
    label: "Analyst",
    title: "What is this source doing?",
    note: "Read a source",
    body: "The read separates what happened from what the source wants you to think happened.",
    rows: [
      ["The move", "A confidential report becomes a public signal before it is a public document."],
      ["Leaves out", "The report is not quoted. Its date is not established."],
      ["Red team", "Argue with the read. See where the evidence pushes back."],
    ],
  },
  {
    key: "seminar",
    label: "Seminar",
    title: "Two accounts, one crux.",
    note: "Compare explanations",
    body: "The strongest version of each explanation, the mechanism behind it, and the test that separates them.",
    rows: [
      ["Theory A", "The timing was ordinary bureaucratic signalling."],
      ["Theory B", "The timing was a deliberate message to the Board."],
      ["The crux", "Whether the release was coordinated with a political decision."],
    ],
  },
  {
    key: "anatomy",
    label: "Anatomy",
    title: "How a belief is built.",
    note: "Where evidence stops",
    body: "Trace a claim from observation to conclusion. Each rung gets an explicit evidence status.",
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
  ["01", "Question", "Does a confidential report to governments count as a finding against Iran at all?", "Filed · open"],
  ["02", "Correction", "Removed an unsupported reporting date added beyond the move.", "Patched · 01"],
  ["03", "Watch", "Whether the Board puts Iran on the formal agenda at its next meeting.", "Vienna · pending"],
] as const;

function LandingLab() {
  const [active, setActive] = useState<(typeof TOOLS)[number]["key"]>("analyst");
  const tool = TOOLS.find((item) => item.key === active) ?? TOOLS[0];

  return (
    <div className="desk-lab min-h-[100dvh]">
      <AppHeader section="home" marketing />

      <main className="desk-main">
        <section className="desk-hero">
          <article className="desk-letter">
            <img className="desk-clip desk-clip--letter" src="/paper-clip.svg" alt="" aria-hidden="true" />
            <p className="desk-kicker">Threadwise / a reading desk · vol. 01</p>
            <h1>See what the <em>story</em> hides.</h1>
            <p className="desk-lede">
              A reading desk for sources you do not trust yet. Bring a link, a PDF or a screenshot.
              Separate the event from the framing, the claim from the evidence, and the evidence
              from the verdict.
            </p>
            <div className="desk-actions">
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="desk-button desk-button--dark">
                Open the IAEA read <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/analyst" className="desk-button">
                Bring your own source <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="desk-proof">
              <span><b>01</b> Read a source</span>
              <span><b>02</b> Compare explanations</span>
              <span><b>03</b> See where evidence stops</span>
            </div>
            <span className="desk-stamp" aria-hidden="true">READ<br />CAREFULLY</span>
          </article>

          <aside className="desk-tools">
            <span className="desk-tab" aria-hidden="true" />
            <div className="desk-tools__head">
              <p>Three instruments</p>
              <span>Field kit</span>
            </div>
            <div className="desk-tabs" role="tablist" aria-label="Threadwise tools">
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
            <div className="desk-preview" role="tabpanel">
              <p className="desk-preview__note">{tool.note}</p>
              <h2>{tool.title}</h2>
              <p className="desk-preview__body">{tool.body}</p>
              <div className="desk-preview__rows">
                {tool.rows.map(([label, text]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <Link to={active === "analyst" ? "/analyst" : active === "seminar" ? "/seminar" : "/anatomy"} className="desk-preview__link">
                Open {tool.label} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="desk-globe">
              <GeoGlobe theme="blueprint" layout="center" minimal mobileScale={0.8} />
              <span>Vienna / Tehran / Natanz</span>
            </div>
          </aside>

          <img className="desk-pen" src="/desk-pen.svg" alt="" aria-hidden="true" />
          <span className="desk-ruler" aria-hidden="true" />
        </section>

        <section className="desk-method">
          <div className="desk-section-head">
            <p className="desk-kicker">02 / the method</p>
            <h2>What happens after the read.</h2>
            <p>A read is the beginning. The questions, predictions and corrections make it checkable later.</p>
          </div>
          <div className="desk-index-grid">
            {LOOP.map(([number, title, body], index) => (
              <article key={number} className={`desk-index-card desk-index-card--${index + 1}`}>
                <img className="desk-clip desk-clip--card" src="/paper-clip.svg" alt="" aria-hidden="true" />
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="desk-record">
          <div className="desk-section-head desk-record__head">
            <div>
              <p className="desk-kicker">03 / the record</p>
              <h2>What the read leaves behind.</h2>
            </div>
            <p>A chat window forgets. This keeps the question, the correction and the thing to watch.</p>
          </div>
          <div className="desk-ledger">
            <img className="desk-clip desk-clip--ledger" src="/paper-clip.svg" alt="" aria-hidden="true" />
            <div className="desk-ledger__head">
              <span>No.</span><span>Entry</span><span>Record</span><span>State</span>
            </div>
            {RECORD.map(([number, label, text, meta]) => (
              <div className="desk-ledger__row" key={number}>
                <span>{number}</span>
                <span>{label}</span>
                <p>{text}</p>
                <span>{meta}</span>
              </div>
            ))}
            <div className="desk-ledger__foot">
              <span>From the IAEA read · not a live record</span>
              <Link to="/digest">Open the record <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
        </section>

        <section className="desk-close">
          <div className="desk-section-head">
            <p className="desk-kicker">04 / the last page</p>
            <h2>Read one <em>article</em> properly.</h2>
            <p>Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.</p>
            <p>It will not tell you what to conclude. It will show you where the evidence stops.</p>
          </div>
          <aside className="desk-close-card">
            <img className="desk-clip desk-clip--close" src="/paper-clip.svg" alt="" aria-hidden="true" />
            <p className="desk-kicker">Start here</p>
            <Link to="/analyst" className="desk-close-link">
              <span>Read a source</span><ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="desk-secondary-link">
              Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <p className="desk-fine">Free while in beta<br />Sign in with Google</p>
          </aside>
        </section>

        <footer className="desk-foot">
          <span className="desk-wordmark">threadwise</span>
          <span>A reading desk for sources you do not trust yet.</span>
          <span>Paper prototype · not the live homepage</span>
        </footer>
      </main>
    </div>
  );
}
