import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Canvas = lazy(() => import("@/components/threadwise/Canvas"));
export const Route = createFileRoute("/socratic/$threadId")({
  head: () => ({ meta: [{ title: "Threadwise — Socratic inquiry" }, { name: "description", content: "Examine assumptions and hidden tensions in your connected thinking. Inquiry history stays in this browser." }, { property: "og:title", content: "Threadwise — Socratic inquiry" }, { property: "og:description", content: "A thoughtful conversation with your connected canvas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Inquiry,
});
function Inquiry() { const { threadId } = Route.useParams(); const loading = <div className="flex h-[100dvh] items-center justify-center font-display">Threadwise</div>; return <main className="h-[100dvh] w-full overflow-hidden bg-background">
      <Link
        to="/app"
        className="fixed right-3 top-3 z-[60] flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#FDFBF7]/95 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
      >
        ← Workspace
      </Link><ClientOnly fallback={loading}><Suspense fallback={loading}><Canvas threadId={threadId} /></Suspense></ClientOnly></main>; }