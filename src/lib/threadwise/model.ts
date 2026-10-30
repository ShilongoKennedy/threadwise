export const NODE_TYPES = ["idea", "note", "question", "experiment", "action", "portal", "dossier"] as const;
export type ThreadNodeType = (typeof NODE_TYPES)[number];

export const EPISTEMIC = ["fact", "evidence", "assumption", "hypothesis", "unknown"] as const;
export type Epistemic = (typeof EPISTEMIC)[number];

export const LENSES = ["scarcity", "difficulty", "risk"] as const;
export type Lens = (typeof LENSES)[number];
/** 0 = not assessed, 1 = low, 2 = medium, 3 = high */
export type LensLevel = 0 | 1 | 2 | 3;
export const LENS_LEVELS = ["—", "Low", "Medium", "High"] as const;

export const RELATIONS = [
  "supports",
  "contradicts",
  "causes",
  "depends_on",
  "similar_to",
  "example_of",
  "could_solve",
  "leads_to",
  "needs_evidence_from",
  "custom",
] as const;
export type Relation = (typeof RELATIONS)[number];

export const relationLabel = (r: Relation, custom?: string) =>
  r === "custom" ? custom?.trim() || "custom" : r.replace(/_/g, " ");

export type ThreadNodeData = {
  color?: import("./paper").PaperColor | (string & {});
  kind: ThreadNodeType;
  title: string;
  body: string;
  epistemic: Epistemic;
  lenses: Record<Lens, LensLevel>;
  meta: Record<string, string>;
};

export type ThreadEdgeData = {
  relation: Relation;
  customLabel?: string | undefined;
  ghost?: boolean;
  traced?: boolean;
  provenance?: boolean;
  fault?: boolean;
  dimmed?: boolean;
};

export type MetaField = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "date";
  options?: string[];
};

export const TYPE_INFO: Record<
  ThreadNodeType,
  { label: string; hint: string; defaultEpistemic: Epistemic; fields: MetaField[] }
> = {
  idea: {
    label: "Idea",
    hint: "Possibility, concept, opportunity, or proposed explanation",
    defaultEpistemic: "hypothesis",
    fields: [
      {
        key: "status",
        label: "Status",
        kind: "select",
        options: ["raw", "exploring", "promising", "parked", "discarded"],
      },
    ],
  },
  note: {
    label: "Note",
    hint: "Observation, reading, or research",
    defaultEpistemic: "evidence",
    fields: [{ key: "source", label: "Source", kind: "text" }],
  },
  question: {
    label: "Question",
    hint: "Unresolved question or unknown",
    defaultEpistemic: "unknown",
    fields: [
      {
        key: "status",
        label: "Status",
        kind: "select",
        options: ["open", "investigating", "answered"],
      },
      { key: "answer", label: "Current answer", kind: "textarea" },
    ],
  },
  experiment: {
    label: "Experiment",
    hint: "A test of a hypothesis with criteria and outcomes",
    defaultEpistemic: "hypothesis",
    fields: [
      {
        key: "status",
        label: "Status",
        kind: "select",
        options: ["planned", "running", "completed", "abandoned"],
      },
      { key: "hypothesis", label: "Hypothesis", kind: "textarea" },
      { key: "testMethod", label: "Test method", kind: "textarea" },
      { key: "successCriteria", label: "Success criteria", kind: "textarea" },
      { key: "metrics", label: "Metrics", kind: "text" },
      { key: "outcome", label: "Outcome", kind: "textarea" },
      { key: "lessonsLearned", label: "Lessons learned", kind: "textarea" },
      { key: "owner", label: "Owner", kind: "text" },
      { key: "durationDays", label: "Estimated duration (days)", kind: "text" },
      { key: "probability", label: "Estimated success (%)", kind: "text" },
      { key: "startDate", label: "Start date", kind: "date" },
      { key: "dueDate", label: "Deadline", kind: "date" },
      { key: "reviewDate", label: "Review check-in", kind: "date" },
      { key: "reviewFinding", label: "Review finding", kind: "textarea" },
      { key: "priority", label: "Priority", kind: "select", options: ["medium", "high", "low"] },
      { key: "milestone", label: "Milestone", kind: "text" },
    ],
  },
  action: {
    label: "Action",
    hint: "A concrete next step",
    defaultEpistemic: "fact",
    fields: [
      { key: "status", label: "Status", kind: "select", options: ["todo", "doing", "done"] },
      { key: "dueDate", label: "Due date", kind: "date" },
      { key: "startDate", label: "Start date", kind: "date" },
      { key: "owner", label: "Owner", kind: "text" },
      { key: "durationDays", label: "Estimated duration (days)", kind: "text" },
      { key: "probability", label: "Estimated success (%)", kind: "text" },
      { key: "priority", label: "Priority", kind: "select", options: ["medium", "high", "low"] },
      { key: "milestone", label: "Milestone", kind: "text" },
      { key: "reviewDate", label: "Review check-in", kind: "date" },
    ],
  },
  portal: {
    label: "Portal",
    hint: "Open a dedicated child canvas",
    defaultEpistemic: "unknown",
    fields: [],
  },
  dossier: {
    label: "Dossier",
    hint: "Source document anchor for planted insights",
    defaultEpistemic: "fact",
    fields: [
      { key: "source", label: "Source title", kind: "text" },
      { key: "sourceUrl", label: "Source URL", kind: "text" },
    ],
  },
};

export function defaultMeta(kind: ThreadNodeType): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const f of TYPE_INFO[kind].fields)
    meta[f.key] = f.kind === "select" ? (f.options?.[0] ?? "") : "";
  return meta;
}

export function createNodeData(kind: ThreadNodeType, title = ""): ThreadNodeData {
  return {
    kind,
    title: title || `New ${TYPE_INFO[kind].label.toLowerCase()}`,
    body: "",
    epistemic: TYPE_INFO[kind].defaultEpistemic,
    lenses: { scarcity: 0, difficulty: 0, risk: 0 },
    meta: defaultMeta(kind),
  };
}

/** Changing type keeps shared metadata keys and adds the new type's defaults. */
export function changeKind(data: ThreadNodeData, kind: ThreadNodeType): ThreadNodeData {
  const fresh = defaultMeta(kind);
  const meta: Record<string, string> = {};
  for (const k of Object.keys(fresh)) {
    const allowed = TYPE_INFO[kind].fields.find((f) => f.key === k);
    const prev = data.meta[k];
    meta[k] =
      prev && (!allowed?.options || allowed.options.includes(prev)) ? prev : (fresh[k] ?? "");
  }
  return { ...data, kind, meta };
}

/**
 * How "ungrounded" a card looks, 0 (flush, proven) to 1 (floating, unbacked).
 * Validated experiments and completed actions sit flush regardless of status.
 */
export function groundedLift(data: {
  kind: ThreadNodeType;
  epistemic: Epistemic;
  meta: Record<string, string | undefined>;
}) {
  if (data.kind === "experiment" && data.meta["result"] === "validated") return 0;
  if (data.kind === "action" && data.meta["status"] === "done") return 0;
  const base = { fact: 0, evidence: 0.15, assumption: 0.6, hypothesis: 0.8, unknown: 1 }[
    data.epistemic
  ];
  if (data.kind === "question" && data.meta["status"] !== "answered") return Math.max(base, 0.8);
  return base;
}