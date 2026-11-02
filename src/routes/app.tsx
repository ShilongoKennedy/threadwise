import { createFileRoute, ClientOnly, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const WorkspaceShell = lazy(() => import("@/components/threadwise/WorkspaceShell").then(m => ({ default: m.WorkspaceShell })));

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — Threadwise" },
      { name: "description", content: "Your reasoning workspace: sources, canvases and the daily brief." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setIsChecking(false);
      }
    });
  }, [navigate]);

  const loading = (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]/20 mb-4" />
      <div className="font-display text-lg text-[#1A1A1A]/65">Opening workspace...</div>
    </div>
  );

  if (isChecking) return loading;

  return (
    <main id="main" className="h-[100dvh] w-full overflow-hidden bg-background">
      <ClientOnly fallback={loading}>
        <Suspense fallback={loading}>
          <WorkspaceShell />
        </Suspense>
      </ClientOnly>
    </main>
  );
}