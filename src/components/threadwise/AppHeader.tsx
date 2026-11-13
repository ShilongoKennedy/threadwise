import { useEffect, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  HelpCircle,
  Menu,
  Presentation,
  ScanSearch,
  X,
} from "lucide-react";
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

const TABS: Array<{ key: string; to: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }> = [
  { key: "workspace", to: "/workspace", label: "Workspace", icon: Compass },
  { key: "questions", to: "/questions", label: "Questions", icon: HelpCircle },
  { key: "analyst", to: "/analyst", label: "Read", icon: ScanSearch },
  { key: "seminar", to: "/seminar", label: "Seminar", icon: Presentation },
  { key: "digest", to: "/digest", label: "Record", icon: BookOpen },
];

/** One floating glass header for the landing and every signed-in surface. */
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

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
        <div className="pointer-events-auto relative mx-auto w-full max-w-[1240px] rounded-[22px] border border-[#8A745C]/22 bg-[linear-gradient(180deg,rgba(255,250,242,0.7),rgba(250,242,229,0.4))] shadow-[0_16px_46px_rgba(43,33,23,0.09),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-[30px] backdrop-saturate-[1.2]">
          <div className="flex h-[56px] items-center justify-between gap-4 px-4 md:h-[60px] md:px-5">
            <BrandLockup size="md" asLink />

            <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={section === item.key ? "page" : undefined}
                  className={`group relative py-2 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
                    section === item.key
                      ? "text-[#1A4BFF]"
                      : "text-[#1A1A1A]/55 hover:text-[#1A4BFF]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-[2px] mx-auto h-px bg-[#1A4BFF] transition-transform duration-200 ${
                      section === item.key ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {signedIn ? (
                <AccountMenu email={email} />
              ) : signedIn === false ? (
                <Link
                  to="/login"
                  className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55 transition-colors hover:text-[#1A4BFF] sm:inline"
                >
                  Sign in
                </Link>
              ) : null}

              <Link
                to="/analyst"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1A1A1A] px-3.5 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#FDFBF7] transition-colors hover:bg-[#1A4BFF]"
              >
                <span className="hidden sm:inline">Read a source</span>
                <span className="sm:hidden">Read</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>

              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="app-mobile-nav"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1A1A]/18 text-[#1A1A1A]/65 transition-colors hover:border-[#1A4BFF]/40 hover:text-[#1A4BFF] lg:hidden"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {menuOpen ? (
            <div
              id="app-mobile-nav"
              className="border-t border-[#8A745C]/15 px-4 pb-4 pt-3 lg:hidden"
            >
              <nav aria-label="Mobile primary" className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[...NAV, { key: "profile", to: "/profile", label: "Profile" }].map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`border-b border-[#1A1A1A]/8 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                      section === item.key ? "text-[#1A4BFF]" : "text-[#1A1A1A]/65"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {signedIn === false ? (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]"
                >
                  Sign in
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {!marketing ? (
        <nav
          aria-label="Primary mobile destinations"
          className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[18px] border border-[#8A745C]/20 bg-[linear-gradient(180deg,rgba(255,250,242,0.82),rgba(250,242,229,0.62))] p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_18px_50px_rgba(43,33,23,0.14)] backdrop-blur-[26px] lg:hidden"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.key;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[13px] font-mono text-[7px] uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "bg-[#1A4BFF]/8 text-[#1A4BFF]"
                    : "text-[#1A1A1A]/45 hover:bg-white/40 hover:text-[#1A1A1A]/70"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
