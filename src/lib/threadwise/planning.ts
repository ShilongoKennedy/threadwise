import { connectedDirection, auditGraph, reasoningLinks } from "./graph";
import { createNodeData, type ThreadNodeType } from "./model";
import type { TNode, TEdge } from "./store";

export type Decision = {
  id: string;
  title: string;
  conclusion: string;
  tradeoffs: string;
  nodeIds: string[];
  analysis: { evidence: string[]; uncertain: string[]; faults: number };
  status: "draft" | "approved";
  signoffs: { userId: string; name: string; at: string }[];
  createdAt: string;
  reviewDate: string;
};
export type Planning = { decisions: Decision[]; templateId?: string; step?: number };
export function analyzeDecision(ids: string[], nodes: TNode[], edges: TEdge[]) {
  const scope = new Set(
    ids.flatMap((id) => [
      id,
      ...connectedDirection(id, edges, true),
      ...connectedDirection(id, edges, false),
    ]),
  );
  const relevant = nodes.filter((n) => scope.has(n.id));
  return {
    nodeIds: relevant.map((n) => n.id),
    evidence: relevant
      .filter((n) => ["fact", "evidence"].includes(n.data.epistemic))
      .map((n) => n.id),
    uncertain: relevant
      .filter((n) => ["assumption", "hypothesis", "unknown"].includes(n.data.epistemic))
      .map((n) => n.id),
    faults: auditGraph(nodes, edges).filter((f) => scope.has(f.actionId)).length,
  };
}
export function executionNodes(decision: Decision, nodes: TNode[], edges: TEdge[]) {
  const ids = new Set(decision.nodeIds);
  const actions = nodes.filter(
    (n) => ids.has(n.id) && ["action", "experiment"].includes(n.data.kind),
  );
  const links = reasoningLinks(edges);
  const remaining = [...actions];
  const ordered: TNode[] = [];
  while (remaining.length) {
    const index = remaining.findIndex(
      (n) => !links.some((e) => e.to === n.id && remaining.some((x) => x.id === e.from)),
    );
    const next = remaining.splice(index < 0 ? 0 : index, 1)[0];
    if (next) ordered.push(next);
  }
  return ordered;
}
export function validDate(value?: string) {
  return (
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function scheduleEvents(nodes: TNode[], decisions: Decision[]) {
  return [
    ...nodes.flatMap((n) => [
      ...(validDate(n.data.meta["dueDate"])
        ? [
            {
              id: `${n.id}-due`,
              nodeId: n.id,
              title: n.data.title,
              date: n.data.meta["dueDate"] ?? "",
              start: validDate(n.data.meta["startDate"])
                ? (n.data.meta["startDate"] ?? "")
                : (n.data.meta["dueDate"] ?? ""),
              kind: n.data.kind,
            },
          ]
        : []),
      ...(validDate(n.data.meta["reviewDate"])
        ? [
            {
              id: `${n.id}-review`,
              nodeId: n.id,
              title: `Review: ${n.data.title}`,
              date: n.data.meta["reviewDate"] ?? "",
              start: n.data.meta["reviewDate"] ?? "",
              kind: "review",
            },
          ]
        : []),
    ]),
    ...decisions
      .filter((d) => validDate(d.reviewDate))
      .map((d) => ({
        id: d.id,
        nodeId: "",
        title: `Decision review: ${d.title}`,
        date: d.reviewDate,
        start: d.reviewDate,
        kind: "review",
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
type Template = {
  id: string;
  title: string;
  audience: string;
  steps: string[];
  cards: [ThreadNodeType, string, string][];
};
export const TEMPLATES: Template[] = [
  {
    id: "business",
    title: "Executive Business Plan",
    audience: "Leadership",
    steps: [
      "Frame the opportunity",
      "Challenge the economics",
      "Validate demand",
      "Commit resources",
    ],
    cards: [
      ["idea", "Business opportunity", "Who do we serve, and what changes for them?"],
      ["note", "Market evidence", "Capture market size, sources and customer observations."],
      ["question", "Commercial assumptions", "What must be true for this business to work?"],
      [
        "experiment",
        "Validate willingness to pay",
        "Define a small test, success criteria and a budget.",
      ],
      ["action", "Build the operating plan", "Assign an owner, priority and launch milestone."],
    ],
  },
  {
    id: "product",
    title: "Product Strategy & Launch",
    audience: "Product teams",
    steps: [
      "Define the customer problem",
      "Choose a strategy",
      "Test the promise",
      "Prepare launch",
    ],
    cards: [
      ["idea", "Customer problem", "Describe the unmet need and target segment."],
      ["note", "Customer signals", "Add interviews, usage data and competitor evidence."],
      ["question", "Positioning trade-offs", "What are we choosing not to build?"],
      ["experiment", "Prototype validation", "Test the core promise with representative users."],
      ["action", "Launch readiness", "Plan delivery, distribution, support and measures."],
    ],
  },
  {
    id: "risk",
    title: "Risk Assessment & Pre-mortem",
    audience: "Leadership",
    steps: ["Imagine failure", "Identify fault lines", "Test mitigations", "Assign safeguards"],
    cards: [
      ["idea", "The plan failed", "Imagine it is six months later. What went wrong?"],
      ["note", "Known risk evidence", "Record incidents, dependencies and constraints."],
      ["question", "Hidden assumptions", "Where are we relying on untested beliefs?"],
      ["experiment", "Stress-test a safeguard", "Test the highest-impact failure mode."],
      ["action", "Mitigation owner", "Assign an accountable owner and escalation date."],
    ],
  },
  {
    id: "retro",
    title: "Leadership Team Retrospective",
    audience: "Teams",
    steps: ["Reflect silently", "Cluster patterns", "Test a change", "Agree commitments"],
    cards: [
      ["idea", "A better next quarter", "What should change in how we work?"],
      ["note", "What happened", "Capture wins, friction and specific examples."],
      ["question", "Root causes", "Which tensions or habits produced the results?"],
      ["experiment", "Try one team change", "Choose a reversible improvement and success measure."],
      ["action", "Team commitment", "Assign ownership and a review check-in."],
    ],
  },
  {
    id: "personal",
    title: "Personal Project / Holiday Planning",
    audience: "Individual planners",
    steps: ["Set your intention", "Check constraints", "Explore options", "Book the next step"],
    cards: [
      ["idea", "The experience I want", "Describe the project or holiday and what matters most."],
      ["note", "Budget and constraints", "Capture dates, costs, preferences and sources."],
      ["question", "Open choices", "What is still undecided or needs research?"],
      ["experiment", "Try before committing", "Compare an itinerary, prototype or small trial."],
      ["action", "Next booking or task", "Set a date, priority and milestone."],
    ],
  },
];
export function templateGraph(id: string) {
  const t = TEMPLATES.find((t) => t.id === id);
  if (!t) throw new Error("Template not found");
  const nodes: TNode[] = t.cards.map(([kind, title, body], i) => ({
    id: crypto.randomUUID(),
    type: "thread",
    position: { x: i * 340, y: (i % 2) * 220 },
    data: { ...createNodeData(kind, title), body },
  }));
  const edges: TEdge[] = nodes
    .slice(1)
    .map((n, i) => ({
      id: crypto.randomUUID(),
      source: nodes[i]?.id ?? "",
      target: n.id,
      type: "relation",
      data: { relation: i === 0 ? "supports" : "leads_to" },
    }));
  return { nodes, edges };
}
