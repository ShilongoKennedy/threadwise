import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type PointerEvent, type CSSProperties } from "react";

export const Route = createFileRoute("/lab/field")({
  head: () => ({
    meta: [
      { title: "The evidence field — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EvidenceField,
});

type Node = {
  id: string;
  n: string;
  kicker: string;
  title: string;
  short: string;
  body: string;
  source: string;
  confidence: string;
  x: number;
  y: number;
  w: number;
  rotate: number;
  z: number;
  kind?: "claim" | "gap" | "test";
};

const NODES: Node[] = [
  {
    id: "claim", n: "01", kicker: "The claim", title: "A report raised concerns.", short: "The document is named. The finding is not.",
    body: "A confidential briefing is said to have raised concerns about Iran’s enrichment programme. It has not been published. No figure, site or finding from it has been quoted.",
    source: "The move / supplied source", confidence: "The claim, not the finding", x: 600, y: 335, w: 360, rotate: -1.2, z: 3, kind: "claim",
  },
  {
    id: "document", n: "02", kicker: "The document", title: "The missing exhibit.", short: "Unpublished. Unquoted. Load-bearing.",
    body: "The report exists as an object in the story, not as evidence in the open. Until the annex is published, the reader is relying on descriptions of a document, not the document.",
    source: "Briefing note / not independently reviewed", confidence: "Gap at the centre", x: 292, y: 155, w: 230, rotate: -3.4, z: 1,
  },
  {
    id: "gap", n: "03", kicker: "The gap", title: "The leap from ‘concerns’ to capability.", short: "One word is doing too much work.",
    body: "‘Concerns’ can mean a capability, an intention, an access problem, or a political judgement. The sentence does not say which. That ambiguity is the point where the read has to slow down.",
    source: "Language / the unstated referent", confidence: "Interpretive seam", x: 238, y: 560, w: 235, rotate: 2.4, z: 2, kind: "gap",
  },
  {
    id: "actors", n: "04", kicker: "The actors", title: "Who wants the briefing known?", short: "A leak is also a move.",
    body: "Officials, member states and the Agency each have a different reason to describe the briefing in public. Ask who gains from the timing being read as a signal.",
    source: "Incentives / not established", confidence: "Inference, not fact", x: 942, y: 178, w: 225, rotate: 2.2, z: 1,
  },
  {
    id: "timing", n: "05", kicker: "The timing", title: "The signal is the timing.", short: "Not the content. The circulation.",
    body: "The story turns on when the briefing reached member states, not on what it found. That is an interpretation of motive unless a named actor says the timing was intentional.",
    source: "Sequence / reported", confidence: "Inference", x: 996, y: 410, w: 214, rotate: -2.4, z: 2,
  },
  {
    id: "test", n: "06", kicker: "The test", title: "Publish the annex.", short: "What would end the reading.",
    body: "A named site, a measured quantity, or a quoted finding would settle the question. Until one appears, the honest verdict is not ‘nothing happened’ but ‘the record does not say’.",
    source: "Falsifier / the document", confidence: "What would change it", x: 824, y: 642, w: 255, rotate: 1.8, z: 3, kind: "test",
  },
  {
    id: "record", n: "07", kicker: "The record", title: "Six dated reports.", short: "The story is real. The evidence is thin.",
    body: "Six reports repeat the same central fact: a briefing exists and has raised concerns. Repetition is not corroboration. The missing document remains the only thing that would make the claim a finding.",
    source: "News record / 6 reports", confidence: "Documented to a point", x: 438, y: 664, w: 220, rotate: -1.6, z: 1,
  },
];

const LINKS: [string, string][] = [
  ["claim", "document"], ["claim", "gap"], ["claim", "actors"], ["claim", "timing"], ["claim", "test"], ["claim", "record"],
  ["document", "gap"], ["actors", "timing"], ["timing", "test"], ["gap", "record"], ["record", "test"],
];

function curve(a: Node, b: Node) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 36;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

function EvidenceField() {
  const [selected, setSelected] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const byId = (id: string) => NODES.find((node) => node.id === id)!;

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + event.clientX - drag.current.x, y: drag.current.py + event.clientY - drag.current.y });
  };
  const onUp = () => { drag.current = null; };

  return (
    <div className="field-lab">
      <header className="field-nav">
        <Link to="/" className="field-brand">threadwise</Link>
        <span className="field-nav__case">Evidence field / case 014</span>
        <div className="field-nav__right">
          <span>Analyst</span>
          <Link to="/analyst">New source <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main
        className="field-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          className="field-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` } as CSSProperties}
        >
          <svg className="field-lines" viewBox="0 0 1200 760" aria-hidden="true">
            {LINKS.map(([from, to]) => {
              const a = byId(from);
              const b = byId(to);
              const active = selected?.id === from || selected?.id === to;
              return (
                <g key={`${from}-${to}`} className={active ? "is-active" : ""}>
                  <path d={curve(a, b)} />
                  <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2 - 18} r="2" />
                </g>
              );
            })}
          </svg>

          {NODES.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelected(node)}
              className={`field-node field-node--${node.id} ${node.kind ? `field-node--${node.kind}` : ""} ${selected?.id === node.id ? "is-selected" : ""}`}
              style={{
                left: `${(node.x / 1200) * 100}%`,
                top: `${(node.y / 760) * 100}%`,
                width: `${(node.w / 1200) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${node.rotate}deg) scale(${0.94 + node.z * 0.03})`,
                zIndex: node.z + (selected?.id === node.id ? 10 : 0),
              }}
            >
              <span className="field-node__pin" aria-hidden="true" />
              <span className="field-node__meta"><b>{node.n}</b>{node.kicker}</span>
              <span className="field-node__title">{node.title}</span>
              <span className="field-node__short">{node.short}</span>
            </button>
          ))}
        </div>

        <div className="field-hint">
          <span>Drag the field</span>
          <span>Open a node</span>
          <span>Confidence is marked inside</span>
        </div>

        <div className="field-controls">
          <button type="button" onClick={() => setZoom((v) => Math.max(0.72, v - 0.1))} aria-label="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((v) => Math.min(1.35, v + 0.1))} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        </div>
      </main>

      {selected ? (
        <aside className="field-sheet" aria-live="polite">
          <button type="button" className="field-sheet__close" onClick={() => setSelected(null)} aria-label="Close evidence note">×</button>
          <p className="field-sheet__kicker"><span>{selected.n}</span>{selected.kicker}</p>
          <h2>{selected.title}</h2>
          <p className="field-sheet__body">{selected.body}</p>
          <div className="field-sheet__foot">
            <span>{selected.source}</span>
            <span>{selected.confidence}</span>
          </div>
        </aside>
      ) : null}

      <footer className="field-foot">
        <span>Read the connections, not the order.</span>
        <span>Not a verdict. A field of evidence.</span>
      </footer>
    </div>
  );
}
