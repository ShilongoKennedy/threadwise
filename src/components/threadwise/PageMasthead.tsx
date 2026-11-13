import type { ReactNode } from "react";

type PageMastheadProps = {
  eyebrow: string;
  title: string;
  deck?: string;
  aside?: ReactNode;
};

export function PageMasthead({ eyebrow, title, deck, aside }: PageMastheadProps) {
  return (
    <header className="border-b border-[#8A745C]/20 pb-5 md:pb-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#8A745C]/22 bg-[#FAF3E7]/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm">
          <span className="h-1 w-1 rounded-full bg-[#1A4BFF]" />
          {eyebrow}
        </p>
        {aside ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
            {aside}
          </p>
        ) : null}
      </div>
      <h1 className="mt-4 max-w-[18ch] font-display text-[42px] leading-[0.95] tracking-[-0.03em] md:text-[62px]">
        {title}
      </h1>
      {deck ? (
        <p className="mt-4 max-w-[54ch] font-serif text-[16px] leading-[1.65] text-[#1A1A1A]/65">
          {deck}
        </p>
      ) : null}
    </header>
  );
}
