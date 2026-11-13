import { Link } from "@tanstack/react-router";
import { BookOpen, Compass, FolderOpen, HelpCircle, Presentation, ScanSearch } from "lucide-react";

const ITEMS = [
  { key: "explore", label: "Explore", icon: Compass, to: null },
  { key: "analyst", label: "The analyst", icon: ScanSearch, to: "/analyst" },
  { key: "questions", label: "Questions", icon: HelpCircle, to: "/questions" },
  { key: "record", label: "Record", icon: BookOpen, to: "/digest" },
  { key: "cases", label: "Cases", icon: FolderOpen, to: "/cases" },
  { key: "seminar", label: "Seminar", icon: Presentation, to: "/seminar" },
] as const;

export function AtlasDock({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 md:bottom-[88px] flex justify-center px-3 md:bottom-5">
      <nav
        aria-label="Atlas destinations"
        className="pointer-events-auto flex items-stretch gap-0.5 rounded-[18px] border border-[#C9A77D]/20 bg-[#100C09]/80 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-[20px]"
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.key === "explore";
          const content = (
            <>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span className="font-mono text-[7px] uppercase tracking-[0.1em]">{item.label}</span>
            </>
          );
          const className = `relative flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-[13px] px-2 py-2 transition-colors md:min-w-[112px] md:gap-1.5 md:py-3 ${
            active
              ? "bg-[#F4EBDD]/10 text-[#AFC0FF] shadow-[inset_0_0_24px_rgba(133,162,255,0.08)]"
              : "text-[#F4EBDD]/45 hover:bg-[#F4EBDD]/5 hover:text-[#F4EBDD]/80"
          }`;

          return item.to ? (
            <Link key={item.key} to={item.to} className={className}>
              {content}
            </Link>
          ) : (
            <button key={item.key} type="button" onClick={onExplore} className={className}>
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
