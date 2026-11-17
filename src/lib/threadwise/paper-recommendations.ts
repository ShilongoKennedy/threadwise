import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

export const paperRecommendationsSchema = z.object({
  quotes: z.array(z.string().trim().min(1).max(220)).min(2).max(6),
});

export type PaperRecommendations = z.infer<typeof paperRecommendationsSchema>;

const SYSTEM = `You are choosing highlights for a curious reader inside a serious reading surface.

The highlight is not decoration. Choose the passages a reader might want explained, defined or explored further.

Prioritise:
- unusual, technical or specialist vocabulary
- terms of art and jargon
- named concepts and contested definitions
- a compact phrase that compresses an inference
- a causal claim with a hidden assumption
- a sentence where the exact wording matters

Reject:
- everyday words a reader already knows
- headings, navigation, labels, buttons and generic introductions
- transitions and filler
- a whole sentence merely because it is long

A quote may be one word ("ascribed"), a 2–5 word term ("ontological security"), or a short sentence. Choose a whole sentence only when the sentence itself is a definition, a claim, or a piece of reasoning worth pausing on.

Return 3 to 6 pieces. Each must be an exact contiguous quotation from the text, character for character. Do not paraphrase. Do not include a final period unless it is part of a quoted sentence that genuinely earns the highlight.`;


export async function openPaperRecommendations(text: string): Promise<string[]> {
  const { object } = await generateObject({
    model: getModel("deepseek"),
    system: SYSTEM,
    schema: paperRecommendationsSchema,
    prompt: `READING SURFACE TEXT:\n${text.slice(0, 7000)}\n\nReturn only short exact phrases.`,
    temperature: 0.2,
    maxOutputTokens: 1200,
    maxRetries: 3,
  });
  return object.quotes;
}
