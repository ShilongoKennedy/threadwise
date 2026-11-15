import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { useEffect, useState } from "react";
import { QuestionGap } from "@/components/threadwise/QuestionGap";
import { BalanceBar } from "@/components/threadwise/BalanceBar";
import { isQuestionLike } from "@/lib/threadwise/question-quality";
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
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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
      setEditDraft((row as Question).question);
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

  const saveEdit = async () => {
    if (!question || editSaving) return;
    const clean = editDraft.trim();
    if (clean.length < 10) {
      setError("Keep the question at least a sentence long.");
      return;
    }
    if (!isQuestionLike(clean)) {
      setError("That reads like a statement. Phrase it as a question: Is…, Will…, Should…");
      return;
    }
    setEditSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("analyst_questions")
      .update({ question: clean })
      .eq("id", question.id);
    if (updateError) {
      setError("The question could not be saved.");
    } else {
      setQuestion({ ...question, question: clean });
      setEditing(false);
      setMessage("Question updated.");
    }
    setEditSaving(false);
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
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <div className="bp-scrim" aria-hidden />
      <AppHeader section="questions" />

      <main className="bp-page bp-page--narrow">
        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Reading the question…
          </p>
        )}

        {state === "anon" && (
          <BPEmptyState
            className="mt-8"
            eyebrow="Standing question"
            title="This question belongs to an account."
            body="Sign in to see the evidence filed for and against it, and to add the next finding."
            action={
              <Link to="/login" className={bpButtonClass({ variant: "primary" })}>
                Sign in
              </Link>
            }
          />
        )}

        {state === "missing" && (
          <BPEmptyState
            className="mt-8"
            eyebrow="Not found"
            title="That question is not on your record."
            body="It may belong to another account, or it may have been dropped."
            action={
              <Link to="/questions" className={bpButtonClass({ variant: "secondary" })}>
                Back to questions
              </Link>
            }
          />
        )}

        {state === "ready" && question && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
              Standing question
            </p>
            {editing ? (
              <div className="mt-3">
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  rows={3}
                  maxLength={300}
                  className="bp-input min-h-[110px] font-display text-[20px] leading-snug"
                />
                <div className="mt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    disabled={editSaving}
                    className="bp-button bp-button--primary bp-button--sm"
                  >
                    {editSaving ? "Saving…" : "Save question"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditDraft(question.question);
                      setError(null);
                    }}
                    className="bp-button bp-button--ghost bp-button--sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-start justify-between gap-3">
                <h1 className="max-w-[24ch] font-display text-[30px] leading-[1.02] md:text-[42px]">
                  {question.question}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditDraft(question.question);
                    setEditing(true);
                    setError(null);
                  }}
                  className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45 underline underline-offset-4 hover:text-[#1A4BFF]"
                >
                  edit
                </button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">
              <span className="border border-[#1A1A1A]/20 px-1.5 py-0.5">{question.status}</span>
              <span>
                opened{" "}
                {new Date(question.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <BalanceBar forCount={forCount} againstCount={againstCount} className="mt-3 max-w-[320px]" />

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

            <div className="bp-card mt-6 grid grid-cols-1 overflow-hidden md:grid-cols-2 md:divide-x md:divide-white/12">
              {(["for", "against"] as const).map((side) => {
                const list = findings.filter((finding) => finding.stance === side);
                return (
                  <section key={side} className="border-b border-white/12 px-5 py-4 last:border-b-0 md:border-b-0">
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
                                  className="text-[#E8EEFF] underline underline-offset-4"
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

            <section className="bp-card mt-8">
              <div className="bp-card__header">
                <p className="bp-card__eyebrow">Add evidence</p>
                <span className="bp-badge">{forCount} for · {againstCount} against</span>
              </div>
              <div className="bp-card__body">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="The fact, quotation or observation that bears on this question…"
                  className="bp-input bp-textarea min-h-[110px]"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["for", "against"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setStance(side)}
                      aria-pressed={stance === side}
                      className={`bp-chip ${stance === side ? "is-active" : ""}`}
                    >
                      {side}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void add()}
                    disabled={saving || note.trim().length < 3}
                    className="bp-button bp-button--primary bp-button--sm ml-auto"
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
