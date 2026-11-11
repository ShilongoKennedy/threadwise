import { describe, expect, it } from "vitest";
import { buildWeeklyReview } from "./weekly-review";

const now = new Date("2026-11-11T12:00:00Z");

const base = {
  reads: [
    {
      token: "a",
      input: "A read this week",
      at: "2026-11-09T10:00:00Z",
      report: { subject: "Iran", revision: { patched: 2 } },
    },
    { token: "old", input: "An old read", at: "2026-10-01T10:00:00Z" },
  ],
  questions: [
    { id: "q1", question: "Will Iran let inspectors back in?", status: "open", created_at: "2026-11-09T10:00:00Z" },
    { id: "q2", question: "Has Starlink become a US tool?", status: "open", created_at: "2026-11-08T10:00:00Z" },
    { id: "q3", question: "An old question?", status: "open", created_at: "2026-09-01T10:00:00Z" },
  ],
  findings: [
    { question_id: "q2", stance: "for", created_at: "2026-11-08T10:00:00Z" },
    { question_id: "q2", stance: "for", created_at: "2026-11-09T10:00:00Z" },
    { question_id: "q2", stance: "for", created_at: "2026-11-10T10:00:00Z" },
  ],
  watches: [
    {
      claim: "Iran will allow inspectors",
      status: "confirmed",
      due_date: "2026-11-01",
      checked_at: "2026-11-08T10:00:00Z",
      origin: "prediction:high",
    },
    {
      claim: "The Board will meet",
      status: "pending",
      due_date: "2026-11-01",
      checked_at: null,
      origin: "prediction:medium",
    },
  ],
  practice: [{ passed: 4, total: 5, created_at: "2026-11-10T10:00:00Z" }],
  now,
};

describe("buildWeeklyReview", () => {
  it("counts the week only", () => {
    const review = buildWeeklyReview(base);
    expect(review.counts.reads).toBe(1);
    expect(review.counts.evidence).toBe(3);
    expect(review.counts.questions).toBe(2);
    expect(review.counts.predictionsSettled).toBe(1);
    expect(review.counts.practice).toBe(1);
    expect(review.counts.corrections).toBe(2);
  });

  it("puts empty questions ahead of one-sided ones", () => {
    const review = buildWeeklyReview(base);
    expect(review.openQuestions[0]?.id).toBe("q1");
    expect(review.openQuestions[0]?.state).toBe("no evidence");
    expect(review.openQuestions.find((question) => question.id === "q2")?.state).toBe("one-sided");
    expect(review.overdue[0]?.claim).toBe("The Board will meet");
  });

  it("recommends evidence when a question is empty", () => {
    expect(buildWeeklyReview(base).next.kind).toBe("question");
    expect(buildWeeklyReview(base).next.title).toContain("Will Iran");
  });

  it("starts with a read when the week is empty", () => {
    const review = buildWeeklyReview({ ...base, reads: [], now });
    expect(review.counts.reads).toBe(0);
    expect(review.next.kind).toBe("read");
  });

  it("falls back to practice when questions and predictions are clear", () => {
    const review = buildWeeklyReview({
      ...base,
      findings: [],
      questions: [],
      watches: [],
      reads: base.reads,
      now,
    });
    expect(review.next.kind).toBe("practice");
  });
});
