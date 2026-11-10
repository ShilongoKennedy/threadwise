import { describe, expect, it } from "vitest";
import { calibrationStats, isPrediction, predictionConfidence } from "./calibration";

describe("predictionConfidence", () => {
  it("reads confidence from the watch origin", () => {
    expect(predictionConfidence("prediction:high")).toBe("high");
    expect(predictionConfidence("prediction:low")).toBe("low");
  });

  it("ignores watches that are not predictions", () => {
    expect(predictionConfidence("daily-brief")).toBeNull();
    expect(predictionConfidence(null)).toBeNull();
    expect(isPrediction("prediction:medium")).toBe(true);
    expect(isPrediction("daily-brief")).toBe(false);
  });
});

describe("calibrationStats", () => {
  const stats = calibrationStats([
    { confidence: "high", status: "confirmed", origin: "prediction:high" },
    { confidence: "high", status: "contradicted", origin: "prediction:high" },
    { confidence: "low", status: "confirmed", origin: "prediction:low" },
    { confidence: "medium", status: "pending", origin: "prediction:medium" },
  ]);

  it("counts only settled predictions", () => {
    expect(stats.predictions).toBe(4);
    expect(stats.settled).toBe(3);
  });

  it("computes accuracy per confidence band", () => {
    expect(stats.buckets.find((bucket) => bucket.confidence === "high")).toMatchObject({
      total: 2,
      settled: 2,
      correct: 1,
      accuracy: 0.5,
    });
    expect(stats.buckets.find((bucket) => bucket.confidence === "low")).toMatchObject({
      settled: 1,
      correct: 1,
      accuracy: 1,
    });
    expect(stats.buckets.find((bucket) => bucket.confidence === "medium")).toMatchObject({
      total: 1,
      settled: 0,
      accuracy: null,
      brier: null,
    });
  });

  it("computes a Brier score over settled predictions", () => {
    expect(stats.brier).toBeCloseTo(0.39, 5);
    expect(
      stats.buckets.find((bucket) => bucket.confidence === "high")?.brier,
    ).toBeCloseTo(0.34, 5);
  });
});
