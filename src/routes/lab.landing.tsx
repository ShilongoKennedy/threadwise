import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { GeoGlobe } from "@/components/record/GeoGlobe";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The reading room — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingLab,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const TOOLS = [
  ["01", "The Analyst", "Read a source", "What is this document doing?", "/analyst"],
  ["02", "Seminar", "Compare explanations", "Where do the two accounts part?", "/seminar"],
  ["03", "The Anatomy", "Where evidence stops", "How was this belief built?", "/anatomy"],
] as const;

const LOOP = [
  ["01", "Read the move", "Separate the event from the framing."],
  ["02", "Keep the questions", "File evidence for and against."],
  ["03", "Predict and score", "Date the claim and check it later."],
  ["04", "Practise the gap", "Drill the falsifier you avoid."],
] as const;

const RECORD = [
  ["01", "Question", "Does a confidential report to governments count as a finding against Iran at all?", "Filed · open"],
  ["02", "Correction", "Removed an unsupported reporting date added beyond the move.", "Patched"],
  ["03", "Watch", "Whether the Board puts Iran on the formal agenda at its next meeting.", "Vienna · pending"],
] as const;

function LandingLab() {
  return (
    <div className="room-lab min-h-[100dvh]">
      <AppHeader section="home" marketing />

      <main className="room-main">
        <section className="room-hero">
          <div className="room-globe" aria-hidden="true">
            <GeoGlobe theme="blueprint" layout="center" minimal mobileScale={0.9} />
          </div>

          <div className="room-hero__copy">
            <div className="room-meta">
              <span>Threadwise / reading room</span>
              <span>Vol. 01 · 2026</span>
            </div>
            <p className="room-kicker">Evidence first. Verdict later.</p>
            <h1>The story is <em>not</em> the evidence.</h1>
            <p className="room-lede">
              Threadwise reads the source, separates the claim from the frame, and shows you where
              the evidence stops. Bring a link, a PDF or a screenshot.
            </p>
            <div className="room-actions">
              <Link to="/analyst" className="room-button room-button--light">
                Read a source <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="room-button room-button--text">
                Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <nav className="room-tools" aria-label="The three tools">
              {TOOLS.map(([number, label, note, question, to]) => (
                <Link key={label} to={to} className="room-tool">
                  <span>{number}</span>
                  <span className="room-tool__name">{label}</span>
                  <span className="room-tool__note">{note}</span>
                  <span className="room-tool__question">{question}</span>
                  <ArrowUpRight className="room-tool__arrow h-3.5 w-3.5" />
                </Link>
              ))}
            </nav>
          </div>

          <aside className="room-dossier">
            <span className="room-dossier__tab" aria-hidden="true" />
            <div className="room-dossier__head">
              <p>The read / sample 001</p>
              <span>10 min</span>
            </div>
            <p className="room-dossier__kicker">Inferred · desk review corrected this read</p>
            <h2>IAEA report on Iran enrichment</h2>
            <p className="room-dossier__dateline">as of 10 Nov 2026</p>

            <div className="room-dossier__section">
              <span>01 / What it actually says</span>
              <p>
                The report raises concerns; the substance is with governments. No figure and no
                finding from the report itself is quoted.
              </p>
            </div>
            <div className="room-dossier__section">
              <span>02 / Confidence</span>
              <div className="room-meter"><i style={{ width: "38%" }} /></div>
              <p className="room-meter__label">Low <span>Inferred</span> High</p>
            </div>
            <div className="room-dossier__section">
              <span>03 / What to watch</span>
              <p>
                Whether the Board puts Iran on the formal agenda — and whether a document, not a
                briefing, appears.
              </p>
            </div>

            <blockquote>
              <mark>No figure, site or finding from the report itself has been quoted.</mark>
              <span>Closer · a claim to test</span>
            </blockquote>

            <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="room-dossier__open">
              Open the full read <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        </section>

        <section className="room-method">
          <div className="room-section-head">
            <p className="room-kicker">02 / the method</p>
            <h2>What happens after the read.</h2>
            <p>The read is the beginning. The questions, predictions and corrections make it checkable later.</p>
          </div>
          <ol className="room-steps">
            {LOOP.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="room-record">
          <div className="room-record__head">
            <div>
              <p className="room-kicker">03 / the record</p>
              <h2>What the read leaves behind.</h2>
            </div>
            <p>A chat window forgets. This keeps the question, the correction and the thing to watch.</p>
          </div>
          <div className="room-ledger">
            {RECORD.map(([number, label, text, meta]) => (
              <div className="room-ledger__row" key={number}>
                <span>{number}</span>
                <span>{label}</span>
                <p>{text}</p>
                <span>{meta}</span>
              </div>
            ))}
          </div>
          <div className="room-record__foot">
            <span>From the IAEA read · not a live record</span>
            <Link to="/digest">Open the record <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </section>

        <section className="room-close">
          <p className="room-kicker">04 / the last page</p>
          <div className="room-close__grid">
            <h2>Read one<br /><em>article</em> properly.</h2>
            <div>
              <p>Ten minutes with a source you already distrust will teach you more than a month of summaries. Start with the one you have open in another tab.</p>
              <p>It will not tell you what to conclude. It will show you where the evidence stops.</p>
              <div className="room-actions">
                <Link to="/analyst" className="room-button room-button--light">
                  Read a source <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="room-button room-button--text">
                  Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="room-foot">
          <span className="room-wordmark">threadwise</span>
          <span>A reading desk for sources you do not trust yet.</span>
          <span>Prototype · not the live homepage</span>
        </footer>
      </main>
    </div>
  );
}
