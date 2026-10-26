import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reasoningLinks } from "@/lib/threadwise/graph";
import { TYPE_INFO } from "@/lib/threadwise/model";
import { useThread } from "@/lib/threadwise/store";

/** A playable, graph-derived answer to “if we do this, then what?” */
export function ConsequenceMap({ onExit }: { onExit: () => void }) {
  const s = useThread();
  const [mode, setMode] = useState<"expected" | "upside" | "guardrail">("expected");
  const focus = s.nodes.find((n) => n.selected) ?? s.nodes.find((n) => n.data.kind === "action") ?? s.nodes[0];
  const links = useMemo(() => reasoningLinks(s.edges), [s.edges]);
  const byId = useMemo(() => new Map(s.nodes.map((n) => [n.id, n])), [s.nodes]);
  const direct = focus ? links.filter((l) => l.from === focus.id).map((l) => byId.get(l.to)).filter(Boolean) : [];
  const second = direct.flatMap((n) => links.filter((l) => l.from === n!.id).map((l) => byId.get(l.to))).filter(Boolean);
  const upstream = focus ? links.filter((l) => l.to === focus.id).map((l) => byId.get(l.from)).filter(Boolean) : [];
  const target = mode === "guardrail" ? upstream : mode === "upside" ? second : direct;
  const label = mode === "expected" ? "The next consequences" : mode === "upside" ? "What this could unlock" : "What must hold first";
  const select = (id: string) => { s.select(id); onExit(); };
  const Card = ({ id, role }: { id: string; role: string }) => { const n = byId.get(id); return n ? <button className="tw-consequence-card" onClick={() => select(id)}><span>{role} · {TYPE_INFO[n.data.kind].label}</span><strong>{n.data.title}</strong><small>{n.data.body || "Open this thread to shape the next move."}</small></button> : null; };

  return <section className="tw-consequence" role="dialog" aria-modal="true" aria-label="Consequence map">
    <header><div><span className="tw-kicker">Consequence map</span><h2>If we move, what moves?</h2></div><Button variant="ghost" size="icon" aria-label="Close consequence map" onClick={onExit}><X /></Button></header>
    {focus ? <main><aside><p className="tw-kicker">Choose a future</p>{(["expected", "upside", "guardrail"] as const).map((v) => <button key={v} data-active={mode === v} onClick={() => setMode(v)}>{v === "expected" ? "Expected path" : v === "upside" ? "Upside path" : "Guardrails"}</button>)}<p className="tw-consequence-note">This map uses only the relationships already on your canvas. It does not pretend to predict the future.</p></aside><div className="tw-consequence-world"><div className="tw-consequence-origin"><span>the move</span><h3>{focus.data.title}</h3><p>{focus.data.body || "Choose this card to see the decision in its original context."}</p><button onClick={() => select(focus.id)}>Open source <ArrowRight /></button></div><div className="tw-consequence-beam" aria-hidden><i /><i /><i /></div><section className="tw-consequence-outcomes"><p className="tw-kicker">{label}</p>{target.length ? target.slice(0, 6).map((n, i) => <Card key={n!.id} id={n!.id} role={mode === "guardrail" ? "depends on" : `${String(i + 1).padStart(2, "0")} then`} />) : <div className="tw-consequence-empty"><RotateCcw /><p>{mode === "guardrail" ? "No explicit prerequisites yet." : "No downstream consequences yet."}</p><small>Link another card to this thought to give the future a shape.</small></div>}</section></div></main> : <p className="p-8">Add a thought to map its consequences.</p>}
  </section>;
}
