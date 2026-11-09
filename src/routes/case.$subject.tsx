import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/case/$subject")({
  head: ({ params }) => ({ meta: [{ title: `${params.subject} — Threadwise` }] }),
  loader: async ({ params }) => {
    const { caseReads } = await import("@/lib/threadwise/analyst");
    return { subject: params.subject, reads: await caseReads(params.subject) };
  },
  component: CasePage,
});

type CaseRead = { token: string; input: string; at: string; mode: string | null; falsifier: string };

function CasePage() {
  const data = Route.useLoaderData() as { subject: string; reads: CaseRead[] } | undefined;
  const subject = data?.subject ?? "";
  const reads = data?.reads ?? [];

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
          <ol className="mt-8 border-l-2 border-[#1A1A1A]/15 pl-5">
            {reads.map((read) => (
              <li key={read.token} className="relative pb-7">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 bg-[#1A4BFF]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/50">
                  {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {read.mode ? ` · ${read.mode}` : ""}
                </p>
                <Link to="/read/$token" params={{ token: read.token }} className="group mt-1 block">
                  <h2 className="font-display text-[18px] leading-snug group-hover:text-[#1A4BFF]">{read.input}</h2>
                  <p className="mt-1.5 max-w-[62ch] border-l-2 border-[#C1121F] pl-3 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                    {read.falsifier}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
