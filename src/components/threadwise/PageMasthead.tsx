import type { ReactNode } from "react";

type PageMastheadProps = {
  eyebrow: string;
  title: string;
  deck?: string;
  aside?: ReactNode;
};

export function PageMasthead({ eyebrow, title, deck, aside }: PageMastheadProps) {
  return (
    <header className="border-b border-[#1A1A1A]/15 pb-5 md:pb-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A4BFF]">
          {eyebrow}
        </p>
        {aside ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/35">
            {aside}
          </p>
        ) : null}
      </div>
      <h1 className="mt-3 max-w-[18ch] font-display text-[40px] leading-[0.96] tracking-[-0.03em] md:text-[58px]">
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
