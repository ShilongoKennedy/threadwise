import { createFileRoute, ClientOnly, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Canvas = lazy(() => import("@/components/threadwise/Canvas"));

export const Route = createFileRoute("/app")({
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If no session, kick them to the login page
        navigate({ to: "/login" });
      } else {
        setIsChecking(false);
      }
    });
  }, [navigate]);

  const loading = (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]/20 mb-4" />
      <div className="font-display text-lg text-[#1A1A1A]/50">Opening workspace...</div>
    </div>
  );

  if (isChecking) return loading;

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