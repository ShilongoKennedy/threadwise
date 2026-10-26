import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

/** Completes both Supabase PKCE (?code=…) and legacy implicit (#access_token=…) callbacks. */
function AuthCallback() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let active = true;
    const finish = async () => {
      // This runs only after hydration and initializes from Vite's browser-side
      // VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY values.
      const supabase = getSupabaseClient();
      const current = new URL(window.location.href);
      const providerError = current.searchParams.get("error_description") || current.searchParams.get("error");
      if (providerError) throw new Error(providerError);

      const code = current.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        const hash = new URLSearchParams(current.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (!access_token || !refresh_token) throw new Error("The sign-in response was incomplete. Please try again.");
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
      }

      window.history.replaceState({}, document.title, "/auth/callback");
      if (active) await navigate({ to: "/", replace: true });
    };
    void finish().catch((error: unknown) => {
      if (active) setProblem(error instanceof Error ? error.message : "Google sign-in could not be completed.");
    });
    return () => { active = false; };
  }, [navigate]);

  return <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
    <section className="max-w-md">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-ink">Threadwise account</p>
      <h1 className="mt-3 font-display text-4xl">{problem ? "Sign-in needs attention" : "Opening your desk…"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{problem || "Finishing your secure Google sign-in."}</p>
      {problem && <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Return to canvas</a>}
    </section>
  </main>;
}
