import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import {
  checkPractice,
  recordPracticeAttempt,
  type PracticeKind,
} from "@/lib/threadwise/practice";
import { savePracticeAttempt } from "@/lib/threadwise/practice-sync";

export const Route = createFileRoute("/practice/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Practice ${params.token} — Threadwise` },
      {
        name: "description",
        content:
          "Write the falsifier, steelman or teach-back before seeing the read's answer, then compare against a structural checklist.",
      },
    ],
  }),
  component: PracticePage,
});

type Report = {
  move: string;
  why_now: string;
  counter_reading: string;
  falsifier: string;
  claims?: { text: string }[];
};

const EXERCISES: {
  kind: PracticeKind;
  label: string;
  prompt: string;
}[] = [
  {
    kind: "falsifier",
    label: "Falsifier",
    prompt: "Before you see it: what one fact would prove this read wrong? Be specific enough that it could be checked.",
  },
  {
    kind: "steelman",
    label: "Steelman",
    prompt: "Write the strongest case that this is routine, not a rupture. Argue it properly.",
  },
  {
    kind: "teach",
    label: "Teach-back",
    prompt: "Explain the move and why now, in your own words, as if to a smart friend who has not read it.",
  },
];

function PracticePage() {
  const { token } = Route.useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [input, setInput] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [kind, setKind] = useState<PracticeKind>("falsifier");
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(`/api/read/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (alive) setState("missing");
          return;
        }
        const body = (await response.json()) as { report?: Report; input?: string };
        if (!alive || !body.report) {
          if (alive) setState("missing");
          return;
        }
        setReport(body.report);
        setInput(body.input ?? "");
        setState("ready");
      } catch {
        if (alive) setState("missing");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const exercise = EXERCISES.find((item) => item.kind === kind) ?? EXERCISES[0]!;
  const checks = useMemo(
    () => (revealed && report ? checkPractice(kind, answer, report) : []),
    [revealed, kind, answer, report],
  );
  useEffect(() => {
    if (!revealed || !report || !checks.length || recorded.current) return;
    recorded.current = true;
    const attempt = {
      token,
      kind,
      passed: checks.filter((check) => check.passed).length,
      total: checks.length,
      at: new Date().toISOString(),
    };
    recordPracticeAttempt(attempt);
    void savePracticeAttempt(attempt);
  }, [revealed, checks, report, kind, token]);

  const passed = checks.filter((check) => check.passed).length;
  const modelAnswer =
    report && kind === "falsifier"
      ? report.falsifier
      : report && kind === "steelman"
        ? report.counter_reading
        : report
          ? `${report.move}\n\n${report.why_now}`
          : "";

  const choose = (next: PracticeKind) => {
    setKind(next);
    setAnswer("");
    setRevealed(false);
    recorded.current = false;
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/read/$token"
              params={{ token }}
              className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]"
            >
              <ArrowLeft className="h-3 w-3" /> Read
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
            Practice
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-8">
        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Opening the read…
          </p>
        )}

        {state === "missing" && (
          <div className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-4 py-3">
            <p className="font-serif text-[15px]">That read does not exist, or the link is wrong.</p>
            <Link to="/analyst" className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
              Bring a move →
            </Link>
          </div>
        )}

        {state === "ready" && report && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#1A4BFF]">
              The move
            </p>
            <p className="mt-2 border-l-2 border-[#1A1A1A] pl-3 font-serif text-[16px] leading-relaxed text-[#1A1A1A]/80">
              {input}
            </p>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {EXERCISES.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => choose(item.kind)}
                  aria-pressed={kind === item.kind}
                  className={`border px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    kind === item.kind
                      ? "border-[#1A4BFF] bg-[#1A4BFF] text-white"
                      : "border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <section className="mt-4 border-2 border-[#1A1A1A] bg-white">
              <div className="border-b border-[#1A1A1A]/15 px-4 py-3">
                <p className="font-serif text-[15px] leading-relaxed">{exercise.prompt}</p>
              </div>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="Write it before you look at the read's answer…"
                className="w-full resize-none bg-transparent px-4 py-3 font-serif text-[15px] leading-relaxed outline-none placeholder:text-[#1A1A1A]/35"
              />
              <div className="flex flex-wrap items-center gap-3 border-t border-[#1A1A1A]/15 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  disabled={answer.trim().length < 20}
                  className="border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] disabled:opacity-40"
                >
                  Compare
                </button>
                {revealed && (
                  <button
                    type="button"
                    onClick={() => {
                      const index = EXERCISES.findIndex((item) => item.kind === kind);
                      choose(EXERCISES[(index + 1) % EXERCISES.length]!.kind);
                    }}
                    className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
                  >
                    Next exercise
                  </button>
                )}
              </div>
            </section>

            {revealed && (
              <>
                <section className="mt-6 border-2 border-[#1A4BFF] bg-white">
                  <div className="flex items-center justify-between bg-[#1A4BFF] px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                      The read's answer
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/75">
                      {passed}/{checks.length} structural checks
                    </span>
                  </div>
                  <p className="whitespace-pre-line px-4 py-3 font-serif text-[15px] leading-relaxed text-[#1A1A1A]/85">
                    {modelAnswer}
                  </p>
                </section>

                <section className="mt-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60">
                    Your answer, checked
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {checks.map((check) => (
                      <li key={check.label} className="flex items-start gap-2 font-serif text-[13.5px] leading-snug">
                        <span
                          className={`mt-0.5 font-mono text-[12px] ${
                            check.passed ? "text-[#1A4BFF]" : "text-[#C1121F]"
                          }`}
                        >
                          {check.passed ? "✓" : "×"}
                        </span>
                        <span className={check.passed ? "text-[#1A1A1A]/80" : "text-[#1A1A1A]/50"}>
                          {check.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
                    Structural check, not a grade. The comparison is the lesson.
                  </p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                    Saved to your practice record on this device.
                  </p>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
