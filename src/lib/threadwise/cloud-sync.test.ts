import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), select: vi.fn(), latest: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          then: (resolve: unknown, reject: unknown) => mock.select().then(resolve, reject),
          eq: () => ({ maybeSingle: () => mock.latest() }),
        }),
      }),
    }),
    rpc: mock.rpc,
  },
}));
import { syncWorkspaces, useAccount } from "./cloud-sync";
import { useWorkspaces } from "./workspaces";
import { useThread } from "./store";
describe("cloud save recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useWorkspaces.setState({ owner: "owner", workspaces: [], activeId: null, ready: false });
    useThread.setState({ nodes: [], edges: [], ghosts: [], history: [], replayIndex: null });
    useWorkspaces.getState().boot();
    useAccount.setState({ user: { id: "owner" } as never });
    mock.select.mockResolvedValue({ data: [], error: null });
    mock.latest.mockResolvedValue({ data: null, error: null });
  });
  it("a lost acknowledgment is resolved by a fresh owner-scoped read without duplicate copies", async () => {
    const w = useWorkspaces.getState().workspaces[0];
    if (!w) throw new Error("missing");
    mock.rpc.mockResolvedValue({ data: [], error: null });
    mock.latest.mockResolvedValue({ data: { ...w, revision: 4 }, error: null });
    await syncWorkspaces();
    expect(useWorkspaces.getState().workspaces).toHaveLength(1);
    expect(useWorkspaces.getState().workspaces[0]?.revision).toBe(4);
    expect(useWorkspaces.getState().status).toBe("Cloud synced");
  });
  it("cloud errors preserve dirty local edits and expose retry", async () => {
    mock.rpc.mockResolvedValue({ error: { message: "Network disconnected" }, data: null });
    await syncWorkspaces();
    expect(useWorkspaces.getState().workspaces[0]?.dirty).toBe(true);
    expect(useWorkspaces.getState().status).toBe(
      "Saved locally · Network disconnected · Retry cloud",
    );
  });
  it("a stale revision creates a recovered copy with current local edits", async () => {
    vi.useFakeTimers();
    const ws = useWorkspaces.getState();
    const w = ws.workspaces[0];
    if (!w) throw new Error("missing");
    useThread.getState().addNode("note", { x: 0, y: 0 });
    mock.rpc.mockResolvedValue({ data: [], error: null });
    mock.latest.mockResolvedValue({ data: { ...w, revision: 5 }, error: null });
    await syncWorkspaces();
    expect(useWorkspaces.getState().workspaces).toHaveLength(2);
    expect(
      useWorkspaces.getState().workspaces.find((w) => w.title.includes("recovered"))?.document
        .canvases[0]?.nodes,
    ).toHaveLength(1);
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
