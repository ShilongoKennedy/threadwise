import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { AlertTriangle, Check, Link2, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relationLabel, type Relation, type ThreadNodeType } from "@/lib/threadwise/model";
import { useThread } from "@/lib/threadwise/store";
import { TYPE_COLOR, TYPE_ICON } from "./ThreadNode";
import { streamTask } from "@/lib/threadwise/ai-client";
import { intelligentTidy } from "@/lib/threadwise/layout";
import { toast } from "sonner";

export function ExplorePanel({ onClose }: { onClose: () => void }) {
  const s = useThread();
  const rf = useReactFlow();
  const [loading, setLoading] = useState(false);
  const [redTeamLoading, setRedTeamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focus = s.nodes.find((n) => n.id === s.selectedId);
  const title = (id: string | null) => s.nodes.find((n) => n.id === id)?.data.title ?? "?";

  const explore = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadNodes = s.nodes.map((n) => ({
        id: n.id,
        kind: n.data?.kind || "idea",
        title: n.data?.title || "",
        body: n.data?.body || "",
        epistemic: n.data?.epistemic || "UNKNOWN",
        lenses: n.data?.lenses || {},
        meta: n.data?.meta || {},
      }));

      const payloadEdges = s.edges.map((e) => ({
        source: e.source,
        target: e.target,
        relation: relationLabel(e.data?.relation ?? "leads_to", e.data?.customLabel),
      }));

      const output = await streamTask(
        {
          mode: "explore",
          focusId: focus?.id ?? null,
          nodes: payloadNodes,
          edges: payloadEdges,
        },
        () => {},
      );

      const res = JSON.parse(output);

      if (res.error) {
        setError(res.error);
      } else if (!res.suggestions || res.suggestions.length === 0) {
        setError("No suggestions this time — try adding more detail.");
      } else {
        s.setGhosts(res.suggestions);
        setTimeout(() => rf.fitView({ padding: 0.2, duration: 500 }), 50);
      }
    } catch (e: any) {
      console.error("EXPLORE ERROR DETAILS:", e);
      setError(e?.message || String(e) || "Couldn't get suggestions right now.");
    } finally {
      setLoading(false);
    }
  };

  const runRedTeam = async () => {
    setRedTeamLoading(true);
    setError(null);
    try {
      const lightweightNodes = s.nodes.map(n => ({
        id: n.id,
        kind: n.data.kind,
        title: n.data.title,
        body: n.data.body
      }));

      const output = await streamTask({ mode: "red-team-canvas", nodes: lightweightNodes }, () => {});
      const res = JSON.parse(output);
      
      if (res.error) {
        setError(res.error);
      } else if (res.omissions && res.omissions.length > 0) {
        const currentNodes = useThread.getState().nodes;
        
        res.omissions.forEach((om: any) => {
          // Find the target node to calculate spawn position
          const target = currentNodes.find(n => n.id === om.targetId) || currentNodes[0];
          const x = target ? target.position.x + 400 : 0;
          const y = target ? target.position.y + 200 : 0;
          
          // Spawn the Omission node
          const id = useThread.getState().addNode("omission", { x, y });
          useThread.getState().updateNode(id, { title: om.title, body: om.body, meta: { status: "open" } });
          
          // Connect it to the target hypothesis
          if (om.targetId && currentNodes.some(n => n.id === om.targetId)) {
            useThread.getState().connect({ source: om.targetId, target: id, sourceHandle: null, targetHandle: null }, "needs_evidence_from");
          }
        });
        
        // Instantly tidy the board to snap them into place
        const newPositions = intelligentTidy(useThread.getState().nodes, useThread.getState().edges);
        useThread.getState().setPositions(newPositions);
        
        toast.success(`Red team found ${res.omissions.length} blind spot${res.omissions.length === 1 ? '' : 's'}. Planted.`);
      } else {
        toast.success("Red team found no obvious omissions. The board looks solid!");
      }
    } catch (e: any) {
      setError(e.message || "Red team failed.");
    } finally {
      setRedTeamLoading(false);
    }
  };

  return (
    <aside className="tw-sheet-left absolute inset-x-0 bottom-0 z-20 flex max-h-[72dvh] flex-col md:inset-x-auto md:bottom-28 md:left-6 md:top-24 md:max-h-none md:w-[320px] overflow-hidden tw-sheet rounded-t-[22px] md:rounded-[18px] border bg-card shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Explore
        </span>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close explore">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 border-b px-5 py-4">
        <p className="text-xs text-muted-foreground">
          {focus ? <>Exploring around <span className="font-display text-foreground">{focus.data.title}</span></> : <span className="font-display text-[15px] italic text-foreground">Read the whole canvas, or select a card to focus.</span>}
        </p>
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={explore} disabled={loading || redTeamLoading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your canvas…</> : <><Sparkles className="mr-2 h-4 w-4" /> Find questions, tests & links</>}
          </Button>
          <Button variant="outline" className="w-full border-[#C24A35]/30 text-[#C24A35] hover:bg-[#C24A35]/5" onClick={runRedTeam} disabled={redTeamLoading || loading}>
            {redTeamLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Red Teaming...</> : <><AlertTriangle className="mr-2 h-4 w-4" /> Red Team Board (Find Omissions)</>}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive whitespace-pre-wrap">{error}</p>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {s.ghosts.length === 0 && !loading && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Suggestions appear here and as faint cards on the canvas until you accept them.</p>
        )}
        {s.ghosts.map((g) => {
          const isLink = g.kind === "connection";
          const Icon = isLink ? Link2 : TYPE_ICON[g.kind as ThreadNodeType];
          const color = isLink ? "var(--muted-foreground)" : TYPE_COLOR[g.kind as ThreadNodeType];
          return (
            <div key={g.id} className={`tw-rise ${s.leaving[g.id] ? `is-${s.leaving[g.id]}` : ""} rounded-xl border border-dashed bg-background/50 p-3.5`} style={{ animationDelay: `${s.ghosts.indexOf(g) * 60}ms` }}>
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>
                <Icon className="h-3 w-3" /> {g.kind}
              </div>
              <div className="font-display text-sm leading-snug">{g.title}</div>
              {isLink ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {title(g.anchorId)} <span className="font-medium text-foreground">{relationLabel(g.relation as Relation)}</span> {title(g.targetId)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>
              )}
              <p className="mt-2 border-l-2 pl-2 font-display text-[12.5px] italic leading-snug text-muted-foreground" style={{ borderColor: color }}>{g.rationale}</p>
              <div className="mt-2 flex gap-1.5">
                <Button size="sm" className="h-7 text-xs" onClick={() => s.resolveGhost(g.id, "accept")}><Check className="mr-1 h-3 w-3" /> Accept</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => s.resolveGhost(g.id, "dismiss")}>Dismiss</Button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}