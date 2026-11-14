import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import type { Seminar } from "@/lib/threadwise/seminar";

export type GlossaryWord = Seminar["glossary"][number];

export const WORD_TONES = [
  { bg: "#F7E4BC", line: "#CFA965", ink: "#6B4A1D", wash: "#FBF2DE" },
  { bg: "#DDECE2", line: "#8EAE9E", ink: "#3E6250", wash: "#F0F7F1" },
  { bg: "#E7E1F3", line: "#A79BC9", ink: "#554574", wash: "#F5F1FB" },
  { bg: "#F5DCD1", line: "#D29A82", ink: "#824634", wash: "#FCF1EB" },
  { bg: "#DDE9F3", line: "#8EA9C3", ink: "#3F5E79", wash: "#F0F6FA" },
] as const;

export type OpenWord = {
  word: GlossaryWord;
  tone: number;
  rect: DOMRect;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({
  text,
  glossary,
  onWord,
}: {
  text: string;
  glossary: GlossaryWord[];
  onWord: (word: GlossaryWord, tone: number, element: HTMLElement) => void;
}) {
  const terms = useMemo(
    () =>
      [...glossary]
        .filter((word) => word.term.trim().length > 1 && text.toLocaleLowerCase().includes(word.term.toLocaleLowerCase()))
        .sort((a, b) => b.term.length - a.term.length),
    [glossary, text],
  );

  const pattern = useMemo(() => {
    if (!terms.length) return null;
    return new RegExp(`(${terms.map((word) => escapeRegExp(word.term)).join("|")})`, "gi");
  }, [terms]);

  if (!pattern) return <>{text}</>;

  const lookup = new Map(terms.map((word, index) => [word.term.toLocaleLowerCase(), { word, tone: index % WORD_TONES.length }]));
  return (
    <>
      {text.split(pattern).map((part, index) => {
        const match = lookup.get(part.toLocaleLowerCase());
        if (!match) return <span key={index}>{part}</span>;
        const tone = WORD_TONES[match.tone];
        return (
          <button
            key={index}
            type="button"
            className="seminar-word"
            style={{ "--word-bg": tone.bg, "--word-line": tone.line, "--word-ink": tone.ink } as CSSProperties}
            onClick={(event) => onWord(match.word, match.tone, event.currentTarget)}
            aria-label={`Explain the word ${match.word.term}`}
          >
            {part}
          </button>
        );
      })}
    </>
  );
}

export function WordChips({
  glossary,
  onWord,
}: {
  glossary: GlossaryWord[];
  onWord: (word: GlossaryWord, tone: number, element: HTMLElement) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {glossary.map((word, index) => {
        const tone = WORD_TONES[index % WORD_TONES.length];
        return (
          <button
            key={word.term}
            type="button"
            onClick={(event) => onWord(word, index % WORD_TONES.length, event.currentTarget)}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
            style={{ borderColor: `${tone.line}88`, backgroundColor: tone.wash, color: tone.ink }}
          >
            <Sparkles className="h-2.5 w-2.5" style={{ color: tone.line }} />
            {word.term}
          </button>
        );
      })}
    </div>
  );
}

export function WordCloudBubble({ open, onClose }: { open: OpenWord | null; onClose: () => void }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const mobile = window.innerWidth < 768;
    setMobile(mobile);
    if (mobile) return;
    const width = 340;
    const height = 230;
    const anchorX = open.rect.left + open.rect.width / 2;
    const left = Math.max(14, Math.min(window.innerWidth - width - 14, anchorX - width / 2));
    let top = open.rect.bottom + 14;
    if (top + height > window.innerHeight - 14) top = open.rect.top - height - 14;
    setPosition({ left, top: Math.max(14, top) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onOutside = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-word-cloud]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside, true);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;
  if (!mobile && !position) return null;
  const tone = WORD_TONES[open.tone % WORD_TONES.length];

  const bubble = (
    <div
      className="pointer-events-none fixed inset-0 z-[95]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="false"
        data-word-cloud
        aria-label={`A word to keep: ${open.word.term}`}
        className={`word-cloud pointer-events-auto ${mobile ? "fixed inset-x-3 bottom-3" : "fixed"}`}
        style={mobile ? undefined : { left: position?.left ?? 0, top: position?.top ?? 0, width: 340 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="word-cloud-puff word-cloud-puff-a" style={{ backgroundColor: tone.bg }} aria-hidden />
        <span className="word-cloud-puff word-cloud-puff-b" style={{ backgroundColor: tone.bg }} aria-hidden />
        <span className="word-cloud-puff word-cloud-puff-c" style={{ backgroundColor: tone.bg }} aria-hidden />
        <div
          className="relative overflow-hidden rounded-[30px] border p-4 shadow-[0_26px_60px_-24px_rgba(47,51,44,0.4)] md:p-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${tone.wash} 5%, ${tone.bg} 145%)`,
            borderColor: `${tone.line}80`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.18em]" style={{ color: tone.ink }}>
              <Sparkles className="h-3 w-3" style={{ color: tone.line }} />
              A word to keep
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close word note"
              className="grid h-6 w-6 place-items-center rounded-full text-[#2F332C]/35 transition-colors hover:bg-[#2F332C]/5 hover:text-[#2F332C]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <h2 className="mt-3 font-display text-[25px] leading-none tracking-[-0.025em]" style={{ color: tone.ink }}>
            {open.word.term}
          </h2>
          <p className="mt-3 font-serif text-[14px] leading-[1.55] text-[#2F332C]/72">{open.word.plain}</p>
          <p className="mt-3 border-t pt-2.5 font-serif text-[12px] leading-snug text-[#2F332C]/48" style={{ borderColor: `${tone.line}45` }}>
            <span className="font-mono text-[7px] uppercase tracking-[0.12em]" style={{ color: tone.ink }}>
              Why keep it ·{" "}
            </span>
            {open.word.why}
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(bubble, document.body);
}
