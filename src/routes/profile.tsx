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
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader section="profile" />

      <main className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-10">
        <h1 className="font-display text-[34px] leading-none md:text-[48px]">The thinking profile.</h1>
        <p className="mt-3 max-w-[56ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/70">
          What the record says about how you reason. Not a score — a mirror. Every number here comes
          from reads, questions, findings and predictions you filed.
        </p>

        {state === "anon" && (
          <div className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center">
            <p className="font-display text-xl">The profile belongs to you, so it needs an account.</p>
            <Link
              to="/login"
              className="mt-3 inline-flex border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]"
            >
              Sign in
            </Link>
          </div>
        )}

        {state === "loading" && (
          <p className="py-16 font-mono text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
            Reading the record…
          </p>
        )}

        {state === "error" && (
          <p className="mt-8 border-2 border-[#C1121F] bg-[#C1121F]/5 px-4 py-3 font-serif text-[14px] text-[#C1121F]">
            The profile could not be read just now. Try again.
          </p>
        )}

        {state === "ready" && profile && (
          <>
            {profile.reads === 0 ? (
              <section className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center">
                <p className="font-display text-xl">No reads yet.</p>
                <p className="mx-auto mt-2 max-w-[42ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
                  The profile starts once you have read one move, filed one question or scored one
                  prediction.
                </p>
                <Link
                  to="/analyst"
                  className="mt-4 inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]"
                >
                  Bring a move <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            ) : (
              <>
                <section className="mt-8 grid grid-cols-2 border-2 border-[#1A1A1A] md:grid-cols-5">
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
                  <section className="mt-6 border-2 border-[#1A4BFF] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1A4BFF] px-3 py-1.5">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white">
                        {drill.completedAt ? "This week's drill · done" : "This week's drill"}{" "}
                        · {drill.kind === "teach" ? "teach-back" : drill.kind}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/70">
                        {drill.week}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                        {drill.title}
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
                          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
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
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1A1A1A] px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
                      Calibration
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                      {profile.calibration.settled}/{profile.calibration.predictions} settled
                      {profile.calibration.brier !== null
                        ? ` · Brier ${profile.calibration.brier.toFixed(2)}`
                        : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[#1A1A1A]/10">
                    {profile.calibration.buckets.map((bucket) => (
                      <div key={bucket.confidence} className="px-3 py-3">
                        <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
                          {bucket.confidence}
                        </div>
                        <div className="mt-1 font-display text-[22px] leading-none">
                          {bucket.accuracy === null ? "—" : `${Math.round(bucket.accuracy * 100)}%`}
                        </div>
                        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                          {bucket.correct}/{bucket.settled} right
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="border-t border-[#1A1A1A]/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                    Brier: lower is better · confidence maps to 80 / 55 / 30%
                  </p>
                </section>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <section className="border-2 border-[#1A1A1A] bg-white p-4">
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

                  <section className="border-2 border-[#1A1A1A] bg-white p-4">
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
                      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#C1121F]">
                        {profile.sources.unreferencedReads} reads with no sources
                      </p>
                    )}
                  </section>
                </div>

                <section className="mt-6 border-2 border-[#1A1A1A] bg-white p-4">
                  <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                    What the reads are made of
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.claimKinds.map((claim) => (
                      <span
                        key={claim.kind}
                        className="border border-[#1A1A1A]/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/65"
                      >
                        {claim.kind} · {claim.count}
                      </span>
                    ))}
                    {profile.modes.map((mode) => (
                      <span
                        key={mode.mode}
                        className="border border-[#1A4BFF]/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF]"
                      >
                        {mode.mode} · {mode.count}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                    {profile.reviewVerdicts.grounded} grounded · {profile.reviewVerdicts.mixed} mixed ·{" "}
                    {profile.reviewVerdicts.unsupported} unsupported
                  </p>
                </section>

                {practice && practice.total > 0 && (
                  <section className="mt-6 border-2 border-[#1A1A1A] bg-white p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                        Practice
                      </h2>
                      <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                        {practice.total} attempt{practice.total === 1 ? "" : "s"} · local record
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {practice.byKind.map((item) => (
                        <li
                          key={item.kind}
                          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1A1A1A]/10 pb-1.5"
                        >
                          <span className="font-serif text-[13.5px] capitalize">
                            {item.kind === "teach" ? "Teach-back" : item.kind}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/55">
                            {item.averagePct}% avg · {item.attempts} attempt
                            {item.attempts === 1 ? "" : "s"}
                            {item.deltaPct !== null ? ` · ${item.trend} (${item.deltaPct > 0 ? "+" : ""}${item.deltaPct} pts)` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
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
