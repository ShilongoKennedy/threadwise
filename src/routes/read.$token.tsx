import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/read/$token")({
  // Rendered on the server so a shared link previews properly and never flashes.
  // Client-side navigation (the analyst redirect) cannot read the database with
  // the service key, so it asks the public read API instead.
  loader: async ({ params }) => {
    if (import.meta.env.SSR) {
      const { loadRead } = await import("@/lib/threadwise/analyst");
      return (await loadRead(params.token)) ?? null;
    }

    const response = await fetch(`/api/read/${encodeURIComponent(params.token)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      input?: string;
      report?: Report;
      at?: string | null;
    };
    return body.report ? { input: body.input ?? "", report: body.report, at: body.at ?? null } : null;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "A read — Threadwise" }, { name: "robots", content: "noindex" }] };
    }
    const move = loaderData.input.replace(/\s+/g, " ").trim().slice(0, 150);
    const description = (loaderData.report as Report).falsifier.slice(0, 200);
    return {
      meta: [
        { title: `${move} — The Analyst` },
        { name: "description", content: description },
        { property: "og:title", content: move },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SharedRead,
});

type Report = {
  move: string;
  why_now: string;
  stakes: { actor: string; gains: string; loses: string }[];
  precedent: { name: string; when: string; parallel: string; breaks: string }[];
  second_order: string;
  counter_reading: string;
  watch: { signal: string; when: string }[];
  falsifier: string;
  confidence: string;
  basis?: string;
  writer?: string;
  intent?: { mode: string; changeMind?: string };
  claims?: {
    text: string;
    kind: "fact" | "inference" | "value" | "prediction";
    confidence: "high" | "medium" | "low";
    source: string;
    falsifier: string;
  }[];
  review?: {
    verdict: "grounded" | "mixed" | "unsupported";
    supported: number;
    issues: { section: string; claim: string; problem: string }[];
    missing: string[];
    by?: string;
  };
  revision?: { patched: number; notes: string[] };
  mode?: string;
  layers?: string[];
  sections?: { title: string; body: string }[];
  questions?: string[];
  sources: { title: string; url: string }[];
};

function SharedRead() {
  const { token } = Route.useParams();
  const loaded = Route.useLoaderData();
  const report = (loaded?.report ?? null) as Report | null;
  const input = loaded?.input ?? "";
  const at = loaded?.at ?? null;
  const [again, setAgain] = useState<{ token: string | null; report: Report } | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<boolean | null>(null);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const status = loaded ? "ready" : "missing";
  const blocks = report ? buildBlocks(report) : [];
  const sourceNumber = String(blocks.length + 1).padStart(2, "0");
  const contents = report
    ? [
        ...blocks.map((block, index) => ({
          n: String(index + 1).padStart(2, "0"),
          title: block.title,
        })),
        ...(report.sources.length ? [{ n: sourceNumber, title: "What this rests on" }] : []),
      ]
    : [];

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <BrandLockup />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">A saved read</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-8">
        {status === "missing" && (
          <div className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-4 py-3">
            <p className="font-serif text-[15px]">
              That read does not exist, or the link is wrong.
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
              token {token}
            </p>
            <p className="mt-2 max-w-[52ch] font-serif text-[13px] leading-relaxed text-[#1A1A1A]/60">
              If you just created this read, the server could not read the database. Check that
              SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are set for the deployment.
            </p>
            <Link to="/analyst" className="mt-2 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4">
              Ask the analyst something new →
            </Link>
          </div>
        )}
        {status === "ready" && report && (
          <article className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em]">
                The read · {report.confidence}
                {report.basis ? (
                  <span className="font-normal text-[#1A1A1A]/50"> · {report.basis}</span>
                ) : null}
                {at && (
                  <span className="ml-2 font-normal text-[#1A1A1A]/50">
                    · as of {new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </span>
              {loaded && (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { data } = await supabase.auth.getSession();
                      const jwt = data.session?.access_token;
                      if (!jwt) {
                        setPublishNote("Sign in to publish a read.");
                        return;
                      }
                      const response = await fetch("/api/publish-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
                        body: JSON.stringify({ token, publish: published !== true }),
                      });
                      const body = (await response.json()) as { error?: string };
                      if (response.ok) {
                        setPublished(published !== true);
                        setPublishNote(published !== true ? "Private." : "On the index.");
                      } else {
                        setPublishNote(body.error ?? "Could not publish.");
                      }
                    })();
                  }}
                  className="inline-flex min-h-11 items-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/55 underline underline-offset-4 hover:text-[#1A4BFF]"
                >
                  {published ? "Published · unpublish" : "Publish to the index"}
                </button>
              )}
              {publishNote && (
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">{publishNote}</span>
              )}
              {input && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      setAgain(null);
                      try {
                        const response = await fetch("/api/analyst", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: input }),
                        });
                        const body = (await response.json()) as { token?: string | null; report?: Report };
                        if (body.report) setAgain({ token: body.token ?? null, report: body.report });
                        else setAgain({ token: null, report });
                      } catch {
                        setAgain(null);
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                  className="inline-flex min-h-11 items-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4 disabled:opacity-40"
                >
                  {busy ? "Re-reading…" : "Re-read with today's reporting"}
                </button>
              )}
              <Link
                to="/practice/$token"
                params={{ token }}
                className="inline-flex min-h-11 items-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline underline-offset-4"
              >
                Practice this read →
              </Link>
            </div>

            {again && (
              <div className="border-2 border-[#1A4BFF] bg-[#1A4BFF]/5 px-3 py-2">
                <p className="font-serif text-[14px]">
                  A fresh read has been written from the same move.{" "}
                  {again.token ? (
                    <Link
                      to="/read/$token"
                      params={{ token: again.token }}
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A4BFF] underline underline-offset-4"
                    >
                      Open it →
                    </Link>
                  ) : (
                    <span className="text-[#1A1A1A]/60">It could not be saved, so it is not available by link.</span>
                  )}
                </p>

                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
                  What changed since this one
                </p>
                <ul className="mt-1 space-y-1">
                  {changedSince(report, again.report).map((change) => (
                    <li key={change} className="flex gap-2 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/85">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#1A4BFF]" />
                      {change}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                  This page keeps the original, as written.
                </p>
              </div>
            )}

            {report.intent ? <InquiryBar intent={report.intent} /> : null}

            {report.review ? (
              <DeskReview
                review={report.review}
                revision={report.revision}
                writer={report.writer}
              />
            ) : null}

            {report.claims?.length ? <ClaimTable claims={report.claims} /> : null}

            <Contents items={contents} />

            {blocks.map((block, index) => (
              <Block
                key={block.key}
                n={contents[index]?.n ?? String(index + 1).padStart(2, "0")}
                title={block.title}
              >
                {block.body}
              </Block>
            ))}

            <Proposals report={report} token={token} />

            <FileFinding token={token} note={report.falsifier} />

            <OpenQuestions questions={report.questions ?? []} />

            <Predictions
              claims={report.claims ?? []}
              sourceUrl={typeof window !== "undefined" ? window.location.href : undefined}
            />

            <RedTeam report={report} />

            {report.sources.length > 0 && (
              <Block n={sourceNumber} title="What this rests on">
                <ul className="space-y-1.5">
                  {report.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 hover:decoration-[#1A4BFF]"
                      >
                        {source.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <p className="border-t border-[#1A1A1A]/15 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/55">
              Produced by The Analyst · verify before you act
            </p>
          </article>
        )}
      </main>
    </div>
  );
}


/** Why this read exists, stated before the read itself. */
function InquiryBar({ intent }: { intent: NonNullable<Report["intent"]> }) {
  return (
    <section className="border-l-2 border-[#1A4BFF] pl-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
        Inquiry · {intent.mode}
      </p>
      {intent.changeMind ? (
        <p className="mt-1 font-serif text-[13px] leading-snug text-[#1A1A1A]/70">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
            Would change their mind ·{" "}
          </span>
          {intent.changeMind}
        </p>
      ) : null}
    </section>
  );
}

/** The load-bearing claims, separated from the prose that argues them. */
function ClaimTable({ claims }: { claims: NonNullable<Report["claims"]> }) {
  return (
    <section className="border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#FDFBF7]">
          Claims
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A4BFF]">
          {claims.length} load-bearing
        </span>
      </div>
      <ul className="divide-y divide-[#1A1A1A]/10">
        {claims.map((claim, index) => (
          <li key={`${claim.text.slice(0, 20)}-${index}`} className="px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-mono text-[8px] font-bold uppercase tracking-[0.14em] ${
                  claim.kind === "fact"
                    ? "text-[#1A4BFF]"
                    : claim.kind === "prediction"
                      ? "text-[#B26A00]"
                      : claim.kind === "value"
                        ? "text-[#C1121F]"
                        : "text-[#1A1A1A]/60"
                }`}
              >
                {claim.kind}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
                {claim.confidence}
              </span>
            </div>
            <p className="mt-1 font-serif text-[13.5px] leading-snug text-[#1A1A1A]/85">
              {claim.text}
            </p>
            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
              {claim.source || "source not stated"}
            </p>
            {claim.falsifier ? (
              <p className="mt-1 font-serif text-[12px] leading-snug text-[#1A1A1A]/55">
                Would be wrong if: {claim.falsifier}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The independent editor's verdict, shown before the read itself. */
function DeskReview({
  review,
  revision,
  writer,
}: {
  review: NonNullable<Report["review"]>;
  revision?: Report["revision"];
  writer?: string;
}) {
  const corrected = (revision?.patched ?? 0) > 0;
  const tone = corrected
    ? "border-[#1A4BFF] bg-[#1A4BFF]/5"
    : review.verdict === "grounded"
      ? "border-[#1A4BFF] bg-[#1A4BFF]/5"
      : review.verdict === "mixed"
        ? "border-[#B26A00] bg-[#B26A00]/5"
        : "border-[#C1121F] bg-[#C1121F]/5";

  return (
    <section className={`border-2 px-3 py-3 ${tone}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
          Desk review · {review.verdict}
          {corrected ? ` · ${revision!.patched} corrected` : ""}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
          {review.by ? `reviewed by ${review.by}` : "reviewed"}
          {writer ? ` · written by ${writer}` : ""}
        </span>
      </div>

      {review.supported > 0 && (
        <p className="mt-1 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65">
          {review.supported} factual claim{review.supported === 1 ? "" : "s"} supported by the
          retrieved material.
        </p>
      )}

      {corrected ? (
        <>
          <p className="mt-2 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/70">
            The writer corrected {revision!.patched} flagged claim
            {revision!.patched === 1 ? "" : "s"} before publication.
          </p>
          <ul className="mt-2 space-y-1.5">
            {revision!.notes.map((note, index) => (
              <li
                key={`${note.slice(0, 20)}-${index}`}
                className="border-l-2 border-[#1A4BFF] pl-2 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/70"
              >
                {note}
              </li>
            ))}
          </ul>
        </>
      ) : (
        review.issues.length > 0 && (
          <ul className="mt-2 space-y-2">
            {review.issues.map((issue, index) => (
              <li
                key={`${issue.claim.slice(0, 20)}-${index}`}
                className="border-l-2 border-[#C1121F] pl-2"
              >
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/50">
                  {issue.section || "claim"}
                </p>
                <p className="font-serif text-[13px] leading-snug">“{issue.claim}”</p>
                <p className="font-serif text-[12px] leading-snug text-[#1A1A1A]/60">
                  {issue.problem}
                </p>
              </li>
            ))}
          </ul>
        )
      )}

      {review.missing.length > 0 && (
        <p className="mt-2 font-serif text-[12px] leading-snug text-[#1A1A1A]/60">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em]">Missing · </span>
          {review.missing.join(" · ")}
        </p>
      )}

      {review.verdict === "grounded" && review.issues.length === 0 && (
        <p className="mt-1 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/65">
          Every factual claim checked against the retrieved material.
        </p>
      )}
    </section>
  );
}

/** One numbered section of the document, with an anchor the index can hit. */
function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={`s-${n}`}
      className="scroll-mt-24 border-t border-[#1A1A1A]/15 pt-4 first:border-t-0 first:pt-0"
    >
      <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
        {n} · {title}
      </p>
      <div className="font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/85">{children}</div>
    </section>
  );
}

/** The document's contents: collapsible on a phone, fixed beside it on a desk. */
function Contents({ items }: { items: { n: string; title: string }[] }) {
  return (
    <>
      <details className="border-2 border-[#1A1A1A] px-3 xl:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
          Contents
        </summary>
        <ol className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.n}>
              <a
                href={`#s-${item.n}`}
                className="flex gap-1.5 font-mono text-[9px] uppercase leading-snug tracking-[0.1em] text-[#1A1A1A]/60"
              >
                <span className="shrink-0 text-[#1A4BFF]">{item.n}</span>
                <span>{item.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </details>

      <nav className="fixed left-4 top-28 hidden w-[150px] xl:block" aria-label="Sections">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/45">
          Contents
        </span>
        <ol className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.n}>
              <a
                href={`#s-${item.n}`}
                className="flex gap-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/45 transition-colors hover:text-[#1A4BFF]"
              >
                <span className="text-[#1A4BFF]">{item.n}</span>
                <span className="truncate">{item.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** The read's own sections when it has them, its narrative fields when it does not. */
function buildBlocks(report: Report) {
  const blocks: { key: string; title: string; body: React.ReactNode }[] = [];

  if (report.sections?.length) {
    report.sections.forEach((section, index) => {
      blocks.push({
        key: `section-${index}`,
        title: section.title || "Untitled",
        body: <p className="whitespace-pre-line">{section.body}</p>,
      });
    });
  } else {
    blocks.push({ key: "move", title: "The move", body: <p>{report.move}</p> });
    blocks.push({ key: "why-now", title: "Why now", body: <p>{report.why_now}</p> });
    blocks.push({
      key: "downstream",
      title: "What it changes downstream",
      body: <p>{report.second_order}</p>,
    });
    blocks.push({
      key: "counter",
      title: "The counter-reading",
      body: <p className="border-l-2 border-[#1A4BFF] pl-3">{report.counter_reading}</p>,
    });
  }

  if (report.stakes.length) {
    blocks.push({
      key: "stakes",
      title: "Who gains, who pays",
      body: (
        <ul className="space-y-3">
          {report.stakes.map((stake) => (
            <li key={stake.actor} className="border-l-2 border-[#1A1A1A] pl-3">
              <p className="font-display text-[16px] leading-tight">{stake.actor}</p>
              <p className="mt-1 text-[14px] leading-snug text-[#1A1A1A]/80">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                  gains ·{" "}
                </span>
                {stake.gains}
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-[#1A1A1A]/60">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C1121F]">
                  loses ·{" "}
                </span>
                {stake.loses}
              </p>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (report.precedent.length) {
    blocks.push({
      key: "precedent",
      title: "What it echoes",
      body: (
        <ul className="space-y-4">
          {report.precedent.map((item) => (
            <li key={item.name}>
              <p className="font-display text-[17px] leading-tight">
                {item.name}{" "}
                <span className="font-mono text-[10px] text-[#1A1A1A]/55">{item.when}</span>
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">{item.parallel}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#1A1A1A]/60">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                  where it breaks ·{" "}
                </span>
                {item.breaks}
              </p>
            </li>
          ))}
        </ul>
      ),
    });
  }

  blocks.push({
    key: "falsifier",
    title: "What would prove this wrong",
    body: (
      <p className="border-2 border-[#C1121F] bg-[#C1121F]/5 px-3 py-2 text-[15px] leading-relaxed">
        {report.falsifier}
      </p>
    ),
  });

  if (report.watch.length) {
    blocks.push({
      key: "watch",
      title: "What to watch",
      body: (
        <ul className="space-y-2">
          {report.watch.map((item) => (
            <li
              key={item.signal}
              className="flex flex-col gap-1 border-b border-[#1A1A1A]/10 pb-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="text-[15px] leading-snug">{item.signal}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55 sm:shrink-0 sm:text-right">
                {item.when}
              </span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return blocks;
}

/** A short, honest list of what a re-read changed — or that nothing did. */
function changedSince(before: Report, after: Report): string[] {
  const changes: string[] = [];

  if (before.confidence !== after.confidence) {
    changes.push(`Confidence moved from ${before.confidence} to ${after.confidence}.`);
  }
  if (before.falsifier.trim() !== after.falsifier.trim()) {
    changes.push("The falsifier is different — the read now hinges on another fact.");
  }

  const oldSignals = new Set(before.watch.map((item) => item.signal.toLowerCase().trim()));
  const newSignals = new Set(after.watch.map((item) => item.signal.toLowerCase().trim()));
  const added = after.watch.filter((item) => !oldSignals.has(item.signal.toLowerCase().trim()));
  const dropped = before.watch.filter((item) => !newSignals.has(item.signal.toLowerCase().trim()));
  if (added.length) changes.push(`${added.length} new signal${added.length > 1 ? "s" : ""} to watch: ${added[0]!.signal}`);
  if (dropped.length) changes.push(`${dropped.length} signal${dropped.length > 1 ? "s" : ""} no longer expected: ${dropped[0]!.signal}`);

  if (before.counter_reading.trim().slice(0, 80) !== after.counter_reading.trim().slice(0, 80)) {
    changes.push("The counter-reading shifted.");
  }

  return changes.length ? changes : ["Nothing material changed — the same facts still support the same read."];
}


type Round = { attack: string; strongest: string; concession: string; settle: string };

function RedTeam({ report }: { report: Report }) {
  const [position, setPosition] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spar = async (text: string) => {
    const claim = text.trim();
    if (claim.length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setPosition("");
    try {
      const response = await fetch("/api/analyst-redteam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, position: claim }),
      });
      const body = (await response.json()) as Round & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No argument came back.");
      setRounds([...rounds, body]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No argument came back.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">Red team</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">argue with the read</span>
      </div>

      <div className="px-4 py-4">
        {rounds.length === 0 && (
          <p className="max-w-[58ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">
            State your own position on this move. The analyst will attack it with the evidence in the
            read — and tell you where you are right.
          </p>
        )}

        {rounds.map((round, index) => (
          <div key={index} className="mb-5 space-y-3 border-b border-[#1A1A1A]/10 pb-4 last:border-b-0">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C1121F]">the attack</p>
              <p className="mt-1 whitespace-pre-line font-serif text-[15px] leading-relaxed">{round.attack}</p>
            </div>
            <div className="border-l-2 border-[#1A1A1A]/30 pl-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/60">strongest point for you</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.strongest}</p>
            </div>
            <div className="border-l-2 border-[#1A4BFF] pl-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">where you are right</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.concession}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/60">what would settle it</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#1A1A1A]/80">{round.settle}</p>
            </div>
          </div>
        ))}

        {error && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C1121F]">{error}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void spar(position);
          }}
          className="flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-2"
        >
          <input
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="I think this reading is wrong because…"
            className="min-w-0 flex-1 bg-transparent font-serif text-[15px] outline-none placeholder:text-[#1A1A1A]/35"
          />
          <button
            type="submit"
            disabled={busy || position.trim().length < 20}
            className="inline-flex min-h-11 shrink-0 items-center px-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] disabled:opacity-40"
          >
            {busy ? "Thinking…" : "Argue →"}
          </button>
        </form>
      </div>
    </section>
  );
}


/** Files one line of evidence from this read against an open question. */
function FileFinding({ token, note }: { token: string; note: string }) {
  const [questions, setQuestions] = useState<{ id: string; question: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [text, setText] = useState(note.slice(0, 240));
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data } = await supabase
        .from("analyst_questions")
        .select("id, question")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (!alive) return;
      setQuestions((data as { id: string; question: string }[]) ?? []);
      if (data?.[0]) setSelected((data[0] as { id: string }).id);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (questions.length === 0) return null;

  const file = async (stance: "for" | "against") => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("analyst_findings").delete().eq("question_id", selected).eq("read_token", token).eq("stance", stance);
    const { error } = await supabase.from("analyst_findings").insert({
      question_id: selected,
      read_token: token,
      stance,
      note: text.trim().slice(0, 400),
    });
    setDone(error ? error.message : `Filed ${stance} — it is on the question now.`);
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">File a finding</span>
        <Link to="/questions" className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
          questions →
        </Link>
      </div>
      <div className="space-y-3 px-4 py-4">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="w-full border-2 border-[#1A1A1A] bg-white px-2 py-2 font-serif text-[14px] outline-none"
        >
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.question}
            </option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="w-full resize-none border-2 border-[#1A1A1A] px-2 py-2 font-serif text-[14px] leading-relaxed outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void file("for")}
            className="border-2 border-[#1A4BFF] bg-[#1A4BFF] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
          >
            This supports it
          </button>
          <button
            type="button"
            onClick={() => void file("against")}
            className="border-2 border-[#C1121F] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#C1121F]"
          >
            This argues against it
          </button>
          {done && <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">{done}</span>}
        </div>
      </div>
    </section>
  );
}


/** Predictions from the claim table, filed so the Digest can score them. */
function Predictions({
  claims,
  sourceUrl,
}: {
  claims: NonNullable<Report["claims"]>;
  sourceUrl?: string;
}) {
  const predictions = claims.filter((claim) => claim.kind === "prediction");
  const defaultDue = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  const [dates, setDates] = useState<Record<number, string>>({});
  const [state, setState] = useState<Record<number, "saving" | "saved" | "error">>({});
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (alive) setSignedIn(Boolean(data.session));
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!predictions.length) return null;

  const file = async (index: number) => {
    setState((current) => ({ ...current, [index]: "saving" }));
    try {
      const { addPrediction } = await import("@/lib/threadwise/watches");
      await addPrediction({
        claim: predictions[index]!.text,
        dueDate: dates[index] ?? defaultDue,
        confidence: predictions[index]!.confidence,
        sourceUrl,
      });
      setState((current) => ({ ...current, [index]: "saved" }));
    } catch {
      setState((current) => ({ ...current, [index]: "error" }));
    }
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
          Predictions to score
        </span>
        <Link to="/digest" className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
          the record →
        </Link>
      </div>
      <ul className="divide-y divide-[#1A1A1A]/10">
        {predictions.map((claim, index) => (
          <li key={`${claim.text.slice(0, 20)}-${index}`} className="px-4 py-3">
            <p className="font-serif text-[14px] leading-snug text-[#1A1A1A]/85">{claim.text}</p>
            {claim.falsifier ? (
              <p className="mt-1 font-serif text-[12.5px] leading-snug text-[#1A1A1A]/55">
                Would be wrong if: {claim.falsifier}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A4BFF]">
                {claim.confidence} confidence
              </span>
              <input
                type="date"
                value={dates[index] ?? defaultDue}
                onChange={(event) =>
                  setDates((current) => ({ ...current, [index]: event.target.value }))
                }
                className="border border-[#1A1A1A]/20 bg-transparent px-2 py-1 font-mono text-[10px] outline-none"
              />
              <button
                type="button"
                disabled={
                  signedIn === false || state[index] === "saving" || state[index] === "saved"
                }
                onClick={() => void file(index)}
                className="border border-[#1A1A1A] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7] disabled:opacity-40"
              >
                {state[index] === "saved"
                  ? "Filed"
                  : state[index] === "saving"
                    ? "Filing…"
                    : state[index] === "error"
                      ? "Retry"
                      : "File prediction"}
              </button>
              {signedIn === false && (
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
                  Sign in to file
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Questions this read opens, one click from becoming standing questions. */
function OpenQuestions({ questions }: { questions: string[] }) {
  const list = [...new Set(questions)].slice(0, 3);
  const [state, setState] = useState<Record<string, "adding" | "added" | "error">>({});
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (alive) setSignedIn(Boolean(data.session));
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!list.length) return null;

  const add = async (question: string) => {
    setState((current) => ({ ...current, [question]: "adding" }));
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setSignedIn(false);
        setState((current) => ({ ...current, [question]: "error" }));
        return;
      }
      const { error } = await supabase.from("analyst_questions").insert({ question });
      setState((current) => ({ ...current, [question]: error ? "error" : "added" }));
    } catch {
      setState((current) => ({ ...current, [question]: "error" }));
    }
  };

  return (
    <section className="mt-8 border-2 border-[#1A1A1A] bg-white">
      <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#FDFBF7]">
          Questions this read opens
        </span>
        <Link to="/questions" className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A4BFF]">
          questions →
        </Link>
      </div>
      <ul className="divide-y divide-[#1A1A1A]/10">
        {list.map((question) => (
          <li key={question} className="flex items-start justify-between gap-3 px-4 py-3">
            <p className="font-serif text-[14px] leading-snug text-[#1A1A1A]/85">{question}</p>
            <button
              type="button"
              disabled={state[question] === "adding" || state[question] === "added"}
              onClick={() => void add(question)}
              className="shrink-0 border border-[#1A1A1A]/25 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/60 transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A] disabled:opacity-40"
            >
              {state[question] === "added"
                ? "Added"
                : state[question] === "adding"
                  ? "Adding…"
                  : state[question] === "error"
                    ? "Retry"
                    : "Add"}
            </button>
          </li>
        ))}
      </ul>
      {signedIn === false && (
        <p className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
          Sign in to keep these questions.
        </p>
      )}
    </section>
  );
}


/** What this read adds to the reader's open questions, proposed by the analyst. */
function Proposals({ report, token }: { report: Report; token: string }) {
  const [items, setItems] = useState<
    { question_id: string; question: string; stance: "for" | "against"; claim?: string; note: string }[]
  >([]);
  const [filed, setFiled] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data } = await supabase.from("analyst_questions").select("id, question").eq("status", "open").limit(8);
      const questions = (data as { id: string; question: string }[]) ?? [];
      if (!questions.length) return;

      const response = await fetch("/api/analyst-findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, questions }),
      });
      if (!response.ok) return;
      const body = (await response.json()) as {
        findings?: {
          question_id: string;
          stance: "for" | "against";
          claim?: string;
          note: string;
        }[];
      };
      if (!alive || !body.findings?.length) return;
      setItems(
        body.findings.map((finding) => ({
          ...finding,
          question: questions.find((question) => question.id === finding.question_id)?.question ?? "",
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, [report]);

  if (items.length === 0) return null;

  const fileAll = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const questionIds = [...new Set(items.map((item) => item.question_id))];
    await supabase.from("analyst_findings").delete().eq("read_token", token).in("question_id", questionIds);
    await supabase.from("analyst_findings").insert(
      items.map((item) => {
        const claim = item.claim?.trim() ?? "";
        const key = (value: string) =>
          value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        const sourceClaim = claim
          ? report.claims?.find((candidate) => key(candidate.text) === key(claim)) ??
            report.claims?.find(
              (candidate) =>
                key(candidate.text).includes(key(claim)) ||
                key(claim).includes(key(candidate.text)),
            )
          : undefined;
        return {
          question_id: item.question_id,
          read_token: token,
          stance: item.stance,
          claim: claim || null,
          source: sourceClaim?.source?.trim() || null,
          confidence: sourceClaim?.confidence ?? null,
          note: item.note.slice(0, 400),
        };
      }),
    );
    setFiled(true);
  };

  return (
    <section className="mt-8 border-2 border-[#1A4BFF] bg-white">
      <div className="flex items-center justify-between bg-[#1A4BFF] px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-white">
          This read bears on {items.length} of your questions
        </span>
        <Link to="/questions" className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/80">
          questions →
        </Link>
      </div>
      <ul className="divide-y divide-[#1A1A1A]/10">
        {items.map((item) => (
          <li key={`${item.question_id}-${item.note.slice(0, 12)}`} className="px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55">{item.question}</p>
            {item.claim ? (
              <p className="mt-1 border-l-2 border-[#1A4BFF] pl-2 font-serif text-[13px] leading-snug text-[#1A1A1A]/65">
                “{item.claim}”
              </p>
            ) : null}
            <p className="mt-1 font-serif text-[14px] leading-snug">
              <span className={`mr-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${item.stance === "for" ? "text-[#1A4BFF]" : "text-[#C1121F]"}`}>
                {item.stance}
              </span>
              {item.note}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => void fileAll()}
          disabled={filed}
          className="border-2 border-[#1A4BFF] bg-[#1A4BFF] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-40"
        >
          {filed ? "Filed" : "File all"}
        </button>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
          or file one by hand below
        </span>
      </div>
    </section>
  );
}
