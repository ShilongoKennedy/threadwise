import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

const theorySchema = z.object({
  key: z.enum(["A", "B"]),
  name: z.string().trim().min(2).max(90),
  claim: z.string().trim().min(20).max(400),
  mechanism: z.string().trim().min(40).max(900),
  predictions: z.array(z.string().trim().min(10).max(260)).min(2).max(4),
  evidence: z.array(z.string().trim().min(10).max(260)).min(1).max(4),
  falsifier: z.string().trim().min(20).max(400),
  assumes: z.string().trim().min(10).max(300),
});

export const seminarSchema = z.object({
  question: z.string().trim().min(10).max(260),
  restatement: z.string().trim().min(40).max(700),
  theories: z.array(theorySchema).length(2),
  crux: z.string().trim().min(30).max(600),
  disagreement: z.enum(["empirical", "definitional", "scope", "mixed"]),
  settle: z.string().trim().min(30).max(600),
  sources_needed: z.array(z.string().trim().min(4).max(220)).min(1).max(4),
  verdict: z.object({
    lean: z.enum(["A", "B", "undecided"]),
    confidence: z.enum(["low", "medium", "high"]),
    why: z.string().trim().min(40).max(700),
    change: z.string().trim().min(20).max(400),
  }),
});

export type Seminar = z.infer<typeof seminarSchema>;
export type SeminarTheory = z.infer<typeof theorySchema>;

const SYSTEM = `You are The Seminar at Threadwise: a teacher of reasoning, not a pundit.

The reader brings a quote or question. Your job is to make the strongest serious case for two rival explanations of it, then show the exact point where they part. You are not refereeing a morality play. You are mapping causal claims.

RULES
- Restate the underlying question, not the quote's rhetoric.
- Steelman both theories. Each must be the version a serious, informed proponent would defend, not a caricature.
- Both theories must be genuinely rival explanations of the same outcome. They should not be "good version" vs "bad version", and they should not agree in disguise.
- Work causally: mechanism, observable predictions, evidence, falsifier, hidden assumption.
- Do not moralise. Do not say which side is ethically better. If the disagreement is partly normative, label it "mixed" and say that the values question is separate; do not settle it.
- Do not invent facts. If the evidence is thin, say so in evidence and sources_needed.
- The crux is one question that actually separates the theories. Not "both have merits".
- settle is a specific observation, comparison or dataset that would move a reasonable reader.
- The verdict is provisional and empirical only. Use "undecided" when the evidence does not separate them. State what would change it. Never make a moral verdict.`;

export async function openSeminar(text: string, context: string): Promise<Seminar> {
  const { object } = await generateObject({
    model: getModel("deepseek"),
    system: SYSTEM,
    schema: seminarSchema,
    prompt: `THE QUOTE OR QUESTION:
${text.slice(0, 3000)}

${context.trim() ? `CONTEXT PROVIDED BY THE READER:\n${context.slice(0, 1000)}\n\n` : ""}
Open the seminar. Return two rival theories, the crux, what would settle it, and a provisional empirical verdict.`,
    temperature: 0.3,
    maxOutputTokens: 2600,
    maxRetries: 1,
  });

  return {
    ...object,
    theories: object.theories.map((theory, index) => ({
      ...theory,
      key: index === 0 ? "A" : "B",
    })) as Seminar["theories"],
  };
}
