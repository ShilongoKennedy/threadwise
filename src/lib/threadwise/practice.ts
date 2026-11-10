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
