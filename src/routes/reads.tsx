import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { PageMasthead } from "@/components/threadwise/PageMasthead";
import { BPBadge, BPEmptyState, bpButtonClass } from "@/components/threadwise/BlueprintUI";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MinimalHeader } from "@/components/threadwise/MinimalHeader";

export const Route = createFileRoute("/reads")({
  head: () => ({
    meta: [
      { title: "Published reads — Threadwise" },
      { name: "description", content: "Reads the analyst has written and published: a move, and what it would take to prove the reading wrong." },
    ],
  }),
  component: ReadsPage,
});

type Pub = { token: string; input: string; at: string; falsifier: string };

function ReadsPage() {
  const [reads, setReads] = useState<Pub[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let alive = true;
    fetch("/api/reads-public")
      .then(async (response) => (response.ok ? ((await response.json()) as { reads?: Pub[] }) : { reads: [] }))
      .then((body) => {
        if (!alive) return;
        const list = body.reads ?? [];
        setReads(list);
        setState(list.length ? "ready" : "empty");
      })
      .catch(() => alive && setState("empty"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <div className="bp-scrim" aria-hidden />
      <MinimalHeader label="Published reads" />

      <main className="bp-page bp-page--narrow">
        <PageMasthead
          eyebrow="Published"
          title="What was published."
          deck="Each of these is a move the analyst was given, and the sentence that would prove its reading wrong."
        />

        {state === "loading" && (
          <p className="py-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/55">Opening…</p>
        )}

        {state === "empty" && (
          <BPEmptyState
            className="mt-8"
            eyebrow="The record"
            title="Nothing published yet."
            body="Reads are private by default. Publish one from its own page and it appears here."
            action={
              <Link to="/analyst" className={bpButtonClass({ variant: "primary" })}>
                Write the first read
              </Link>
            }
          />
        )}

        {state === "ready" && (
          <ul className="mt-8 grid gap-3">
            {reads.map((read) => (
              <li key={read.token}>
                <Link to="/read/$token" params={{ token: read.token }} className="bp-row group block">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <BPBadge>Published</BPBadge>
                      <h2 className="mt-3 font-display text-[21px] leading-snug transition-colors group-hover:text-[#FFE8D6]">
                        {read.input}
                      </h2>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                      {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 max-w-[64ch] border-l-2 border-[#E7A574]/60 pl-3 font-serif text-[14px] leading-[1.6] text-white/70">
                    {read.falsifier}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/12 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                    <span>What would prove it wrong</span>
                    <span className="inline-flex items-center gap-1.5 text-white/80">
                      Read the record <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
