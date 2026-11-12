import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/experiment")({
  head: () => ({
    meta: [
      { title: "Threadwise — A thinking instrument" },
      {
        name: "description",
        content:
          "Every story has a load-bearing claim. Threadwise finds it, tests it, and keeps the receipt.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperimentPage,
});

const NOTES = [
  {
    n: "01",
    label: "The claim",
    line: "Aid buys influence.",
    detail:
      "That is the sentence underneath the story. Not “the aid was generous” and not “the aid was cynical.” The claim is that the money changes behaviour.",
  },
  {
    n: "02",
    label: "The assumption",
    line: "The money changes the vote.",
    detail:
      "This assumes the partner has something the donor wants, can sell it without paying a domestic price, and cannot get the same money elsewhere.",
  },
  {
    n: "03",
    label: "The falsifier",
    line: "Aid rises. Votes do not move.",
    detail:
      "Compare the partner with similar countries that received no aid. If the votes move just the same, the causal claim is in trouble — whatever the minister intended.",
  },
] as const;

const LOOP = [
  {
    n: "01",
    title: "Read the move",
    body: "What happened, who carries the cost, and what the source wants you to feel. One link, one PDF, one screenshot.",
    cta: "Bring a source",
    to: "/analyst",
  },
  {
    n: "02",
    title: "Put it on trial",
    body: "Two steelmanned theories. One crux. Commit before the verdict. The seminar does not tell you what is good; it shows what would settle it.",
    cta: "Open the seminar",
    to: "/seminar",
  },
  {
    n: "03",
    title: "Keep the receipt",
    body: "Claims, questions, predictions, corrections. Score the misses, not only the hits. The record is where thinking becomes visible.",
    cta: "See the record",
    to: "/digest",
  },
] as const;

function ExperimentPage() {
  const [activeNote, setActiveNote] = useState(0);

  return (
    <div className="lab-root min-h-[100dvh]">
      <style>{`
        .lab-root {
          --ink: #0B0A09;
          --bone: #E8DFCF;
          --oxide: #9E3D2C;
          --dim: #AFA492;
          background: var(--ink);
          color: var(--bone);
        }
        .lab-serif {
          font-family: "Bodoni 72", Didot, "Times New Roman", serif;
          font-weight: 400;
          letter-spacing: -0.035em;
        }
        .lab-sans {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .lab-mono {
          font-family: "Courier New", Courier, monospace;
        }
        .lab-grain {
          position: relative;
        }
        .lab-grain::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image: radial-gradient(rgba(232, 223, 207, 0.35) 0.5px, transparent 0.5px);
          background-size: 4px 4px;
          mix-blend-mode: soft-light;
        }
        .lab-bone {
          background: var(--bone);
          color: var(--ink);
        }
        .lab-oxide {
          background: var(--oxide);
          color: var(--bone);
        }
        .lab-hairline {
          background: rgba(232, 223, 207, 0.18);
        }
        .lab-hairline-dark {
          background: rgba(11, 10, 9, 0.18);
        }
        .lab-underline {
          background-image: linear-gradient(var(--oxide), var(--oxide));
          background-repeat: no-repeat;
          background-position: 0 96%;
          background-size: 100% 2px;
        }
        .lab-note {
          transition: background-color 160ms ease, color 160ms ease, padding 160ms ease;
        }
        .lab-note:hover {
          background: rgba(158, 61, 44, 0.08);
        }
        .lab-note[aria-expanded="true"] {
          background: var(--ink);
          color: var(--bone);
        }
        .lab-note[aria-expanded="true"] .lab-note-dim {
          color: rgba(232, 223, 207, 0.55);
        }
        .lab-link {
          text-decoration-color: var(--oxide);
          text-decoration-thickness: 2px;
          text-underline-offset: 5px;
        }
        .lab-link:hover {
          color: var(--oxide);
        }
        .lab-focus:focus-visible {
          outline: 2px solid var(--oxide);
          outline-offset: 4px;
        }
        ::selection {
          background: var(--oxide);
          color: var(--bone);
        }
        @media (max-width: 768px) {
          .lab-grain::before { opacity: 0.1; }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-[#E8DFCF]/15 bg-[#0B0A09]/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link to="/" className="lab-sans flex items-baseline gap-3">
            <span className="text-[13px] font-semibold tracking-[0.22em]">THREADWISE</span>
            <span className="lab-mono hidden text-[8px] uppercase tracking-[0.15em] text-[#E8DFCF]/35 sm:inline">
              a thinking instrument
            </span>
          </Link>
          <nav className="lab-mono hidden items-center gap-7 text-[9px] uppercase tracking-[0.15em] text-[#E8DFCF]/55 md:flex">
            <Link to="/analyst" className="hover:text-[#E8DFCF]">Read</Link>
            <Link to="/seminar" className="hover:text-[#E8DFCF]">Seminar</Link>
            <Link to="/workspace" className="hover:text-[#E8DFCF]">Workspace</Link>
          </nav>
          <Link
            to="/analyst"
            className="lab-focus lab-mono border border-[#E8DFCF]/40 px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#E8DFCF] transition-colors hover:border-[#E8DFCF] hover:bg-[#E8DFCF] hover:text-[#0B0A09]"
          >
            Begin →
          </Link>
        </div>
      </header>

      <main>
        <section className="lab-grain grid min-h-[calc(100svh-61px)] border-b border-[#E8DFCF]/15 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative flex flex-col justify-between px-5 py-10 md:px-10 md:py-12 lg:px-14 lg:py-12">
            <div className="flex flex-wrap items-center gap-3">
              <span className="lab-mono border border-[#E8DFCF]/25 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-[#E8DFCF]/60">
                Essay 01 / the load-bearing claim
              </span>
              <span className="lab-mono text-[8px] uppercase tracking-[0.14em] text-[#E8DFCF]/30">
                Politics / power / evidence
              </span>
            </div>

            <div className="my-10 lg:my-0">
              <h1 className="lab-serif text-[64px] leading-[0.84] sm:text-[88px] lg:text-[104px] min-[1400px]:text-[122px]">
                Every
                <br />
                story has
                <br />
                a load-
                <br />
                bearing
                <br />
                claim.
              </h1>
              <p className="lab-sans mt-7 max-w-[43ch] text-[16px] leading-[1.45] text-[#E8DFCF]/70 md:text-[17px]">
                Threadwise finds the sentence a story cannot survive without — then tests it against
                the record. Not the framing. Not the mood. The claim underneath.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  to="/analyst"
                  className="lab-focus lab-mono bg-[#E8DFCF] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#0B0A09] transition-colors hover:bg-[#9E3D2C] hover:text-[#E8DFCF]"
                >
                  Bring a source →
                </Link>
                <Link
                  to="/seminar"
                  className="lab-focus lab-mono lab-link px-1 py-3 text-[10px] uppercase tracking-[0.13em] text-[#E8DFCF]/75"
                >
                  Put a quote on trial ↗
                </Link>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-[#E8DFCF]/15 pt-4">
              <div className="lab-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-[#E8DFCF]/35">
                Read
                <br />
                Question
                <br />
                Predict
              </div>
              <p className="lab-mono max-w-[22ch] text-right text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#E8DFCF]/35">
                A record of what you believed before you knew
              </p>
            </div>
          </div>

          <aside className="relative flex flex-col justify-between overflow-hidden bg-[#E8DFCF] px-5 py-10 text-[#0B0A09] md:px-10 md:py-14 lg:px-12 lg:py-16">
            <div className="lab-serif pointer-events-none absolute -right-3 -top-10 text-[180px] leading-none text-[#9E3D2C]/10 md:text-[240px]">
              01
            </div>
            <div className="relative">
              <p className="lab-mono text-[9px] uppercase tracking-[0.16em] text-[#0B0A09]/45">
                A claim in the wild / 2026
              </p>
              <blockquote className="lab-serif mt-6 max-w-[15ch] text-[34px] leading-[1.02] md:text-[44px] lg:text-[48px]">
                “Sometimes you want to bribe a country to get your way.”
              </blockquote>
              <p className="lab-mono mt-5 text-[8px] uppercase tracking-[0.12em] text-[#0B0A09]/40">
                A podcast conversation / not a confession
              </p>
              <div className="mt-8 border-t border-[#0B0A09]/20 pt-4">
                <p className="lab-sans max-w-[34ch] text-[14px] leading-[1.5] text-[#0B0A09]/65">
                  Strip the euphemism and a theory of politics appears. The useful question is not
                  whether the sentence is rude. It is whether it is true.
                </p>
                <p className="lab-serif mt-10 max-w-[13ch] text-[26px] leading-[1.02] text-[#9E3D2C]">
                  What would have to be true?
                </p>
              </div>
            </div>
            <div className="relative mt-8 border-t border-[#0B0A09]/20 pt-3">
              <p className="lab-mono text-[8px] uppercase tracking-[0.14em] text-[#0B0A09]/35">
                The notes
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {NOTES.map((note) => (
                  <span key={note.n} className="lab-mono text-[8px] uppercase tracking-[0.08em] text-[#0B0A09]/55">
                    {note.n} {note.label}
                  </span>
                ))}
              </div>
              <Link
                to="/seminar"
                className="lab-focus lab-mono mt-4 inline-block border-b-2 border-[#9E3D2C] pb-1 text-[9px] uppercase tracking-[0.12em] text-[#0B0A09] hover:text-[#9E3D2C]"
              >
                Put this on the seminar table →
              </Link>
            </div>
          </aside>
        </section>

        <section className="lab-bone px-5 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[#0B0A09]/20 pt-3">
              <p className="lab-mono text-[9px] uppercase tracking-[0.16em] text-[#0B0A09]/55">
                02 / A read, annotated
              </p>
              <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#0B0A09]/35">
                Hypothetical / for scale
              </p>
            </div>

            <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-20">
              <div>
                <h2 className="lab-serif max-w-[17ch] text-[38px] leading-[1.03] md:text-[54px]">
                  A government sends <span className="lab-underline">$1.2bn</span> in aid to a
                  partner. The minister calls it development. Critics call it a bribe.
                </h2>
                <p className="lab-mono mt-6 text-[8px] uppercase tracking-[0.12em] text-[#0B0A09]/35">
                  The claim is not the quote. The claim is what the quote asks you to believe.
                </p>
                <div className="mt-12 border-t border-[#0B0A09]/20 pt-4">
                  <p className="lab-sans max-w-[52ch] text-[14px] leading-[1.6] text-[#0B0A09]/60">
                    A read separates what happened from what it wants you to feel. It names the
                    mechanism, the people who carry the cost, and the observation that would make
                    the whole account fall apart.
                  </p>
                  <Link
                    to="/analyst"
                    className="lab-focus lab-mono mt-5 inline-block border-b-2 border-[#9E3D2C] pb-1 text-[9px] uppercase tracking-[0.12em] text-[#0B0A09] hover:text-[#9E3D2C]"
                  >
                    See a full read →
                  </Link>
                </div>
              </div>

              <div>
                <p className="lab-mono text-[8px] uppercase tracking-[0.14em] text-[#0B0A09]/35">
                  Open the claim / three notes
                </p>
                <div className="mt-3">
                  {NOTES.map((note, index) => {
                    const active = activeNote === index;
                    return (
                      <div key={note.n} className="border-t border-[#0B0A09]/20">
                        <button
                          type="button"
                          aria-expanded={active}
                          onClick={() => setActiveNote(index)}
                          className={`lab-note lab-focus flex w-full items-start gap-4 px-3 py-4 text-left ${
                            active ? "my-1" : ""
                          }`}
                        >
                          <span className={`lab-mono mt-1 text-[9px] ${active ? "text-[#E8DFCF]/55" : "text-[#9E3D2C]"}`}>
                            {note.n}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`lab-mono block text-[8px] uppercase tracking-[0.14em] ${active ? "text-[#E8DFCF]/55" : "text-[#0B0A09]/40"}`}>
                              {note.label}
                            </span>
                            <span className="lab-serif mt-1 block text-[24px] leading-[1.05] md:text-[28px]">
                              {note.line}
                            </span>
                            {active && (
                              <span className="lab-sans mt-3 block max-w-[42ch] text-[13px] leading-[1.55] text-[#E8DFCF]/70">
                                {note.detail}
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                  <div className="border-t border-[#0B0A09]/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lab-grain px-5 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[#E8DFCF]/20 pt-3">
              <p className="lab-mono text-[9px] uppercase tracking-[0.16em] text-[#E8DFCF]/50">
                03 / The loop
              </p>
              <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/30">
                One loop / three moves
              </p>
            </div>

            <h2 className="lab-serif mt-8 max-w-[12ch] text-[54px] leading-[0.9] md:text-[82px]">
              Read.
              <br />
              Doubt.
              <br />
              Decide.
            </h2>

            <div className="mt-10 grid border-t border-[#E8DFCF]/20 md:grid-cols-3">
              {LOOP.map((step, index) => (
                <article
                  key={step.n}
                  className={`py-6 md:px-7 md:py-8 ${index > 0 ? "border-t border-[#E8DFCF]/15 md:border-l md:border-t-0" : "md:pl-0"}`}
                >
                  <p className="lab-serif text-[48px] leading-none text-[#9E3D2C]">{step.n}</p>
                  <h3 className="lab-serif mt-4 text-[27px] leading-none">{step.title}</h3>
                  <p className="lab-sans mt-3 max-w-[34ch] text-[13px] leading-[1.55] text-[#E8DFCF]/60">
                    {step.body}
                  </p>
                  <Link
                    to={step.to}
                    className="lab-focus lab-mono mt-5 inline-block border-b border-[#9E3D2C] pb-1 text-[9px] uppercase tracking-[0.12em] text-[#E8DFCF] hover:text-[#E8DFCF]/60"
                  >
                    {step.cta} →
                  </Link>
                </article>
              ))}
            </div>

            <p className="lab-serif mt-12 max-w-[24ch] text-[28px] leading-[1.08] text-[#E8DFCF]/70 md:ml-[33%] md:text-[38px]">
              The record is not what you remember. It is what you said would happen.
            </p>
          </div>
        </section>

        <section className="lab-oxide px-5 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <div>
              <p className="lab-mono text-[9px] uppercase tracking-[0.16em] text-[#E8DFCF]/55">
                04 / The record
              </p>
              <p className="lab-serif mt-4 text-[56px] leading-[0.86] md:text-[76px]">
                The
                <br />
                receipt.
              </p>
              <p className="lab-mono mt-6 max-w-[28ch] text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#E8DFCF]/40">
                When the argument is over, the record is the only part that can be checked.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#E8DFCF]/25 pt-3">
                <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/45">
                  One claim, dated
                </p>
                <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/35">
                  Sample record
                </p>
              </div>
              <p className="lab-serif mt-3 text-[34px] leading-[1.05] md:text-[44px]">
                “Aid buys influence.”
              </p>

              <div className="mt-8 border-t border-[#E8DFCF]/25">
                {[
                  ["Filed", "09 November 2026"],
                  ["Falsifier", "Aid rises. Votes do not move."],
                  ["Status", "Open."],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[90px_minmax(0,1fr)] items-baseline gap-4 border-b border-[#E8DFCF]/20 py-3">
                    <span className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/40">
                      {label}
                    </span>
                    <span className="lab-sans text-[14px] leading-[1.4] text-[#E8DFCF]/85">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/digest"
                className="lab-focus lab-mono mt-6 inline-block border-b-2 border-[#E8DFCF] pb-1 text-[9px] uppercase tracking-[0.12em] text-[#E8DFCF] hover:text-[#E8DFCF]/60"
              >
                Open the record →
              </Link>
            </div>
          </div>
        </section>

        <section className="lab-bone px-5 py-16 md:px-10 md:py-24 lg:px-14">
          <div className="mx-auto w-full max-w-[1440px]">
            <p className="lab-mono border-t border-[#0B0A09]/20 pt-3 text-[9px] uppercase tracking-[0.16em] text-[#0B0A09]/45">
              05 / Begin
            </p>
            <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-end md:gap-16">
              <h2 className="lab-serif text-[64px] leading-[0.82] md:text-[104px] lg:text-[124px]">
                Bring me
                <br />a claim.
              </h2>
              <div>
                <p className="lab-sans max-w-[32ch] text-[14px] leading-[1.55] text-[#0B0A09]/65">
                  A link, a quote, a PDF, a sentence you cannot stop turning over. Start with the
                  thing that made you suspicious.
                </p>
                <Link
                  to="/analyst"
                  className="lab-focus lab-mono mt-6 inline-flex bg-[#0B0A09] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#E8DFCF] transition-colors hover:bg-[#9E3D2C]"
                >
                  Bring a source →
                </Link>
                <Link
                  to="/seminar"
                  className="lab-focus lab-mono lab-link mt-3 block text-[9px] uppercase tracking-[0.12em] text-[#0B0A09]/60"
                >
                  Or put a quote on trial ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8DFCF]/15 px-5 py-6 md:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <p className="lab-mono text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/35">
            Threadwise / a thinking instrument / experiment 01
          </p>
          <div className="lab-mono flex gap-5 text-[8px] uppercase tracking-[0.12em] text-[#E8DFCF]/40">
            <Link to="/" className="hover:text-[#E8DFCF]">Current site</Link>
            <Link to="/seminar" className="hover:text-[#E8DFCF]">Seminar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
