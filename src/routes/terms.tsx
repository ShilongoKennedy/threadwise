import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Threadwise" },
      {
        name: "description",
        content: "The agreement between you and Threadwise: what you own, what we promise, and what we do not.",
      },
    
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <PageBackdrop />
      <header className="border-b-2 border-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-[820px] items-center gap-3 px-4 py-3 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
            Threadwise <span className="text-[#1A4BFF]">//</span> Terms
          </span>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[820px] px-4 py-10 md:px-6 md:py-14">
        <h1 className="font-display text-[38px] leading-none md:text-[52px]">The agreement.</h1>
        <p className="mt-4 text-base leading-relaxed text-[#1A1A1A]/70">
          Short, and in the same voice as the product. Last updated 2 November 2026.
        </p>

        <Section title="What you own">
          <p>
            Everything you put in: your canvases, cards, documents, notes and watches. You can export
            or delete them at any time. We claim no licence over your work beyond what is needed to
            store it and show it back to you.
          </p>
        </Section>

        <Section title="What we provide">
          <p>
            A workspace for reasoning about sources, and a daily brief assembled by a model from
            public reporting. It is analysis, not fact, and it is not professional advice — not
            legal, financial, medical or security advice — and it should not be acted on as though it
            were.
          </p>
          <p>
            The brief is machine-generated. It can be wrong, incomplete or out of date, and the
            article it is based on may itself be wrong. Verify before you act.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            One account per person, authenticated through Google. You are responsible for what
            happens under it. Do not use Threadwise to break the law, to infringe someone else's
            copyright, or to attack the service.
          </p>
        </Section>

        <Section title="Availability">
          <p>
            The service is provided as-is, without warranty. We may change or withdraw features, and
            we may suspend accounts that abuse the service. If a paid plan exists, its terms will be
            stated at purchase and will govern over this page.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the extent the law allows, we are not liable for decisions you make from the analysis,
            or for data loss beyond what a normal backup can restore. Your remedy, if any, is limited
            to what you paid in the previous twelve months.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If these terms change in a way that affects you, we will say so in the product rather
            than quietly editing this page.
          </p>
        </Section>

        <p className="mt-10 border-t-2 border-[#1A1A1A] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
          Contact · hello@threadwise.app
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 border-t border-[#1A1A1A]/15 pt-5">
      <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]/65">
        {title}
      </h2>
      <div className="mt-2 space-y-3 font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/85">
        {children}
      </div>
    </section>
  );
}
