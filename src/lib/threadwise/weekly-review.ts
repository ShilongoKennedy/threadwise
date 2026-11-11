/**
 * The weekly review: a deterministic close of the loop. It reads timestamps and
 * current state, never the model. The recommendation is the only opinion.
 */
export type ReviewRead = {
  token: string;
  input: string;
  at: string;
  report?: {
    subject?: string;
    revision?: { patched?: number };
    review?: { verdict?: string };
  };
};

export type ReviewQuestion = {
  id: string;
  question: string;
  status: string;
  created_at: string;
};

export type ReviewFinding = {
  question_id: string;
  stance: string;
  created_at: string;
};

export type ReviewWatch = {
  claim: string;
  status: string;
  due_date: string;
  checked_at: string | null;
  origin: string | null;
};

export type ReviewPractice = {
  passed: number;
  total: number;
  created_at: string;
};

export type WeeklyReview = {
  from: string;
  to: string;
  counts: {
    reads: number;
    evidence: number;
    questions: number;
    predictionsSettled: number;
    practice: number;
    corrections: number;
  };
  reads: ReviewRead[];
  corrections: number;
  openQuestions: {
    id: string;
    question: string;
    state: "no evidence" | "one-sided" | "open";
    forCount: number;
    againstCount: number;
  }[];
  overdue: { claim: string; due_date: string }[];
  next:
    | { kind: "read"; title: string; detail: string }
    | { kind: "question"; id: string; title: string; detail: string }
    | { kind: "prediction"; title: string; detail: string }
    | { kind: "practice"; title: string; detail: string };
};

const DAY = 86_400_000;
const within = (value: string, from: number, to: number) => {
  const time = new Date(value).getTime();
  return time >= from && time <= to;
};

export function buildWeeklyReview(input: {
  reads: ReviewRead[];
  questions: ReviewQuestion[];
  findings: ReviewFinding[];
  watches: ReviewWatch[];
  practice: ReviewPractice[];
  now?: Date;
}): WeeklyReview {
  const now = input.now ?? new Date();
  const from = new Date(now.getTime() - 7 * DAY);
  const fromTime = from.getTime();
  const toTime = now.getTime();
  const today = now.toISOString().slice(0, 10);

  const reads = input.reads
    .filter((read) => within(read.at, fromTime, toTime))
    .sort((a, b) => b.at.localeCompare(a.at));
  const evidence = input.findings.filter((finding) =>
    within(finding.created_at, fromTime, toTime),
  );
  const questions = input.questions.filter((question) =>
    within(question.created_at, fromTime, toTime),
  );
  const practice = input.practice.filter((attempt) =>
    within(attempt.created_at, fromTime, toTime),
  );
  const predictionsSettled = input.watches.filter(
    (watch) =>
      (watch.status === "confirmed" || watch.status === "contradicted") &&
      watch.checked_at &&
      within(watch.checked_at, fromTime, toTime),
  );
  const corrections = reads.reduce(
    (sum, read) => sum + Math.max(0, read.report?.revision?.patched ?? 0),
    0,
  );

  const openQuestions = input.questions
    .filter((question) => question.status === "open")
    .map((question) => {
      const mine = input.findings.filter((finding) => finding.question_id === question.id);
      const forCount = mine.filter((finding) => finding.stance === "for").length;
      const againstCount = mine.length - forCount;
      const state =
        mine.length === 0
          ? "no evidence"
          : mine.length >= 3 && (forCount === 0 || againstCount === 0)
            ? "one-sided"
            : "open";
      return { id: question.id, question: question.question, state, forCount, againstCount };
    })
    .sort((a, b) => {
      const rank = { "no evidence": 0, "one-sided": 1, open: 2 };
      return rank[a.state] - rank[b.state];
    });

  const overdue = input.watches
    .filter(
      (watch) =>
        watch.status === "pending" &&
        watch.due_date < today &&
        watch.origin?.startsWith("prediction:"),
    )
    .map((watch) => ({ claim: watch.claim, due_date: watch.due_date }));

  const noEvidence = openQuestions.find((question) => question.state === "no evidence");
  const oneSided = openQuestions.find((question) => question.state === "one-sided");

  const next: WeeklyReview["next"] =
    reads.length === 0
      ? {
          kind: "read",
          title: "Read one source this week.",
          detail: "The record is quiet. Start with the source already open in another tab.",
        }
      : noEvidence
        ? {
            kind: "question",
            id: noEvidence.id,
            title: `File evidence on “${noEvidence.question}”`,
            detail: "It is open and has no evidence on either side.",
          }
        : oneSided
          ? {
              kind: "question",
              id: oneSided.id,
              title: `Find the counter-case on “${oneSided.question}”`,
              detail: "Every finding is on one side. Name the observation that would change your mind.",
            }
          : overdue.length > 0
            ? {
                kind: "prediction",
                title: `Resolve “${overdue[0]!.claim}”`,
                detail: `It was due on ${overdue[0]!.due_date} and is still open.`,
              }
            : {
                kind: "practice",
                title: "Practise the gap.",
                detail: "No question is empty or one-sided. Use the week’s drill to keep the reasoning sharp.",
              };

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    counts: {
      reads: reads.length,
      evidence: evidence.length,
      questions: questions.length,
      predictionsSettled: predictionsSettled.length,
      practice: practice.length,
      corrections,
    },
    reads,
    corrections,
    openQuestions: openQuestions.slice(0, 5),
    overdue: overdue.slice(0, 5),
    next,
  };
}
