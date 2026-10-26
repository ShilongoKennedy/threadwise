import { create } from "zustand";
import type { UIMessage } from "ai";
export const SOCRATIC_KEY = "threadwise-socratic-v1";
export type SocraticSession = { id: string; title: string; canvasId: string; nodeIds: string[]; updatedAt: number; messages: UIMessage[] };
type State = { sessions: SocraticSession[]; ready: boolean; boot: () => void; create: (canvasId: string, nodeIds: string[]) => string; rename: (id: string, title: string) => void; save: (id: string, messages: UIMessage[]) => void; remove: (id: string) => void };
function persistSessions(sessions: SocraticSession[]) { localStorage.setItem(SOCRATIC_KEY, JSON.stringify(sessions)); }
export const useSocratic = create<State>((set, get) => ({
  sessions: [], ready: false,
  boot: () => {
    if (get().ready || typeof window === "undefined") return;
    try { const sessions = JSON.parse(localStorage.getItem(SOCRATIC_KEY) ?? "[]") as SocraticSession[]; set({ sessions: Array.isArray(sessions) ? sessions : [], ready: true }); }
    catch { set({ ready: true }); }
  },
  create: (canvasId, nodeIds) => {
    get().boot(); const id = crypto.randomUUID();
    const sessions = [...get().sessions, { id, title: `Inquiry ${get().sessions.length + 1}`, canvasId, nodeIds, updatedAt: Date.now(), messages: [] }];
    persistSessions(sessions); set({ sessions }); return id;
  },
  rename: (id, title) => { const sessions = get().sessions.map((s) => s.id === id ? { ...s, title: title.trim() || "Untitled inquiry" } : s); persistSessions(sessions); set({ sessions }); },
  save: (id, messages) => { const sessions = get().sessions.map((s) => s.id === id ? { ...s, messages, updatedAt: Date.now() } : s); persistSessions(sessions); set({ sessions }); },
  remove: (id) => { const sessions = get().sessions.filter((s) => s.id !== id); persistSessions(sessions); set({ sessions }); },
}));