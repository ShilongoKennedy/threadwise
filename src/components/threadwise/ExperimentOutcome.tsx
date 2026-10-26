import { useState } from "react";
import { Check, CircleHelp, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { graduationCandidates, type Outcome } from "@/lib/threadwise/graph";
import { useThread } from "@/lib/threadwise/store";

export function ExperimentOutcome() {
  const s = useThread();
  const experiment = s.nodes.find((n) => n.id === s.pendingExperiment);
  if (!experiment) return null;
  return <OutcomeForm key={experiment.id} id={experiment.id} />;
}

function OutcomeForm({ id }: { id: string }) {
  const s = useThread();
  const experiment = s.nodes.find((n) => n.id === id);
  const candidates = graduationCandidates(id, s.nodes, s.edges);
  const [outcome, setOutcome] = useState<Outcome>("inconclusive");
  const [lessons, setLessons] = useState(experiment?.data.meta["lessonsLearned"] ?? "");
  const [chosen, setChosen] = useState<string[]>([]);
  const [promoteTo, setPromoteTo] = useState<"evidence" | "fact">("evidence");
  return <Dialog open onOpenChange={(open) => { if (!open) s.cancelExperiment(); }}>
    <DialogContent className="max-h-[85dvh] w-[calc(100%-24px)] overflow-y-auto rounded-lg">
      <DialogTitle className="font-display text-2xl font-normal">What did the experiment reveal?</DialogTitle>
      <DialogDescription>{experiment?.data.title}</DialogDescription>
      <div className="grid grid-cols-3 gap-2">
        {(["validated", "invalidated", "inconclusive"] as const).map((value) => {
          const Icon = value === "validated" ? Check : value === "invalidated" ? X : CircleHelp;
          return <Button key={value} variant={outcome === value ? "default" : "outline"} className="h-auto flex-col px-1 py-3 text-xs capitalize" aria-pressed={outcome === value} onClick={() => setOutcome(value)}><Icon />{value}</Button>;
        })}
      </div>
      <label className="space-y-2 text-xs">Lessons learned<Textarea aria-label="Lessons learned" className="mt-2" value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="What changed your mind?" /></label>
      {outcome === "validated" && candidates.length > 0 && <div className="space-y-3 border-t pt-3">
        <p className="font-display text-lg">Graduate upstream beliefs</p>
        <div className="flex gap-2">{(["evidence", "fact"] as const).map((value) => <Button key={value} size="sm" variant={promoteTo === value ? "default" : "outline"} aria-pressed={promoteTo === value} onClick={() => setPromoteTo(value)} className="capitalize">{value}</Button>)}</div>
        {candidates.map((n) => <label key={n.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-foreground" checked={chosen.includes(n.id)} onChange={(e) => setChosen((ids) => e.target.checked ? [...ids, n.id] : ids.filter((x) => x !== n.id))} />{n.data.title}</label>)}
      </div>}
      {outcome === "invalidated" && <p className="text-sm text-accent-ink">Dependent actions will be marked for review. A connected lessons note will be added.</p>}
      <Button onClick={() => s.finishExperiment(id, outcome, lessons, chosen, promoteTo)}>Record outcome</Button>
    </DialogContent>
  </Dialog>;
}