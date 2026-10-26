import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread } from "@/lib/threadwise/store";
import type { Fault } from "@/lib/threadwise/graph";

export function AuditPanel({ faults, onClose, onFocus }: { faults: Fault[]; onClose: () => void; onFocus: (id: string) => void }) {
  const nodes = useThread((s) => s.nodes);
  return <aside className="absolute left-4 right-4 top-[132px] z-10 max-h-[30dvh] overflow-y-auto border-l-2 border-accent-ink bg-background/95 p-3 md:left-6 md:right-auto md:w-80" aria-label="Integrity audit">
    <div className="flex items-center justify-between"><span className="flex items-center gap-2 font-mono text-[10px] uppercase">{faults.length ? <AlertTriangle className="h-4 w-4 text-accent-ink" /> : <Check className="h-4 w-4" />} {faults.length} fault {faults.length === 1 ? "line" : "lines"}</span><Button size="icon" variant="ghost" aria-label="Close audit" onClick={onClose}><X /></Button></div>
    {faults.length === 0 && <p className="text-xs text-muted-foreground">No untested Idea-to-Action chains found.</p>}
    {faults.map((f) => <Button key={`${f.actionId}-${f.uncertainId}`} variant="ghost" className="h-auto w-full flex-col items-start whitespace-normal px-1 py-3 text-left" onClick={() => onFocus(f.actionId)}>
      <span className="text-xs text-accent-ink">Untested assumption precedes action</span>
      <span className="font-display text-sm font-normal">{nodes.find((n) => n.id === f.uncertainId)?.data.title} → {nodes.find((n) => n.id === f.actionId)?.data.title}</span>
    </Button>)}
  </aside>;
}