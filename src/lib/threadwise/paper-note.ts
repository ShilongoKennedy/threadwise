import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

export const paperNoteSchema = z.object({
  term: z.string().trim().min(3).max(80),
  plain: z.string().trim().min(20).max(420),
  deeper: z.string().trim().min(30).max(650),
  watch: z.string().trim().min(10).max(420),
});

export type PaperNote = z.infer<typeof paperNoteSchema>;

const SYSTEM = `You are a margin-note explainer inside a serious reading tool.

The reader has highlighted a phrase or sentence. Explain it without flattering them and without turning the note into a verdict.

Return:
- term: a short handle for the idea, not a restatement of the whole sentence.
- plain: what the phrase means in ordinary language.
- deeper: the context that makes it matter here, including what it does or does not establish.
- watch: one concrete thing to look for in the surrounding reporting or argument.

Separate definition from inference. If the passage contains a contested claim, say what is established and what is not. Do not invent sources, numbers or quotations. Keep the prose calm, exact and useful.`;

export async function openPaperNote(text: string, context: string): Promise<PaperNote> {
  const { object } = await generateObject({
    model: getModel("deepseek"),
    system: SYSTEM,
    schema: paperNoteSchema,
    prompt: `HIGHLIGHTED PASSAGE:
${text.slice(0, 800)}

SURROUNDING PARAGRAPH:
${context.slice(0, 1600)}

Write the margin note.`,
    temperature: 0.3,
    maxOutputTokens: 1500,
    maxRetries: 2,
  });
  return object;
}
