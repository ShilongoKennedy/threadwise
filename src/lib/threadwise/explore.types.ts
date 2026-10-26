export type RawSuggestion = {
  kind: "question" | "experiment" | "connection";
  title: string;
  body: string;
  rationale: string;
  epistemic: "fact" | "evidence" | "assumption" | "hypothesis" | "unknown";
  relation: string;
  anchorId: string;
  targetId: string | null;
  hypothesis: string | null;
  successCriteria: string | null;
};

export type ExploreInput = {
  focusId: string | null;
  nodes: { id: string; kind: string; title: string; body: string; epistemic: string; lenses: Record<string, number>; meta: Record<string, string> }[];
  edges: { source: string; target: string; relation: string }[];
};
