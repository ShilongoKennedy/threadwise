import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { PageMasthead } from "@/components/threadwise/PageMasthead";
import { BPBadge, BPEmptyState, bpButtonClass } from "@/components/threadwise/BlueprintUI";

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
      <div className="bp-scrim" aria-hidden />
      <AppHeader section="cases" />

      <main className="bp-page bp-page--narrow">
        <PageMasthead
          eyebrow="The cases"
          title="The files that keep coming back."
          deck="Every read is filed under the situation it sits inside. A case is that subject, in order — so you can see how the reading changed."
          aside={`${cases.length} filed`}
        />

        {cases.length === 0 && (
          <BPEmptyState
            className="mt-8"
            eyebrow="The record"
            title="No cases yet."
            body="Each read is filed automatically. Make two reads on the same subject and the case appears."
            action={
              <Link to="/analyst" className={bpButtonClass({ variant: "primary" })}>
                Make a read
              </Link>
            }
          />
        )}

        {cases.length > 0 && (
          <ul className="mt-8 grid gap-2.5">
            {cases.map((item) => (
              <li key={item.subject}>
                <Link
                  to="/case/$subject"
                  params={{ subject: item.subject }}
                  className="bp-row group flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <BPBadge>Case file</BPBadge>
                    <h2 className="mt-2 font-display text-[19px] leading-snug sm:text-[21px] transition-colors group-hover:text-white">
                      {item.subject}
                    </h2>
                  </div>
                  <span className="shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                    <span className="block">
                      {new Date(item.latest).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="mt-1 block text-white/45">
                      {item.reads} {item.reads === 1 ? "read" : "reads"} →
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
