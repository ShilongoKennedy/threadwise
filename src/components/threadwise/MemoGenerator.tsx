import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, FileText, Pilcrow, Plus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { streamTask } from "@/lib/threadwise/ai-client";
import { connectedDirection } from "@/lib/threadwise/graph";
import { useThread } from "@/lib/threadwise/store";
import { useDraft, draftToMarkdown, type DraftBlock } from "@/lib/threadwise/draft";
import { EPISTEMIC, TYPE_INFO, type Epistemic } from "@/lib/threadwise/model";
import { EpistemicGlyph, TYPE_COLOR } from "./ThreadNode";

const EMPTY: DraftBlock[] = [];

/** A live writing surface: prose blocks plus transcluded cards that stay bound to the canvas. */
export function MemoGenerator({ canvasId, onClose }: { canvasId: string; onClose: () => void }) {
  const blocks = useDraft((d) => d.drafts[canvasId] ?? EMPTY);
  const draft = useDraft();
  const nodes = useThread((s) => s.nodes);
  const selectedId = useThread((s) => s.selectedId);
  const [format, setFormat] = useState<"brief" | "memo">("brief");
  const [stream, setStream] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const selectedNode = nodes.find((n) => n.id === selectedId);

  const graph = () => {
    const s = useThread.getState();
    const embedded = blocks.flatMap((b) => (b.type === "card" ? [b.nodeId] : []));
    const ids = embedded.length ? new Set(embedded) : s.selectedId ? new Set([s.selectedId, ...connectedDirection(s.selectedId, s.edges, true), ...connectedDirection(s.selectedId, s.edges, false)]) : new Set(s.nodes.map((n) => n.id));
    return { nodes: s.nodes.filter((n) => ids.has(n.id)).map((n) => ({ id: n.id, ...n.data })), edges: s.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ source: e.source, target: e.target, ...e.data })) };
  };
  const generate = async () => {
    abort.current = new AbortController(); setBusy(true); setStream(""); setError("");
    let text = "";
    try { await streamTask({ mode: "memo", format, graph: graph() }, (t) => { text = t; setStream(t); }, abort.current.signal); if (text.trim()) draft.addProse(canvasId, text); }
    catch (e) { if (!abort.current.signal.aborted) setError(e instanceof Error ? e.message : "Could not write the memo."); }
    finally { setBusy(false); setStream(""); }
  };
  const markdown = () => draftToMarkdown(blocks, useThread.getState().nodes);

  return (
    <aside data-memo-drop className="tw-sheet absolute inset-x-0 bottom-0 z-30 flex h-[78dvh] flex-col border bg-card shadow-[var(--shadow-lift)] md:inset-x-auto md:right-6 md:top-[124px] md:bottom-6 md:h-auto md:w-[460px]" aria-label="Draft">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5" /><span className="font-display text-xl">Live draft</span></div>
        <Button variant="ghost" size="icon" aria-label="Close draft" onClick={onClose}><X /></Button>
      </header>
      <p className="border-b px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Drag a card here to embed it · edits flow both ways</p>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        {!blocks.length && !busy && <div className="py-10 text-center"><p className="font-display text-2xl italic">An empty page.</p><p className="mt-2 text-sm text-muted-foreground">Drag cards in from the canvas, write a paragraph, or let the thread draft one.</p></div>}
        {blocks.map((b, i) => (
          <div key={b.id} className="group relative">
            <div className="absolute -right-2 -top-2 z-10 hidden gap-0.5 rounded-md border bg-card p-0.5 shadow-[var(--shadow-card)] group-focus-within:flex group-hover:flex">
              <Button size="icon-xs" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => draft.move(canvasId, b.id, -1)}><ArrowUp /></Button>
              <Button size="icon-xs" variant="ghost" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => draft.move(canvasId, b.id, 1)}><ArrowDown /></Button>
              <Button size="icon-xs" variant="ghost" aria-label="Remove block" onClick={() => draft.remove(canvasId, b.id)}><X /></Button>
            </div>
            {b.type === "prose"
              ? <Textarea aria-label="Paragraph" value={b.text} placeholder="Write…" onChange={(e) => draft.setText(canvasId, b.id, e.target.value)} className="field-sizing-content min-h-16 resize-none border-0 bg-transparent px-0 font-display text-[15px] leading-relaxed shadow-none focus-visible:ring-0" />
              : <Transclusion nodeId={b.nodeId} />}
          </div>
        ))}
        {busy && (stream ? <p className="whitespace-pre-wrap font-display text-[15px] leading-relaxed text-muted-foreground">{stream}</p> : <Shimmer>Following the thread…</Shimmer>)}
        {error && <p role="alert" className="text-sm text-accent-ink">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t p-3">
        <Button size="sm" variant="ghost" onClick={() => draft.addProse(canvasId)}><Pilcrow />Paragraph</Button>
        <Button size="sm" variant="ghost" disabled={!selectedNode} title={selectedNode ? `Embed “${selectedNode.data.title}”` : "Select a card first"} onClick={() => selectedNode && draft.embed(canvasId, selectedNode.id)}><Plus />Embed card</Button>
        <div className="ml-auto flex gap-1">
          <Button size="icon-sm" variant="outline" title="Copy Markdown" aria-label="Copy draft" disabled={!blocks.length} onClick={async () => { try { await navigator.clipboard.writeText(markdown()); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setError("Clipboard is unavailable. Download instead."); } }}><Copy /></Button>
          <Button size="icon-sm" variant="outline" title="Download Markdown" aria-label="Download draft" disabled={!blocks.length} onClick={() => { const url = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `threadwise-${format}.md`; a.click(); URL.revokeObjectURL(url); }}><Download /></Button>
        </div>
        <div className="flex w-full items-center gap-1 pt-1">
          <select aria-label="Draft style" className="h-8 rounded-md border bg-card px-2 text-xs" value={format} disabled={busy} onChange={(e) => setFormat(e.target.value as "brief" | "memo")}><option value="brief">Executive brief</option><option value="memo">Markdown memo</option></select>
          {copied && <span className="text-xs text-muted-foreground">Copied</span>}
          {busy ? <Button size="sm" className="ml-auto" onClick={() => abort.current?.abort()}><Square />Stop</Button> : <Button size="sm" className="ml-auto" onClick={() => void generate()}>Draft from thread</Button>}
        </div>
      </div>
    </aside>
  );
}

/** A card embedded in prose. Reads and writes the canvas node directly — no copy exists. */
function Transclusion({ nodeId }: { nodeId: string }) {
  const node = useThread((s) => s.nodes.find((n) => n.id === nodeId));
  const update = useThread((s) => s.updateNode);
  if (!node) return <p className="border-l-2 border-dashed pl-3 text-sm italic text-muted-foreground">This card was removed from the canvas.</p>;
  const d = node.data;
  const color = TYPE_COLOR[d.kind];
  const editable = TYPE_INFO[d.kind].fields.filter((f) => f.kind === "text" || (d.kind === "experiment" && ["successCriteria", "outcome"].includes(f.key)));
  return (
    <figure className="rounded-lg border-l-[3px] bg-background/60 px-3 py-2.5" style={{ borderColor: color }}>
      <figcaption className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color }}>
        <span>{TYPE_INFO[d.kind].label} · live</span>
        <label className="flex items-center gap-1 text-muted-foreground"><EpistemicGlyph status={d.epistemic} />
          <select aria-label="Epistemic status" className="bg-transparent uppercase" value={d.epistemic} onChange={(e) => update(nodeId, { epistemic: e.target.value as Epistemic })}>{EPISTEMIC.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        </label>
      </figcaption>
      <Input aria-label="Card title" value={d.title} onChange={(e) => update(nodeId, { title: e.target.value })} className="h-auto border-0 bg-transparent px-0 py-0.5 font-display text-[16px] shadow-none focus-visible:ring-0" />
      {d.body && <Textarea aria-label="Card text" value={d.body} onChange={(e) => update(nodeId, { body: e.target.value })} className="field-sizing-content min-h-0 resize-none border-0 bg-transparent px-0 py-0.5 text-[12.5px] text-muted-foreground shadow-none focus-visible:ring-0" />}
      {editable.map((f) => (
        <label key={f.key} className="mt-1 flex items-baseline gap-2 text-[12px]"><span className="w-24 shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{f.label}</span>
          <Input aria-label={f.label} value={d.meta[f.key] ?? ""} placeholder="—" onChange={(e) => update(nodeId, (x) => ({ ...x, meta: { ...x.meta, [f.key]: e.target.value } }))} className="h-7 border-0 border-b border-dashed bg-transparent px-0 text-[12px] shadow-none focus-visible:ring-0" />
        </label>
      ))}
    </figure>
  );
}
