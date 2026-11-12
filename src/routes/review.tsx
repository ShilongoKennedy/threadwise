import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { PageMasthead } from "@/components/threadwise/PageMasthead";
import { EmptyState } from "@/components/threadwise/EmptyState";
import { BalanceBar } from "@/components/threadwise/BalanceBar";
import { supabase } from "@/integrations/supabase/client";
import type { WeeklyReview } from "@/lib/threadwise/weekly-review";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "The week — Threadwise" },
      {
        name: "description",
        content: "What changed in your record this week, what is still open, and the next move.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [state, setState] = useState<"loading" | "anon" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      if (!jwt) {
        if (alive) setState("anon");
        return;
      }
      const response = await fetch("/api/weekly-review", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!alive) return;
      if (!response.ok) {
        setState("error");
        return;
      }
      const body = (await response.json()) as { review?: WeeklyReview };
      if (!body.review) {
        setState("error");
        return;
      }
      setReview(body.review);
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <AppHeader section="digest" />

      <main className="mx-auto w-full max-w-[900px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
        <PageMasthead
          eyebrow="Weekly review"
          title="The week."
          deck="What changed in the record, what is still open, and the one thing worth doing next."
          aside={
            review
              ? `${new Date(review.from).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} — ${new Date(review.to).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
              : undefined
          }
        />

        {state === "anon" && (
          <div className="mt-8 border-y border-[#1A1A1A]/15 py-7">
            <p className="max-w-[26ch] font-display text-[28px] leading-[1.05]">The week belongs to your account.</p>
            <Link to="/login" className="mt-4 inline-flex border-b border-[#1A4BFF]/40 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]">
              Sign in →
            </Link>
          </div>
        )}

        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Reading the week…
          </p>
        )}

        {state === "error" && (
          <p className="mt-8 border-l-2 border-[#C1121F] pl-3 font-serif text-[14px] text-[#C1121F]">
            The week could not be read just now. Try again.
          </p>
        )}

        {state === "ready" && review && (
          <>
            {Object.values(review.counts).every((value) => value === 0) &&
            review.openQuestions.length === 0 ? (
              <EmptyState
                title="A quiet week."
                action={
                  <Link to="/analyst" className="inline-flex items-center gap-2 border-b border-[#1A4BFF]/40 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]">
                    Read a source →
                  </Link>
                }
              >
                Nothing was read, filed or settled in the last seven days. The next move is a source.
              </EmptyState>
            ) : (
              <>
                <section className="mt-8 grid grid-cols-2 border-y-2 border-[#1A1A1A] sm:grid-cols-5">
                  {[
                    { label: "reads", value: review.counts.reads },
                    { label: "evidence", value: review.counts.evidence },
                    { label: "questions", value: review.counts.questions },
                    { label: "settled", value: review.counts.predictionsSettled },
                    { label: "practice", value: review.counts.practice },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`px-4 py-3 ${index > 0 ? "border-l border-[#1A1A1A]/12" : ""} ${index === 2 ? "max-sm:border-l-0 max-sm:border-t" : ""} ${index === 3 || index === 4 ? "max-sm:border-t" : ""}`}
                    >
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
                        {stat.label}
                      </p>
                      <p className="mt-1 font-display text-[26px] leading-none">{stat.value}</p>
                    </div>
                  ))}
                </section>

                <section className="mt-6 border-2 border-[#1A4BFF] bg-white">
                  <div className="flex items-center justify-between bg-[#1A4BFF] px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                      Next move
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/70">
                      one thing
                    </span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="font-display text-[22px] leading-tight">{review.next.title}</p>
                    <p className="mt-2 max-w-[60ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
                      {review.next.detail}
                    </p>
                    <Link
                      to={
                        review.next.kind === "question"
                          ? "/question/$id"
                          : review.next.kind === "read"
                            ? "/analyst"
                            : review.next.kind === "prediction"
                              ? "/digest"
                              : "/profile"
                      }
                      params={
                        review.next.kind === "question" ? { id: review.next.id } : undefined
                      }
                      className="mt-4 inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
                    >
                      {review.next.kind === "question"
                        ? "Open the question"
                        : review.next.kind === "prediction"
                          ? "Open the record"
                          : review.next.kind === "practice"
                            ? "Open the drill"
                            : "Read a source"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </section>

                <section className="mt-8">
                  <div className="flex items-end justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
                    <h2 className="font-display text-[26px] leading-none">What changed.</h2>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                      last seven days
                    </span>
                  </div>
                  {review.reads.length === 0 ? (
                    <p className="py-4 font-serif text-[14px] text-[#1A1A1A]/55">
                      No reads were filed this week.
                    </p>
                  ) : (
                    <ul>
                      {review.reads.map((read) => (
                        <li key={read.token} className="border-b border-[#1A1A1A]/12">
                          <Link
                            to="/read/$token"
                            params={{ token: read.token }}
                            className="group flex items-baseline justify-between gap-4 py-3"
                          >
                            <span className="min-w-0 font-serif text-[14px] leading-snug text-[#1A1A1A]/80 group-hover:text-[#1A4BFF]">
                              {read.report?.subject || read.input}
                            </span>
                            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/35">
                              {new Date(read.at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {review.counts.corrections > 0 && (
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A4BFF]">
                      {review.counts.corrections} correction
                      {review.counts.corrections === 1 ? "" : "s"} made before publication
                    </p>
                  )}
                </section>

                <section className="mt-8">
                  <div className="flex items-end justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
                    <h2 className="font-display text-[26px] leading-none">Still open.</h2>
                    <Link
                      to="/questions"
                      className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
                    >
                      all questions
                    </Link>
                  </div>
                  {review.openQuestions.length === 0 ? (
                    <p className="py-4 font-serif text-[14px] text-[#1A1A1A]/55">
                      No open questions.
                    </p>
                  ) : (
                    <ul>
                      {review.openQuestions.map((question) => (
                        <li key={question.id} className="border-b border-[#1A1A1A]/12">
                          <Link
                            to="/question/$id"
                            params={{ id: question.id }}
                            className="group block pt-3"
                          >
                            <span className="font-serif text-[14px] leading-snug text-[#1A1A1A]/80 group-hover:text-[#1A4BFF]">
                              {question.question}
                            </span>
                          </Link>
                          <BalanceBar
                            forCount={question.forCount}
                            againstCount={question.againstCount}
                            className="pt-2 pb-3"
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {review.overdue.length > 0 && (
                    <div className="mt-5 border-l-2 border-[#C1121F] pl-3">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#C1121F]">
                        Predictions overdue
                      </p>
                      <ul className="mt-1 space-y-1">
                        {review.overdue.map((prediction) => (
                          <li key={prediction.claim} className="font-serif text-[13px] leading-snug text-[#1A1A1A]/70">
                            {prediction.claim} <span className="text-[#1A1A1A]/35">· due {prediction.due_date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
