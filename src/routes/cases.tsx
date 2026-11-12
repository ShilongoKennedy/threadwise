import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Cases — Threadwise" },
      { name: "description", content: "Every subject the analyst has written on, grouped so the reads accumulate instead of scattering." },
    ],
  }),
  loader: async () => {
    if (import.meta.env.SSR) {
      const { listCases } = await import("@/lib/threadwise/analyst");
      return { cases: await listCases() };
    }

    const response = await fetch("/api/cases", { cache: "no-store" });
    const body = response.ok
      ? ((await response.json()) as { cases?: { subject: string; reads: number; latest: string }[] })
      : {};
    return { cases: body.cases ?? [] };
  },
  component: CasesPage,
});

function CasesPage() {
  const { cases } = Route.useLoaderData();

  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <AppHeader section="cases" />

      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10">
        <h1 className="font-display text-[34px] leading-none md:text-[46px]">The files that keep coming back.</h1>
        <p className="mt-3 max-w-[54ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/70">
          Every read is filed under the situation it sits inside. A case is that subject, in order —
          so you can see how the reading changed.
        </p>

        {cases.length === 0 && (
          <div className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-10 text-center">
            <p className="font-display text-2xl">No cases yet.</p>
            <p className="mx-auto mt-2 max-w-[42ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
              Each read is filed automatically. Make two reads on the same subject and the case appears.
            </p>
            <Link to="/analyst" className="mt-4 inline-block border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]">
              Make a read
            </Link>
          </div>
        )}

        {cases.length > 0 && (
          <ul className="mt-8 border-t border-[#1A1A1A]/15">
            {cases.map((item) => (
              <li key={item.subject} className="border-b border-[#1A1A1A]/15">
                <Link
                  to="/case/$subject"
                  params={{ subject: item.subject }}
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <h2 className="font-display text-[20px] leading-snug group-hover:text-[#1A4BFF]">{item.subject}</h2>
                  <span className="shrink-0 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                    <span className="block">
                      {new Date(item.latest).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="block text-[#1A1A1A]/35">
                      {item.reads} {item.reads === 1 ? "read" : "reads"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
