import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export function MinimalHeader({ label }: { label?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`app-header app-header--minimal sticky top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="app-header__shell">
        <div className="app-header__inner app-header__inner--minimal">
          <Link to="/" className="app-header__back">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span className="app-header__label">{label ?? "Threadwise"}</span>
          <BrandLockup size="sm" asLink />
        </div>
        <div className="app-header__thread" aria-hidden="true"><span /></div>
      </div>
    </header>
  );
}
