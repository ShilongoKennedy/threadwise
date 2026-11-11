import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Threadwise" },
      {
        name: "description",
        content: "Sign in to keep your reads, questions, predictions and practice in one record.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/analyst", replace: true });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/analyst", replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start Google sign-in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#FDFBF7] text-[#1A1A1A]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-6 top-24 h-4 w-4 border-l border-t border-[#1A1A1A]/20" />
      <div className="pointer-events-none absolute right-6 top-24 h-4 w-4 border-r border-t border-[#1A1A1A]/20" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1100px] flex-col px-5 py-5 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]"
          >
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <BrandLockup size="md" asLink />
        </header>

        <main className="grid flex-1 items-center gap-12 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-20">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1A4BFF]">
              Your record, kept
            </p>
            <h1 className="mt-4 max-w-[12ch] font-display text-[clamp(42px,6vw,76px)] leading-[0.94] tracking-[-0.03em]">
              Sign in to keep the record.
            </h1>
            <p className="mt-5 max-w-[42ch] font-serif text-[16px] leading-[1.65] text-[#1A1A1A]/70">
              Reads, questions, predictions and practice in one place. No feed. No recommendations.
              Just the work you can check.
            </p>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
              Free while in beta.
            </p>
          </div>

          <div className="border-2 border-[#1A1A1A] bg-white">
            <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#FDFBF7]">
                Sign in
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF]">
                one account
              </span>
            </div>

            <div className="p-5 md:p-6">
              <h2 className="font-display text-[24px] leading-tight">Continue with Google.</h2>
              <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/60">
                No password to remember. Your reads stay private until you publish one.
              </p>

              {error && (
                <p className="mt-4 border-l-2 border-[#C1121F] pl-2 font-serif text-[13px] leading-snug text-[#C1121F]">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleGoogleLogin()}
                disabled={isLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4 rounded-full bg-white p-0.5" viewBox="0 0 24 24" aria-hidden>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                <ShieldCheck className="h-3.5 w-3.5" /> Secured by Supabase
              </p>
            </div>
          </div>
        </main>

        <footer className="flex flex-col justify-between gap-3 border-t border-[#1A1A1A]/10 py-4 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/40 sm:flex-row">
          <span>By signing in, you agree to the terms.</span>
          <span className="flex gap-4">
            <Link to="/terms" className="underline underline-offset-4 hover:text-[#1A1A1A]">
              Terms
            </Link>
            <Link to="/privacy" className="underline underline-offset-4 hover:text-[#1A1A1A]">
              Privacy
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
