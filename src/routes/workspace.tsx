import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { BalanceBar } from "@/components/threadwise/BalanceBar";
import { isQuestionLike } from "@/lib/threadwise/question-quality";
import { supabase } from "@/integrations/supabase/client";
import type { ThinkingProfile } from "@/lib/threadwise/thinking-profile";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Threadwise" },
      {
        name: "description",
        content: "Your desk: open questions, recent reads, predictions and the state of your record.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePage,
});

type Read = { token: string; input: string; at: string };
type Question = { id: string; question: string; status: string; created_at: string };
type Finding = { question_id: string; stance: string };

function WorkspacePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "anon" | "ready" | "error">("loading");
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);
  const [reads, setReads] = useState<Read[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        if (alive) setState("anon");
        return;
      }

      const jwt = session.access_token;
      try {
        const [profileResponse, recentResponse, questionResponse, findingResponse] = await Promise.all([
          fetch("/api/thinking-profile", { headers: { Authorization: `Bearer ${jwt}` } }),
          fetch("/api/analyst-recent", { headers: { Authorization: `Bearer ${jwt}` } }),
          supabase
            .from("analyst_questions")
            .select("id, question, status, created_at")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("analyst_findings")
            .select("question_id, stance")
            .order("created_at", { ascending: false })
            .limit(300),
        ]);

        if (!alive) return;
        if (!profileResponse.ok) {
          setState("error");
          return;
        }
        const profileBody = (await profileResponse.json()) as { profile?: ThinkingProfile };
        const recentBody = recentResponse.ok
          ? ((await recentResponse.json()) as { reads?: Read[] })
          : {};
        if (!profileBody.profile) {
          setState("error");
          return;
        }

        setProfile(profileBody.profile);
        setReads(recentBody.reads ?? []);
        setQuestions((questionResponse.data as Question[]) ?? []);
        setFindings((findingResponse.data as Finding[]) ?? []);
        setState("ready");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const start = () => {
    const clean = draft.trim();
    if (!clean) return;
    if (/^https?:\/\/\S+$/i.test(clean)) {
      window.sessionStorage.setItem("threadwise:analyst-link", clean);
    } else {
      window.sessionStorage.setItem("threadwise:analyst-draft", clean);
    }
    navigate({ to: "/analyst" });
  };

  if (state === "anon") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#FDFBF7] text-[#1A1A1A]">
        <header className="border-b-2 border-[#1A1A1A] px-5 py-3.5 md:px-8">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]"
              >
                <ArrowLeft className="h-3 w-3" /> Home
              </Link>
              <BrandLockup size="md" asLink />
            </div>
            <Link to="/login" className="border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7]">
              Sign in
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-16">
          <div className="max-w-[30ch]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
              Workspace
            </p>
            <h1 className="mt-3 font-display text-[42px] leading-none">The desk is behind an account.</h1>
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-[#1A1A1A]/65">
              Sign in to keep reads, questions, predictions and practice in one place.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FDFBF7]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/45">
          Opening the desk…
        </p>
      </div>
    );
  }

  if (state === "error" || !profile) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FDFBF7] px-5">
        <p className="font-serif text-[16px] text-[#1A1A1A]/70">The desk could not be opened just now.</p>
        <Link to="/analyst" className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4">
          Open the analyst
        </Link>
      </div>
    );
  }

  const nextQuestions = questions.slice(0, 4);
  const recentReads = reads.slice(0, 5);
  const brier = profile.calibration.brier;

  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <AppHeader section="workspace" />

      <main className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <section>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1A4BFF]">
              Workspace
            </p>
            <span className="h-3 w-px bg-[#1A1A1A]/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
          <h1 className="mt-2 font-display text-[38px] leading-none md:text-[56px]">Your desk.</h1>
          <p className="mt-3 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/65">
            What is open, what you just read, and where the evidence is thin. The rest can wait.
          </p>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
          className="mt-8 border-2 border-[#1A1A1A] bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/12 px-3 py-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
              Start with a source
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45 sm:inline">
              link · text · the analyst takes PDFs and screenshots
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45 sm:hidden">
              link · text · PDF · screenshot
            </span>
          </div>
          <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste a link or the first line…"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 font-serif text-[15px] outline-none placeholder:text-[#1A1A1A]/45"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] disabled:border-[#1A1A1A]/20 disabled:bg-transparent disabled:text-[#1A1A1A]/45"
            >
              Open the analyst <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        <section className="mt-8 grid grid-cols-2 border-y-2 border-[#1A1A1A] bg-[#FDFBF7] sm:grid-cols-4">
          {[
            { label: "reads", value: profile.reads },
            { label: "open questions", value: profile.questions.open },
            { label: "predictions", value: profile.calibration.predictions },
            {
              label: "Brier",
              value: brier === null ? "Not yet" : brier.toFixed(2),
              note: brier === null ? "no settled predictions" : "lower is better",
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`px-4 py-3 ${index > 0 ? "border-l border-[#1A1A1A]/12" : ""} ${index === 2 ? "max-sm:border-l-0 max-sm:border-t" : ""} ${index === 3 ? "max-sm:border-t" : ""}`}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
                {stat.label}
              </p>
              <p className="mt-1 font-display text-[26px] leading-none">{stat.value}</p>
              {stat.note && (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/45">
                  {stat.note}
                </p>
              )}
            </div>
          ))}
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:gap-12">
          <div className="min-w-0 space-y-10">
            <section>
              <div className="flex items-end justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-display text-[26px] leading-none">Open questions.</h2>
                <Link to="/questions" className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4">
                  all questions
                </Link>
              </div>
              {nextQuestions.length === 0 ? (
                <p className="py-4 font-serif text-[14px] text-[#1A1A1A]/55">
                  Nothing open. The questions page is where the next decision starts.
                </p>
              ) : (
                <ul>
                  {nextQuestions.map((question) => {
                    const mine = findings.filter((finding) => finding.question_id === question.id);
                    const forCount = mine.filter((finding) => finding.stance === "for").length;
                    const againstCount = mine.length - forCount;
                    return (
                      <li key={question.id} className="border-b border-[#1A1A1A]/12">
                        <Link
                          to="/question/$id"
                          params={{ id: question.id }}
                          className="group block pt-3.5"
                        >
                          <span className="font-serif text-[14.5px] leading-snug text-[#1A1A1A]/85 group-hover:text-[#1A4BFF]">
                            {question.question}
                          </span>
                        </Link>
                        <BalanceBar forCount={forCount} againstCount={againstCount} className="pt-2" />
                        {!isQuestionLike(question.question) ? (
                          <Link
                            to="/question/$id"
                            params={{ id: question.id }}
                            className="mt-1 block pb-3 font-mono text-[8px] uppercase tracking-[0.1em] text-[#B26A00] underline underline-offset-2"
                          >
                            reads like a statement · open to edit
                          </Link>
                        ) : (
                          <div className="pb-3" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-display text-[26px] leading-none">Recent reads.</h2>
                <Link to="/cases" className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4">
                  by case
                </Link>
              </div>
              {recentReads.length === 0 ? (
                <p className="py-4 font-serif text-[14px] text-[#1A1A1A]/55">
                  No reads yet. Start with the source in front of you.
                </p>
              ) : (
                <ul>
                  {recentReads.map((read) => (
                    <li key={read.token} className="border-b border-[#1A1A1A]/12">
                      <Link
                        to="/read/$token"
                        params={{ token: read.token }}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-3.5"
                      >
                        <span className="line-clamp-2 min-w-0 font-serif text-[14px] leading-snug text-[#1A1A1A]/80 group-hover:text-[#1A4BFF]">
                          {read.input}
                        </span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/45">
                          {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-8">
            <section className="border-2 border-[#1A1A1A] bg-white">
              <div className="border-b border-[#1A1A1A]/12 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
                What the record says
              </div>
              <ul className="divide-y divide-[#1A1A1A]/10">
                {profile.signals.slice(0, 3).map((signal) => (
                  <li key={signal.title} className="px-3 py-3">
                    <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${signal.tone === "warn" ? "text-[#C1121F]" : "text-[#1A4BFF]"}`}>
                      {signal.tone === "warn" ? "warning" : "note"}
                    </p>
                    <p className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/80">
                      {signal.title}
                    </p>
                    {signal.detail && (
                      <p className="mt-1 font-serif text-[12px] leading-snug text-[#1A1A1A]/50">
                        {signal.detail}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-[#1A1A1A]/12 px-3 py-2">
                <Link to="/profile" className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4">
                  thinking profile
                </Link>
                <Link to="/digest" className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45 underline underline-offset-4">
                  the record
                </Link>
              </div>
            </section>

            <section className="border-t-2 border-[#1A1A1A] pt-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/45">
                This week
              </p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">
                Your drill targets the exercise you keep getting wrong. It is chosen from your practice
                record, not from a feed.
              </p>
              <Link
                to="/profile"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
              >
                Open the drill <ArrowRight className="h-3 w-3" />
              </Link>
            </section>

            <section className="border-t-2 border-[#1A1A1A] pt-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF]">
                Ask your record
              </p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">
                Ask what your own reads, questions and predictions say. One call, no web.
              </p>
              <Link
                to="/digest"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
              >
                Open the record <ArrowRight className="h-3 w-3" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
