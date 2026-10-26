import { Check, Pipette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAPER_COLORS, PAPER_LABELS, isCustomColor, paperColor, paperInk } from "@/lib/threadwise/paper";
import type { PaperColor } from "@/lib/threadwise/paper";

export function ColorPicker({ value, onChange, label = "Paper color", disabled = false, allowCustom = false }: { value?: string | undefined; onChange: (color: PaperColor | string) => void; label?: string; disabled?: boolean; allowCustom?: boolean }) {
  const custom = isCustomColor(value);
  return <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {PAPER_COLORS.map((color) => <Button key={color} type="button" variant="outline" size="icon" disabled={disabled} data-paper={color} className="tw-swatch h-8 w-8 rounded-full" aria-label={`${label}: ${PAPER_LABELS[color]}`} title={PAPER_LABELS[color]} aria-pressed={!custom && paperColor(value) === color} onClick={() => onChange(color)}>{!custom && paperColor(value) === color && <Check className="h-3.5 w-3.5" />}</Button>)}
    {allowCustom && (
      <label
        className="tw-swatch tw-swatch-custom relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-foreground"
        style={custom ? { background: value, color: paperInk(value) } : undefined}
        title="Custom color"
        aria-label={`${label}: custom color`}
        aria-pressed={custom}
        data-disabled={disabled || undefined}
      >
        {custom ? <Check className="h-3.5 w-3.5" style={{ color: "inherit" }} /> : <Pipette className="h-3.5 w-3.5" />}
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={custom ? value : "#e7d3a7"}
          disabled={disabled}
          aria-label={`${label}: choose a custom color`}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    )}
  </div>;
}
