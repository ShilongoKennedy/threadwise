/**
 * The thinking profile — a mirror built from the record, not a personality test.
 *
 * It aggregates reads, claims, reviews, questions, findings and predictions into
 * the few observations that are actually actionable: where the evidence is
 * one-sided, where the record is too narrow, and whether confidence has been
 * earning itself.
 */
import { calibrationStats, isPrediction, type Calibration } from "./calibration";

export type ProfileRead = {
  token: string;
  created_at: string;
  report: {
    mode?: string;
    confidence?: string;
    sources?: { title: string; url: string }[];
    claims?: { kind?: string; confidence?: string }[];
    review?: { verdict?: string; issues?: unknown[] };
    revision?: { patched?: number };
  };
};

export type ProfileQuestion = {
  id: string;
  question: string;
  status: string;
  created_at: string;
};

export type ProfileFinding = {
  question_id: string;
  stance: string;
  created_at: string;
};

export type ProfileWatch = {
  status: string;
  origin: string | null;
  due_date: string;
};

export type ProfileSignal = {
  tone: "warn" | "note";
  title: string;
  detail: string;
};

export type ThinkingProfile = {
  reads: number;
  reviewed: number;
  corrections: number;
  reviewVerdicts: { grounded: number; mixed: number; unsupported: number };
  modes: { mode: string; count: number }[];
  confidence: { documented: number; inferred: number; speculative: number };
  claimKinds: { kind: string; count: number }[];
  sources: {
    total: number;
    unique: number;
    primary: number;
    unreferencedReads: number;
    topShare: number;
    top: { name: string; count: number }[];
  };
  questions: {
    open: number;
    answered: number;
    oneSided: number;
    noEvidence: number;
    oldestDays: number | null;
  };
  calibration: Calibration;
  loops: { openPredictions: number; overduePredictions: number };
  signals: ProfileSignal[];
};

function sourceOutlet(source: { title: string; url: string }): string {
  const title = source.title?.trim() ?? "";
  if (title.startsWith("Primary ·")) return "Official document";
  if (title.startsWith("Background ·")) return "Encyclopedia";
  const parts = title.split(" · ");
  if (parts[0] === "Situation" || parts[0] === "Layer") {
    return parts[1]?.trim() || "Other";
  }
  if (parts.length > 1) return parts[0]!.trim() || "Other";
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

export function buildThinkingProfile(input: {
  reads: ProfileRead[];
  questions: ProfileQuestion[];
  findings: ProfileFinding[];
  watches: ProfileWatch[];
  now?: Date;
}): ThinkingProfile {
  const now = input.now ?? new Date();
  const reads = input.reads;
  const allSources = reads.flatMap((read) => read.report?.sources ?? []);

  const outletCounts = new Map<string, number>();
  for (const source of allSources) {
    const outlet = sourceOutlet(source);
    outletCounts.set(outlet, (outletCounts.get(outlet) ?? 0) + 1);
  }
  const top = [...outletCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  const modeCounts = new Map<string, number>();
  const confidence = { documented: 0, inferred: 0, speculative: 0 };
  const claimKind = new Map<string, number>([
    ["fact", 0],
    ["inference", 0],
    ["value", 0],
    ["prediction", 0],
  ]);
  const reviewVerdicts = { grounded: 0, mixed: 0, unsupported: 0 };
  let reviewed = 0;
  let corrections = 0;

  for (const read of reads) {
    const report = read.report ?? {};
    const mode = report.mode || "report";
    modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);

    const level = report.confidence;
    if (level === "documented" || level === "inferred" || level === "speculative") {
      confidence[level] += 1;
    } else {
      confidence.inferred += 1;
    }

    for (const claim of report.claims ?? []) {
      const kind = claim.kind || "fact";
      claimKind.set(kind, (claimKind.get(kind) ?? 0) + 1);
    }

    if (report.review) {
      reviewed += 1;
      const verdict = report.review.verdict;
      if (verdict === "grounded" || verdict === "mixed" || verdict === "unsupported") {
        reviewVerdicts[verdict] += 1;
      }
      corrections += Math.max(0, report.revision?.patched ?? 0);
    }
  }

  const findingsByQuestion = new Map<string, { for: number; against: number }>();
  for (const finding of input.findings) {
    const counts = findingsByQuestion.get(finding.question_id) ?? { for: 0, against: 0 };
    if (finding.stance === "against") counts.against += 1;
    else counts.for += 1;
    findingsByQuestion.set(finding.question_id, counts);
  }

  const openQuestions = input.questions.filter((question) => question.status === "open");
  let oneSided = 0;
  let noEvidence = 0;
  for (const question of openQuestions) {
    const counts = findingsByQuestion.get(question.id) ?? { for: 0, against: 0 };
    const total = counts.for + counts.against;
    if (total === 0) noEvidence += 1;
    else if (total >= 3 && (counts.for === 0 || counts.against === 0)) oneSided += 1;
  }
  const oldestDays = openQuestions.length
    ? Math.max(
        ...openQuestions.map((question) =>
          Math.max(
            0,
            Math.floor((now.getTime() - new Date(question.created_at).getTime()) / 86_400_000),
          ),
        ),
      )
    : null;

  const predictions = input.watches.filter((watch) => isPrediction(watch.origin));
  const calibration = calibrationStats(
    predictions.map((watch) => {
      const confidenceValue = watch.origin?.split(":")[1];
      return {
        confidence:
          confidenceValue === "high" || confidenceValue === "low" ? confidenceValue : "medium",
        status:
          watch.status === "confirmed" ||
          watch.status === "contradicted" ||
          watch.status === "inconclusive"
            ? watch.status
            : "pending",
        origin: watch.origin,
      };
    }),
  );
  const today = now.toISOString().slice(0, 10);
  const overduePredictions = predictions.filter(
    (watch) => watch.status === "pending" && watch.due_date < today,
  ).length;

  const signals: ProfileSignal[] = [];
  if (noEvidence > 0) {
    signals.push({
      tone: "warn",
      title: `${noEvidence} open question${noEvidence === 1 ? "" : "s"} with no evidence`,
      detail: "The questions are doing no work until something is filed against them.",
    });
  }
  if (oneSided > 0) {
    signals.push({
      tone: "warn",
      title: `${oneSided} one-sided question${oneSided === 1 ? "" : "s"}`,
      detail: "Three or more findings, all on one side. Ask what the strongest counter-case is.",
    });
  }
  if (reviewVerdicts.unsupported > 0) {
    signals.push({
      tone: "warn",
      title: `${reviewVerdicts.unsupported} read${reviewVerdicts.unsupported === 1 ? "" : "s"} had unsupported central claims`,
      detail: "The editor caught them, but the pattern is worth seeing.",
    });
  }
  if (calibration.settled >= 3 && calibration.brier !== null && calibration.brier > 0.25) {
    signals.push({
      tone: "warn",
      title: "Confidence is not earning itself yet",
      detail: `Your Brier score is ${calibration.brier.toFixed(
        2,
      )}; lower is better. High-confidence misses are the expensive ones.`,
    });
  }
  if (allSources.length >= 5 && top[0] && top[0].count / allSources.length >= 0.5) {
    signals.push({
      tone: "warn",
      title: "The record is narrow",
      detail: `${Math.round(
        (top[0].count / allSources.length) * 100,
      )}% of citations come from ${top[0].name}. Widen the record before trusting the pattern.`,
    });
  }
  if (predictions.length === 0) {
    signals.push({
      tone: "note",
      title: "No predictions filed",
      detail: "Calibration cannot start until a claim has a date and an outcome.",
    });
  }
  if (corrections > 0) {
    signals.push({
      tone: "note",
      title: `${corrections} claim${corrections === 1 ? "" : "s"} corrected before publication`,
      detail: "The editor is doing work; this is the record of it.",
    });
  }
  if (reads.length > 0 && openQuestions.length === 0) {
    signals.push({
      tone: "note",
      title: "No open questions",
      detail: "The record has evidence but no decision it is trying to close.",
    });
  }
  if (!signals.length) {
    signals.push({
      tone: "note",
      title: "Nothing anomalous in the record yet",
      detail: "Keep filing reads and predictions; the profile sharpens with use.",
    });
  }

  return {
    reads: reads.length,
    reviewed,
    corrections,
    reviewVerdicts,
    modes: [...modeCounts.entries()]
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count),
    confidence,
    claimKinds: [...claimKind.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
    sources: {
      total: allSources.length,
      unique: outletCounts.size,
      primary: allSources.filter((source) => source.title?.startsWith("Primary ·")).length,
      unreferencedReads: reads.filter((read) => !(read.report?.sources?.length)).length,
      topShare: allSources.length && top[0] ? top[0].count / allSources.length : 0,
      top,
    },
    questions: {
      open: openQuestions.length,
      answered: input.questions.filter((question) => question.status === "answered").length,
      oneSided,
      noEvidence,
      oldestDays,
    },
    calibration,
    loops: {
      openPredictions: predictions.filter((watch) => watch.status === "pending").length,
      overduePredictions,
    },
    signals: signals.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "warn" ? -1 : 1)).slice(0, 5),
  };
}
