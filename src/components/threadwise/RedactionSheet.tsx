import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SOURCE_TEXT = [
  "The IAEA sent a confidential report to member states about Iran’s enrichment programme. The contents are unpublished. The public record is that inspectors have not been allowed back to the sites bombed in June 2025, and Iran has not said how much of its 60%-enriched uranium survived.",
  "A confidential report is a signal to governments, not an enforceable finding. Its authority is the safeguards mandate, not a power to compel access. What it changes depends on whether the Board acts and whether Iran lets inspectors back in.",
  "The report can say whether Iran is meeting its safeguards obligations on access and declaration. It cannot say how much 60%-enriched uranium Iran holds, because it has not seen the material since June 2025. That distinction matters: a report that documents missing access is a finding about compliance, not about capability.",
  "The IAEA’s regular budget for 2026–2027 is €442.1 million. The Technical Cooperation Fund is voluntary. Safeguards work on Iran is funded from assessed contributions, so losing access does not reduce the Agency’s income — it reduces what the income verifies.",
  "The Board of Governors, 35 member states, receives the confidential reports and decides whether to put Iran on the formal agenda. The Director General is appointed by the Board and confirmed by the General Assembly. The Agency has no power to compel entry; its only sanction is to report non-compliance to the Board and, ultimately, the Security Council.",
];

export function RedactionSheet() {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);
  const [lens, setLens] = useState({ x: 58, y: 24 });
  const [active, setActive] = useState(false);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (lifted) return;
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(9, Math.min(91, ((event.clientY - rect.top) / rect.height) * 100));
    setLens({ x, y });
    setActive(true);
  };

  return (
    <div className="mt-8">
      <div
        ref={sheetRef}
        onPointerMove={move}
        onPointerDown={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        className="relative min-h-[500px] overflow-hidden border border-[#1A1A1A]/20 bg-[#FDFBF7] p-5 md:min-h-[540px] md:p-8"
      >
        <div className="relative z-20 flex flex-wrap items-start justify-between gap-3 border-b border-[#1A1A1A]/15 pb-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
              The public record / 09 Nov 2026
            </p>
            <h2 className="mt-1 font-display text-[26px] leading-[1.02] md:text-[34px]">
              IAEA report on Iran enrichment
            </h2>
          </div>
          <span
            className={`rotate-[-7deg] border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] transition-colors ${
              lifted
                ? "border-[#1A4BFF] text-[#1A4BFF]"
                : "border-[#C1121F] text-[#C1121F]"
            }`}
          >
            {lifted ? "Record open" : "Partially redacted"}
          </span>
        </div>

        <div className="relative mt-5">
          <div className="columns-1 gap-8 font-serif text-[15px] leading-[1.75] text-[#1A1A1A]/85 md:columns-2">
            <p>
              <span className="float-left mr-2 mt-1 font-display text-[46px] leading-[0.7] text-[#1A4BFF]">
                T
              </span>
              {SOURCE_TEXT[0]}
            </p>
            <p className="mt-4">{SOURCE_TEXT[1]}</p>
            <p className="mt-4">{SOURCE_TEXT[2]}</p>
            <p className="mt-4">{SOURCE_TEXT[3]}</p>
            <p className="mt-4">{SOURCE_TEXT[4]}</p>
          </div>

          <div
            className={`redaction-veil ${lifted ? "is-lifted" : ""}`}
            style={{ "--lens-x": `${lens.x}%`, "--lens-y": `${lens.y}%` } as React.CSSProperties}
            aria-hidden="true"
          />
          <div
            className={`redaction-lens ${lifted ? "is-lifted" : ""} ${active ? "is-active" : ""}`}
            style={{ "--lens-x": `${lens.x}%`, "--lens-y": `${lens.y}%` } as React.CSSProperties}
            aria-hidden="true"
          >
            <span />
          </div>
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t pt-3 font-mono text-[8px] uppercase tracking-[0.14em] ${lifted ? "border-[#1A1A1A]/15 text-[#1A1A1A]/40" : "border-[#FDFBF7]/15 text-[#FDFBF7]/45"}`}>
            <span>{lifted ? "Record open" : "Move the lens to read"}</span>
            <span>IAEA / Iran</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setLifted((current) => !current)}
          className="inline-flex items-center gap-2 border-b border-[#1A4BFF]/40 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]"
        >
          {lifted ? "Redact it again" : "Lift the redactions"}
          <ArrowUpRight className="h-3 w-3" />
        </button>
        <Link
          to="/read/$token"
          params={{ token: "mn4qvf4bhu" }}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45 underline underline-offset-4 transition-colors hover:text-[#1A4BFF]"
        >
          Open the full read →
        </Link>
      </div>
    </div>
  );
}
