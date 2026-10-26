import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread } from "@/lib/threadwise/store";
import { reasoningLinks } from "@/lib/threadwise/graph";
import { TYPE_INFO } from "@/lib/threadwise/model";

/** A spatial reading of a decision: evidence below, uncertainties around it, moves ahead. */
export function DecisionTheatre({ onExit }: { onExit: () => void }) {
  const s = useThread();
  const focus = s.nodes.find((n) => n.id === s.selectedId) ?? s.nodes.find((n) => n.data.kind === "action") ?? s.nodes[0];
  const links = reasoningLinks(s.edges);
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const related = focus ? links.filter((l) => l.to === focus.id || l.from === focus.id).map((l) => byId.get(l.from === focus.id ? l.to : l.from)).filter(Boolean) : [];
  const evidence = related.filter((n) => n!.data.epistemic === "fact" || n!.data.epistemic === "evidence" || n!.data.kind === "note");
  const uncertain = related.filter((n) => ["assumption", "hypothesis", "unknown"].includes(n!.data.epistemic));
  const moves = related.filter((n) => n!.data.kind === "action" || n!.data.kind === "experiment");
  const Card = ({ n }: { n: NonNullable<typeof focus> }) => <button className="tw-theatre-card" onClick={() => { s.select(n.id); onExit(); }}><span>{TYPE_INFO[n.data.kind].label} · {n.data.epistemic}</span>{n.data.title}</button>;
  return <section className="tw-theatre" role="dialog" aria-modal="true" aria-label="Decision theatre"><header><div><span className="tw-kicker">Decision theatre</span><p>Stand inside the decision before you make it.</p></div><Button variant="ghost" size="icon" aria-label="Exit decision theatre" onClick={onExit}><X /></Button></header>{focus ? <main><div className="tw-theatre-ring tw-theatre-uncertain"><h3>Uncertainty</h3>{uncertain.length ? uncertain.map((n) => <Card key={n!.id} n={n!} />) : <p>No named uncertainty nearby.</p>}</div><div className="tw-theatre-core"><span>{TYPE_INFO[focus.data.kind].label}</span><h2>{focus.data.title}</h2><p>{focus.data.body || "This is the decision at the centre of the current field."}</p></div><div className="tw-theatre-ring tw-theatre-evidence"><h3>What grounds it</h3>{evidence.length ? evidence.map((n) => <Card key={n!.id} n={n!} />) : <p>Link evidence to give this decision a floor.</p>}</div><div className="tw-theatre-path"><h3>What it unlocks</h3>{moves.length ? moves.map((n) => <Card key={n!.id} n={n!} />) : <p>Name the next move when you are ready.</p>}</div></main> : <p className="p-8">Add a thought to open the theatre.</p>}</section>;
}
