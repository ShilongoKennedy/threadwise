/** Shared, client-safe vocabulary for adaptive reads. No server imports. */

export const READ_FORMS = {
  brief: {
    label: "Brief",
    description: "A short, direct read for a signal, a single move, or a question with little record behind it.",
  },
  document: {
    label: "Document read",
    description: "A provenance-first read of a quoted document, report, filing, or second-hand excerpt.",
  },
  chronology: {
    label: "Chronology",
    description: "A sequence where timing, turning points, or what changed when is the actual story.",
  },
  actors: {
    label: "Actor map",
    description: "A read organised around who gains, who loses, who decides, and who is absent.",
  },
  comparison: {
    label: "Comparison",
    description: "Two accounts, cases, or explanations held side by side until the point of divergence.",
  },
  audit: {
    label: "Claim audit",
    description: "A claim-by-claim examination where the weakest link in the record is the centre.",
  },
} as const;

export type ReadForm = keyof typeof READ_FORMS;

export const READ_FORM_KEYS = Object.keys(READ_FORMS) as ReadForm[];

export type ReadBlock =
  | { kind: "argument"; title: string; body: string }
  | { kind: "chronology"; title: string; events: { when: string; what: string }[] }
  | { kind: "document"; title: string; quote: string; provenance: string; reading: string }
  | { kind: "actors"; title: string; actors: { name: string; wants: string; constraint: string }[] }
  | {
      kind: "contrast";
      title: string;
      left_label: string;
      left_text: string;
      right_label: string;
      right_text: string;
      crux: string;
    }
  | {
      kind: "figures";
      title: string;
      figures: { value: string; label: string; year: string; source: string; caveat: string }[];
    }
  | { kind: "gap"; title: string; body: string; cannot_say: string }
  | { kind: "question"; title: string; question: string; why: string }
  | { kind: "test"; title: string; claim: string; would_change: string }
  | { kind: "aside"; title: string; body: string };

export const BLOCK_KINDS = [
  "argument",
  "chronology",
  "document",
  "actors",
  "contrast",
  "figures",
  "gap",
  "question",
  "test",
  "aside",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

export const SEMINAR_FORMS = {
  duel: {
    label: "Duel",
    description: "Two genuine rival explanations that cannot both be true.",
  },
  trilemma: {
    label: "Trilemma",
    description: "Three positions where reducing the dispute to two would distort it.",
  },
  single: {
    label: "Single reading",
    description: "One serious explanation, tested against its strongest objection; use when a second rival would be manufactured.",
  },
} as const;

export type SeminarForm = keyof typeof SEMINAR_FORMS;
