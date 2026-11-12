import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { PageMasthead } from "@/components/threadwise/PageMasthead";
import { EmptyState } from "@/components/threadwise/EmptyState";

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
        <PageMasthead
          eyebrow="The cases"
          title="The files that keep coming back."
          deck="Every read is filed under the situation it sits inside. A case is that subject, in order — so you can see how the reading changed."
          aside={`${cases.length} filed`}
        />

        {cases.length === 0 && (
          <EmptyState
            title="No cases yet."
            action={
              <Link to="/analyst" className="inline-flex items-center gap-2 border-b border-[#1A4BFF]/40 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF]">
                Make a read →
              </Link>
            }
          >
            Each read is filed automatically. Make two reads on the same subject and the case appears.
          </EmptyState>
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
