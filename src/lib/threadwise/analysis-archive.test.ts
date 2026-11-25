import { beforeEach, describe, expect, it } from "vitest";
import { deleteAnalysis, loadArchive, saveAnalysis, updateAnalysis } from "./analysis-archive";

describe("analysis archive", () => {
  beforeEach(() => localStorage.clear());

  it("saves analyses automatically, newest first, by tool", () => {
    saveAnalysis({ kind: "analyst", title: "One", subtitle: "Read", payload: { n: 1 } });
    saveAnalysis({ kind: "seminar", title: "Two", subtitle: "Seminar", payload: { n: 2 } });
    saveAnalysis({ kind: "anatomy", title: "Three", subtitle: "Anatomy", payload: { n: 3 } });

    expect(loadArchive()).toHaveLength(3);
    expect(loadArchive("seminar")[0]?.title).toBe("Two");
    expect(loadArchive("anatomy")[0]?.payload).toEqual({ n: 3 });
  });

  it("updates and deletes a saved analysis", () => {
    const saved = saveAnalysis({ kind: "seminar", title: "Before", subtitle: "Question", payload: { lesson: false } });
    const updated = updateAnalysis(saved.id, { title: "After", payload: { lesson: true } });
    expect(updated?.title).toBe("After");
    expect(loadArchive("seminar")[0]?.payload).toEqual({ lesson: true });

    deleteAnalysis(saved.id);
    expect(loadArchive("seminar")).toHaveLength(0);
  });
});
