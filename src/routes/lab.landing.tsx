import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The Threadwise Dispatch — lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Broadsheet,
});

const SAMPLE_TOKEN = "mn4qvf4bhu";

function HalftoneGlobe() {
  return (
    <svg viewBox="0 0 420 300" role="img" aria-label="Halftone globe showing Vienna, Tehran and Natanz">
      <defs>
        <pattern id="news-dots" width="5.4" height="5.4" patternUnits="userSpaceOnUse">
          <circle cx="2.7" cy="2.7" r="1.45" fill="#191d23" />
        </pattern>
        <clipPath id="news-globe-clip">
          <circle cx="210" cy="148" r="103" />
        </clipPath>
      </defs>
      <rect width="420" height="300" fill="#ece9df" />
      <g clipPath="url(#news-globe-clip)">
        <rect x="100" y="40" width="220" height="220" fill="url(#news-dots)" />
        <g fill="none" stroke="#ece9df" strokeWidth="4">
          <ellipse cx="210" cy="148" rx="103" ry="30" />
          <ellipse cx="210" cy="148" rx="75" ry="98" />
          <ellipse cx="210" cy="148" rx="38" ry="101" />
          <path d="M107 148 H313" />
          <path d="M118 103 H302" />
          <path d="M118 193 H302" />
        </g>
      </g>
      <circle cx="210" cy="148" r="103" fill="none" stroke="#191d23" strokeWidth="2" />
      <g fill="#191d23" stroke="#ece9df" strokeWidth="2">
        <circle cx="202" cy="102" r="5" />
        <circle cx="236" cy="139" r="5" />
        <circle cx="218" cy="172" r="5" />
      </g>
      <g fill="#191d23" fontFamily="DM Mono, monospace" fontSize="8" letterSpacing="1">
        <text x="275" y="90">VIENNA</text>
        <text x="284" y="138">TEHRAN</text>
        <text x="260" y="190">NATANZ</text>
      </g>
    </svg>
  );
}

function Broadsheet() {
  return (
    <div className="dispatch-stage">
      <div className="dispatch-paper">
        <header className="dispatch-top">
          <nav aria-label="Primary">
            <Link to="/analyst">The Analyst</Link>
            <Link to="/seminar">Seminar</Link>
            <Link to="/anatomy">The Anatomy</Link>
            <Link to="/digest">Record</Link>
          </nav>
          <span>Demonstration edition</span>
          <Link to="/login">Sign in</Link>
        </header>

        <header className="dispatch-masthead">
          <div className="dispatch-masthead__meta">
            <span>Vol. I · No. 1</span>
            <span>Wednesday, 18 November 2026</span>
            <span>Price: one careful read</span>
          </div>
          <h1>The Threadwise Dispatch</h1>
          <p>“Read the evidence, not just the framing.”</p>
        </header>

        <div className="dispatch-rule dispatch-rule--double" />

        <section className="dispatch-lead">
          <article>
            <p className="dispatch-kicker">The read / Iran</p>
            <h2>A report no one<br />can read.</h2>
            <p className="dispatch-deck">
              A confidential IAEA briefing has raised concerns about Iran’s enrichment programme.
              The document itself remains out of sight — and that gap is the story.
            </p>
            <p className="dispatch-byline">From the Reading Desk · Vienna · 10 November 2026</p>
            <div className="dispatch-body dispatch-body--columns">
              <p className="dispatch-dropcap">
                A confidential IAEA report circulated to member states has raised concerns about
                Iran’s enrichment programme, according to officials familiar with the matter. The
                report has not been published. No figure, site or finding from it has been quoted.
              </p>
              <p>
                Officials describe the briefing as a warning about capability and intent. The White
                House says there is no immediate threat to the homeland. Both statements can be true
                at once. Neither is a substitute for the document.
              </p>
              <p>
                The timing has turned the briefing into a public act. It lands inside a week of
                diplomatic pressure, after a public reward for information and new sanctions. The
                question is not only what the report says, but who is meant to hear it.
              </p>
              <p>
                The word “concerns” carries the weight of the story. It is not a measurement, a
                finding or a named capability. It is a judgement about what the Agency does not know
                — and about what governments are prepared to do with that uncertainty.
              </p>
            </div>
            <blockquote className="dispatch-pull">
              “A report about a report is not yet evidence of a new capability.”
            </blockquote>
          </article>

          <aside className="dispatch-leadside">
            <figure className="dispatch-photo">
              <HalftoneGlobe />
              <figcaption>
                <span>Wirephoto / the record</span>
                <span>Vienna · Tehran · Natanz</span>
              </figcaption>
            </figure>

            <div className="dispatch-box">
              <p className="dispatch-box__label">The crux</p>
              <p className="dispatch-box__title">Was the timing a message?</p>
              <p>
                If the briefing was coordinated with a political decision, the release is part of
                the pressure campaign. If it was routine, the leak is the story.
              </p>
            </div>

            <div className="dispatch-box dispatch-box--dark">
              <p className="dispatch-box__label">What to watch</p>
              <p className="dispatch-box__title">A document, not a briefing.</p>
              <p>
                Whether the Board puts Iran on the formal agenda, and whether a published finding
                follows the anonymous one.
              </p>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }}>
                Read the full report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </section>

        <div className="dispatch-rule" />

        <section className="dispatch-lower">
          <article>
            <p className="dispatch-kicker">The move</p>
            <h3>The briefing is the message.</h3>
            <p>
              A confidential assessment becomes consequential the moment officials describe it in
              public. The timing is not a detail; it is part of the argument. The leaker, the
              briefers and the officials who confirm the briefing are all shaping what the public
              can do with it.
            </p>
            <p>
              That does not make the concern invented. It makes the concern mediated. A serious
              claim can arrive through a political channel and still be serious.
            </p>
          </article>
          <article>
            <p className="dispatch-kicker">The language</p>
            <h3>What “concerns” leaves out.</h3>
            <p>
              A concern can describe a capability, an intention, a gap in access or a political
              judgement. The sentence does not tell us which. Without that distinction, readers
              supply the missing certainty themselves.
            </p>
            <p>
              The strongest correction is not “nothing happened.” It is “we do not yet know what
              happened, and here is what would tell us.”
            </p>
          </article>
          <article>
            <p className="dispatch-kicker">The test</p>
            <h3>What would change the reading.</h3>
            <ul>
              <li>A published document, not a briefing.</li>
              <li>A named site and a measurable finding.</li>
              <li>A named decision-maker and an order.</li>
              <li>A clear move from options to an operational plan.</li>
            </ul>
            <p>
              Until one of those appears, the claim is about a report. It is not yet a finding.
            </p>
          </article>
        </section>

        <div className="dispatch-rule dispatch-rule--ornament">
          <span>◆</span>
        </div>

        <section className="dispatch-bottom">
          <div className="dispatch-questions">
            <p className="dispatch-kicker">The margin / three questions</p>
            <h3>Before the Board meets.</h3>
            <ol>
              <li><span>01</span> Is the briefing a decision, a warning, or an option?</li>
              <li><span>02</span> Who receives the message — Tehran, the Board, or the public?</li>
              <li><span>03</span> What would the Agency need to see to change its language?</li>
            </ol>
          </div>

          <aside className="dispatch-ad">
            <p className="dispatch-ad__top">The Reading Desk</p>
            <h3>Read the source.<br />Keep the questions.</h3>
            <p>
              Bring a link, a PDF or a screenshot. Leave with the framing, the evidence and the
              questions the source cannot answer.
            </p>
            <div className="dispatch-ad__actions">
              <Link to="/analyst">Bring a source <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              <Link to="/read/$token" params={{ token: SAMPLE_TOKEN }}>Open the IAEA read <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            <p className="dispatch-ad__small">Threadwise · free while in beta · sign in with Google</p>
          </aside>
        </section>

        <footer className="dispatch-foot">
          <span>The Threadwise Dispatch · demonstration edition</span>
          <span>Built from the IAEA sample read · not a live news report</span>
          <span>Page 1</span>
        </footer>
      </div>
    </div>
  );
}
