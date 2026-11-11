import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { QuestionGap } from "@/components/threadwise/QuestionGap";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/question/$id")({
  head: () => ({
    meta: [
      { title: "A standing question — Threadwise" },
      {
        name: "description",
        content: "One question, the evidence filed for and against it, and what would settle it.",
      },
    ],
  }),
  component: QuestionPage,
});

type Question = { id: string; question: string; status: string; created_at: string };
type Finding = {
  id: string;
  question_id: string;
  stance: string;
  note: string;
  claim: string | null;
  source: string | null;
  confidence: string | null;
  read_token: string | null;
  created_at: string;
};

function QuestionPage() {
  const { id } = Route.useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [state, setState] = useState<"loading" | "anon" | "ready" | "missing">("loading");
  const [note, setNote] = useState("");
  const [stance, setStance] = useState<"for" | "against">("for");
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        if (alive) setState("anon");
        return;
      }

      const { data: row } = await supabase
        .from("analyst_questions")
        .select("id, question, status, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (!row) {
        setState("missing");
        return;
      }

      const { data: evidence } = await supabase
        .from("analyst_findings")
        .select("id, question_id, stance, note, claim, source, confidence, read_token, created_at")
        .eq("question_id", id)
        .order("created_at", { ascending: false });
      if (!alive) return;
      setQuestion(row as Question);
      setFindings((evidence as Finding[]) ?? []);
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const add = async () => {
    if (!question || saving) return;
    const clean = note.trim();
    if (clean.length < 3) {
      setError("Write the evidence in a sentence.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const { data, error: insertError } = await supabase
      .from("analyst_findings")
      .insert({ question_id: question.id, stance, note: clean })
      .select("id, question_id, stance, note, claim, source, confidence, read_token, created_at")
      .single();
    if (insertError || !data) {
      setError("That evidence could not be filed.");
      setSaving(false);
      return;
    }
    setFindings((current) => [data as Finding, ...current]);
    setNote("");
    setMessage("Filed.");
    setSaving(false);
  };

  const changeStatus = async (status: "open" | "answered" | "dropped") => {
    if (!question || statusBusy) return;
    setStatusBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("analyst_questions")
      .update({ status })
      .eq("id", question.id);
    if (updateError) {
      setError("That status could not be saved.");
    } else {
      setQuestion({ ...question, status });
      setMessage(status === "open" ? "Reopened." : status === "answered" ? "Marked answered." : "Dropped.");
    }
    setStatusBusy(false);
  };

  const forCount = findings.filter((finding) => finding.stance === "for").length;
  const againstCount = findings.length - forCount;

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/questions"
              className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]"
            >
              <ArrowLeft className="h-3 w-3" /> Questions
            </Link>
            <BrandLockup />
          </div>
          <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF] sm:inline">
            Question
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10">
        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Reading the question…
          </p>
        )}

        {state === "anon" && (
          <div className="border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center">
            <p className="font-display text-xl">This question belongs to an account.</p>
            <Link
              to="/login"
              className="mt-3 inline-flex border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]"
            >
              Sign in
            </Link>
          </div>
        )}

        {state === "missing" && (
          <div className="border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center">
            <p className="font-display text-xl">That question is not on your record.</p>
            <Link
              to="/questions"
              className="mt-3 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
            >
              Back to questions
            </Link>
          </div>
        )}

        {state === "ready" && question && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
              Standing question
            </p>
            <h1 className="mt-3 max-w-[24ch] font-display text-[30px] leading-[1.02] md:text-[42px]">
              {question.question}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">
              <span className="border border-[#1A1A1A]/20 px-1.5 py-0.5">{question.status}</span>
              <span>
                {forCount} for · {againstCount} against
              </span>
              <span>
                opened{" "}
                {new Date(question.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {findings.length === 0 ? (
              <p className="mt-6 border-l-2 border-[#1A1A1A]/20 pl-3 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/60">
                No evidence filed yet. A read can file it, or you can add a note below.
              </p>
            ) : findings.length >= 3 && (forCount === 0 || againstCount === 0) ? (
              <p className="mt-6 border-l-2 border-[#C1121F] pl-3 font-serif text-[14px] leading-relaxed text-[#C1121F]/85">
                Every finding is on one side. That is a warning sign, not a conclusion. Ask what the
                strongest case against it is.
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-1 border-2 border-[#1A1A1A] md:grid-cols-2 md:divide-x md:divide-[#1A1A1A]/12">
              {(["for", "against"] as const).map((side) => {
                const list = findings.filter((finding) => finding.stance === side);
                return (
                  <section key={side} className="border-b border-[#1A1A1A]/12 px-4 py-3 last:border-b-0 md:border-b-0">
                    <p
                      className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${
                        side === "for" ? "text-[#1A4BFF]" : "text-[#C1121F]"
                      }`}
                    >
                      {side} · {list.length}
                    </p>
                    {list.length === 0 ? (
                      <p className="mt-2 font-serif text-[13px] text-[#1A1A1A]/40">nothing yet</p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {list.map((finding) => (
                          <li key={finding.id} className="border-b border-[#1A1A1A]/8 pb-2 last:border-b-0 last:pb-0">
                            {finding.claim && (
                              <p className="mb-1 border-l-2 border-[#1A4BFF]/30 pl-2 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                                “{finding.claim}”
                              </p>
                            )}
                            <p className="font-serif text-[13.5px] leading-snug text-[#1A1A1A]/80">
                              {finding.note}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                              <span>
                                {new Date(finding.created_at).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              {finding.source && <span>{finding.source}</span>}
                              {finding.confidence && <span>{finding.confidence}</span>}
                              {finding.read_token ? (
                                <Link
                                  to="/read/$token"
                                  params={{ token: finding.read_token }}
                                  className="text-[#1A4BFF] underline underline-offset-4"
                                >
                                  read
                                </Link>
                              ) : (
                                <span>filed directly</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            <QuestionGap
              question={question.question}
              findings={findings.map((finding) => ({ stance: finding.stance, note: finding.note }))}
              oneSided={findings.length >= 3 && (forCount === 0 || againstCount === 0)}
            />

            <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
              <div className="bg-[#1A1A1A] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#FDFBF7]">
                Add evidence
              </div>
              <div className="px-4 py-3">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="The fact, quotation or observation that bears on this question…"
                  className="w-full resize-none border border-[#1A1A1A]/20 bg-[#FDFBF7] px-3 py-2 font-serif text-[14px] leading-relaxed outline-none focus:border-[#1A4BFF]"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["for", "against"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setStance(side)}
                      aria-pressed={stance === side}
                      className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${
                        stance === side
                          ? side === "for"
                            ? "border-[#1A4BFF] bg-[#1A4BFF] text-white"
                            : "border-[#C1121F] bg-[#C1121F] text-white"
                          : "border-[#1A1A1A]/20 text-[#1A1A1A]/55"
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void add()}
                    disabled={saving || note.trim().length < 3}
                    className="ml-auto border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] disabled:opacity-40"
                  >
                    {saving ? "Filing…" : "File evidence"}
                  </button>
                </div>
                {message && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF]">
                    {message}
                  </p>
                )}
                {error && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#C1121F]">
                    {error}
                  </p>
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#1A1A1A]/15 pt-4">
              {question.status === "open" ? (
                <>
                  <button
                    type="button"
                    onClick={() => void changeStatus("answered")}
                    disabled={statusBusy}
                    className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/60 underline underline-offset-4 hover:text-[#1A4BFF] disabled:opacity-40"
                  >
                    Mark answered
                  </button>
                  <button
                    type="button"
                    onClick={() => void changeStatus("dropped")}
                    disabled={statusBusy}
                    className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/45 underline underline-offset-4 hover:text-[#C1121F] disabled:opacity-40"
                  >
                    Drop question
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void changeStatus("open")}
                  disabled={statusBusy}
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4 disabled:opacity-40"
                >
                  Reopen question
                </button>
              )}
              <Link
                to="/questions"
                className="ml-auto font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/45 underline underline-offset-4"
              >
                All questions
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
