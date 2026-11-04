import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createNodeData, type ThreadNodeType } from "@/lib/threadwise/model";
import { useThread, type TEdge, type TNode } from "@/lib/threadwise/store";

const Canvas = lazy(() => import("@/components/threadwise/Canvas"));

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Try the canvas — Threadwise" },
      {
        name: "description",
        content:
          "The real canvas, seeded with one source. Drag a card, pull a cord, click a tag — nothing here is a screenshot.",
      },
    ],
  }),
  component: DemoPage,
});

const SPEC: {
  id: string;
  x: number;
  y: number;
  kind: ThreadNodeType;
  epistemic: TNode["data"]["epistemic"];
  title: string;
  body: string;
}[] = [
  {
    id: "demo-claim",
    x: 120,
    y: 160,
    kind: "note",
    epistemic: "evidence",
    title: "“I said, you have three armies within 400 miles.”",
    body: "Reuters brief · US Treasury, Nov 2026",
  },
  {
    id: "demo-support",
    x: 520,
    y: 110,
    kind: "note",
    epistemic: "evidence",
    title: "Gold defended by the Atlantic, the Pacific, the US military.",
    body: "Three assurances in one breath.",
  },
  {
    id: "demo-reading",
    x: 900,
    y: 200,
    kind: "idea",
    epistemic: "hypothesis",
    title: "The reassurance is the threat.",
    body: "Protection named as leverage: what could be taken if the gold moves.",
  },
  {
    id: "demo-gap",
    x: 520,
    y: 420,
    kind: "question",
    epistemic: "unknown",
    title: "Who is the threat, exactly?",
    body: "Never stated in the source.",
  },
];

type Relation = NonNullable<TEdge["data"]>["relation"];

const CORDS: { id: string; source: string; target: string; relation: Relation }[] = [
  { id: "demo-e1", source: "demo-claim", target: "demo-support", relation: "supports" },
  { id: "demo-e2", source: "demo-support", target: "demo-reading", relation: "leads_to" },
  { id: "demo-e3", source: "demo-claim", target: "demo-gap", relation: "needs_evidence_from" },
];

function DemoPage() {
  const [ready, setReady] = useState(false);

  // Seed the real store once, so every component behaves exactly as it does in the app.
  useEffect(() => {
    const nodes: TNode[] = SPEC.map((card) => ({
      id: card.id,
      type: "thread",
      position: { x: card.x, y: card.y },
      data: {
        ...createNodeData(card.kind, card.title),
        title: card.title,
        body: card.body,
        epistemic: card.epistemic,
      },
    }));
    const edges: TEdge[] = CORDS.map((cord) => ({
      id: cord.id,
      source: cord.source,
      target: cord.target,
      type: "relation",
      data: { relation: cord.relation },
    }));
    useThread.setState({ nodes, edges, selectedId: null });
    useThread.getState().recordSnapshot("Demo canvas");
    setReady(true);
  }, []);

  return (
    <div className="tw-demo flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FDFBF7]">
      <header className="z-40 flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#1A1A1A] bg-[#FDFBF7] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
            Demo <span className="text-[#1A4BFF]">//</span> the real canvas, seeded
          </span>
        </div>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 sm:inline">
          drag · pull a cord · press O on a card
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        {ready && (
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <Canvas />
            </Suspense>
          </ClientOnly>
        )}
      </div>
    </div>
  );
}
