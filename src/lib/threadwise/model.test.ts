import { describe, expect, it } from "vitest";
import { changeKind, createNodeData } from "./model";

describe("threadwise model", () => {
  it("experiments carry hypothesis, method, criteria, outcome and lessons", () => {
    const d = createNodeData("experiment");
    expect(Object.keys(d.meta)).toEqual([
      "status", "hypothesis", "testMethod", "successCriteria", "metrics", "outcome", "lessonsLearned",
      "owner", "durationDays", "probability", "startDate", "dueDate", "reviewDate", "reviewFinding", "priority", "milestone",
    ]);
    expect(d.meta["status"]).toBe("planned");
  });

  it("questions default to unknown epistemic status", () => {
    expect(createNodeData("question").epistemic).toBe("unknown");
  });

  it("changing type drops invalid status values", () => {
    const exp = createNodeData("experiment");
    exp.meta["status"] = "running";
    const action = changeKind(exp, "action");
    expect(action.meta).toEqual({ status: "todo", dueDate: "", startDate: "", owner: "", durationDays:"",probability:"", priority: "medium", milestone: "", reviewDate: "" });
  });
});

import { groundedLift } from "./model";
describe("paper depth", () => {
  it("validated actions and experiments sit flush; open questions and hypotheses float", () => {
    expect(groundedLift({ kind: "action", epistemic: "assumption", meta: { status: "done" } })).toBe(0);
    expect(groundedLift({ kind: "experiment", epistemic: "hypothesis", meta: { result: "validated" } })).toBe(0);
    expect(groundedLift({ kind: "idea", epistemic: "hypothesis", meta: {} })).toBe(0.8);
    expect(groundedLift({ kind: "question", epistemic: "fact", meta: { status: "open" } })).toBe(0.8);
    expect(groundedLift({ kind: "note", epistemic: "fact", meta: {} })).toBe(0);
  });
});
