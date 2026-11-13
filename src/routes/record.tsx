import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/threadwise/AppHeader";
import { RecordBand } from "@/components/record/RecordBand";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "The record — section preview" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Section-scale preview of the torn record for the Threadwise landing." },
    ],
  }),
  component: RecordPreview,
});

function RecordPreview() {
  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] pt-[62px] text-[#1A1A1A]">
      <AppHeader marketing />
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-5 pb-2 pt-5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#1A1A1A]/35 md:px-8">
        <span>Section preview / the record</span>
        <span className="hidden sm:inline">Replaces “the record, shown” after the method</span>
      </div>
      <RecordBand />
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/15 px-5 py-5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#1A1A1A]/35 md:px-8">
        <span>Threadwise / the record</span>
        <span>Not yet wired into the public landing</span>
      </div>
    </div>
  );
}
