import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Redirects back to your app after successful auth
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Could not initiate Google Sign-In.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans selection:bg-[#FBD0D4]">
      
      {/* Left Side - Cinematic Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A1A1A] overflow-hidden flex-col justify-between p-12">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#FDF0B6] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#75F09A] opacity-10 blur-[120px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
              <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
            <span className="font-display italic text-2xl tracking-tight font-medium text-white group-hover:opacity-70 transition-opacity">threadwise</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl text-white leading-[1.1] mb-6">
            Every story has a <span className="italic text-[#75F09A]">thread.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Sign in to connect the evidence, find the hidden motive, and map the bigger picture on your spatial workbench.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/40 font-mono text-xs uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" /> Secured by Supabase Auth
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl text-[#1A1A1A] mb-3">Welcome back.</h2>
            <p className="text-[#1A1A1A]/50">Sign in to access your workspace.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full group flex items-center justify-center gap-3 px-6 py-4 bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 hover:bg-[#FDFBF7] text-[#1A1A1A] rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-8 text-center text-xs text-[#1A1A1A]/40 leading-relaxed">
            By signing in, you agree to our <a href="#" className="underline hover:text-[#1A1A1A]">Terms of Service</a> and <a href="#" className="underline hover:text-[#1A1A1A]">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}