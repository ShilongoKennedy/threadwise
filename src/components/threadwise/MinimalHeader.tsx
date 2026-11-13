import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export function MinimalHeader({ label }: { label?: string }) {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <div className="mx-auto flex h-14 w-full max-w-[980px] items-center justify-between gap-3 rounded-[20px] border border-[#8A745C]/22 bg-[linear-gradient(180deg,rgba(255,250,242,0.7),rgba(250,242,229,0.4))] px-3 shadow-[0_16px_46px_rgba(43,33,23,0.09),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-[30px] md:h-[58px] md:px-4">
        <Link
          to="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#1A1A1A]/16 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/65 transition-colors hover:border-[#1A4BFF]/40 hover:text-[#1A4BFF]"
        >
          <ArrowLeft className="h-3 w-3" /> Home
        </Link>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/45">
          {label ?? "Threadwise"}
        </span>
        <BrandLockup size="sm" asLink />
      </div>
    </header>
  );
}
