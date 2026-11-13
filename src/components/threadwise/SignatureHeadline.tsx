import { useEffect, useId, useRef } from "react";
import { FireFlourish } from "./FireFlourish";

type Props = {
  text: string;
  className?: string;
  fire?: boolean;
};

const DRIFT = ["0.008em", "-0.006em", "0.012em", "-0.01em", "0.004em"];
const TILT = ["-0.5deg", "0.35deg", "-0.3deg", "0.6deg", "-0.45deg"];

export function SignatureHeadline({ text, className = "", fire = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const penRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const headline = headlineRef.current;
    const pen = penRef.current;
    if (!headline || !pen) return;

    const letters = Array.from(
      headline.querySelectorAll<HTMLSpanElement>(".signature-letter"),
    );
    if (!letters.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      headline.classList.add("is-signed");
      return;
    }

    const timers: number[] = [];
    let cursor = 420;

    const movePen = (letter: HTMLSpanElement) => {
      const h = headline.getBoundingClientRect();
      const l = letter.getBoundingClientRect();
      pen.style.left = `${l.right - h.left - 1}px`;
      pen.style.top = `${l.top - h.top + l.height * 0.63}px`;
      pen.style.opacity = "1";
    };

    letters.forEach((letter, index) => {
      const char = letter.textContent ?? "";
      const wordEnd = letter.dataset.wordEnd === "true";
      const punctuation = /[.,;:!?—]/.test(char);
      const variance = [1, 1.22, 0.9, 1.1, 0.84][index % 5];

      cursor += Math.round(56 * variance) + (punctuation ? 34 : 0);

      timers.push(
        window.setTimeout(() => {
          letter.classList.add("is-writing");
          movePen(letter);
        }, cursor),
      );

      if (wordEnd) {
        timers.push(
          window.setTimeout(() => {
            pen.style.opacity = "0";
          }, cursor + 95),
        );
        cursor += 24;
      }
    });

    timers.push(
      window.setTimeout(() => {
        headline.classList.add("is-signed");
        pen.style.opacity = "0";
      }, cursor + 300),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      letters.forEach((letter) => letter.classList.remove("is-writing"));
      headline.classList.remove("is-signed");
      pen.style.opacity = "0";
    };
  }, []);

  const words = text.split(" ");
  let index = 0;

  return (
    <h1 ref={headlineRef} aria-label={text} className={`signature-headline ${fire ? "fire-headline" : ""} ${className}`}>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => {
          const letters = Array.from(word);
          const start = index;
          index += letters.length;

          return (
            <span key={`${word}-${wordIndex}`}>
              <span className="inline-block whitespace-nowrap">
                {letters.map((letter, letterIndex) => {
                  const itemIndex = start + letterIndex;
                  return (
                    <span
                      key={`${letter}-${letterIndex}`}
                      className="signature-letter"
                      data-word-end={letterIndex === letters.length - 1 ? "true" : undefined}
                      style={{
                        "--signature-drift": DRIFT[itemIndex % DRIFT.length],
                        "--signature-tilt": TILT[itemIndex % TILT.length],
                      } as React.CSSProperties}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
              {wordIndex < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
      <span ref={penRef} className="signature-pen" aria-hidden="true" />
      {fire ? (
        <FireFlourish />
      ) : (
        <svg className="signature-flourish" viewBox="0 0 700 30" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 24 C110 4 205 27 305 16 C410 4 505 28 610 12 C646 7 672 4 696 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </h1>
  );
}
