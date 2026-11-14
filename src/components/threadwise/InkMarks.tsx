/**
 * Small editorial marks used sparingly across the seminar.
 * They are deliberately hand-drawn rather than geometric UI dividers.
 */
export function InkRule({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 7"
      preserveAspectRatio="none"
      className={`h-[7px] w-full overflow-visible text-[#1A1A1A]/35 ${className}`}
    >
      <path
        d="M1 4.4 C49 2.2 72 5.7 117 3.7 S186 4.7 223 3.1 S283 3.2 319 4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InkArrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 18 12" className={`h-3 w-[18px] shrink-0 text-[#1A4BFF] ${className}`}>
      <path
        d="M1 6.4 C5.8 2 9.4 9.7 15.1 5.4 M11.8 2.2 L15.5 5.4 L11.2 8.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InkCircle({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={`h-full w-full overflow-visible ${className}`}>
      <path
        d="M91 23 C107 37 113 60 104 82 C94 106 68 117 43 110 C18 103 4 82 5 58 C6 30 31 7 59 7 C76 7 90 13 99 23"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export function InkTick({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`h-3.5 w-3.5 shrink-0 text-[#1A4BFF] ${className}`}>
      <path d="M2.5 8.8 L6 12 L13.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
