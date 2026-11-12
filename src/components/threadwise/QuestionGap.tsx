import { useState } from "react";

type Gap = {
  counter_question: string;
  settling_evidence: string;
  hidden_assumption: string;
};

/** Ask for the counter-case only when the reader wants it; this is a paid call. */
export function QuestionGap({
  question,
  findings,
  oneSided,
}: {
  question: string;
  findings: { stance: string; note: string }[];
  oneSided: boolean;
}) {
  const [gap, setGap] = useState<Gap | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label =
    findings.length === 0
      ? "What would count as evidence?"
      : oneSided
        ? "Find the counter-case"
        : "What would settle this?";

  const find = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/question-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, findings }),
      });
      const body = (await response.json()) as { gap?: Gap; error?: string };
      if (!response.ok || !body.gap) throw new Error(body.error ?? "No counter-case came back.");
      setGap(body.gap);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No counter-case came back.");
    } finally {
      setBusy(false);
    }
  };

  if (!gap) {
    return (
      <div className="border-t border-[#1A1A1A]/10 py-3">
        <button
          type="button"
          onClick={() => void find()}
          disabled={busy}
          className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4 disabled:opacity-40"
        >
          {busy ? "Thinking…" : label}
        </button>
        {error && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C1121F]">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-[#1A1A1A]/10 py-3">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
          Counter-question
        </p>
        <p className="mt-0.5 font-serif text-[14px] leading-snug text-[#1A1A1A]/85">
          {gap.counter_question}
        </p>
      </div>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/55">
          What would settle it
        </p>
        <p className="mt-0.5 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/80">
          {gap.settling_evidence}
        </p>
      </div>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/55">
          Hidden assumption
        </p>
        <p className="mt-0.5 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/80">
          {gap.hidden_assumption}
        </p>
      </div>
    </div>
  );
}
