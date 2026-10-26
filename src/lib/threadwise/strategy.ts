import { auditGraph } from "./graph";
import type { Epistemic } from "./model";
import type { TEdge, TNode } from "./store";

/* ---------- Scenario stress-tester ---------- */

export type ScenarioParams = {
  leads: number; // qualified leads per month at launch
  conversion: number; // % of leads that become paying customers
  price: number; // revenue per customer per month
  unitCost: number; // variable cost per customer per month
  fixedCost: number; // fixed cost per month
  startupCost: number; // one-off cost before launch
  growth: number; // % lead growth per month
  delay: number; // months before revenue starts
  months: number; // horizon
};

export const DEFAULT_SCENARIO: ScenarioParams = {
  leads: 400,
  conversion: 3,
  price: 120,
  unitCost: 35,
  fixedCost: 4000,
  startupCost: 15000,
  growth: 4,
  delay: 2,
  months: 24,
};

export const SCENARIO_FIELDS: {
  key: keyof ScenarioParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: "leads", label: "Leads per month", min: 0, max: 5000, step: 10, unit: "" },
  { key: "conversion", label: "Conversion rate", min: 0, max: 50, step: 0.1, unit: "%" },
  { key: "price", label: "Price per customer / mo", min: 0, max: 2000, step: 5, unit: "€" },
  { key: "unitCost", label: "Variable cost / customer", min: 0, max: 2000, step: 5, unit: "€" },
  { key: "fixedCost", label: "Fixed cost / month", min: 0, max: 100000, step: 250, unit: "€" },
  { key: "startupCost", label: "One-off startup cost", min: 0, max: 500000, step: 1000, unit: "€" },
  { key: "growth", label: "Monthly lead growth", min: -20, max: 40, step: 0.5, unit: "%" },
  { key: "delay", label: "Launch delay", min: 0, max: 24, step: 1, unit: "mo" },
  { key: "months", label: "Horizon", min: 3, max: 60, step: 1, unit: "mo" },
];

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

export function normalizeScenario(p?: Partial<ScenarioParams>): ScenarioParams {
  const out = { ...DEFAULT_SCENARIO };
  for (const f of SCENARIO_FIELDS)
    out[f.key] = Math.min(f.max, Math.max(f.min, num(p?.[f.key], DEFAULT_SCENARIO[f.key])));
  out.months = Math.round(out.months);
  out.delay = Math.round(out.delay);
  return out;
}

export type ScenarioMonth = {
  month: number;
  customers: number;
  revenue: number;
  profit: number;
  cumulative: number;
};

/** Customers recur monthly from new conversions; there is no churn model. Months are 1-based. */
export function runScenario(input: ScenarioParams) {
  const p = normalizeScenario(input);
  const rows: ScenarioMonth[] = [];
  let cumulative = -p.startupCost;
  let customers = 0;
  let breakEvenMonth: number | null = null;
  for (let m = 1; m <= p.months; m++) {
    const live = m > p.delay;
    if (live) {
      const sinceLaunch = m - p.delay - 1;
      customers += p.leads * Math.pow(1 + p.growth / 100, sinceLaunch) * (p.conversion / 100);
    }
    const revenue = customers * p.price;
    const profit = revenue - customers * p.unitCost - p.fixedCost;
    cumulative += profit;
    if (breakEvenMonth === null && cumulative >= 0) breakEvenMonth = m;
    rows.push({ month: m, customers, revenue, profit, cumulative });
  }
  const contribution = p.price - p.unitCost;
  return {
    rows,
    breakEvenMonth,
    final: rows[rows.length - 1]?.cumulative ?? -p.startupCost,
    contribution,
    breakEvenCustomers: contribution > 0 ? p.fixedCost / contribution : Infinity,
    trough: Math.min(-p.startupCost, ...rows.map((r) => r.cumulative)),
  };
}

/** One-at-a-time sensitivity: swing in final cumulative result when a driver moves ±delta%. */
export function sensitivity(input: ScenarioParams, delta = 20) {
  const p = normalizeScenario(input);
  const base = runScenario(p).final;
  return SCENARIO_FIELDS.filter((f) => f.key !== "months")
    .map((f) => {
      const shift = (dir: 1 | -1) => {
        const v = p[f.key];
        const moved = f.key === "delay" || f.key === "growth" ? v + dir * Math.max(1, Math.abs(v) * delta / 100) : v * (1 + (dir * delta) / 100);
        return runScenario({ ...p, [f.key]: moved }).final - base;
      };
      const low = shift(-1),
        high = shift(1);
      return { key: f.key, label: f.label, low, high, swing: Math.abs(high - low) };
    })
    .sort((a, b) => b.swing - a.swing);
}

/* ---------- Resource & runway ---------- */

export type TeamMember = { id: string; name: string; monthlyCost: number; daysPerMonth: number };
export type RunwayPlan = { capital: number; team: TeamMember[]; costs: Record<string, number> };
export const emptyRunway = (): RunwayPlan => ({ capital: 0, team: [], costs: {} });

const isDone = (n: TNode) =>
  ["done", "completed", "complete", "abandoned"].includes(n.data.meta["status"] ?? "");
const validDay = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const monthsBetween = (from: Date, to: Date) =>
  Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

export function runwayAnalysis(nodes: TNode[], plan: RunwayPlan, today = new Date()) {
  const work = nodes.filter((n) => ["action", "experiment"].includes(n.data.kind));
  const open = work.filter((n) => !isDone(n));
  const dues = open.map((n) => n.data.meta["dueDate"]).filter(validDay) as string[];
  const lastDue = dues.length ? new Date(dues.sort().at(-1) as string) : null;
  const horizon = Math.max(1, lastDue ? monthsBetween(today, lastDue) : 1);
  const burn = plan.team.reduce((a, m) => a + Math.max(0, m.monthlyCost || 0), 0);
  const committed = open.reduce((a, n) => a + Math.max(0, plan.costs[n.id] ?? 0), 0);
  const spent = work.filter(isDone).reduce((a, n) => a + Math.max(0, plan.costs[n.id] ?? 0), 0);
  const free = plan.capital - committed;
  const runwayMonths = burn > 0 ? Math.max(0, free) / burn : free >= 0 ? Infinity : 0;
  const cashOut = Number.isFinite(runwayMonths)
    ? new Date(today.getTime() + runwayMonths * 30.4375 * 864e5)
    : null;
  const key = (s: string) => s.trim().toLowerCase();
  const people = [
    ...plan.team.map((m) => ({ id: m.id, name: m.name, capacity: Math.max(0, m.daysPerMonth || 0) * horizon })),
    { id: "unassigned", name: "Unassigned", capacity: 0 },
  ].map((p) => {
    const tasks = open.filter((n) => {
      const owner = key(n.data.meta["owner"] ?? "");
      return p.id === "unassigned"
        ? !plan.team.some((m) => m.name.trim() && key(m.name) === owner)
        : owner !== "" && key(p.name) === owner;
    });
    const demand = tasks.reduce((a, n) => a + Math.max(0, Number(n.data.meta["durationDays"]) || 1), 0);
    return { ...p, demand, tasks: tasks.length, load: p.capacity > 0 ? demand / p.capacity : demand > 0 ? Infinity : 0 };
  }).filter((p) => p.id !== "unassigned" || p.tasks > 0);
  const groups = new Map<string, TNode[]>();
  for (const n of work) {
    const m = n.data.meta["milestone"]?.trim() || "Unscheduled";
    groups.set(m, [...(groups.get(m) ?? []), n]);
  }
  const milestones = [...groups.entries()].map(([name, list]) => {
    const due = list.map((n) => n.data.meta["dueDate"]).filter(validDay).sort().at(-1) ?? "";
    return {
      name,
      due,
      total: list.length,
      done: list.filter(isDone).length,
      cost: list.reduce((a, n) => a + (plan.costs[n.id] ?? 0), 0),
      atRisk: !!due && !!cashOut && new Date(due) > cashOut,
    };
  }).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  return { burn, committed, spent, free, runwayMonths, cashOut, horizon, people, milestones, open: open.length, work: work.length };
}

/* ---------- Post-decision dossier ---------- */

export const CONFIDENCE_WEIGHT: Record<Epistemic, number> = {
  fact: 1,
  evidence: 0.85,
  assumption: 0.35,
  hypothesis: 0.25,
  unknown: 0,
};

export function dossier(nodes: TNode[], edges: TEdge[]) {
  const counts: Record<Epistemic, number> = { fact: 0, evidence: 0, assumption: 0, hypothesis: 0, unknown: 0 };
  for (const n of nodes) counts[n.data.epistemic]++;
  const confidence = nodes.length
    ? Math.round((nodes.reduce((a, n) => a + CONFIDENCE_WEIGHT[n.data.epistemic], 0) / nodes.length) * 100)
    : 0;
  const lens = (k: "scarcity" | "difficulty" | "risk") => {
    const rated = nodes.filter((n) => n.data.lenses[k] > 0);
    return rated.length ? Math.round((rated.reduce((a, n) => a + n.data.lenses[k], 0) / rated.length / 3) * 100) : 0;
  };
  const work = nodes.filter((n) => ["action", "experiment"].includes(n.data.kind));
  const faults = auditGraph(nodes, edges).length;
  const done = work.filter(isDone).length;
  const radar = [
    { axis: "Scarcity", value: lens("scarcity") },
    { axis: "Difficulty", value: lens("difficulty") },
    { axis: "Risk", value: lens("risk") },
    { axis: "Uncertainty", value: 100 - confidence },
    { axis: "Fault exposure", value: work.length ? Math.min(100, Math.round((faults / work.length) * 100)) : faults ? 100 : 0 },
    { axis: "Execution gap", value: work.length ? Math.round(((work.length - done) / work.length) * 100) : 0 },
  ];
  const grade = confidence >= 75 ? "Well grounded" : confidence >= 50 ? "Partly grounded" : confidence >= 25 ? "Thinly grounded" : "Speculative";
  return { counts, confidence, grade, radar, faults, done, work: work.length };
}
