import { Fragment, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  startDelay?: number;
  stagger?: number;
};

export function SignatureHeadline({
  text,
  className = "",
  startDelay = 260,
  stagger = 48,
}: Props) {
  const words = text.split(" ");
  let index = 0;

  return (
    <h1 aria-label={text} className={`signature-headline ${className}`}>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => {
          const letters = Array.from(word);
          const start = index;
          index += letters.length;

          return (
            <Fragment key={`${word}-${wordIndex}`}>
              <span className="inline-block whitespace-nowrap">
                {letters.map((letter, letterIndex) => {
                  const delay = startDelay + (start + letterIndex) * stagger;
                  return (
                    <span
                      key={`${letter}-${letterIndex}`}
                      className="signature-letter"
                      style={{ "--signature-delay": `${delay}ms` } as CSSProperties}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
              {wordIndex < words.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </span>
    </h1>
  );
}
