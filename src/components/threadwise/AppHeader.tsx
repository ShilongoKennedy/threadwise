import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { AccountMenu } from "@/components/threadwise/AccountMenu";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { key: "workspace", to: "/workspace", label: "Workspace" },
  { key: "analyst", to: "/analyst", label: "The analyst" },
  { key: "seminar", to: "/seminar", label: "Seminar" },
  { key: "questions", to: "/questions", label: "Questions" },
  { key: "digest", to: "/digest", label: "Record" },
  { key: "cases", to: "/cases", label: "Cases" },
] as const;

const TABS = [
  { key: "workspace", to: "/workspace", label: "Workspace" },
  { key: "questions", to: "/questions", label: "Questions" },
  { key: "analyst", to: "/analyst", label: "Read" },
  { key: "seminar", to: "/seminar", label: "Seminar" },
  { key: "digest", to: "/digest", label: "Record" },
] as const;

/** One header for the landing and every signed-in surface. */
export function AppHeader({
  section,
  marketing = false,
}: {
  section?: string;
  marketing?: boolean;
}) {
  const [email, setEmail] = useState<string | undefined>();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail(data.session?.user.email ?? undefined);
      setSignedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? undefined);
      setSignedIn(Boolean(session));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const headerClass = marketing
    ? "fixed inset-x-0 top-0 z-50 border-b border-[#1A1A1A]/10 bg-[#FDFBF7]/90 backdrop-blur-md"
    : "sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]/95 backdrop-blur-sm";

  return (
    <>
      <header className={headerClass}>
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-5 py-3 md:px-8">
          <BrandLockup size="md" asLink />

          <nav className="hidden items-center gap-6 font-mono text-[9px] uppercase tracking-[0.16em] lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={
                  section === item.key
                    ? "text-[#1A4BFF]"
                    : "text-[#1A1A1A]/55 transition-colors hover:text-[#1A4BFF]"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {signedIn ? (
              <AccountMenu email={email} />
            ) : signedIn === false ? (
              <Link
                to="/login"
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55 transition-colors hover:text-[#1A4BFF]"
              >
                Sign in
              </Link>
            ) : null}

            <Link
              to="/analyst"
              className={`${marketing ? "inline-flex" : "hidden lg:inline-flex"} items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]`}
            >
              <span className="hidden sm:inline">Read a source</span>
              <span className="sm:hidden">Read</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>

            {marketing && (
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#1A1A1A] lg:hidden"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {marketing && menuOpen && (
          <div id="mobile-nav" className="border-t border-[#1A1A1A]/10 bg-[#FDFBF7] px-5 py-4 lg:hidden">
            <nav className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              {[...NAV, { key: "profile", to: "/profile", label: "Profile" }].map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-[#1A1A1A]/10 pb-2 text-[#1A1A1A]/75 hover:text-[#1A4BFF]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {signedIn === false && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-4 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </header>

      {!marketing && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-[#1A1A1A] bg-[#FDFBF7] pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              to={tab.to}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${
                section === tab.key ? "text-[#1A4BFF]" : "text-[#1A1A1A]/50"
              } ${tab.key === "analyst" ? "border-x border-[#1A1A1A]/10 bg-white" : ""}`}
            >
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
