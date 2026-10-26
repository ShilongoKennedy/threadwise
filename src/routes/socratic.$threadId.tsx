import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Canvas = lazy(() => import("@/components/threadwise/Canvas"));
export const Route = createFileRoute("/socratic/$threadId")({
  head: () => ({ meta: [{ title: "Threadwise — Socratic inquiry" }, { name: "description", content: "Examine assumptions and hidden tensions in your connected thinking. Inquiry history stays in this browser." }, { property: "og:title", content: "Threadwise — Socratic inquiry" }, { property: "og:description", content: "A thoughtful conversation with your connected canvas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Inquiry,
});
function Inquiry() { const { threadId } = Route.useParams(); const loading = <div className="flex h-screen items-center justify-center font-display">Threadwise</div>; return <main className="h-screen w-screen overflow-hidden bg-background"><ClientOnly fallback={loading}><Suspense fallback={loading}><Canvas threadId={threadId} /></Suspense></ClientOnly></main>; }