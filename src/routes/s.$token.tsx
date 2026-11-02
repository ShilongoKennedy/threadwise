import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { fetchShare, type SharedCanvas } from "@/lib/threadwise/share";

export const Route = createFileRoute("/s/$token")({
  head: () => ({
    meta: [
      { title: "Shared canvas — Threadwise" },
      {
        name: "description",
        content: "A read-only case file: cards, their epistemic status, and the threads between them.",
      },
    ],
  }),
  component: SharePage,
});

const ORDER = ["fact", "evidence", "assumption", "hypothesis", "unknown"] as const;
const GROUP_LABEL: Record<string, string> = {
  fact: "Established",
  evidence: "Evidence",
  assumption: "Assumed",
  hypothesis: "Hypothesised",
  unknown: "Unknown",
};

function SharePage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [share, setShare] = useState<SharedCanvas | null>(null);

  useEffect(() => {
    let active = true;
    void fetchShare(token)
      .then((result) => {
        if (!active) return;
        setShare(result);
        setState(result ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const byId = new Map((share?.nodes ?? []).map((node) => [node.id, node]));
  const grouped = ORDER.map((status) => ({
    status,
    nodes: (share?.nodes ?? []).filter((node) => node.epistemic === status),
  })).filter((group) => group.nodes.length > 0);

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="border-b-2 border-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
            Threadwise <span className="text-[#1A4BFF]">//</span> Shared canvas
          </span>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            Open Threadwise
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[860px] px-4 py-10 md:px-6 md:py-14">
        {state === "loading" && (
          <p className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/65">
            Reading the file…
          </p>
        )}

        {(state === "missing" || state === "error") && (
          <div className="border-2 border-dashed border-[#1A1A1A]/25 p-12 text-center">
            <p className="font-display text-3xl">
              {state === "missing" ? "This link has no file behind it." : "The file could not be read."}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
              {state === "missing" ? "It may have been revoked by its author." : "Try again in a moment."}
            </p>
          </div>
        )}

        {state === "ready" && share && (
          <>
            <h1 className="font-display text-[38px] leading-[1.02] md:text-[56px]">{share.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
              <span>{share.nodes.length} cards</span>
              <span aria-hidden>·</span>
              <span>{share.edges.length} threads</span>
              <span aria-hidden>·</span>
              <span>Published {new Date(share.published_at).toLocaleDateString("en-GB")}</span>
            </p>

            {grouped.map((group) => (
              <section key={group.status} className="mt-10">
                <div className="flex items-end justify-between border-b-2 border-[#1A1A1A] pb-2">
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
                    {GROUP_LABEL[group.status]}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                    {group.nodes.length}
                  </span>
                </div>
                <ul>
                  {group.nodes.map((node) => {
                    const links = share.edges.filter(
                      (edge) => edge.source === node.id || edge.target === node.id,
                    );
                    return (
                      <li key={node.id} className="border-b border-[#1A1A1A]/15 py-4">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-display text-lg leading-tight">{node.title}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                            {node.kind}
                          </span>
                          {node.meta["source"] && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">
                              · {node.meta["source"]}
                            </span>
                          )}
                          {node.meta["dueDate"] && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                              · due {node.meta["dueDate"]}
                            </span>
                          )}
                        </div>
                        {node.body && (
                          <p className="mt-1.5 max-w-[62ch] font-serif text-[15px] leading-[1.65] text-[#1A1A1A]/80">
                            {node.body}
                          </p>
                        )}
                        {links.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {links.map((edge, index) => {
                              const other = byId.get(edge.source === node.id ? edge.target : edge.source);
                              if (!other) return null;
                              const direction = edge.source === node.id ? "→" : "←";
                              return (
                                <li
                                  key={`${edge.source}-${edge.target}-${index}`}
                                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1A1A]/65"
                                >
                                  {direction} {(edge.label || edge.relation).replace(/_/g, " ")} ·{" "}
                                  {other.title}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <footer className="mt-12 border-t-2 border-[#1A1A1A] pt-4">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                <Lock className="h-3 w-3" /> Read-only snapshot · not the live canvas
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
