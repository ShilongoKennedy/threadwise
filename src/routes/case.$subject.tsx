import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { buildCaseLedger, type CaseRead } from "@/lib/threadwise/case-ledger";

export const Route = createFileRoute("/case/$subject")({
  head: ({ params }) => ({ meta: [{ title: `${params.subject} — Threadwise` }] }),
  loader: async ({ params }) => {
    if (import.meta.env.SSR) {
      const { caseReads } = await import("@/lib/threadwise/analyst");
      return { subject: params.subject, reads: await caseReads(params.subject) };
    }

    const response = await fetch(`/api/case/${encodeURIComponent(params.subject)}`, {
      cache: "no-store",
    });
    const body = response.ok
      ? ((await response.json()) as { reads?: CaseRead[] })
      : {};
    return { subject: params.subject, reads: body.reads ?? [] };
  },
  component: CasePage,
});

function CasePage() {
  const data = Route.useLoaderData() as { subject: string; reads: CaseRead[] } | undefined;
  const subject = data?.subject ?? "";
  const reads = data?.reads ?? [];
  const ledger = buildCaseLedger(reads);
  const claims = ledger.claims.filter((claim) => claim.kind !== "prediction");
  const date = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link to="/cases" className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              <ArrowLeft className="h-3 w-3" /> Cases
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">{reads.length} reads</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#1A4BFF]">Case file</p>
        <h1 className="mt-3 font-display text-[34px] leading-none md:text-[46px]">{subject}</h1>

        {reads.length === 0 ? (
          <p className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-8 text-center font-serif text-[14px] text-[#1A1A1A]/65">
            No reads filed under this case yet.
          </p>
        ) : (
          <>
            {ledger.change && (
              <section className="mt-8 border-2 border-[#1A4BFF] bg-white">
                <div className="bg-[#1A4BFF] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                  What changed since the previous read
                </div>
                <div className="px-4 py-3">
                  <ul className="space-y-1.5">
                    {ledger.change.summary.map((line) => (
                      <li key={line} className="font-serif text-[13.5px] leading-snug text-[#1A1A1A]/80">
                        — {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
                    {date(ledger.change.fromAt)} → {date(ledger.change.toAt)}
                  </p>
                </div>
              </section>
            )}

            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-display text-[24px] leading-none">The ledger.</h2>
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/50">
                  {claims.length} claim{claims.length === 1 ? "" : "s"}
                  {ledger.predictions.length > 0
                    ? ` · ${ledger.predictions.length} prediction${ledger.predictions.length === 1 ? "" : "s"}`
                    : ""}
                  {" "}across {reads.length} read{reads.length === 1 ? "" : "s"}
                </span>
              </div>

              {ledger.claims.length === 0 ? (
                <p className="mt-3 font-serif text-[13.5px] text-[#1A1A1A]/55">
                  No claims or predictions were recorded in these reads.
                </p>
              ) : claims.length === 0 ? (
                <p className="mt-3 font-serif text-[13.5px] text-[#1A1A1A]/55">
                  This case has predictions but no factual claims recorded.
                </p>
              ) : (
                <ul className="mt-2">
                  {claims.map((claim) => (
                    <li key={claim.text} className="border-b border-[#1A1A1A]/12 py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="max-w-[64ch] font-serif text-[14px] leading-snug text-[#1A1A1A]/85">
                          {claim.text}
                        </p>
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF]">
                          {claim.kind} · {claim.latestConfidence}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/45">
                        {claim.reads.length} read{claim.reads.length === 1 ? "" : "s"}
                        {claim.sources.length
                          ? ` · ${claim.sources.slice(0, 3).join(" · ")}`
                          : " · no source recorded"}
                      </p>
                      {claim.falsifier && (
                        <p className="mt-1.5 border-l-2 border-[#C1121F] pl-2 font-serif text-[12.5px] leading-snug text-[#C1121F]/85">
                          False if: {claim.falsifier}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-3">
                        {claim.reads.slice(0, 2).map((read) => (
                          <Link
                            key={read.token}
                            to="/read/$token"
                            params={{ token: read.token }}
                            className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A4BFF] underline underline-offset-4"
                          >
                            {date(read.at)}
                          </Link>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

            </section>

            {ledger.predictions.length > 0 && (
              <section className="mt-8">
                <h2 className="border-b-2 border-[#1A1A1A] pb-2 font-display text-[22px] leading-none">
                  Predictions in this case.
                </h2>
                <ul className="mt-2">
                  {ledger.predictions.map((prediction) => (
                    <li key={prediction.text} className="border-b border-[#1A1A1A]/12 py-2.5">
                      <p className="font-serif text-[14px] leading-snug text-[#1A1A1A]/85">
                        {prediction.text}
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/45">
                        {prediction.latestConfidence} confidence · {prediction.reads.length} read
                        {prediction.reads.length === 1 ? "" : "s"}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <h2 className="mt-9 border-b-2 border-[#1A1A1A] pb-2 font-display text-[22px] leading-none">
              The reads.
            </h2>

            <ol className="mt-4 border-l-2 border-[#1A1A1A]/15 pl-5">
            {reads.map((read) => (
              <li key={read.token} className="relative pb-7">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 bg-[#1A4BFF]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/50">
                  {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {read.mode ? ` · ${read.mode}` : ""}
                </p>
                <Link to="/read/$token" params={{ token: read.token }} className="group mt-1 block">
                  <h2 className="font-display text-[18px] leading-snug group-hover:text-[#1A4BFF]">{read.input}</h2>
                  <p className="mt-1.5 line-clamp-3 max-w-[62ch] border-l-2 border-[#C1121F] pl-3 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                    {read.falsifier}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
          </>
        )}
      </main>
    </div>
  );
}
