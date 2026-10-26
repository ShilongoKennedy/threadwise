import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Canvas = lazy(() => import("@/components/threadwise/Canvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Threadwise — Canvas for connected thinking" },
      { name: "description", content: "Capture ideas, notes, questions, experiments and actions, then connect them on an infinite canvas." },
      { property: "og:title", content: "Threadwise — Canvas for connected thinking" },
      { property: "og:description", content: "Turn scattered thoughts into connected understanding and meaningful action." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const loading = <div className="flex h-screen items-center justify-center font-display text-muted-foreground">Threadwise</div>;
  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <ClientOnly fallback={loading}>
        <Suspense fallback={loading}>
          <Canvas />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
