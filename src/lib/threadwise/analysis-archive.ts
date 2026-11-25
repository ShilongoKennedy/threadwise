import { useEffect, useState } from "react";

export type AnalysisKind = "analyst" | "seminar" | "anatomy";

export type SavedAnalysis = {
  id: string;
  kind: AnalysisKind;
  title: string;
  subtitle: string;
  createdAt: string;
  payload: unknown;
};

const KEY = "threadwise:analysis-archive:v1";
const MAX = 30;

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function loadArchive(kind?: AnalysisKind): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAnalysis[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.id && item.kind && item.title)
      .filter((item) => !kind || item.kind === kind)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function announce() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("threadwise:analysis-archive"));
  }
}

function persist(items: SavedAnalysis[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // Quota is rare for three compact analyses; keep the newest half if it happens.
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, Math.ceil(MAX / 2))));
    } catch {
      // Storage is unavailable; the generated analysis still works in-session.
    }
  }
}

export function saveAnalysis(input: {
  kind: AnalysisKind;
  title: string;
  subtitle: string;
  payload: unknown;
  id?: string;
}): SavedAnalysis {
  const item: SavedAnalysis = {
    id: input.id ?? randomId(),
    kind: input.kind,
    title: input.title.trim().slice(0, 180) || "Untitled analysis",
    subtitle: input.subtitle.trim().slice(0, 180),
    createdAt: new Date().toISOString(),
    payload: input.payload,
  };
  const items = loadArchive();
  persist([item, ...items.filter((existing) => existing.id !== item.id)]);
  announce();
  return item;
}

export function updateAnalysis(id: string, patch: Partial<Pick<SavedAnalysis, "title" | "subtitle" | "payload">>) {
  const items = loadArchive();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const next: SavedAnalysis = { ...items[index]!, ...patch };
  items[index] = next;
  persist(items);
  announce();
  return next;
}

export function deleteAnalysis(id: string) {
  persist(loadArchive().filter((item) => item.id !== id));
  announce();
}

export function useAnalysisArchive(kind?: AnalysisKind): SavedAnalysis[] {
  const [items, setItems] = useState<SavedAnalysis[]>(() => loadArchive(kind));

  useEffect(() => {
    const update = () => setItems(loadArchive(kind));
    update();
    window.addEventListener("threadwise:analysis-archive", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("threadwise:analysis-archive", update);
      window.removeEventListener("storage", update);
    };
  }, [kind]);

  return items;
}
