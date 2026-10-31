import { useEffect, useState } from "react";
import { ArrowRight, CircleHelp, Link2, MousePointer2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NODE_TYPES, TYPE_INFO } from "@/lib/threadwise/model";
import { EpistemicGlyph, TYPE_COLOR, TYPE_ICON } from "./ThreadNode";

const KEY = "threadwise-onboarded-v1";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-7 min-w-7 place-items-center rounded-md border border-b-2 bg-card px-1.5 font-mono text-[12px] text-foreground">
      {children}
    </kbd>
  );
}

const STEPS = [
  {
    eyebrow: "01 — The canvas",
    title: "Think in cards, not pages.",
    body: "Every idea, note, question, experiment and action is a card. Drag between the dots on two cards to connect them, and say how they relate.",
    art: () => (
      <svg viewBox="0 0 240 90" className="h-24 w-full">
        <rect x="8" y="22" width="78" height="46" rx="8" fill="var(--card)" stroke="var(--border-strong)" />
        <rect x="8" y="30" width="3" height="30" rx="1.5" fill="var(--type-note)" />
        <rect x="154" y="22" width="78" height="46" rx="8" fill="var(--card)" stroke="var(--border-strong)" />
        <rect x="154" y="30" width="3" height="30" rx="1.5" fill="var(--type-idea)" />
        <path d="M86 45 C 120 45, 120 45, 154 45" stroke="var(--edge)" strokeWidth="1.2" fill="none" className="tw-draw" />
        <text x="120" y="38" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="11" fill="var(--muted-foreground)">supports</text>
      </svg>
    ),
  },
  {
    eyebrow: "02 — Ghost suggestions",
    title: "Let the canvas think back.",
    body: "Explore reads your whole canvas and suggests questions, experiments and links. They show up as faint striped cards and only become real when you accept them.",
    art: () => (
      <div className="flex h-24 items-center justify-center gap-3">
        <div className="h-16 w-28 rounded-lg border bg-card shadow-[var(--shadow-card)]" />
        <div className="tw-ghost flex h-16 w-28 items-center justify-center gap-1 rounded-lg border border-dashed font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground" style={{ borderColor: "var(--type-question)" }}>
          <Sparkles className="h-3 w-3" /> suggested
        </div>
      </div>
    ),
  },
  {
    eyebrow: "03 — Make the thread visible",
    title: "Give every link a meaning.",
    body: "Drag from a card's small connection handle to another card, then choose the relationship. Use “depends on” for prerequisites and “needs evidence from” when a claim still needs proof.",
    art: () => (
      <div className="flex h-24 items-center justify-center gap-4 text-sm">
        <MousePointer2 className="h-8 w-8 text-accent-ink" />
        <Link2 className="h-5 w-5 text-muted-foreground" />
        <div className="rounded-lg border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-wider">needs evidence</div>
      </div>
    ),
  },
  {
    eyebrow: "04 — A useful rhythm",
    title: "Capture → connect → challenge → decide.",
    body: "Start rough: capture an idea or note. Connect it to what it affects. Use Explore when you want questions and test ideas, then turn the best next move into an action or experiment.",
    art: () => (
      <div className="flex h-24 items-center justify-center gap-2 text-center font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">
        {[["Capture", "var(--type-note)"], ["Connect", "var(--type-idea)"], ["Challenge", "var(--type-question)"], ["Decide", "var(--type-action)"]].map(([label, color], i) => <div key={label} className="contents"><div className="grid h-14 w-14 place-items-center rounded-full border bg-card" style={{ borderColor: color }}>{label}</div>{i < 3 && <ArrowRight className="h-3 w-3" />}</div>)}
      </div>
    ),
  },
  {
    eyebrow: "05 — Help is always nearby",
    title: "You never have to remember the system.",
    body: "Use the ? button in the bottom toolbar to reopen this guide at any time. The Canvas Studio contains guided tools for presenting, evidence, risk and planning. Start with one card; the rest can arrive later.",
    art: () => <div className="grid h-24 place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full border bg-card text-accent-ink shadow-[var(--shadow-card)]"><CircleHelp className="h-7 w-7" /></span></div>,
  },
  {
    eyebrow: "06 — Your hands",
    title: "Keys for thinking fast.",
    body: "",
    art: () => (
      <div className="space-y-2 py-1">
        {NODE_TYPES.map((k, i) => {
          const Icon = TYPE_ICON[k];
          return (
            <div key={k} className="flex items-center gap-3 text-sm">
              <Key>{i + 1}</Key>
              <Icon className="h-4 w-4" style={{ color: TYPE_COLOR[k] }} />
              <span>{TYPE_INFO[k].label}</span>
              <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:block">{TYPE_INFO[k].hint}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-3 border-t border-dashed pt-2 text-sm">
          <Key>E</Key>
          <Sparkles className="h-4 w-4 text-accent-ink" />
          <span>Explore</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><Key>Esc</Key> deselect</span>
        </div>
      </div>
    ),
  },
];

export function useOnboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);
  return {
    open,
    show: () => setOpen(true),
    close: () => {
      localStorage.setItem(KEY, "1");
      setOpen(false);
    },
  };
}

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step]!;
  const last = step === STEPS.length - 1;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") last ? onClose() : setStep((x) => x + 1);
      if (e.key === "ArrowLeft") setStep((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [last, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/15 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal aria-label="Welcome to Threadwise">
      <div className="tw-sheet w-full max-w-[440px] overflow-hidden rounded-[2px] border bg-card shadow-[var(--shadow-lift)]">
        <div className="border-b border-dashed bg-background/60 px-6 py-5" key={`art-${step}`}>
          <div className="tw-rise">{s.art()}</div>
        </div>
        <div className="px-6 pb-5 pt-5" key={step}>
          <div className="tw-rise font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.eyebrow}</div>
          <h2 className="tw-rise mt-2 font-display text-[26px] italic leading-tight tracking-tight">{s.title}</h2>
          {s.body && <p className="tw-rise mt-2 text-[14px] leading-relaxed text-muted-foreground">{s.body}</p>}
          {step === 0 && (
            <p className="tw-rise mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <EpistemicGlyph status="fact" /> known <EpistemicGlyph status="assumption" className="ml-2" /> assumed <EpistemicGlyph status="unknown" className="ml-2" /> unknown
            </p>
          )}
        </div>
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} aria-label={`Step ${i + 1}`} onClick={() => setStep(i)} className="grid h-8 w-6 place-items-center">
                <span className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-5" : "w-1.5"}`} style={{ background: i === step ? "var(--foreground)" : "var(--border-strong)" }} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {!last && <Button variant="ghost" className="h-10 text-muted-foreground" onClick={onClose}>Skip</Button>}
            <Button className="tw-press h-10 px-4" onClick={() => (last ? onClose() : setStep(step + 1))}>
              {last ? "Start thinking" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
