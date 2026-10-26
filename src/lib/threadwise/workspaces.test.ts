import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaces } from "./workspaces";
import { useThread } from "./store";
import { cloudDocument, breadcrumbs } from "./workspace-model";
import { useSocratic, SOCRATIC_KEY } from "./socratic";
import { addEvidence } from "./evidence";

describe("workspace and inquiry rules", () => {
  it("preserves frames, inbox and branch bases in capture and cloud without conversations", () => {
    const ws = useWorkspaces.getState(),
      id = ws.workspaces[0]?.document.activeCanvasId ?? "";
    ws.updateSuite(id, {
      frames: [],
      inbox: [{ id: "capture", text: "Private plan" }],
      stops: [],
      seals: [],
    });
    useThread.getState().addNode("idea", { x: 0, y: 0 });
    const branchId = ws.branchCanvas(id, "Alternative");
    const doc = useWorkspaces.getState().workspaces[0]?.document;
    if (!doc) throw new Error("Missing workspace");
    expect(cloudDocument(doc).canvases.find((c) => c.id === id)?.suite?.inbox[0]?.text).toBe(
      "Private plan",
    );
    expect(
      cloudDocument(doc).canvases.find((c) => c.id === branchId)?.suite?.branch?.baseNodes,
    ).toHaveLength(1);
  });
  beforeEach(() => {
    localStorage.clear();
    useWorkspaces.setState({ workspaces: [], activeId: null, owner: null, ready: false });
    useThread.setState({
      nodes: [],
      edges: [],
      ghosts: [],
      history: [],
      replayIndex: null,
      selectedId: null,
    });
    useSocratic.setState({ sessions: [], ready: false });
    useWorkspaces.getState().boot();
  });
  it("new unnamed canvases retain existing work without requiring deletion", () => {
    const ws = useWorkspaces.getState();
    const first = ws.workspaces[0]?.document.activeCanvasId ?? "";
    useThread.getState().addNode("note", { x: 0, y: 0 });
    const next = ws.createCanvas();
    expect(next).not.toBe(first);
    expect(useWorkspaces.getState().workspaces[0]?.document.canvases).toHaveLength(2);
    ws.switchCanvas(first);
    expect(useThread.getState().nodes[0]?.data.kind).toBe("note");
    expect(
      JSON.parse(localStorage.getItem("threadwise-workspaces-v1") ?? "{}").state.workspaces[0]
        .document.canvases,
    ).toHaveLength(2);
  });
  it("new unnamed workspaces preserve previous files and select a blank new file", () => {
    const first = useWorkspaces.getState().activeId;
    useThread.getState().addNode("idea", { x: 0, y: 0 });
    useWorkspaces.getState().createWorkspace();
    expect(useWorkspaces.getState().workspaces).toHaveLength(2);
    expect(useWorkspaces.getState().activeId).not.toBe(first);
    expect(useThread.getState().nodes).toHaveLength(0);
    if (first) useWorkspaces.getState().switchWorkspace(first);
    expect(useThread.getState().nodes).toHaveLength(1);
  });
  it("late remote reads cannot discard a newly created empty canvas", () => {
    const ws = useWorkspaces.getState();
    const id = ws.createCanvas();
    const original = useWorkspaces.getState().workspaces[0];
    if (!original) throw new Error("Missing workspace");
    ws.replaceRemote([{ ...original, id: "remote", revision: 3, dirty: false }]);
    expect(
      useWorkspaces.getState().workspaces.find((w) => w.id === original.id)?.document
        .activeCanvasId,
    ).toBe(id);
    expect(useWorkspaces.getState().workspaces).toHaveLength(2);
  });
  it("card and canvas organizing colors survive edits and cloud projection", () => {
    const ws = useWorkspaces.getState();
    const canvasId = ws.workspaces[0]?.document.activeCanvasId ?? "";
    ws.setCanvasColor(canvasId, "sage");
    const node = useThread.getState().addNode("note", { x: 0, y: 0 });
    useThread.getState().updateNode(node, { color: "rose" });
    ws.createCanvas();
    ws.switchCanvas(canvasId);
    const document = useWorkspaces.getState().workspaces[0]?.document;
    if (!document) throw new Error("Missing workspace");
    const projected = cloudDocument(document).canvases.find((c) => c.id === canvasId);
    expect(projected?.color).toBe("sage");
    expect(projected?.nodes[0]?.data.color).toBe("rose");
  });
  it("workspace labels and color persist independently", () => {
    const ws = useWorkspaces.getState();
    const id = ws.activeId ?? "";
    ws.renameWorkspace(id, "Research");
    ws.setWorkspaceColor(id, "sky");
    const w = useWorkspaces.getState().workspaces[0];
    expect(w?.title).toBe("Research");
    expect(w?.document.color).toBe("sky");
    if (w) expect(cloudDocument(w.document).color).toBe("sky");
  });
  it("switching canvases restores their own cards and replay history", () => {
    const ws = useWorkspaces.getState();
    const first = ws.workspaces[0]?.document.activeCanvasId ?? "";
    useThread.getState().addNode("idea", { x: 0, y: 0 });
    useThread.getState().recordSnapshot("Original");
    const second = ws.createCanvas("Second");
    expect(useThread.getState().nodes).toHaveLength(0);
    expect(useThread.getState().history).toHaveLength(0);
    useThread.getState().addNode("question", { x: 0, y: 0 });
    ws.switchCanvas(first);
    expect(useThread.getState().nodes[0]?.data.kind).toBe("idea");
    expect(useThread.getState().history[0]?.label).toBe("Original");
    ws.switchCanvas(second);
    expect(useThread.getState().nodes[0]?.data.kind).toBe("question");
  });
  it("child canvases create navigable portal cards and ancestor breadcrumbs", () => {
    const ws = useWorkspaces.getState();
    const parent = ws.workspaces[0]?.document.activeCanvasId ?? "";
    const child = ws.createCanvas("Child", parent);
    const grandchild = ws.createCanvas("Grandchild", child);
    const canvases = useWorkspaces.getState().workspaces[0]?.document.canvases ?? [];
    expect(canvases.find((c) => c.id === parent)?.nodes[0]?.data.meta["childCanvasId"]).toBe(child);
    expect(breadcrumbs(canvases, grandchild).map((c) => c.title)).toEqual([
      "First thoughts",
      "Child",
      "Grandchild",
    ]);
    expect(ws.createCanvas("Invalid", "missing-parent")).toBe("");
  });
  it("Socratic sessions are separate browser records and excluded from cloud documents", () => {
    const ws = useWorkspaces.getState();
    const document = ws.workspaces[0]?.document;
    if (!document) throw new Error("Missing workspace");
    const id = useSocratic.getState().create(document.activeCanvasId, []);
    useSocratic
      .getState()
      .save(id, [
        { id: "msg_private", role: "user", parts: [{ type: "text", text: "PRIVATE-INQUIRY" }] },
      ]);
    expect(localStorage.getItem(SOCRATIC_KEY)).toContain("PRIVATE-INQUIRY");
    expect(JSON.stringify(cloudDocument(document))).not.toContain("PRIVATE-INQUIRY");
    expect(localStorage.getItem("threadwise-workspaces-v1")).not.toContain("PRIVATE-INQUIRY");
  });
  it("multiple inquiries restore messages by stable individual IDs", () => {
    const s = useSocratic.getState();
    const first = s.create("canvas", []),
      second = s.create("canvas", []);
    s.save(first, [{ id: "one", role: "user", parts: [{ type: "text", text: "First" }] }]);
    s.save(second, [{ id: "two", role: "user", parts: [{ type: "text", text: "Second" }] }]);
    useSocratic.setState({ sessions: [], ready: false });
    s.boot();
    expect(useSocratic.getState().sessions.find((s) => s.id === first)?.messages[0]?.id).toBe(
      "one",
    );
    expect(useSocratic.getState().sessions.find((s) => s.id === second)?.messages[0]?.id).toBe(
      "two",
    );
  });
  it("cited evidence creates a Note supporting its selected source card", () => {
    const anchor = useThread.getState().addNode("idea", { x: 0, y: 0 });
    const id = addEvidence(
      {
        title: "Source result",
        takeaways: ["Reported finding"],
        excerpt: "Original quote",
        source: "https://example.org/study",
        sourceTitle: "Study",
      },
      anchor,
    );
    expect(useThread.getState().nodes.find((n) => n.id === id)?.data.meta["source"]).toBe(
      "https://example.org/study",
    );
    expect(useThread.getState().edges.find((e) => e.source === id)?.target).toBe(anchor);
    expect(useThread.getState().nodes.find((n) => n.id === id)?.data.kind).toBe("note");
  });
  it("revision acknowledgments do not clear newer offline edits", () => {
    const ws = useWorkspaces.getState();
    const w = ws.workspaces[0];
    if (!w) throw new Error("No workspace");
    useThread.getState().addNode("idea", { x: 0, y: 0 });
    ws.acknowledge(w.id, 2, w.generation);
    expect(useWorkspaces.getState().workspaces[0]?.dirty).toBe(true);
  });
  it("signing in does not upload guest canvases without explicit import", () => {
    useThread.getState().addNode("idea", { x: 0, y: 0 });
    const ws = useWorkspaces.getState();
    ws.attachOwner("account-one");
    expect(useThread.getState().nodes).toHaveLength(0);
    ws.importGuest();
    expect(
      useWorkspaces
        .getState()
        .workspaces.some((w) => w.document.canvases.some((c) => c.nodes.length === 1)),
    ).toBe(true);
    ws.attachOwner(null);
    expect(useThread.getState().nodes).toHaveLength(1);
    ws.attachOwner("account-two");
    expect(useThread.getState().nodes).toHaveLength(0);
  });
  it("repeated local-to-cloud migration imports each browser canvas only once", () => {
    useThread.getState().addNode("note", { x: 0, y: 0 });
    const ws = useWorkspaces.getState();
    ws.attachOwner("account-one");
    ws.importGuest();
    const count = useWorkspaces.getState().workspaces.length;
    ws.importGuest();
    expect(useWorkspaces.getState().workspaces).toHaveLength(count);
  });
  it("planning records survive capture and remain in the cloud projection", () => {
    const ws = useWorkspaces.getState();
    const id = ws.workspaces[0]?.document.activeCanvasId ?? "";
    ws.updatePlanning(id, { decisions: [], templateId: "business", step: 2 });
    useThread.getState().addNode("note", { x: 0, y: 0 });
    const document = useWorkspaces.getState().workspaces[0]?.document;
    if (!document) throw new Error("missing");
    expect(cloudDocument(document).canvases[0]?.planning?.step).toBe(2);
  });
});
