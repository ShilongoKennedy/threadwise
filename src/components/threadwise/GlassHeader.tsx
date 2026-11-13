import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, User, X } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

const NAV = [
  { key: "workspace", to: "/workspace", label: "Workspace" },
  { key: "analyst", to: "/analyst", label: "The Analyst" },
  { key: "seminar", to: "/seminar", label: "Seminar" },
  { key: "questions", to: "/questions", label: "Questions" },
  { key: "record", to: "/digest", label: "Record" },
  { key: "cases", to: "/cases", label: "Cases" },
] as const;

/** The experimental hero's floating glass navigation. */
export function GlassHeader({ section = "record" }: { section?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 md:top-5 md:px-6">
      <header className="pointer-events-auto relative mx-auto w-full max-w-[1280px] rounded-[22px] border border-[#8A745C]/20 bg-[#FDFBF7]/72 shadow-[0_14px_46px_rgba(43,33,23,0.10),0_2px_8px_rgba(43,33,23,0.05)] backdrop-blur-[22px]">
        <div className="flex h-[58px] items-center justify-between gap-4 px-4 md:h-[62px] md:px-5">
          <div className="brand-emboss shrink-0">
            <BrandLockup size="md" asLink />
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={`group relative py-2 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
                  section === item.key ? "text-[#1A4BFF]" : "text-[#1A1A1A]/55 hover:text-[#1A4BFF]"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-[3px] mx-auto h-px bg-[#1A4BFF] transition-transform duration-200 ${
                    section === item.key ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
            <Link
              to="/profile"
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1A1A]/20 bg-[#FDFBF7]/70 text-[#1A1A1A]/65 transition-colors hover:border-[#1A4BFF]/40 hover:text-[#1A4BFF]"
            >
              <User className="h-3.5 w-3.5" strokeWidth={1.7} />
            </Link>
            <Link
              to="/analyst"
              className="hidden items-center gap-1.5 rounded-full bg-[#1A4BFF] px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#FDFBF7] transition-colors hover:bg-[#1A1A1A] sm:inline-flex"
            >
              Read a Source
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="glass-mobile-nav"
              onClick={() => setOpen((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1A1A]/18 text-[#1A1A1A]/65 transition-colors hover:border-[#1A4BFF]/40 hover:text-[#1A4BFF] lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="glass-mobile-nav"
            className="border-t border-[#8A745C]/15 px-4 pb-4 pt-3 lg:hidden"
          >
            <nav aria-label="Mobile primary" className="grid grid-cols-2 gap-x-4 gap-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`border-b border-[#1A1A1A]/8 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                    section === item.key ? "text-[#1A4BFF]" : "text-[#1A1A1A]/65"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/analyst"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center gap-1.5 text-[#1A4BFF]"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                Read a Source
              </span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ) : null}
      </header>
    </div>
  );
}
