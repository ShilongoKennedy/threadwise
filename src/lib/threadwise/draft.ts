import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TNode } from "./store";
import { TYPE_INFO } from "./model";

export type DraftBlock = { id: string; type: "prose"; text: string } | { id: string; type: "card"; nodeId: string };
const uid = () => Math.random().toString(36).slice(2, 10);

type DraftState = {
  drafts: Record<string, DraftBlock[]>;
  embed: (canvasId: string, nodeId: string, index?: number) => void;
  addProse: (canvasId: string, text?: string) => void;
  setText: (canvasId: string, id: string, text: string) => void;
  move: (canvasId: string, id: string, delta: number) => void;
  remove: (canvasId: string, id: string) => void;
};

/** Drafts store only references to cards; the canvas stays the single source of truth for card content. */
export const useDraft = create<DraftState>()(persist((set, get) => {
  const update = (canvasId: string, fn: (b: DraftBlock[]) => DraftBlock[]) => set({ drafts: { ...get().drafts, [canvasId]: fn(get().drafts[canvasId] ?? []) } });
  return {
    drafts: {},
    embed: (canvasId, nodeId, index) => update(canvasId, (b) => { const next = [...b]; next.splice(index ?? next.length, 0, { id: uid(), type: "card", nodeId }); return next; }),
    addProse: (canvasId, text = "") => update(canvasId, (b) => [...b, { id: uid(), type: "prose", text }]),
    setText: (canvasId, id, text) => update(canvasId, (b) => b.map((x) => x.id === id && x.type === "prose" ? { ...x, text } : x)),
    move: (canvasId, id, delta) => update(canvasId, (b) => { const i = b.findIndex((x) => x.id === id); const j = i + delta; if (i < 0 || j < 0 || j >= b.length) return b; const next = [...b]; const [x] = next.splice(i, 1); if (x) next.splice(j, 0, x); return next; }),
    remove: (canvasId, id) => update(canvasId, (b) => b.filter((x) => x.id !== id)),
  };
}, { name: "threadwise-drafts-v1" }));

/** Renders a draft to Markdown, reading every transcluded card's current canvas content. */
export function draftToMarkdown(blocks: DraftBlock[], nodes: TNode[]) {
  const map = new Map(nodes.map((n) => [n.id, n]));
  return blocks.map((b) => {
    if (b.type === "prose") return b.text.trim();
    const n = map.get(b.nodeId);
    if (!n) return "> *Card removed from canvas*";
    const d = n.data;
    const fields = TYPE_INFO[d.kind].fields.filter((f) => d.meta[f.key]).map((f) => `> - **${f.label}:** ${d.meta[f.key]}`);
    return [`> **${TYPE_INFO[d.kind].label} · ${d.title}** _(${d.epistemic})_`, ...(d.body ? [`> ${d.body}`] : []), ...fields].join("\n");
  }).filter(Boolean).join("\n\n");
}
