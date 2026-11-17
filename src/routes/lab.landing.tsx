import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { GeoGlobe } from "@/components/record/GeoGlobe";
import { ThreadTitle } from "@/components/threadwise/ThreadTitle";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "Landing, on paper — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingLab,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

const LOOP = [
  ["01", "Read the move", "A link, a PDF, a screenshot. The read separates what happened from what the source wants you to think happened."],
  ["02", "Keep the questions", "File evidence for and against. When a question is one-sided, the record says so instead of pretending it is settled."],
  ["03", "Predict and score", "Date a claim, come back when it resolves. The record keeps the Brier score, not only the hits."],
  ["04", "Practise the gap", "A weekly drill targets the falsifier or steelman you are weakest at, then shows whether you are improving."],
] as const;

const RECORD = [
  ["01", "Question", "Does a confidential report to governments count as a finding against Iran at all?", "Filed · open", "lime"],
  ["02", "Correction", "Removed an unsupported reporting date added beyond the move.", "Patched · 01", "red"],
  ["03", "Watch", "Whether the Board puts Iran on the formal agenda at its next meeting.", "Vienna · pending", "ink"],
] as const;

function LandingLab() {
  return (
    <div className="landing-lab min-h-[100dvh]">
      <AppHeader section="home" marketing />
      <main className="landing-paper">
        <div className="landing-paper__content">
          <section className="landing-hero">
            <div>
              <p className="landing-kicker">Threadwise / a reading desk</p>
              <ThreadTitle className="landing-thread-title" />
              <p className="landing-lede">
                A reading desk for sources you do not trust yet. Bring a link, a PDF or a screenshot.
                The desk separates the event from the framing, the claim from the evidence, and the
                evidence from the verdict.
              </p>
              <div className="landing-actions">
                <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="landing-button landing-button--dark">
                  Open the IAEA read <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/analyst" className="landing-button">
                  Bring your own source <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="landing-proof" aria-label="What the desk does">
                <span><b>01</b> Read a source</span>
                <span><b>02</b> Compare explanations</span>
                <span><b>03</b> See where evidence stops</span>
              </div>
              <p className="landing-micro">Free while in beta · sign in with Google</p>
            </div>

            <figure className="landing-specimen">
              <span className="landing-tape" aria-hidden="true" />
              <div className="landing-globe">
                <GeoGlobe theme="blueprint" layout="center" minimal mobileScale={0.9} />
              </div>
              <figcaption>
                <span>The record / live globe</span>
                <span>Vienna · Tehran · Natanz</span>
              </figcaption>
            </figure>
          </section>

          <section className="landing-method">
            <div className="landing-section-head">
              <p className="landing-kicker">The method / what happens after the read</p>
              <h2>What happens after the read.</h2>
              <p>
                A read is the beginning. The questions, predictions and corrections are what make it
                checkable later.
              </p>
            </div>
            <ol className="landing-steps">
              {LOOP.map(([number, title, body]) => (
                <li key={number}>
                  <span className="landing-step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="landing-record">
            <div className="landing-section-head">
              <p className="landing-kicker">The record / from the IAEA read</p>
              <h2>What the read leaves behind.</h2>
              <p>
                A chat window gives you an answer and forgets it. This leaves a record: the question
                the read opened, the correction it needed, and what to watch next.
              </p>
            </div>
            <div className="landing-cards">
              {RECORD.map(([number, label, text, meta, tone]) => (
                <article key={number} className={`landing-card landing-card--${tone}`}>
                  <span className="landing-tape" aria-hidden="true" />
                  <div className="landing-card__top"><span>{number}</span><span>{label}</span></div>
                  <p>{text}</p>
                  <span className="landing-card__meta">{meta}</span>
                </article>
              ))}
            </div>
            <div className="landing-record__foot">
              <span>From the IAEA read · not a live record</span>
              <Link to="/digest">Open the record <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
          </section>

          <section className="landing-close">
            <div>
              <p className="landing-kicker">The last page</p>
              <h2>Read one article properly.</h2>
              <p>
                Ten minutes with a source you already distrust will teach you more than a month of
                summaries. Start with the one you have open in another tab.
              </p>
              <p>It will not tell you what to conclude. It will show you where the evidence stops.</p>
            </div>
            <div className="landing-close__actions">
              <span className="landing-tape" aria-hidden="true" />
              <p className="landing-kicker">Start here</p>
              <Link to="/analyst" className="landing-cta">
                <span>Read a source</span><ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }} className="landing-text-link">
                Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <p className="landing-micro">Free while in beta<br />Sign in with Google</p>
            </div>
          </section>

          <footer className="landing-foot">
            <div>
              <p className="landing-wordmark">threadwise</p>
              <p>A reading desk for sources you do not trust yet.</p>
            </div>
            <div className="landing-foot__links">
              <Link to="/analyst">The analyst</Link>
              <Link to="/seminar">Seminar</Link>
              <Link to="/anatomy">The anatomy</Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }}>Sample read</Link>
            </div>
            <span className="landing-foot__note">Paper prototype · not the live homepage</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
