import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBackdrop } from "@/components/threadwise/PageBackdrop";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Threadwise" },
      {
        name: "description",
        content: "What Threadwise stores, where it lives, which models read your text, and how to remove it.",
      },
    
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            Threadwise <span className="text-[#1A4BFF]">//</span> Privacy
          </span>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[820px] px-4 py-10 md:px-6 md:py-14">
        <h1 className="font-display text-[38px] leading-none md:text-[52px]">What we hold.</h1>
        <p className="mt-4 text-base leading-relaxed text-[#1A1A1A]/70">
          Written plainly, because a privacy page nobody reads protects nobody. Last updated 2
          November 2026.
        </p>

        <Section title="What is stored">
          <p>
            Your email address and display name from Google sign-in. Your canvases, cards and
            connections. Documents you ask the lab to index. The brief archive and the dated claims
            you file as watches. Nothing else.
          </p>
          <p>
            Sound effects and interface preferences stay in your browser's local storage and never
            leave the device.
          </p>
        </Section>

        <Section title="Where it lives">
          <p>
            In a Supabase project with row-level security enabled: every row is readable only by the
            account that created it. Briefs are public by design — they are news analysis, not your
            work — and suggestions planted by the agent carry no owner until you keep one.
          </p>
        </Section>

        <Section title="Who reads your text">
          <p>
            When you ask for analysis, the document text and your prompts are sent to a model
            provider (DeepSeek, with Gemini and OpenAI as fallbacks) to produce the response. They
            are not used to train models by us, and we keep no copy beyond what the feature needs to
            show you.
          </p>
          <p>
            The news agent reads public articles from BBC World, Al Jazeera and The Guardian. It
            never sends your private documents to a model in that daily run.
          </p>
        </Section>

        <Section title="What we never do">
          <p>
            No selling data. No advertising trackers. No third-party analytics that fingerprint you.
            No selling or sharing your canvases with other users unless you explicitly share them.
          </p>
        </Section>

        <Section title="Removing it">
          <p>
            Delete a canvas, a document or a watch from the interface and it is removed from the
            database. To delete the account and everything attached to it, email the address below
            and it will be done within seven days.
          </p>
        </Section>

        <p className="mt-10 border-t-2 border-[#1A1A1A] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
          Questions · privacy@threadwise.app
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
