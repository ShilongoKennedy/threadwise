import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  ChevronDown,
  Crosshair,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import type { AnatomyReport, AnatomyRung, AnatomyStatus } from "@/lib/threadwise/anatomy";

export const Route = createFileRoute("/anatomy")({
  head: () => ({
    meta: [
      { title: "The Anatomy — Threadwise" },
      {
        name: "description",
        content:
          "Break a belief into its inference chain. See where observation ends, interpretation begins, and the evidence stops.",
      },
    ],
  }),
  component: AnatomyPage,
});

const SAMPLE = `A photograph of the Pope travelling in a helicopter in Peru has attracted attention for several unusual details. The Pope's white skullcap has been compared to a Jewish kippah, while the Peruvian Air Force pilot's flight helmet appears to carry Russian Armed Forces insignia. The discussion has also taken a Masonic angle, with commenters suggesting that the combination of symbols represents a form of visual balance or symbolism.`;

const STATUS_META: Record<AnatomyStatus, { label: string; note: string }> = {
  established: { label: "Established", note: "Directly observable or independently verified." },
  supported: { label: "Supported", note: "Reasonable, but not fully established." },
  contested: { label: "Contested", note: "Credible evidence points both ways." },
  unsupported: { label: "Unsupported", note: "The evidence does not reach this rung." },
  unfalsifiable: { label: "Unfalsifiable", note: "Cannot be tested even in principle." },
};

const LENSES = [
  { key: "psychological", label: "Psychology", accent: "lime" },
  { key: "social", label: "Social function", accent: "lilac" },
  { key: "historical", label: "Historical lineage", accent: "white" },
  { key: "symbolic", label: "Symbolic reading", accent: "lilac" },
] as const;

function AnatomyPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnatomyReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!report) return;
    const frame = requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [report]);

  const examine = async () => {
    if (text.trim().length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch("/api/anatomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as { report?: AnatomyReport; error?: string };
      if (!response.ok || !body.report) throw new Error(body.error ?? "The anatomy could not be drawn.");
      setReport(body.report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The anatomy could not be drawn.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="anatomy-page min-h-[100dvh]">
      <AppHeader section="anatomy" />
      <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <section className="anatomy-hero">
          <div>
            <p className="anatomy-kicker"><BrainCircuit className="h-3 w-3" /> The anatomy</p>
            <h1 className="anatomy-title">Where does the<br />evidence stop?</h1>
            <p className="anatomy-lede">
              Put a belief on the table. We separate the observation from the interpretation, the
              symbol from the intention, and the evidence from the need to believe.
            </p>
          </div>
          <div className="anatomy-mini" aria-hidden="true">
            <p className="anatomy-mini__label">The ladder</p>
            {["Observation", "Identification", "Interpretation", "Intention", "Coordination", "Conclusion"].map((label, index) => (
              <div className="anatomy-mini__rung" key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i className={index > 2 ? "is-fading" : ""} />
                {label}
              </div>
            ))}
            <p className="anatomy-mini__note">Most beliefs break before the last rung.</p>
          </div>
        </section>

        <section className="anatomy-composer">
          <div className="anatomy-composer__bar">
            <p><Crosshair className="h-3 w-3" /> The claim</p>
            <button type="button" onClick={() => setText(SAMPLE)}>Use the Peru example</button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste a belief, rumour, headline, or describe a photograph…"
            className="anatomy-input"
            rows={5}
            maxLength={4000}
          />
          <div className="anatomy-composer__foot">
            <span>{text.trim().length} / 4000 · one claim at a time</span>
            <button type="button" onClick={() => void examine()} disabled={busy || text.trim().length < 20} className="anatomy-action">
              {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Drawing the ladder</> : <>Examine the belief <ArrowUpRight className="h-3.5 w-3.5" /></>}
            </button>
          </div>
          {error ? <p className="anatomy-error">{error}</p> : null}
        </section>

        {report ? (
          <div ref={reportRef} className="anatomy-report-wrap">
            <AnatomyView report={report} onReset={() => { setReport(null); setText(""); }} />
          </div>
        ) : (
          <section className="anatomy-waiting">
            <p className="anatomy-waiting__mark">↓</p>
            <p>Start with a claim someone actually believes.</p>
            <p>Not a straw man. Not a headline you already agree with.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function AnatomyView({ report, onReset }: { report: AnatomyReport; onReset: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [myLine, setMyLine] = useState<string | null>(null);
  const firstBreak = report.ladder.findIndex((rung) => rung.status !== "established" && rung.status !== "supported");

  return (
    <article className="anatomy-report">
      <header className="anatomy-report__head">
        <div>
          <p className="anatomy-kicker"><span>{report.claim_type}</span> · case anatomy</p>
          <h2>{report.claim}</h2>
          <p className="anatomy-restatement">{report.restatement}</p>
        </div>
        <button type="button" onClick={onReset} className="anatomy-reset">
          <RotateCcw className="h-3 w-3" /> New claim
        </button>
      </header>

      <section className="anatomy-section">
        <div className="anatomy-section__head">
          <div>
            <p className="anatomy-section__kicker">01 · The inference ladder</p>
            <h3>From what is there to what is claimed.</h3>
          </div>
          <p className="anatomy-section__hint">Open a rung to see what supports it — and what it needs.</p>
        </div>

        <div className="anatomy-ladder">
          {report.ladder.map((rung, index) => {
            const isOpen = open === rung.key;
            const status = STATUS_META[rung.status];
            return (
              <div key={rung.key} className={`anatomy-rung-wrap status-${rung.status} ${myLine === rung.key ? "has-my-line" : ""}`}>
                {index === firstBreak && firstBreak > 0 ? (
                  <div className="anatomy-horizon"><span>Evidence gets thin here</span></div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : rung.key)}
                  aria-expanded={isOpen}
                  className={`anatomy-rung status-${rung.status}`}
                >
                  <span className="anatomy-rung__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="anatomy-rung__copy">
                    <span className="anatomy-rung__top">
                      <span className="anatomy-rung__label">{rung.label}</span>
                      <span className={`anatomy-status status-${rung.status}`}>{status.label}</span>
                    </span>
                    <span className="anatomy-rung__statement">{rung.statement}</span>
                  </span>
                  <ChevronDown className={`anatomy-rung__chevron ${isOpen ? "is-open" : ""}`} />
                </button>
                {isOpen ? (
                  <div className="anatomy-rung__body">
                    <div>
                      <p className="anatomy-rung__eyebrow">What exists</p>
                      <p>{rung.evidence}</p>
                    </div>
                    <div>
                      <p className="anatomy-rung__eyebrow">The missing evidence</p>
                      <p>{rung.gap}</p>
                    </div>
                    <div className="anatomy-rung__actions">
                      <p>{status.note}</p>
                      <button
                        type="button"
                        onClick={() => setMyLine(myLine === rung.key ? null : rung.key)}
                        className="anatomy-line-button"
                      >
                        <Crosshair className="h-3 w-3" />
                        {myLine === rung.key ? "Remove my line" : "Place my line here"}
                      </button>
                    </div>
                  </div>
                ) : null}
                {myLine === rung.key ? <p className="anatomy-my-line">Your line: this is where you stop accepting the chain.</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="anatomy-ledger">
        <div>
          <p className="anatomy-section__kicker">02 · Survives</p>
          <ul>{report.survives.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <p className="anatomy-section__kicker">Does not survive</p>
          <ul>{report.does_not_survive.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <p className="anatomy-section__kicker">Still unknown</p>
          <ul>{report.unknown.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="anatomy-why">
        <div className="anatomy-section__head">
          <div>
            <p className="anatomy-section__kicker">03 · Why it travels</p>
            <h3>The belief is doing work for the believer.</h3>
          </div>
        </div>
        <div className="anatomy-lenses">
          {LENSES.map((lens) => (
            <article key={lens.key} className={`anatomy-lens anatomy-lens--${lens.accent}`}>
              <p>{lens.label}</p>
              <blockquote>{report.why[lens.key]}</blockquote>
            </article>
          ))}
        </div>
      </section>

      <section className="anatomy-hinge">
        <p className="anatomy-section__kicker">04 · The hinge</p>
        <div>
          <h3>What would move the line?</h3>
          <p>{report.hinge}</p>
        </div>
      </section>

      <aside className="anatomy-lesson">
        <p className="anatomy-section__kicker">05 · The thinking lesson</p>
        <h3>{report.lesson.title}</h3>
        <p>{report.lesson.body}</p>
        <span>{report.lesson.pattern}</span>
      </aside>
    </article>
  );
}
