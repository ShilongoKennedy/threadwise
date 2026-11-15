import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";

/**
 * The lockup: mark + wordmark, with the spacing defined once.
 *
 * Rules
 * - The mark is set to the wordmark's cap height, never larger.
 * - The gap is 0.45× the mark's width — tighter reads as a single glyph, looser
 *   as two unrelated objects.
 * - Clear space around the lockup equals the mark's width on every side.
 * - Horizontal is the default. Stacked is only for square formats (share cards,
 *   app splash), where the horizontal would shrink the wordmark below 16px.
 */

type Props = {
  variant?: "horizontal" | "stacked";
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  className?: string;
};

const MARK: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const WORD: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-[17px]",
  md: "text-[22px]",
  lg: "text-[30px]",
};

const GAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "gap-[9px]", // ≈ 0.45 × 20px
  md: "gap-[13px]", // ≈ 0.45 × 28px
  lg: "gap-[18px]", // ≈ 0.45 × 40px
};

export function BrandLockup({
  variant = "horizontal",
  size = "md",
  asLink = false,
  className = "",
}: Props) {
  const content = (
    <span
      className={`inline-flex items-center text-[#1A1A1A] ${
        variant === "stacked" ? `flex-col ${GAP[size].replace("gap-", "gap-y-")}` : GAP[size]
      } ${className}`}
    >
      <BrandMark className={`${MARK[size]} shrink-0`} />
      <span className={`thread-wordmark font-display italic tracking-tight ${WORD[size]} ${variant === "stacked" ? "leading-none" : "leading-none pb-[2px]"}`}>
        <span className="thread-wordmark__text">threadwise</span>
        <svg className="thread-wordmark__thread" viewBox="0 0 112 18" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 12.4 C15 5.3 29 14.2 42 9.6 C51 6.5 56 4.9 61 6.5 C67 8.5 64 13.4 58 12.1 C52.8 11 55.5 5.3 62 6.4 C77 9 93 5.4 110 9.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      to="/"
      aria-label="Threadwise — home"
      className="group inline-flex transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}
