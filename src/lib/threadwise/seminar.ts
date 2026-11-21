import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

const baseTheorySchema = z.object({
  key: z.enum(["A", "B", "C"]),
  name: z.string().trim().min(2).max(90),
  claim: z.string().trim().min(20).max(400),
  mechanism: z.string().trim().min(40).max(900),
  predictions: z.array(z.string().trim().min(10).max(260)).min(2).max(4),
  evidence: z.array(z.string().trim().min(10).max(260)).min(1).max(4),
  falsifier: z.string().trim().min(20).max(400),
  assumes: z.string().trim().min(10).max(300),
});

const theorySchema = baseTheorySchema.extend({
  mechanism_steps: z
    .array(
      z.object({
        label: z.string().trim().min(2).max(42),
        detail: z.string().trim().min(8).max(180),
      }),
    )
    .min(3)
    .max(5),
});

export const seminarFallbackSchema = z.object({
  question: z.string().trim().min(10).max(260),
  restatement: z.string().trim().min(40).max(700),
  form: z.enum(["duel", "trilemma", "single"]),
  theories: z.array(baseTheorySchema).min(1).max(3),
  crux: z.string().trim().min(30).max(600),
  disagreement: z.enum(["empirical", "definitional", "scope", "mixed"]),
  settle: z.string().trim().min(30).max(600),
  sources_needed: z.array(z.string().trim().min(4).max(220)).min(1).max(4),
  verdict: z.object({
    lean: z.enum(["A", "B", "C", "undecided"]),
    confidence: z.enum(["low", "medium", "high"]),
    why: z.string().trim().min(40).max(700),
    change: z.string().trim().min(20).max(400),
  }),
});

export const seminarSchema = seminarFallbackSchema.extend({
  theories: z.array(theorySchema).min(1).max(3),
});

export type Seminar = z.infer<typeof seminarSchema>;
export type SeminarTheory = z.infer<typeof theorySchema>;

const SYSTEM = `You are The Seminar at Threadwise: a teacher of reasoning, not a pundit.

The reader brings a quote or question. Your job is to make the strongest serious case for the explanations that genuinely compete, then show the exact point where they part. You are not refereeing a morality play. You are mapping causal claims.

FIRST, CHOOSE THE FORM
- duel: exactly two genuine rival explanations. Use only when both would be defended by a serious, informed person and they cannot both be true.
- trilemma: exactly three positions, where collapsing them into two would distort the disagreement.
- single: exactly one serious explanation. Use when a second rival would be manufactured. In this form, the falsifier and hidden assumption must carry the strongest objection.

Do not force symmetry. If the evidence supports one serious explanation, use single. If three positions are real, use trilemma. If two are real, use duel.

RULES
- Restate the underlying question, not the quote's rhetoric.
- Steelman every position. Each must be the version a serious, informed proponent would defend, not a caricature.
- Positions must be genuinely rival explanations of the same outcome. They should not be "good version" vs "bad version", and they should not agree in disguise.
- Work causally: mechanism, observable predictions, evidence, falsifier, hidden assumption.
- mechanism_steps must be the causal chain, not a table of contents: 3–5 observable moves from cause to outcome, each with a short label and one clarifying sentence.
- Do not moralise. Do not say which side is ethically better. If the disagreement is partly normative, label it "mixed" and say that the values question is separate; do not settle it.
- Do not invent facts. If the evidence is thin, say so in evidence and sources_needed.
- The crux is one question that actually separates the positions. Not "both have merits". For single, the crux is the one observation that would break the explanation.
- settle is a specific observation, comparison or dataset that would move a reasonable reader.
- The verdict is provisional and empirical only. Use "undecided" when the evidence does not separate the positions. State what would change it. Never make a moral verdict.
- Return form as "duel", "trilemma" or "single" and make the number of theories match exactly.`;

function deriveMechanismSteps(mechanism: string) {
  const sentences = mechanism
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 4);
  return sentences.map((sentence, index) => {
    const words = sentence.split(/\s+/);
    return {
      label: words.slice(0, 3).join(" ").replace(/[.,;:]$/, "") || `Step ${index + 1}`,
      detail: sentence,
    };
  });
}

export async function openSeminar(text: string, context: string): Promise<Seminar> {
  const prompt = `THE QUOTE OR QUESTION:
${text.slice(0, 3000)}

${context.trim() ? `CONTEXT PROVIDED BY THE READER:
${context.slice(0, 1000)}

` : ""}
Open the seminar. Choose the form that fits: duel (2 theories), trilemma (3 theories), or single (1 theory). Return the positions, the crux, what would settle it, and a provisional empirical verdict.`;
  const request = (schema: typeof seminarSchema | typeof seminarFallbackSchema) =>
    generateObject({
      model: getModel("deepseek"),
      system: SYSTEM,
      schema,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 6000,
      maxRetries: 2,
    });

  let object: z.infer<typeof seminarFallbackSchema>;
  let usedFallback = false;
  try {
    object = (await request(seminarSchema)).object;
  } catch (error) {
    // Some providers reject optional struct members. Retry without the step array
    // so a transient structured-output failure never blocks the whole seminar.
    console.error("[seminar] structured generation failed, retrying without steps:", error);
    usedFallback = true;
    object = (await request(seminarFallbackSchema)).object;
  }

  const theories = object.theories.map((theory, index) => ({
    ...theory,
    key: index === 0 ? "A" : index === 1 ? "B" : "C",
    mechanism_steps:
      !usedFallback && "mechanism_steps" in theory && Array.isArray(theory.mechanism_steps)
        ? theory.mechanism_steps
        : deriveMechanismSteps(theory.mechanism),
  })) as Seminar["theories"];

  return {
    ...object,
    form: theories.length === 3 ? "trilemma" : theories.length === 1 ? "single" : "duel",
    theories,
  };
}
