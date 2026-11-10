import { describe, expect, it } from "vitest";
import { buildThinkingProfile, type ProfileRead } from "./thinking-profile";

const reads: ProfileRead[] = [
  {
    token: "read-a",
    created_at: "2026-11-01T09:00:00Z",
    report: {
      mode: "report",
      confidence: "documented",
      sources: [
        { title: "Reuters · 2026-11-01 · A story", url: "https://www.reuters.com/a" },
        { title: "BBC · 2026-11-01 · A story", url: "https://www.bbc.co.uk/a" },
      ],
      claims: [
        { kind: "fact", confidence: "high" },
        { kind: "prediction", confidence: "high" },
      ],
      review: { verdict: "mixed", issues: [{}] },
      revision: { patched: 1 },
    },
  },
  {
    token: "read-b",
    created_at: "2026-11-05T09:00:00Z",
    report: {
      mode: "legal",
      confidence: "inferred",
      sources: [
        { title: "Primary · Budget document", url: "https://www.iaea.org/b.pdf" },
        { title: "Reuters · 2026-11-05 · A story", url: "https://www.reuters.com/b" },
        { title: "Situation · Reuters · 2026-11-05", url: "https://www.reuters.com/b" },
      ],
      claims: [{ kind: "inference", confidence: "medium" }],
      review: { verdict: "grounded" },
    },
  },
];

const profile = buildThinkingProfile({
  reads,
  questions: [
    { id: "q1", question: "Will the bill pass?", status: "open", created_at: "2026-10-01T00:00:00Z" },
    { id: "q2", question: "Is the court independent?", status: "open", created_at: "2026-11-01T00:00:00Z" },
    { id: "q3", question: "Did the minister resign?", status: "answered", created_at: "2026-09-01T00:00:00Z" },
  ],
  findings: [
    { question_id: "q1", stance: "for", created_at: "2026-11-01T00:00:00Z" },
    { question_id: "q1", stance: "for", created_at: "2026-11-02T00:00:00Z" },
    { question_id: "q1", stance: "for", created_at: "2026-11-03T00:00:00Z" },
  ],
  watches: [
    { status: "confirmed", origin: "prediction:high", due_date: "2026-11-01" },
    { status: "pending", origin: "prediction:high", due_date: "2026-11-01" },
    { status: "contradicted", origin: "prediction:low", due_date: "2026-11-02" },
  ],
  now: new Date("2026-11-10T12:00:00Z"),
});

describe("buildThinkingProfile", () => {
  it("summarises reads, reviews and corrections", () => {
    expect(profile.reads).toBe(2);
    expect(profile.reviewed).toBe(2);
    expect(profile.corrections).toBe(1);
    expect(profile.reviewVerdicts).toEqual({ grounded: 1, mixed: 1, unsupported: 0 });
    expect(profile.modes).toEqual([
      { mode: "report", count: 1 },
      { mode: "legal", count: 1 },
    ]);
  });

  it("counts claim kinds and source concentration", () => {
    expect(profile.claimKinds.find((item) => item.kind === "prediction")?.count).toBe(1);
    expect(profile.sources.total).toBe(5);
    expect(profile.sources.unique).toBe(3);
    expect(profile.sources.primary).toBe(1);
    expect(profile.sources.top[0]).toEqual({ name: "Reuters", count: 3 });
    expect(profile.sources.topShare).toBeCloseTo(0.6, 5);
  });

  it("flags one-sided and empty questions", () => {
    expect(profile.questions.open).toBe(2);
    expect(profile.questions.answered).toBe(1);
    expect(profile.questions.oneSided).toBe(1);
    expect(profile.questions.noEvidence).toBe(1);
    expect(profile.questions.oldestDays).toBe(40);
  });

  it("calibrates predictions and counts open loops", () => {
    expect(profile.calibration.predictions).toBe(3);
    expect(profile.calibration.settled).toBe(2);
    expect(profile.calibration.brier).toBeCloseTo(0.065, 5);
    expect(profile.loops.openPredictions).toBe(1);
    expect(profile.loops.overduePredictions).toBe(1);
  });

  it("surfaces the actionable signals, warnings first", () => {
    expect(profile.signals[0]?.tone).toBe("warn");
    expect(profile.signals.some((signal) => /one-sided/i.test(signal.title))).toBe(true);
    expect(profile.signals.some((signal) => /no evidence/i.test(signal.title))).toBe(true);
    expect(profile.signals.some((signal) => /corrected/i.test(signal.title))).toBe(true);
  });
});
