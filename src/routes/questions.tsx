import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QuestionGap } from "@/components/threadwise/QuestionGap";
import { BalanceBar } from "@/components/threadwise/BalanceBar";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { isQuestionLike } from "@/lib/threadwise/question-quality";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/questions")({
  head: () => ({
    meta: [
      { title: "Standing questions — Threadwise" },
      { name: "description", content: "The decisions you are trying to close, with the evidence reads add for and against them." },
    ],
  }),
  component: QuestionsPage,
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

function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        if (alive) setState("anon");
        return;
      }
      const [{ data: qs }, { data: fs }] = await Promise.all([
        supabase.from("analyst_questions").select("id, question, status, created_at").eq("status", "open").order("created_at", { ascending: false }),
        supabase.from("analyst_findings").select("id, question_id, stance, note, claim, source, confidence, read_token, created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      if (!alive) return;
      setQuestions((qs as Question[]) ?? []);
      setFindings((fs as Finding[]) ?? []);
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const add = async () => {
    const text = draft.trim();
    if (text.length < 10) return;
    if (!isQuestionLike(text)) {
      setAddError("That reads like a statement. Phrase it as a question: Is…, Will…, Should…");
      return;
    }
    setAddError(null);
    const { data } = await supabase.from("analyst_questions").insert({ question: text }).select("id, question, status, created_at").single();
    if (data) {
      setQuestions([data as Question, ...questions]);
      setDraft("");
      setAddError(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader section="questions" />

      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10">
        <h1 className="font-display text-[34px] leading-none md:text-[46px]">What are you trying to decide?</h1>
        <p className="mt-3 max-w-[54ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/70">
          Keep three or four questions open. Every read can file evidence for or against them, and the
          balance shows you when you already know the answer.
        </p>

        {state === "anon" && (
          <div className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center">
            <p className="font-display text-xl">Questions belong to you, so they need an account.</p>
            <Link to="/analyst" className="mt-3 inline-flex border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]">
              Sign in
            </Link>
          </div>
        )}

        {state === "ready" && (
          <>
            <div className="mt-6 flex items-center gap-2 border-2 border-[#1A1A1A] bg-white px-3 py-2">
              <input
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setAddError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void add();
                }}
                placeholder="Is Rosatom actually winning in Africa?"
                className="min-w-0 flex-1 bg-transparent font-serif text-[15px] outline-none placeholder:text-[#1A1A1A]/35"
              />
              <button
                type="button"
                onClick={() => void add()}
                disabled={draft.trim().length < 10}
                className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] disabled:opacity-40"
              >
                Add →
              </button>
            </div>
            {addError && (
              <p className="mt-2 border-l-2 border-[#C1121F] pl-2 font-serif text-[12.5px] leading-snug text-[#C1121F]">
                {addError}
              </p>
            )}

            {questions.length === 0 && (
              <p className="mt-6 font-serif text-[14px] text-[#1A1A1A]/60">
                Nothing open. Add the first question above — one you genuinely have not settled.
              </p>
            )}

            <ul className="mt-8 space-y-8">
              {questions.map((question) => {
                const mine = findings.filter((finding) => finding.question_id === question.id);
                const forCount = mine.filter((finding) => finding.stance === "for").length;
                const againstCount = mine.length - forCount;
                return (
                  <li key={question.id} className="border-2 border-[#1A1A1A] bg-white">
                    <div className="border-b-2 border-[#1A1A1A] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-display text-[20px] leading-snug">
                          <Link
                            to="/question/$id"
                            params={{ id: question.id }}
                            className="transition-colors hover:text-[#1A4BFF]"
                          >
                            {question.question}
                          </Link>
                        </h2>
                        <Link
                          to="/question/$id"
                          params={{ id: question.id }}
                          className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
                        >
                          open →
                        </Link>
                      </div>
                      <BalanceBar forCount={forCount} againstCount={againstCount} className="mt-2 max-w-[280px]" />
                      {mine.length >= 4 ? (
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
                          {forCount > againstCount ? "leaning yes" : forCount < againstCount ? "leaning no" : "balanced"}
                        </p>
                      ) : null}
                      {mine.length === 0 ? (
                        <p className="mt-2 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/50">
                          No evidence filed yet. A read that bears on this will file it here.
                        </p>
                      ) : (
                        <p className="mt-2 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/55">
                          Last filed{" "}
                          {new Date(mine[0]!.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                          .
                          {mine.length >= 3 && (forCount === 0 || againstCount === 0)
                            ? " All the evidence is one way — that is a warning sign, not a conclusion. Ask what the strongest case against it is."
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-[#1A1A1A]/10 md:grid-cols-2 md:divide-x md:divide-y-0">
                      {(["for", "against"] as const).map((side) => (
                        <div key={side} className="px-4 py-3">
                          <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${side === "for" ? "text-[#1A4BFF]" : "text-[#C1121F]"}`}>
                            {side}
                          </p>
                          <ul className="mt-2 space-y-2">
                            {mine.filter((finding) => finding.stance === side).map((finding) => (
                              <li key={finding.id} className="font-serif text-[13.5px] leading-snug text-[#1A1A1A]/80">
                                {finding.claim && (
                                  <p className="mb-1 border-l-2 border-[#1A4BFF]/30 pl-2 text-[13px] text-[#1A1A1A]/65">
                                    “{finding.claim}”
                                  </p>
                                )}
                                <p>{finding.note}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/40">
                                  {finding.source && <span>{finding.source}</span>}
                                  {finding.confidence && <span>{finding.confidence}</span>}
                                  {finding.read_token && (
                                    <Link to="/read/$token" params={{ token: finding.read_token }} className="text-[#1A4BFF] underline underline-offset-4">
                                      read
                                    </Link>
                                  )}
                                </div>
                              </li>
                            ))}
                            {mine.filter((finding) => finding.stance === side).length === 0 && (
                              <li className="font-serif text-[13px] text-[#1A1A1A]/40">nothing yet</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <QuestionGap
                      question={question.question}
                      findings={mine.map((finding) => ({
                        stance: finding.stance,
                        note: finding.note,
                      }))}
                      oneSided={mine.length >= 3 && (forCount === 0 || againstCount === 0)}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
