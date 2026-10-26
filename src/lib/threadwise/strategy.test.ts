import { describe, expect, it } from "vitest";
import { createNodeData, type Epistemic } from "./model";
import type { TNode } from "./store";
import { DEFAULT_SCENARIO, dossier, runScenario, runwayAnalysis, sensitivity } from "./strategy";

const node = (id: string, kind: "action" | "idea", meta: Record<string, string> = {}, epistemic?: Epistemic): TNode => {
  const d = createNodeData(kind, id);
  return { id, type: "thread", position: { x: 0, y: 0 }, data: { ...d, meta: { ...d.meta, ...meta }, epistemic: epistemic ?? d.epistemic } };
};

describe("scenario stress-tester", () => {
  it("breaks even in the first month cumulative profit reaches zero", () => {
    const r = runScenario({ ...DEFAULT_SCENARIO, leads: 100, conversion: 10, price: 100, unitCost: 0, fixedCost: 0, startupCost: 2500, growth: 0, delay: 0, months: 6 });
    // 10, 20, 30 customers × €100 → cumulative -1500, 500
    expect(r.breakEvenMonth).toBe(2);
    expect(r.rows[0]?.cumulative).toBe(-1500);
  });
  it("earns nothing during the launch delay", () => {
    const r = runScenario({ ...DEFAULT_SCENARIO, delay: 3, fixedCost: 0, startupCost: 0 });
    expect(r.rows.slice(0, 3).every((m) => m.revenue === 0)).toBe(true);
  });
  it("never breaks even when price is below unit cost", () => {
    const r = runScenario({ ...DEFAULT_SCENARIO, price: 10, unitCost: 20 });
    expect(r.breakEvenMonth).toBeNull();
    expect(r.breakEvenCustomers).toBe(Infinity);
  });
  it("ranks drivers by swing", () => {
    const s = sensitivity(DEFAULT_SCENARIO);
    expect(s[0]!.swing).toBeGreaterThanOrEqual(s[s.length - 1]!.swing);
  });
});

describe("runway matrix", () => {
  it("subtracts committed action costs before dividing by team burn", () => {
    const a = node("a", "action", { owner: "Ana", durationDays: "10" });
    const r = runwayAnalysis([a], { capital: 12000, team: [{ id: "1", name: "ana", monthlyCost: 2000, daysPerMonth: 20 }], costs: { a: 2000 } }, new Date("2026-01-01"));
    expect(r.runwayMonths).toBe(5);
    expect(r.people[0]?.demand).toBe(10);
  });
  it("puts work with unknown owners under Unassigned", () => {
    const r = runwayAnalysis([node("a", "action", { owner: "Zed" })], { capital: 0, team: [], costs: {} });
    expect(r.people.map((p) => p.name)).toEqual(["Unassigned"]);
  });
});

describe("dossier", () => {
  it("scores confidence from epistemic weights", () => {
    const d = dossier([node("f", "idea", {}, "fact"), node("u", "idea", {}, "unknown")], []);
    expect(d.confidence).toBe(50);
  });
});
