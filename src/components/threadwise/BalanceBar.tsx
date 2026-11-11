export function BalanceBar({
  forCount,
  againstCount,
  className = "",
}: {
  forCount: number;
  againstCount: number;
  className?: string;
}) {
  const total = forCount + againstCount;
  const oneSided = total >= 3 && (forCount === 0 || againstCount === 0);
  const forWidth = total ? (forCount / total) * 100 : 0;
  const againstWidth = total ? (againstCount / total) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label={`${forCount} for, ${againstCount} against`}
    >
      <div className="relative h-1.5 flex-1 overflow-hidden bg-[#1A1A1A]/10">
        {total === 0 ? (
          <span className="absolute inset-0 border border-dashed border-[#1A1A1A]/20" />
        ) : (
          <>
            {forCount > 0 && (
              <span
                className="absolute inset-y-0 left-0 bg-[#1A4BFF]"
                style={{ width: `${forWidth}%` }}
              />
            )}
            {againstCount > 0 && (
              <span
                className="absolute inset-y-0 right-0 bg-[#C1121F]"
                style={{ width: `${againstWidth}%` }}
              />
            )}
          </>
        )}
      </div>
      <span
        className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] ${
          oneSided ? "text-[#C1121F]" : "text-[#1A1A1A]/50"
        }`}
      >
        {total === 0 ? "no evidence" : `${forCount} / ${againstCount}`}
      </span>
    </div>
  );
}
