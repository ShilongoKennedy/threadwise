import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/experiment")({
  head: () => ({
    meta: [
      { title: "Threadwise — Field Test 01" },
      {
        name: "description",
        content:
          "A thinking instrument for claims that arrive with a story attached. Read the move, not the mood.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperimentPage,
});

const OPTIONS = [
  { key: "A", text: "The donor calls the aid “unconditional” in a press release." },
  {
    key: "B",
    text: "The partner’s UN votes move toward the donor, compared with similar countries that received no aid.",
  },
  { key: "C", text: "The partner’s GDP grows by 2% the following year." },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Read the move",
    body: "What actually happened, who carries the cost, and what the source wants you to feel. One link, one PDF, one screenshot.",
    cta: "Bring a source",
    to: "/analyst",
  },
  {
    n: "02",
    title: "Argue both ways",
    body: "Two steelmanned theories, one crux. Commit before the verdict. The seminar does not tell you what is good; it shows you what would settle it.",
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
  const [answer, setAnswer] = useState<"A" | "B" | "C" | null>(null);
  const correct = answer === "B";

  return (
    <div className="exp-paper exp-sans min-h-[100dvh] text-[#141414]">
      <style>{`
        .exp-paper {
          background-color: #F1E8D8;
          background-image:
            radial-gradient(rgba(20,20,20,0.09) 0.55px, transparent 0.55px),
            linear-gradient(90deg, transparent 49.8%, rgba(20,20,20,0.035) 50%, transparent 50.2%);
          background-size: 5px 5px, 100% 100%;
        }
        .exp-sans { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .exp-mono { font-family: "Courier New", Courier, monospace; }
        .exp-display {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-weight: 800;
          letter-spacing: -0.065em;
          line-height: 0.84;
          text-transform: uppercase;
        }
        .exp-stamp {
          display: inline-block;
          transform: rotate(-2.5deg);
          border: 2px solid currentColor;
          padding: 3px 7px 2px;
          font-family: "Courier New", Courier, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .exp-mark {
          position: absolute;
          width: 15px;
          height: 15px;
          border-color: rgba(20,20,20,0.45);
        }
        .exp-mark::before,
        .exp-mark::after {
          content: "";
          position: absolute;
          background: rgba(20,20,20,0.45);
        }
        .exp-mark::before { width: 1px; height: 21px; left: 7px; top: -3px; }
        .exp-mark::after { height: 1px; width: 21px; top: 7px; left: -3px; }
        .exp-option {
          transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
        }
        .exp-option:hover { background: #F8F2E6; }
        .exp-option:active { transform: translateY(1px); }
        ::selection { background: #F2D64B; color: #141414; }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-white/20 bg-[#141414] text-[#F7F0E2]">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-[14px] font-extrabold tracking-[0.14em]">THREADWISE</span>
            <span className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#F2D64B]">
              / field test 01
            </span>
          </Link>
          <nav className="hidden items-center gap-6 exp-mono text-[9px] uppercase tracking-[0.14em] text-[#F7F0E2]/55 md:flex">
            <Link to="/analyst" className="hover:text-[#F2D64B]">The analyst</Link>
            <Link to="/seminar" className="hover:text-[#F2D64B]">The seminar</Link>
            <Link to="/workspace" className="hover:text-[#F2D64B]">Workspace</Link>
          </nav>
          <Link
            to="/analyst"
            className="bg-[#F0442E] px-3 py-2 exp-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white hover:bg-[#F2D64B] hover:text-[#141414]"
          >
            Start a read →
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto w-full max-w-[1280px] px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-20">
          <span className="exp-mark left-5 top-10 hidden md:block md:left-8" />
          <span className="exp-mark right-5 top-10 hidden md:block md:right-8" />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 exp-mono text-[9px] uppercase tracking-[0.14em]">
            <span className="border border-[#141414] bg-[#F2D64B] px-2 py-1">A design experiment</span>
            <span className="text-[#141414]/45">Not the product you know</span>
          </div>

          <div className="mt-7 grid gap-10 md:grid-cols-[minmax(0,1fr)_220px] md:gap-16">
            <div>
              <h1 className="exp-display text-[64px] sm:text-[92px] lg:text-[128px]">
                Read the
                <br />
                move.
                <br />
                Not the
                <br />
                <span className="bg-[#F2D64B] px-2">mood.</span>
              </h1>
              <p className="mt-7 max-w-[48ch] text-[17px] leading-[1.4] text-[#141414]/75 md:text-[19px]">
                A thinking instrument for claims that arrive with a story attached. Bring a link, a
                quote or a question. Leave with the machinery, the questions, and the one fact that
                would prove it wrong.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/analyst"
                  className="inline-flex items-center border-2 border-[#141414] bg-[#141414] px-4 py-3 exp-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F7F0E2] hover:border-[#F0442E] hover:bg-[#F0442E]"
                >
                  Bring a source →
                </Link>
                <Link
                  to="/seminar"
                  className="inline-flex items-center px-1 py-3 exp-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#141414] underline decoration-[#F0442E] decoration-2 underline-offset-4 hover:text-[#F0442E]"
                >
                  Open the seminar ↗
                </Link>
              </div>
            </div>

            <aside className="relative border-t border-[#141414]/25 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#141414]/45">
                Field note / 01
              </p>
              <p className="mt-3 text-[13px] leading-[1.45] text-[#141414]/65">
                The web is full of people telling you what happened. Very few tell you what would
                have made them wrong.
              </p>
              <div className="mt-5 border-t border-[#141414]/15 pt-3 exp-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#141414]/35">
                Politics / power / evidence
                <br />
                Est. 2026
              </div>
              <p className="mt-8 inline-block w-fit -rotate-2 border-2 border-[#F0442E] px-2 py-1 exp-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#F0442E]">
                Verify before you act
              </p>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 md:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-[#141414] pt-3">
            <p className="exp-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              02 / The field test
            </p>
            <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#141414]/40">
              Sample · not a news event
            </p>
          </div>

          <div className="mt-4 grid border-2 border-[#141414] bg-[#F8F2E6] md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-5 md:p-8">
              <p className="exp-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#F0442E]">
                The move
              </p>
              <p className="mt-3 max-w-[30ch] text-[25px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[32px]">
                A government sends $1.2bn in aid to a partner. The minister calls it development.
                Critics call it a bribe.
              </p>
              <p className="mt-5 border-t border-[#141414]/20 pt-3 text-[14px] leading-relaxed text-[#141414]/75">
                Which observation would most directly test whether the aid bought influence?
              </p>

              <div className="mt-4 grid gap-2">
                {OPTIONS.map((option) => {
                  const picked = answer === option.key;
                  const isRight = option.key === "B";
                  const revealed = answer !== null;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => setAnswer(option.key)}
                      className={`exp-option flex w-full items-start gap-3 border px-3 py-3 text-left ${
                        picked && isRight
                          ? "border-[#141414] bg-[#F2D64B]"
                          : picked
                            ? "border-[#F0442E] bg-[#F0442E]/8"
                            : revealed && isRight
                              ? "border-[#141414]/40 bg-[#F2D64B]/30"
                              : "border-[#141414]/25 bg-transparent"
                      }`}
                    >
                      <span className="exp-mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-current text-[9px] font-bold">
                        {option.key}
                      </span>
                      <span className="text-[13px] leading-[1.4]">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {answer && (
                <div className="mt-5 border-t border-[#141414]/20 pt-4">
                  <span className={`exp-stamp ${correct ? "text-[#141414]" : "text-[#F0442E]"}`}>
                    {correct ? "Correct" : "Read again"}
                  </span>
                  <p className="mt-3 max-w-[58ch] text-[13px] leading-relaxed text-[#141414]/70">
                    {correct
                      ? "B is the only one that compares the partner with a credible counterfactual. It can show whether the votes moved because of the aid, not just whether the aid arrived."
                      : "The other two can tell you what the donor said or what happened next, but neither gives you a comparison. Without a counterfactual, you cannot separate the aid from everything else."}
                  </p>
                </div>
              )}
            </div>

            <aside className="border-t-2 border-[#141414] bg-[#141414] p-5 text-[#F7F0E2] md:border-l-2 md:border-t-0 md:p-6">
              <p className="exp-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#F2D64B]">
                Why this matters
              </p>
              <p className="mt-3 text-[14px] leading-[1.5] text-[#F7F0E2]/75">
                A claim can be plausible and still not be evidence. The test is not whether the story
                sounds right. It is whether a different observation would have produced a different
                answer.
              </p>
              <div className="mt-6 border-t border-white/20 pt-4">
                <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#F7F0E2]/40">
                  The Threadwise rule
                </p>
                <p className="mt-2 text-[17px] leading-[1.25]">
                  Name the observation that would change your mind before you decide.
                </p>
              </div>
              <p className="mt-8 -rotate-2 border border-[#F2D64B] px-2 py-1 exp-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#F2D64B]">
                Your turn
              </p>
            </aside>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-[1280px] px-5 md:mt-20 md:px-8">
          <div className="flex items-baseline justify-between border-t-2 border-[#141414] pt-3">
            <p className="exp-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              03 / What the machine does
            </p>
            <p className="hidden exp-mono text-[8px] uppercase tracking-[0.12em] text-[#141414]/40 sm:block">
              One loop, three moves
            </p>
          </div>
          <div className="grid border-b-2 border-[#141414] md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article
                key={step.n}
                className={`py-6 md:px-6 md:py-8 ${index > 0 ? "border-t border-[#141414]/20 md:border-l md:border-t-0" : ""} ${index === 0 ? "md:pl-0" : ""}`}
              >
                <p className="exp-mono flex h-7 w-7 items-center justify-center rounded-full border border-[#F0442E] text-[10px] font-bold text-[#F0442E]">
                  {step.n}
                </p>
                <h2 className="mt-4 text-[25px] font-semibold leading-[1.05] tracking-[-0.03em]">
                  {step.title}
                </h2>
                <p className="mt-2 max-w-[36ch] text-[13px] leading-[1.5] text-[#141414]/65">
                  {step.body}
                </p>
                <Link
                  to={step.to}
                  className="mt-4 inline-block exp-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#141414] underline decoration-[#F0442E] decoration-2 underline-offset-4 hover:text-[#F0442E]"
                >
                  {step.cta} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 bg-[#141414] text-[#F7F0E2] md:mt-20">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-12 md:grid-cols-[300px_minmax(0,1fr)] md:px-8 md:py-16">
            <div>
              <p className="exp-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#F2D64B]">
                04 / The record
              </p>
              <p className="exp-display mt-3 text-[56px] text-[#F7F0E2]/90 md:pr-6 md:text-[64px]">
                The
                <br />
                receipt.
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#F7F0E2]/40">
                  One claim, dated
                </p>
                <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#F2D64B]/60">
                  Sample record
                </p>
              </div>
              <p className="mt-2 max-w-[34ch] text-[28px] font-medium leading-[1.1] tracking-[-0.02em] md:text-[38px]">
                “Aid buys influence.”
              </p>
              <div className="mt-7 grid gap-6 border-t border-white/20 pt-4 sm:grid-cols-2">
                <div>
                  <p className="exp-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#F2D64B]">
                    What it predicts
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.5] text-[#F7F0E2]/65">
                    Aid flows toward partners whose votes and access matter, and those partners move
                    when the aid is conditional.
                  </p>
                </div>
                <div>
                  <p className="exp-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#F0442E]">
                    What would break it
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.5] text-[#F7F0E2]/65">
                    Aid surges followed by no policy change when need and domestic politics are
                    controlled, or votes that move without the money.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-3 exp-mono text-[8px] uppercase tracking-[0.1em] text-[#F7F0E2]/35">
                <span>Filed 09 Nov 2026</span>
                <span>Confidence / medium</span>
                <span className="text-[#F2D64B]">Question / open</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F2D64B]">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_260px] md:items-end md:px-8 md:py-16">
            <h2 className="exp-display text-[54px] sm:text-[76px] lg:text-[100px]">
              What would
              <br />
              change your
              <br />
              mind?
            </h2>
            <div>
              <p className="max-w-[32ch] text-[14px] leading-relaxed text-[#141414]/70">
                Start with one source. Threadwise gives you the read, the counter-case and the
                receipt — not another feed to agree with.
              </p>
              <Link
                to="/analyst"
                className="mt-4 inline-flex items-center border-2 border-[#141414] bg-[#141414] px-4 py-3 exp-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F7F0E2] hover:bg-[#F0442E]"
              >
                Bring a source →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#141414]/20">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
          <p className="exp-mono text-[8px] uppercase tracking-[0.12em] text-[#141414]/40">
            Threadwise / field test 01 / a design experiment
          </p>
          <div className="flex gap-4 exp-mono text-[8px] uppercase tracking-[0.12em] text-[#141414]/45">
            <Link to="/" className="hover:text-[#F0442E]">The current site</Link>
            <Link to="/seminar" className="hover:text-[#F0442E]">The seminar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
