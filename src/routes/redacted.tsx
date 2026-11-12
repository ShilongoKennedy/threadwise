import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { RedactionSheet } from "@/components/threadwise/RedactionSheet";

export const Route = createFileRoute("/redacted")({
  head: () => ({
    meta: [
      { title: "The redacted read — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An interactive experiment: the public record as a redacted sheet.",
      },
    ],
  }),
  component: RedactedPage,
});

function RedactedPage() {
  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A]">
      <AppHeader marketing />

      <main className="mx-auto w-full max-w-[1200px] px-5 pb-20 pt-24 md:px-8 md:pt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#1A1A1A]/15 pb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A4BFF]">
            A redacted read / experiment 03
          </p>
          <Link
            to="/"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/40 underline underline-offset-4 hover:text-[#1A4BFF]"
          >
            Back to the atlas
          </Link>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:gap-16">
          <h1 className="max-w-[12ch] font-display text-[46px] leading-[0.94] tracking-[-0.035em] md:text-[76px]">
            See what the story hides.
          </h1>
          <p className="max-w-[38ch] self-end font-serif text-[16px] leading-[1.7] text-[#1A1A1A]/65 md:text-[18px]">
            The report is real. The public finding is not. Move the lens across the record, or lift
            the sheet.
          </p>
        </div>

        <RedactionSheet />
      </main>
    </div>
  );
}
