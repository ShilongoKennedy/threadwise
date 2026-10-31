import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { useState } from "react";
import { Check, Link2, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPE_INFO, type ThreadNodeType } from "@/lib/threadwise/model";
import { useThread, type Ghost } from "@/lib/threadwise/store";
import { TYPE_COLOR, TYPE_ICON } from "./ThreadNode";

export type GhostNodeT = Node<{ ghost: Ghost }, "ghost">;

export function GhostNode({ data }: NodeProps<GhostNodeT>) {
  const resolve = useThread((s) => s.resolveGhost);
  const setActive = useThread((s) => s.setActiveGhost);
  const update = useThread((s) => s.updateGhost);
  const [editing, setEditing] = useState(false);
  const leaving = useThread((s) => s.leaving[data.ghost.id]);
  const g = data.ghost;
  const kind = g.kind === "connection" ? "note" : g.kind as ThreadNodeType;
  const Icon = g.kind === "connection" ? Link2 : TYPE_ICON[kind];
  return (
    <div
      className={`tw-ghost group w-[272px] rounded-[2px] border-[1.25px] border-dashed ${leaving ? `is-${leaving}` : ""}`}
      style={{ borderColor: TYPE_COLOR[kind] }}
      onMouseEnter={() => setActive(g.id)}
      onMouseLeave={() => { if (!editing) setActive(null); }}
      onFocus={() => setActive(g.id)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node | null) && !editing) setActive(null); }}
    >
      <Handle type="target" position={Position.Left} className="tw-handle opacity-0" isConnectable={false} />
      <div className="px-4 pb-3 pt-2.5">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5" style={{ color: TYPE_COLOR[kind] }}>
            <Icon className="h-3.5 w-3.5" /> {g.kind === "connection" ? "Connection" : TYPE_INFO[kind].label}
          </span>
          <span className="flex items-center gap-1 normal-case tracking-normal text-muted-foreground">
            <Sparkles className="h-3 w-3" /> suggested
          </span>
        </div>
        {editing ? <div className="nodrag nopan space-y-2"><Input aria-label="Suggestion title" value={g.title} onChange={(e) => update(g.id, { title: e.target.value })} /><Textarea aria-label="Suggestion content" value={g.body} onChange={(e) => update(g.id, { body: e.target.value })} rows={3} />{g.kind === "experiment" && <><Textarea aria-label="Suggested hypothesis" value={g.hypothesis ?? ""} onChange={(e) => update(g.id, { hypothesis: e.target.value })} /><Textarea aria-label="Suggested success criteria" value={g.successCriteria ?? ""} onChange={(e) => update(g.id, { successCriteria: e.target.value })} /></>}<Button variant="outline" size="sm" onClick={() => setEditing(false)}>Done</Button></div> : <><div className="font-display text-[17px] italic leading-[1.25]">{g.title}</div><p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{g.body}</p></>}
        <div className="nodrag mt-2.5 flex gap-1.5">
          <Button disabled={!!leaving} size="sm" onClick={() => resolve(g.id, "accept")} className="tw-press min-h-9 gap-1 px-2 text-[11px]">
            <Check className="h-3 w-3" /> Accept
          </Button>
          <Button disabled={!!leaving} size="sm" variant="ghost" onClick={() => resolve(g.id, "dismiss")} className="tw-press min-h-9 gap-1 px-2 text-[11px] text-muted-foreground">
            <X className="h-3 w-3" /> Dismiss
          </Button>
          <Button size="icon" variant="ghost" title="Quick edit" aria-label="Quick edit suggestion" onClick={() => setEditing((v) => !v)}><Pencil className="h-3 w-3" /></Button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="tw-handle opacity-0" isConnectable={false} />
    </div>
  );
}
