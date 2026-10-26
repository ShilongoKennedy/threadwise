export const CODES = [
  { id: "frame", label: "Framing" }, { id: "us_them", label: "Us vs. them" },
  { id: "ambiguity", label: "Strategic ambiguity" }, { id: "promise", label: "Promise" },
  { id: "evidence_gap", label: "Claim without evidence" }, { id: "escalation", label: "Urgency" },
] as const;
export type CodeId = (typeof CODES)[number]["id"];
export type DiscourseDoc = { id: string; title: string; speaker: string; date: string; occasion: string; audience: string; text: string };
export type Annotation = { id: string; docId: string; start: number; end: number; quote: string; code: CodeId; note: string };
export type Corpus = { docs: DiscourseDoc[]; annotations: Annotation[]; omissions: { id: string; docId: string; topic: string }[]; terms: string[] };
export const emptyCorpus = (): Corpus => ({ docs: [], annotations: [], omissions: [], terms: [] });
const stop = new Set("a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those we our us you your they their them he she his her i me my not no so do does did have has had will would can could should shall may might must than then there here what which who whom when where why how all any each more most other some such only own same too very just also into over out up down about again further once because while during before after above below between through until against".split(" "));
export const words = (text: string) => (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).map((word) => word.replace(/['’]s$/, ""));
export const countPhrase = (text: string, phrase: string) => { const target = words(phrase), all = words(text); if (!target.length) return 0; let count = 0; for (let i = 0; i + target.length <= all.length; i++) if (target.every((word, j) => word === all[i + j])) count++; return count; };
export const topTerms = (text: string, limit = 10) => { const counts = new Map<string, number>(); for (const word of words(text)) if (word.length > 2 && !stop.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1); return [...counts].sort((a,b) => b[1] - a[1]).slice(0, limit); };
export const clip = (text: string, max = 110) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
export const locate = (text: string, quote: string) => { const start = text.indexOf(quote); return start < 0 ? null : { start, end: start + quote.length }; };
