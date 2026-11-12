import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ThinkingProfile } from "@/lib/threadwise/thinking-profile";
import {
  chooseDrill,
  loadDrillHistory,
  loadPracticeAttempts,
  loadWeeklyDrill,
  mergeDrillHistory,
  mergePracticeAttempts,
  practiceSummary,
  saveWeeklyDrill,
  weekKey,
  type Drill,
  type DrillCompletion,
  type DrillRead,
  type PracticeAttempt,
  type PracticeSummary,
} from "@/lib/threadwise/practice";
import {
  loadRemotePractice,
  syncMissingPracticeAttempts,
} from "@/lib/threadwise/practice-sync";
import {
  completeRemoteDrill,
  loadRemoteDrillState,
  saveRemoteDrill,
  syncMissingDrillHistory,
} from "@/lib/threadwise/drill-sync";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { PageMasthead } from "@/components/threadwise/PageMasthead";
import { EmptyState } from "@/components/threadwise/EmptyState";
import { CONFIDENCE_FORECAST } from "@/lib/threadwise/calibration";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Thinking profile — Threadwise" },
      {
        name: "description",
        content:
          "A private mirror of how you reason: calibration, one-sided questions, source concentration, open loops and the corrections the editor made.",
      },
    ],
  }),
  component: ProfilePage,
});

function shorten(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const boundary = cut.lastIndexOf(" ");
  return `${cut.slice(0, boundary > limit * 0.6 ? boundary : limit).trimEnd()}…`;
}

function ProfilePage() {
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);
  const [state, setState] = useState<"loading" | "anon" | "ready" | "error">("loading");
  const [practice, setPractice] = useState<PracticeSummary | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [reads, setReads] = useState<DrillRead[]>([]);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [drillHistory, setDrillHistory] = useState<DrillCompletion[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      if (!jwt) {
        if (alive) setState("anon");
        return;
      }
      const [response, recentResponse] = await Promise.all([
        fetch("/api/thinking-profile", {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
        fetch("/api/analyst-recent", {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
      ]);
      if (!alive) return;
      if (!response.ok) {
        setState("error");
        return;
      }
      const body = (await response.json()) as { profile?: ThinkingProfile };
      if (!body.profile) {
        setState("error");
        return;
      }
      setProfile(body.profile);
      if (recentResponse.ok) {
        const recent = (await recentResponse.json()) as { reads?: DrillRead[] };
        setReads(recent.reads ?? []);
      }
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const local = loadPracticeAttempts();
      const remote = await loadRemotePractice();
      if (!alive) return;
      const merged = mergePracticeAttempts(local, remote.attempts);
      setAttempts(merged);
      setPractice(practiceSummary(merged));
      if (!remote.pending) {
        void syncMissingPracticeAttempts(local, remote.attempts);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!practice || !reads.length) return;
    let alive = true;
    void (async () => {
      const current = weekKey();
      const localDrill = loadWeeklyDrill();
      const localHistory = loadDrillHistory();
      const remote = await loadRemoteDrillState(current);
      if (!alive) return;

      const history = mergeDrillHistory(localHistory, remote.history);
      setDrillHistory(history);
      if (!remote.pending) {
        void syncMissingDrillHistory(
          localHistory.filter((item) => item.week !== current),
          remote.history,
        );
      }

      if (remote.drill) {
        const merged = { ...remote.drill };
        if (
          localDrill?.week === current &&
          localDrill.completedAt &&
          !merged.completedAt
        ) {
          merged.completedAt = localDrill.completedAt;
          void completeRemoteDrill(merged);
        }
        setDrill(merged);
        saveWeeklyDrill(merged);
        return;
      }

      if (localDrill?.week === current) {
        setDrill(localDrill);
        if (localDrill.completedAt) void completeRemoteDrill(localDrill);
        else void saveRemoteDrill(localDrill);
        return;
      }

      const chosen = chooseDrill(practice, attempts, reads, new Date(), history);
      setDrill(chosen);
      if (chosen) {
        saveWeeklyDrill(chosen);
        void saveRemoteDrill(chosen);
      }
    })();
    return () => {
      alive = false;
    };
  }, [practice, attempts, reads]);

  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <AppHeader section="profile" />

      <main className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-10">
        <PageMasthead
          eyebrow="The profile"
          title="The thinking profile."
          deck="What the record says about how you reason. Not a score — a mirror. Every number here comes from reads, questions, findings and predictions you filed."
        />

        {state === "anon" && (
          <EmptyState
            title="The profile belongs to you, so it needs an account."
            action={
              <Link to="/login" className="inline-flex items-center gap-2 border-b border-[#1A4BFF]/40 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]">
                Sign in →
              </Link>
            }
          >
            The profile is built from reads, questions, findings and predictions you filed — not from activity elsewhere.
          </EmptyState>
        )}

        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Reading the record…
          </p>
        )}

        {state === "error" && (
          <p className="mt-8 border-l-2 border-[#C1121F] pl-3 font-serif text-[14px] text-[#C1121F]">
            The profile could not be read just now. Try again.
          </p>
        )}

        {state === "ready" && profile && (
          <>
            {profile.reads === 0 ? (
              <EmptyState
                title="No reads yet."
                action={
                  <Link to="/analyst" className="inline-flex items-center gap-2 border-b border-[#1A4BFF]/40 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]">
                    Bring a move →
                  </Link>
                }
              >
                The profile starts once you have read one move, filed one question or scored one prediction.
              </EmptyState>
            ) : (
              <>
                <section className="mt-8 grid grid-cols-2 border-y-2 border-[#1A1A1A] md:grid-cols-5">
                  {[
                    { label: "reads", value: profile.reads },
                    { label: "reviewed", value: profile.reviewed },
                    { label: "corrections", value: profile.corrections },
                    { label: "open questions", value: profile.questions.open },
                    { label: "predictions", value: profile.calibration.predictions },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`px-4 py-4 ${index > 0 ? "border-l border-[#1A1A1A]/12" : ""} ${
                        index === 2 ? "max-md:border-l-0 max-md:border-t" : ""
                      } ${index === 3 || index === 4 ? "max-md:border-t" : ""} ${
                        index === 4 ? "max-md:col-span-2 max-md:border-l-0" : ""
                      }`}
                    >
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">
                        {stat.label}
                      </div>
                      <div className="mt-1 font-display text-[30px] leading-none">{stat.value}</div>
                    </div>
                  ))}
                </section>

                {drill && (
                  <section className="mt-8 border-y border-[#1A1A1A]/15 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/15 pb-2">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
                        {drill.completedAt ? "This week's drill · done" : "This week's drill"}{" "}
                        · {drill.kind === "teach" ? "teach-back" : drill.kind}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/35">
                        {drill.week}
                      </span>
                    </div>
                    <div className="pt-3">
                      <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                        {shorten(drill.title, 140)}
                      </p>
                      <p className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/60">
                        {drill.reason}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Link
                          to="/practice/$token"
                          params={{ token: drill.token }}
                          search={{ kind: drill.kind }}
                          className="inline-flex border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]"
                        >
                          {drill.completedAt ? "Practice again →" : "Start drill →"}
                        </Link>
                        {drillHistory.length > 0 && (
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                            {drillHistory.length} drill{drillHistory.length === 1 ? "" : "s"} completed
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                <section className="mt-6">
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
                    What the record says
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {profile.signals.map((signal) => (
                      <li
                        key={signal.title}
                        className={`border-l-2 pl-3 ${
                          signal.tone === "warn" ? "border-[#C1121F]" : "border-[#1A4BFF]"
                        }`}
                      >
                        <p
                          className={`font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${
                            signal.tone === "warn" ? "text-[#C1121F]" : "text-[#1A4BFF]"
                          }`}
                        >
                          {signal.tone === "warn" ? "warning" : "note"}
                        </p>
                        <p className="mt-0.5 font-display text-[16px] leading-tight">{signal.title}</p>
                        <p className="mt-0.5 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                          {signal.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/12 px-4 py-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                      Calibration
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                      {profile.calibration.settled}/{profile.calibration.predictions} settled
                      {profile.calibration.brier !== null
                        ? ` · Brier ${profile.calibration.brier.toFixed(2)}`
                        : ""}
                    </span>
                  </div>

                  {profile.calibration.settled === 0 ? (
                    <div className="px-4 py-5">
                      <p className="max-w-[56ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
                        No prediction has settled yet. File a dated prediction from a read; when the
                        date arrives, this becomes a score instead of a mood.
                      </p>
                      <Link
                        to="/digest"
                        className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF] underline underline-offset-4"
                      >
                        See the predictions →
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 px-4 py-4">
                        {profile.calibration.buckets.map((bucket) => {
                          const forecast = CONFIDENCE_FORECAST[bucket.confidence] * 100;
                          const accuracy = bucket.accuracy === null ? 0 : bucket.accuracy * 100;
                          return (
                            <div key={bucket.confidence}>
                              <div className="flex items-baseline justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.12em]">
                                <span className="text-[#1A1A1A]/70">
                                  {bucket.confidence}
                                  <span className="ml-2 text-[#1A1A1A]/45">stated {forecast}%</span>
                                </span>
                                <span className="text-[#1A4BFF]">
                                  {bucket.accuracy === null ? "no settled" : `${Math.round(accuracy)}%`}
                                </span>
                              </div>
                              <div className="relative mt-1 h-2 bg-[#1A1A1A]/10">
                                <span
                                  className="absolute inset-y-0 left-0 bg-[#1A4BFF]"
                                  style={{ width: `${accuracy}%` }}
                                />
                                <span
                                  className="absolute -top-1 h-4 w-px bg-[#C1121F]"
                                  style={{ left: `${forecast}%` }}
                                />
                              </div>
                              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/40">
                                {bucket.correct}/{bucket.settled} right
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="border-t border-[#1A1A1A]/10 px-4 py-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-[#1A1A1A]/45">
                        Blue = observed accuracy. Red mark = stated confidence. Brier: lower is better.
                      </p>
                    </>
                  )}
                </section>

                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <section className="border-t-2 border-[#1A1A1A] pt-4">
                    <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                      Questions
                    </h2>
                    <dl className="mt-3 space-y-2 font-serif text-[13.5px]">
                      <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                        <dt className="text-[#1A1A1A]/60">open</dt>
                        <dd className="font-display text-[16px]">{profile.questions.open}</dd>
                      </div>
                      <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                        <dt className="text-[#1A1A1A]/60">one-sided</dt>
                        <dd className="font-display text-[16px]">{profile.questions.oneSided}</dd>
                      </div>
                      <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                        <dt className="text-[#1A1A1A]/60">no evidence</dt>
                        <dd className="font-display text-[16px]">{profile.questions.noEvidence}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#1A1A1A]/60">oldest open</dt>
                        <dd className="font-mono text-[11px]">
                          {profile.questions.oldestDays === null
                            ? "—"
                            : `${profile.questions.oldestDays} days`}
                        </dd>
                      </div>
                    </dl>
                    <Link
                      to="/questions"
                      className="mt-3 inline-block font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
                    >
                      open questions →
                    </Link>
                  </section>

                  <section className="border-t-2 border-[#1A1A1A] pt-4">
                    <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                      Sources
                    </h2>
                    <p className="mt-2 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                      {profile.sources.total} citations · {profile.sources.unique} outlets ·{" "}
                      {profile.sources.primary} primary documents
                    </p>
                    <ul className="mt-2 space-y-1">
                      {profile.sources.top.map((outlet) => (
                        <li
                          key={outlet.name}
                          className="flex items-baseline justify-between gap-3 border-b border-[#1A1A1A]/10 pb-1 font-serif text-[13px]"
                        >
                          <span className="truncate">{outlet.name}</span>
                          <span className="font-mono text-[9px] text-[#1A1A1A]/50">{outlet.count}</span>
                        </li>
                      ))}
                    </ul>
                    {profile.sources.unreferencedReads > 0 && (
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#C1121F]">
                        {profile.sources.unreferencedReads} reads with no sources
                      </p>
                    )}
                  </section>
                </div>

                <section className="mt-8 border-t-2 border-[#1A1A1A] pt-4">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                    What the reads are made of
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.claimKinds.map((claim) => (
                      <span
                        key={claim.kind}
                        className="border border-[#1A1A1A]/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/65"
                      >
                        {claim.kind} · {claim.count}
                      </span>
                    ))}
                    {profile.modes.map((mode) => (
                      <span
                        key={mode.mode}
                        className="border border-[#1A4BFF]/30 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A4BFF]"
                      >
                        {mode.mode} · {mode.count}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                    {profile.reviewVerdicts.grounded} grounded · {profile.reviewVerdicts.mixed} mixed ·{" "}
                    {profile.reviewVerdicts.unsupported} unsupported
                  </p>
                </section>

                {practice && practice.total > 0 && (
                  <section className="mt-8 border-t-2 border-[#1A1A1A] pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                        Practice
                      </h2>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                        {practice.total} attempt{practice.total === 1 ? "" : "s"} · local record
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {practice.byKind.map((item) => (
                        <li key={item.kind} className="border-b border-[#1A1A1A]/10 pb-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-serif text-[13.5px] capitalize">
                              {item.kind === "teach" ? "Teach-back" : item.kind}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/55">
                              {item.averagePct}% avg · {item.attempts} attempt
                              {item.attempts === 1 ? "" : "s"}
                              {item.deltaPct !== null ? ` · ${item.trend} (${item.deltaPct > 0 ? "+" : ""}${item.deltaPct} pts)` : ""}
                            </span>
                          </div>
                          <div className="mt-1 h-1 bg-[#1A1A1A]/10">
                            <div className="h-full bg-[#1A4BFF]" style={{ width: `${item.averagePct}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                      Structural checks only · local record; sync is best-effort
                    </p>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
