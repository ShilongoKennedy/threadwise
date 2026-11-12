import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

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
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">Published reads</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10">
        <h1 className="font-display text-[34px] leading-none md:text-[46px]">What was published.</h1>
        <p className="mt-3 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/70">
          Each of these is a move the analyst was given, and the sentence that would prove its reading wrong.
        </p>

        {state === "loading" && (
          <p className="py-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/55">Opening…</p>
        )}

        {state === "empty" && (
          <div className="mt-8 border-2 border-dashed border-[#1A1A1A]/25 p-10 text-center">
            <p className="font-display text-2xl">Nothing published yet.</p>
            <p className="mx-auto mt-2 max-w-[40ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
              Reads are private by default. Publish one from its own page and it appears here.
            </p>
            <Link to="/analyst" className="mt-4 inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7]">
              Write one <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {state === "ready" && (
          <ul className="mt-8 border-t border-[#1A1A1A]/15">
            {reads.map((read) => (
              <li key={read.token} className="border-b border-[#1A1A1A]/15">
                <Link to="/read/$token" params={{ token: read.token }} className="group block py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-[19px] leading-snug group-hover:text-[#1A4BFF]">{read.input}</h2>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                      {new Date(read.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 max-w-[62ch] border-l-2 border-[#C1121F] pl-3 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/65">
                    {read.falsifier}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
