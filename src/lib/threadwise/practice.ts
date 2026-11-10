/**
 * Practice — the part that teaches thinking rather than displaying it.
 *
 * The check is structural, not a grade: did you name an actor, give a condition,
 * explain a cause, use the read's own test? The read's answer is revealed after,
 * so the comparison is the lesson.
 */
export type PracticeKind = "falsifier" | "steelman" | "teach";

export type PracticeReport = {
  move: string;
  why_now: string;
  counter_reading: string;
  falsifier: string;
  claims?: { text: string }[];
};

export type PracticeCheck = { label: string; passed: boolean };

const STOP = new Set([
  "The", "This", "That", "These", "Those", "A", "An", "It", "Its", "But", "And",
  "If", "When", "While", "After", "Before", "In", "On", "For", "To", "Of", "As",
  "At", "By", "With", "From", "He", "She", "They", "We", "You", "I", "His", "Her",
  "Their", "Our", "There", "Here", "What", "Which", "Who", "Why", "How", "Not",
]);

/** Capitalised names and acronyms, enough to check whether an answer is grounded. */
export function namedEntities(text: string): string[] {
  const capitalised = text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) ?? [];
  return [
    ...new Set(
      [...capitalised, ...acronyms].filter((word) => !STOP.has(word)),
    ),
  ];
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const mentionsEntities = (answer: string, source: string) => {
  const lower = answer.toLowerCase();
  return namedEntities(source).some((entity) => lower.includes(entity.toLowerCase()));
};

export function checkPractice(
  kind: PracticeKind,
  answer: string,
  report: PracticeReport,
): PracticeCheck[] {
  const checks: PracticeCheck[] = [
    {
      label: "A sentence or two (15+ words)",
      passed: words(answer) >= 15,
    },
    {
      label: "Names an actor or institution",
      passed: namedEntities(answer).length > 0,
    },
    {
      label: "Gives a condition or deadline",
      passed: /\b(if|when|unless|until|before|after|by|once)\b/i.test(answer),
    },
  ];

  if (kind === "falsifier") {
    checks.push({
      label: "Uses the read's own test",
      passed: mentionsEntities(answer, report.falsifier),
    });
    checks.push({
      label: "Names the observation that would settle it",
      passed:
        /\b(confirm|contradict|show|prove|pass|fail|resign|rule|vote|announce|sign|cut|raise|drop|win|lose|publish|release)(s|ed|ing)?\b/i.test(
          answer,
        ),
    });
  }

  if (kind === "steelman") {
    checks.push({
      label: "Concedes a routine or ordinary explanation",
      passed:
        /\b(but|however|although|yet|while|because|routine|ordinary|expected|incremental|procedural|precedent)\b/i.test(
          answer,
        ),
    });
    checks.push({
      label: "Uses the counter-case's actors",
      passed: mentionsEntities(answer, report.counter_reading),
    });
  }

  if (kind === "teach") {
    checks.push({
      label: "Explains a cause, not just a sequence",
      passed:
        /\b(because|so that|which means|therefore|as a result|in order to|leads to|causes)\b/i.test(
          answer,
        ),
    });
    checks.push({
      label: "Says why now",
      passed: mentionsEntities(answer, report.why_now),
    });
    checks.push({
      label: "Describes the move",
      passed: mentionsEntities(answer, report.move),
    });
  }

  return checks;
}

export type PracticeAttempt = {
  token: string;
  kind: PracticeKind;
  passed: number;
  total: number;
  at: string;
};

const STORAGE_KEY = "threadwise:practice:v1";
const MAX_ATTEMPTS = 200;

/** Local only: practice is private and does not need a server round-trip. */
export function loadPracticeAttempts(): PracticeAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (attempt): attempt is PracticeAttempt =>
        Boolean(attempt) &&
        typeof attempt === "object" &&
        typeof (attempt as PracticeAttempt).token === "string" &&
        ["falsifier", "steelman", "teach"].includes((attempt as PracticeAttempt).kind) &&
        typeof (attempt as PracticeAttempt).passed === "number" &&
        typeof (attempt as PracticeAttempt).total === "number" &&
        typeof (attempt as PracticeAttempt).at === "string",
    );
  } catch {
    return [];
  }
}

export function recordPracticeAttempt(attempt: PracticeAttempt): void {
  try {
    const attempts = [...loadPracticeAttempts(), attempt].slice(-MAX_ATTEMPTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Private mode or a full store: practice still works, it just is not kept.
  }
}

export type PracticeKindSummary = {
  kind: PracticeKind;
  attempts: number;
  averagePct: number;
  recentPct: number | null;
  deltaPct: number | null;
  trend: "improving" | "steady" | "slipping" | "starting";
  lastAt: string | null;
};

export type PracticeSummary = {
  total: number;
  lastAt: string | null;
  byKind: PracticeKindSummary[];
};

const percent = (attempts: PracticeAttempt[]) => {
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const passed = attempts.reduce((sum, attempt) => sum + attempt.passed, 0);
  return total ? (passed / total) * 100 : 0;
};

export function practiceSummary(attempts: PracticeAttempt[]): PracticeSummary {
  const ordered = [...attempts].sort((a, b) => a.at.localeCompare(b.at));
  const byKind = (["falsifier", "steelman", "teach"] as const)
    .map((kind): PracticeKindSummary | null => {
      const list = ordered.filter((attempt) => attempt.kind === kind);
      if (!list.length) return null;
      const recent = list.slice(-5);
      const older = list.slice(-10, -5);
      const recentPct = percent(recent);
      const deltaPct = older.length ? recentPct - percent(older) : null;
      return {
        kind,
        attempts: list.length,
        averagePct: Math.round(percent(list)),
        recentPct: Math.round(recentPct),
        deltaPct: deltaPct === null ? null : Math.round(deltaPct),
        trend:
          deltaPct === null
            ? "starting"
            : deltaPct > 5
              ? "improving"
              : deltaPct < -5
                ? "slipping"
                : "steady",
        lastAt: list.at(-1)?.at ?? null,
      };
    })
    .filter((item): item is PracticeKindSummary => item !== null);

  return {
    total: ordered.length,
    lastAt: ordered.at(-1)?.at ?? null,
    byKind,
  };
}

/** Local and synced attempts share a key, so a device switch does not double-count. */
export function mergePracticeAttempts(
  local: PracticeAttempt[],
  remote: PracticeAttempt[],
): PracticeAttempt[] {
  const byKey = new Map<string, PracticeAttempt>();
  for (const attempt of [...local, ...remote]) {
    byKey.set(`${attempt.token}|${attempt.kind}|${attempt.at}`, attempt);
  }
  return [...byKey.values()].sort((a, b) => a.at.localeCompare(b.at));
}

export type DrillRead = { token: string; input: string; at: string };

export type Drill = {
  week: string;
  kind: PracticeKind;
  token: string;
  title: string;
  reason: string;
  completedAt?: string;
};

export type DrillCompletion = {
  week: string;
  kind: PracticeKind;
  token: string;
  completedAt: string;
};

const DRILL_KEY = "threadwise:drill:v1";
const HISTORY_KEY = "threadwise:drill-history:v1";

/** ISO week, so the drill changes on Monday rather than on every profile load. */
export function weekKey(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function loadWeeklyDrill(): Drill | null {
  try {
    const raw = localStorage.getItem(DRILL_KEY);
    if (!raw) return null;
    const drill = JSON.parse(raw) as Drill;
    if (
      drill &&
      typeof drill.week === "string" &&
      typeof drill.token === "string" &&
      ["falsifier", "steelman", "teach"].includes(drill.kind) &&
      typeof drill.title === "string" &&
      typeof drill.reason === "string"
    ) {
      return drill;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveWeeklyDrill(drill: Drill): void {
  try {
    localStorage.setItem(DRILL_KEY, JSON.stringify(drill));
  } catch {
    // Private mode: the drill can still be shown for this load.
  }
}

export function loadDrillHistory(): DrillCompletion[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DrillCompletion =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as DrillCompletion).week === "string" &&
        ["falsifier", "steelman", "teach"].includes((item as DrillCompletion).kind) &&
        typeof (item as DrillCompletion).token === "string" &&
        typeof (item as DrillCompletion).completedAt === "string",
    );
  } catch {
    return [];
  }
}

/** Marks the pinned drill done once the matching exercise has been compared. */
export function completeWeeklyDrill(token: string, kind: PracticeKind): boolean {
  const drill = loadWeeklyDrill();
  if (!drill || drill.week !== weekKey() || drill.token !== token || drill.kind !== kind) {
    return false;
  }
  if (drill.completedAt) return true;

  const completedAt = new Date().toISOString();
  saveWeeklyDrill({ ...drill, completedAt });
  try {
    const history = loadDrillHistory()
      .filter((item) => item.week !== drill.week)
      .slice(-51);
    history.push({ week: drill.week, kind, token, completedAt });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // The drill is still marked done even if history cannot be kept.
  }
  return true;
}

/** The weakest practiced exercise, applied to a read not yet drilled for it. */
export function chooseDrill(
  summary: PracticeSummary,
  attempts: PracticeAttempt[],
  reads: DrillRead[],
  now = new Date(),
  history: DrillCompletion[] = [],
): Drill | null {
  if (!reads.length) return null;

  const tried = summary.byKind;
  const slipping = tried.find((item) => item.trend === "slipping");
  const weakest =
    slipping ??
    [...tried].sort(
      (a, b) => a.averagePct - b.averagePct || a.attempts - b.attempts,
    )[0];
  const kind = weakest?.kind ?? "falsifier";
  const label = kind === "teach" ? "teach-back" : kind;
  const practiced = new Set(
    attempts.filter((attempt) => attempt.kind === kind).map((attempt) => attempt.token),
  );
  const read = reads.find((candidate) => !practiced.has(candidate.token)) ?? reads[0]!;

  const lastCompleted = [...history].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )[0];
  const completedPrefix =
    lastCompleted && lastCompleted.week !== weekKey(now)
      ? "You completed last week's drill. "
      : "";
  const reason =
    completedPrefix +
    (weakest?.trend === "slipping"
      ? `Your ${label} is slipping (${weakest.deltaPct} points). This read needs that move.`
      : weakest
        ? `Your ${label} average is ${weakest.averagePct}% — the weakest of the exercises you have practiced.`
        : "No practice recorded yet. Start with the falsifier: it is the move everything else depends on.");

  return {
    week: weekKey(now),
    kind,
    token: read.token,
    title: read.input.slice(0, 160),
    reason,
  };
}

/** One completion per week; the account copy wins when both exist. */
export function mergeDrillHistory(
  local: DrillCompletion[],
  remote: DrillCompletion[],
): DrillCompletion[] {
  const byWeek = new Map<string, DrillCompletion>();
  for (const item of [...local, ...remote]) byWeek.set(item.week, item);
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week));
}
