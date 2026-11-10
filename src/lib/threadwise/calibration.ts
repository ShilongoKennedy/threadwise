/**
 * Calibration — turn dated predictions into a track record.
 *
 * Confidence is categorical in the read, so it is mapped to a forecast value.
 * Only confirmed/contradicted watches count; pending and inconclusive ones do
 * not, because scoring an unresolved claim would reward silence.
 */
export type PredictionConfidence = "high" | "medium" | "low";

export type Forecast = {
  confidence: PredictionConfidence;
  status: "pending" | "confirmed" | "contradicted" | "inconclusive";
  origin: string | null;
};

export type CalibrationBucket = {
  confidence: PredictionConfidence;
  total: number;
  settled: number;
  correct: number;
  accuracy: number | null;
  brier: number | null;
};

export type Calibration = {
  predictions: number;
  settled: number;
  brier: number | null;
  buckets: CalibrationBucket[];
};

const FORECAST: Record<PredictionConfidence, number> = {
  high: 0.8,
  medium: 0.55,
  low: 0.3,
};

/** The confidence a watch carries, encoded in its origin as prediction:high. */
export function predictionConfidence(origin: string | null): PredictionConfidence | null {
  const match = origin?.match(/^prediction:(high|medium|low)$/i);
  if (!match) return null;
  return match[1]!.toLowerCase() as PredictionConfidence;
}

export function isPrediction(origin: string | null): boolean {
  return predictionConfidence(origin) !== null;
}

/** Accuracy and Brier score per confidence band, plus the overall record. */
export function calibrationStats(watches: Forecast[]): Calibration {
  const buckets: CalibrationBucket[] = (["high", "medium", "low"] as const).map(
    (confidence) => ({
      confidence,
      total: 0,
      settled: 0,
      correct: 0,
      accuracy: null,
      brier: null,
    }),
  );

  let settled = 0;
  let brierTotal = 0;

  for (const watch of watches) {
    const bucket = buckets.find((item) => item.confidence === watch.confidence);
    if (!bucket) continue;
    bucket.total += 1;
    if (watch.status !== "confirmed" && watch.status !== "contradicted") continue;

    const outcome = watch.status === "confirmed" ? 1 : 0;
    const forecast = FORECAST[watch.confidence];
    bucket.settled += 1;
    bucket.correct += outcome;
    brierTotal += (forecast - outcome) ** 2;
    settled += 1;
  }

  for (const bucket of buckets) {
    if (bucket.settled > 0) {
      bucket.accuracy = bucket.correct / bucket.settled;
      const forecast = FORECAST[bucket.confidence];
      // Recompute the bucket's Brier from its settled members.
      bucket.brier =
        watches
          .filter(
            (watch) =>
              watch.confidence === bucket.confidence &&
              (watch.status === "confirmed" || watch.status === "contradicted"),
          )
          .reduce(
            (sum, watch) =>
              sum + (forecast - (watch.status === "confirmed" ? 1 : 0)) ** 2,
            0,
          ) / bucket.settled;
    }
  }

  return {
    predictions: watches.length,
    settled,
    brier: settled ? brierTotal / settled : null,
    buckets,
  };
}
