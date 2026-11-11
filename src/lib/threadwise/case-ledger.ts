/**
 * A case ledger: the claims that recur across a subject's reads, and what
 * actually changed between the latest read and the one before it.
 */
export type CaseClaim = {
  text: string;
  kind: string;
  confidence: string;
  source: string;
  falsifier: string;
};

export type CaseRead = {
  token: string;
  input: string;
  at: string;
  mode: string | null;
  falsifier: string;
  confidence: string | null;
  claims: CaseClaim[];
  counter_reading: string;
  review: string | null;
};

export type LedgerClaim = {
  text: string;
  kind: string;
  latestConfidence: string;
  falsifier: string;
  sources: string[];
  reads: { token: string; at: string; confidence: string }[];
};

export type CaseChange = {
  fromAt: string;
  toAt: string;
  summary: string[];
};

export type CaseLedger = {
  claims: LedgerClaim[];
  predictions: LedgerClaim[];
  change: CaseChange | null;
};

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, 180);

function describeChange(from: CaseRead, to: CaseRead): CaseChange {
  const summary: string[] = [];
  if (to.confidence && from.confidence && to.confidence !== from.confidence) {
    summary.push(`Confidence moved from ${from.confidence} to ${to.confidence}.`);
  }
  if (from.falsifier && to.falsifier && from.falsifier !== to.falsifier) {
    summary.push("The falsifier changed.");
  }
  if (from.counter_reading && to.counter_reading && from.counter_reading !== to.counter_reading) {
    summary.push("The counter-reading changed.");
  }

  const before = new Set(from.claims.map((claim) => normalise(claim.text)).filter(Boolean));
  const after = new Set(to.claims.map((claim) => normalise(claim.text)).filter(Boolean));
  const added = [...after].filter((key) => !before.has(key)).length;
  const dropped = [...before].filter((key) => !after.has(key)).length;
  if (added) summary.push(`${added} new claim${added === 1 ? "" : "s"} entered the record.`);
  if (dropped) summary.push(`${dropped} claim${dropped === 1 ? "" : "s"} no longer appea${dropped === 1 ? "rs" : "r"}.`);

  if (!summary.length) summary.push("The claims and confidence are unchanged; only the reporting moved.");

  return { fromAt: from.at, toAt: to.at, summary };
}

export function buildCaseLedger(reads: CaseRead[]): CaseLedger {
  const ordered = [...reads].sort((a, b) => b.at.localeCompare(a.at));
  const byClaim = new Map<string, LedgerClaim>();

  for (const read of ordered) {
    for (const claim of read.claims) {
      const key = normalise(claim.text);
      if (!key) continue;
      const existing = byClaim.get(key);
      const source = claim.source?.trim() ?? "";
      if (existing) {
        existing.reads.push({ token: read.token, at: read.at, confidence: claim.confidence });
        if (source && !existing.sources.includes(source)) existing.sources.push(source);
        if (!existing.falsifier && claim.falsifier) existing.falsifier = claim.falsifier;
      } else {
        byClaim.set(key, {
          text: claim.text,
          kind: claim.kind,
          latestConfidence: claim.confidence,
          falsifier: claim.falsifier ?? "",
          sources: source ? [source] : [],
          reads: [{ token: read.token, at: read.at, confidence: claim.confidence }],
        });
      }
    }
  }

  const claims = [...byClaim.values()]
    .sort(
      (a, b) =>
        b.reads.length - a.reads.length ||
        b.reads[0]!.at.localeCompare(a.reads[0]!.at) ||
        a.text.localeCompare(b.text),
    )
    .slice(0, 24);

  return {
    claims,
    predictions: claims.filter((claim) => claim.kind === "prediction").slice(0, 8),
    change: ordered.length >= 2 ? describeChange(ordered[1]!, ordered[0]!) : null,
  };
}
