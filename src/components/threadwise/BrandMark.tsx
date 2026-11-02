/**
 * The Threadwise mark: a case tag hanging from a cord, punched and tilted.
 * Cobalt is the pin only — the tag itself is ink, as it is on a real cord.
 */
export function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Threadwise">
      <circle cx="16" cy="4.6" r="2.2" fill="#1A4BFF" />
      <path d="M16 6.6V9.5" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" />
      <g transform="rotate(-7 16 9.5)">
        <path
          fill="#1A1A1A"
          fillRule="evenodd"
          d="M10.2 9.5h11.6a1.6 1.6 0 0 1 1.6 1.6v15a1.6 1.6 0 0 1-1.6 1.6H10.2a1.6 1.6 0 0 1-1.6-1.6v-15a1.6 1.6 0 0 1 1.6-1.6Zm5.8 3.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Z"
        />
      </g>
    </svg>
  );
}
