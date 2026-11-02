import { useEffect } from "react";
import { playSound } from "@/lib/threadwise/sound";

/**
 * The moment a claim settles. Deliberately physical: an inked rubber stamp,
 * slightly off-square, landing with the existing desk-foley cue.
 */
export function VerdictStamp({
  status,
  sound = true,
}: {
  status: "confirmed" | "contradicted";
  sound?: boolean;
}) {
  const contradicted = status === "contradicted";

  useEffect(() => {
    if (sound) playSound("stamp");
  }, [sound]);

  return (
    <span
      className={`tw-stamp ${contradicted ? "is-contradicted" : ""}`}
      title={contradicted ? "The reporting did not hold" : "The reporting held"}
    >
      {contradicted ? "Contradicted" : "Confirmed"}
    </span>
  );
}
