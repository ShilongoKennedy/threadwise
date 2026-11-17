import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

export const paperRecommendationsSchema = z.object({
  quotes: z.array(z.string().trim().min(4).max(90)).min(2).max(5),
});

export type PaperRecommendations = z.infer<typeof paperRecommendationsSchema>;

const SYSTEM = `You choose recommended phrases inside a reading surface.

Return 3 to 5 SHORT exact phrases from the supplied text.

Rules:
- Each phrase must be 3 to 10 words and at most 90 characters. Do not return a complete sentence and do not include a final period.
- Never return a whole paragraph.
- Prefer the phrase that carries the analytical move: a causal claim, a confidence qualification, a definition, a falsifier, a mechanism, or a crux test.
- The phrase must appear verbatim in the text, including punctuation and capitalisation.
- Do not choose headings, navigation, labels, buttons or generic introductions.
- A short clause is better than a whole sentence. Never return a whole sentence.`;

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
