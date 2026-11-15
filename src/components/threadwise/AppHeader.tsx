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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <header className={`app-header sticky top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
        <div className="app-header__shell">
          <div className="app-header__inner">
            <div className="app-header__brand">
              <BrandLockup size="md" asLink />
            </div>

            <nav aria-label="Primary" className="app-header__nav hidden lg:flex">
              {NAV.map((item, index) => (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={section === item.key ? "page" : undefined}
                  className={`app-header__link ${section === item.key ? "is-active" : ""}`}
                >
                  <span className="app-header__number">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                  <span className="app-header__knot" aria-hidden="true" />
                </Link>
              ))}
            </nav>

            <div className="app-header__actions">
              {signedIn ? (
                <AccountMenu email={email} dark />
              ) : signedIn === false ? (
                <Link to="/login" className="app-header__signin hidden sm:inline">
                  Sign in
                </Link>
              ) : null}

              <Link to="/analyst" data-read-source className="app-header__cta">
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
                className="app-header__menu lg:hidden"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="app-header__thread" aria-hidden="true">
            <span />
          </div>

          {menuOpen ? (
            <div id="app-mobile-nav" className="app-header__mobile lg:hidden">
              <nav aria-label="Mobile primary" className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[...NAV, { key: "profile", to: "/profile", label: "Profile" }].map((item, index) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`app-header__mobile-link ${section === item.key ? "is-active" : ""}`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              {signedIn === false ? (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="app-header__mobile-signin">
                  Sign in <ArrowUpRight className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {!marketing ? (
        <nav aria-label="Primary mobile destinations" className="app-mobile-tabs lg:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.key;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : ""}
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
