import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-8 border-y border-[#1A1A1A]/15 py-7 md:py-8">
      <p className="max-w-[26ch] font-display text-[27px] leading-[1.04] md:text-[32px]">{title}</p>
      {children ? (
        <p className="mt-2 max-w-[48ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/60">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
