import { useEffect, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  HelpCircle,
  Presentation,
  ScanSearch,
  X,
} from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { AccountMenu } from "@/components/threadwise/AccountMenu";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { key: "workspace", to: "/workspace", label: "Workspace", note: "Your desk" },
  { key: "analyst", to: "/analyst", label: "The Analyst", note: "Read a move" },
  { key: "seminar", to: "/seminar", label: "Seminar", note: "Two readings, one crux" },
  { key: "questions", to: "/questions", label: "Questions", note: "What are you deciding?" },
  { key: "digest", to: "/digest", label: "Record", note: "What the evidence did" },
  { key: "cases", to: "/cases", label: "Cases", note: "The files that return" },
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
  const [indexOpen, setIndexOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!indexOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndexOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [indexOpen]);

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

  const current = NAV.find((item) => item.key === section);
  const currentIndex = Math.max(1, NAV.findIndex((item) => item.key === section) + 1);

  return (
    <>
      <header className={`app-header sticky top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
        <div className="app-header__shell">
          <div className="app-header__inner">
            <div className="app-header__brand">
              <BrandLockup size="md" asLink />
            </div>

            <div className="app-header__current" aria-live="polite">
              <span className="app-header__folio">{String(currentIndex).padStart(2, "0")}</span>
              <span className="app-header__current-label">{current?.label ?? "Index"}</span>
              <span className="app-header__current-rule" aria-hidden="true" />
            </div>

            <div className="app-header__actions">
              <button
                type="button"
                onClick={() => setIndexOpen(true)}
                className="app-header__index"
                aria-haspopup="dialog"
                aria-expanded={indexOpen}
              >
                <span className="app-header__index-knot" aria-hidden="true" />
                Index
              </button>
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
            </div>
          </div>
          <div className="app-header__thread" aria-hidden="true"><span /></div>
        </div>
      </header>

      {indexOpen ? (
        <div className="app-index" role="dialog" aria-modal="true" aria-label="Threadwise index">
          <button type="button" className="app-index__scrim" onClick={() => setIndexOpen(false)} aria-label="Close index" />
          <div className="app-index__panel">
            <div className="app-index__head">
              <div>
                <p className="app-index__eyebrow">Threadwise / Index</p>
                <p className="app-index__title">Six ways into the work.</p>
              </div>
              <button type="button" className="app-index__close" onClick={() => setIndexOpen(false)}>
                <X className="h-4 w-4" /> Close
              </button>
            </div>
            <nav aria-label="Index">
              <ol className="app-index__list">
                {NAV.map((item, index) => (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      onClick={() => setIndexOpen(false)}
                      aria-current={section === item.key ? "page" : undefined}
                      className={`app-index__link ${section === item.key ? "is-active" : ""}`}
                    >
                      <span className="app-index__number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="app-index__copy">
                        <span className="app-index__label">{item.label}</span>
                        <span className="app-index__note">{item.note}</span>
                      </span>
                      <ArrowUpRight className="app-index__arrow h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="app-index__foot">
              <span>Read carefully · verify before you act</span>
              <span>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      ) : null}

      {!marketing ? (
        <nav aria-label="Primary mobile destinations" className="app-mobile-tabs lg:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.key;
            return (
              <Link key={tab.key} to={tab.to} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}>
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
