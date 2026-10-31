import { useState } from "react";
import { BookOpen, Trash2, X, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  changeKind,
  EPISTEMIC,
  LENS_LEVELS,
  LENSES,
  NODE_TYPES,
  RELATIONS,
  relationLabel,
  TYPE_INFO,
  type LensLevel,
  type Relation,
} from "@/lib/threadwise/model";
import { useThread } from "@/lib/threadwise/store";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { EpistemicGlyph, TYPE_COLOR, TYPE_ICON } from "./ThreadNode";
import { ColorPicker } from "./ColorPicker";
import { paperColor } from "@/lib/threadwise/paper";

export function DetailsPanel() {
  const { selectedId, nodes, edges, select } = useThread();
  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const c = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  
  const node = nodes.find((n) => n.id === selectedId);
  const edge = !node ? edges.find((e) => e.id === selectedId) : undefined;

  if (!node && !edge) {
    return (
      <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78dvh] flex-col overflow-hidden tw-sheet rounded-t-sm md:inset-x-auto md:right-6 md:top-6 md:bottom-6 md:max-h-none md:w-[360px] md:rounded-sm border bg-card shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Canvas Settings
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div className="space-y-3">
            <Label className="font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-muted-foreground">Canvas Paper</Label>
            <ColorPicker 
              value={c?.color} 
              label="Canvas color" 
              disabled={!c} 
              onChange={(color) => { if (c) ws.setCanvasColor(c.id, paperColor(color)); }} 
            />
          </div>
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <LayoutTemplate className="h-5 w-5 mb-2 opacity-50" />
            Select a card to inspect its intelligence, or use the tools in the Studio to analyze the board.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78dvh] flex-col overflow-hidden tw-sheet rounded-t-sm md:inset-x-auto md:right-6 md:top-6 md:bottom-6 md:max-h-none md:w-[360px] md:rounded-sm border bg-card shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {node ? "Node details" : "Relationship"}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => select(null)} aria-label="Close details">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{node ? <NodeForm id={node.id} /> : edge ? <EdgeForm id={edge.id} /> : null}</div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NodeForm({ id }: { id: string }) {
  const { nodes, edges, updateNode, deleteNode, select } = useThread();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const node = nodes.find((n) => n.id === id);
  if (!node) return null;
  const d = node.data;
  const lenses = d.lenses ?? { scarcity: 0, difficulty: 0, risk: 0 };
  const links = edges.filter((e) => e.source === id || e.target === id);
  const source = d.meta["source"];
  const isDossier = d.kind === "dossier";
  const sourceIsUrl = !!source && /^https?:\/\//.test(source);

  const onDeleteClick = () => {
    if (isDossier) {
      setShowDeleteConfirm(true);
    } else {
      deleteNode(id);
    }
  };

  const openInLab = () => {
    if (!source) return;
    window.dispatchEvent(new CustomEvent("threadwise:focus-source", { detail: { source } }));
    select(null);
  };

  return (
    <div className="space-y-6">
      {!isDossier && (
        <Field label="Type">
          <div className="grid grid-cols-3 gap-1">
            {NODE_TYPES.filter((k) => k !== "portal" && k !== "dossier").map((k) => {
              const Icon = TYPE_ICON[k];
              const active = d.kind === k;
              return (
                <button
                  key={k}
                  title={TYPE_INFO[k].hint}
                  onClick={() => updateNode(id, (data) => changeKind(data, k))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-sm border py-2 text-[10px] transition-colors",
                    active ? "bg-[#1A4BFF]/10 border-[#1A4BFF] text-[#1A4BFF] font-medium" : "border-black/5 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="h-4 w-4" style={{ color: active ? "#1A4BFF" : TYPE_COLOR[k] }} />
                  {TYPE_INFO[k].label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {isDossier && (
        <div className="rounded-sm border border-dashed px-3 py-2 text-[11px] text-muted-foreground" style={{ borderColor: "var(--type-dossier)" }}>
          <span className="font-mono uppercase tracking-wider" style={{ color: "var(--type-dossier)" }}>Anchored source</span>
          <p className="mt-1 leading-relaxed">Dossiers are managed automatically. Delete with confirmation to unlink.</p>
        </div>
      )}

      {d.kind === "portal" && <Button variant="outline" className="w-full rounded-sm" onClick={() => useWorkspaces.getState().switchCanvas(d.meta["childCanvasId"] ?? "")}>Open child canvas</Button>}
      
      <Field label="Title">
        <Input className="h-auto border-0 bg-transparent px-0 py-0 font-display text-[24px] leading-tight md:text-[24px] shadow-none focus-visible:ring-0" value={d.title} onChange={(e) => updateNode(id, { title: e.target.value })} />
      </Field>
      
      <Field label="Content">
        <Textarea rows={4} className="rounded-sm" value={d.body} placeholder="What do you know, notice, or wonder?" onChange={(e) => updateNode(id, { body: e.target.value })} />
      </Field>

      {!isDossier && (
        <>
          <Field label="Card color"><ColorPicker value={d.color} label="Card color" allowCustom onChange={(color) => updateNode(id, { color })} /></Field>
          <Field label="Epistemic status">
            <div className="flex flex-wrap gap-1.5">
              {EPISTEMIC.map((s) => (
                <button
                  key={s}
                  onClick={() => updateNode(id, { epistemic: s })}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs capitalize transition-colors",
                    d.epistemic === s ? "border-[#1A4BFF] bg-[#1A4BFF] text-white" : "border-black/10 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-1.5"><EpistemicGlyph status={s} />{s}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Analytical lenses">
            <div className="space-y-2">
              {LENSES.map((l) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-xs capitalize">{l}</span>
                  <div className="flex rounded-sm border border-black/10 p-0.5">
                    {LENS_LEVELS.map((lbl, i) => (
                      <button
                        key={lbl}
                        onClick={() => updateNode(id, { lenses: { ...lenses, [l]: i as LensLevel } })}
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-[11px] transition-colors",
                          lenses[l] === i ? "bg-[#1A4BFF]/10 font-medium text-[#1A4BFF]" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>
        </>
      )}

      <div className="space-y-4 border-t pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{TYPE_INFO[d.kind].label} details</div>
        {TYPE_INFO[d.kind].fields.map((f) => {
          const v = d.meta[f.key] ?? "";
          const set = (val: string) => updateNode(id, { meta: { ...d.meta, [f.key]: val } });
          return (
            <Field key={f.key} label={f.label}>
              {f.kind === "select" ? (
                <Select value={v} onValueChange={set}>
                  <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.kind === "textarea" ? (
                <Textarea rows={2} className="rounded-sm" value={v} onChange={(e) => set(e.target.value)} />
              ) : (
                <Input className="rounded-sm" type={f.kind === "date" ? "date" : "text"} value={v} onChange={(e) => set(e.target.value)} />
              )}
            </Field>
          );
        })}
      </div>

      {source && !sourceIsUrl && (
        <Button variant="outline" className="w-full rounded-sm" onClick={openInLab}>
          <BookOpen className="mr-2 h-4 w-4" /> Open source in Discourse Lab
        </Button>
      )}

      {links.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Connections</div>
          {links.map((e) => {
            const out = e.source === id;
            const other = nodes.find((n) => n.id === (out ? e.target : e.source));
            return (
              <div key={e.id} className="text-xs">
                <span className="text-muted-foreground">{out ? "→ " : "← "}{relationLabel(e.data?.relation ?? "leads_to", e.data?.customLabel)}</span>{" "}
                {other?.data.title}
              </div>
            );
          })}
        </div>
      )}

      <Button variant="ghost" className="w-full rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDeleteClick}>
        <Trash2 className="mr-2 h-4 w-4" /> Delete {isDossier ? "dossier" : "node"}
      </Button>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md rounded-sm border-black/10">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Delete Source Dossier?</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed mt-2">
              {links.length > 0
                ? `This will orphan ${links.length} linked card${links.length === 1 ? "" : "s"}. The cards will remain on the canvas but lose their source anchor.`
                : "This will permanently remove the source anchor from the canvas."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button variant="outline" className="rounded-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-sm" onClick={() => { deleteNode(id); setShowDeleteConfirm(false); }}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EdgeForm({ id }: { id: string }) {
  const { edges, nodes, updateEdge, deleteEdge } = useThread();
  const e = edges.find((x) => x.id === id);
  if (!e) return null;
  const data = e.data ?? { relation: "leads_to" as Relation };
  const title = (nid: string) => nodes.find((n) => n.id === nid)?.data.title;
  return (
    <div className="space-y-5">
      <p className="font-display text-sm leading-relaxed">
        {title(e.source)} <span className="text-[#1A4BFF]">{relationLabel(data.relation, data.customLabel)}</span> {title(e.target)}
      </p>
      <Field label="Relationship">
        <RelationGrid value={data.relation} onPick={(r) => updateEdge(id, { ...data, relation: r })} />
      </Field>
      {data.relation === "custom" && (
        <Field label="Custom label">
          <Input className="rounded-sm" value={data.customLabel ?? ""} onChange={(ev) => updateEdge(id, { ...data, customLabel: ev.target.value })} />
        </Field>
      )}
      <Button variant="ghost" className="w-full rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteEdge(id)}>
        <Trash2 className="mr-2 h-4 w-4" /> Delete relationship
      </Button>
    </div>
  );
}

export function RelationGrid({ value, onPick }: { value?: Relation; onPick: (r: Relation) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {RELATIONS.map((r) => (
        <button
          key={r}
          onClick={() => onPick(r)}
          className={cn(
            "rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors",
            value === r ? "bg-[#1A4BFF] text-white" : "hover:bg-muted",
            r === "contradicts" && value !== r && "text-[#1A4BFF] font-medium",
          )}
        >
          {relationLabel(r)}
        </button>
      ))}
    </div>
  );
}