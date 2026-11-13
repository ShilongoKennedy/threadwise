import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Loader2, MessageSquareText } from "lucide-react";
import type { Seminar } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain the crux again, more simply.",
  "Give me a second example.",
  "Why do both theories predict the same thing?",
  "What evidence would change the verdict?",
];

export function SeminarTutor({
  text,
  context,
  seminar,
  lesson,
}: {
  text: string;
  context: string;
  seminar: Seminar;
  lesson: SeminarLesson;
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (value?: string) => {
    const clean = (value ?? question).trim();
    if (clean.length < 5 || busy) return;
    setQuestion("");
    setError(null);
    const history = turns.slice(-6);
    setTurns((previous) => [...previous, { role: "user", content: clean }]);
    setBusy(true);
    window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
    try {
      const response = await fetch("/api/seminar-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, seminar, lesson, question: clean, history }),
      });
      const body = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !body.answer) throw new Error(body.error ?? "The tutor could not answer that.");
      setTurns((previous) => [...previous, { role: "assistant", content: body.answer! }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The tutor could not answer that.");
    } finally {
      setBusy(false);
      window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    }
  };

  return (
    <section className="mt-12 border-t border-[#1A1A1A]/15 pt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#1A4BFF]">
            <MessageSquareText className="h-3 w-3" /> Still unclear?
          </p>
          <h3 className="mt-2 font-display text-[30px] leading-none tracking-[-0.02em] md:text-[38px]">Ask the tutor.</h3>
          <p className="mt-2 max-w-[56ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/60">
            A follow-up grounded in this lesson. Ask for another example, a simpler explanation, or
            the evidence that would change the picture.
          </p>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">Grounded in this seminar</p>
      </div>

      <div className="mt-5">
        {turns.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                className="rounded-full border border-[#8A745C]/25 bg-[#FAF3E7]/60 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#1A1A1A]/55 transition-colors hover:border-[#1A4BFF]/40 hover:text-[#1A4BFF]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {turns.map((turn, index) =>
              turn.role === "user" ? (
                <div key={index} className="flex justify-end">
                  <p className="max-w-[85%] rounded-[16px] rounded-br-[4px] bg-[#1A1A1A] px-4 py-2.5 font-serif text-[13.5px] leading-relaxed text-[#FDFBF7]">
                    {turn.content}
                  </p>
                </div>
              ) : (
                <div key={index} className="max-w-[92%]">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A4BFF]">Tutor</p>
                  <div className="tutor-prose mt-1">
                    <ReactMarkdown>{turn.content}</ReactMarkdown>
                  </div>
                </div>
              ),
            )}
            {busy ? (
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                <Loader2 className="h-3 w-3 animate-spin text-[#1A4BFF]" /> Following the argument…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}

        {error ? (
          <p className="mt-3 border-l-2 border-[#C1121F] pl-3 font-mono text-[9px] uppercase tracking-[0.08em] text-[#C1121F]">
            {error}{" "}
            <button
              type="button"
              onClick={() => void ask(turns.filter((turn) => turn.role === "user").at(-1)?.content)}
              className="underline underline-offset-4"
            >
              Try again
            </button>
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask();
          }}
          className="mt-4 flex items-end gap-2 rounded-[18px] border border-[#8A745C]/25 bg-[#FBF6EC]/70 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md"
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask();
              }
            }}
            rows={1}
            maxLength={600}
            placeholder="Ask about a term, a mechanism, or the evidence…"
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 font-serif text-[14px] leading-relaxed outline-none placeholder:text-[#1A1A1A]/35"
          />
          <button
            type="submit"
            disabled={busy || question.trim().length < 5}
            aria-label="Ask the tutor"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[#FDFBF7] transition-colors hover:bg-[#1A4BFF] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.1em] text-[#1A1A1A]/30">
          Ask follow-ups only about this seminar · verify before you act
        </p>
      </div>
    </section>
  );
}
