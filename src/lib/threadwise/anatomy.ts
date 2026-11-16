import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

const statusSchema = z.enum([
  "established",
  "supported",
  "contested",
  "unsupported",
  "unfalsifiable",
]);

const rungSchema = z.object({
  key: z.enum([
    "observation",
    "identification",
    "interpretation",
    "intention",
    "coordination",
    "conclusion",
  ]),
  label: z.string().trim().min(2).max(40),
  statement: z.string().trim().min(12).max(300),
  status: statusSchema,
  evidence: z.string().trim().min(10).max(700),
  gap: z.string().trim().min(4).max(500),
});

export const anatomySchema = z.object({
  claim: z.string().trim().min(10).max(500),
  restatement: z.string().trim().min(30).max(900),
  claim_type: z.string().trim().min(3).max(80),
  ladder: z.array(rungSchema).length(6),
  survives: z.array(z.string().trim().min(6).max(300)).min(1).max(4),
  does_not_survive: z.array(z.string().trim().min(6).max(300)).min(1).max(4),
  unknown: z.array(z.string().trim().min(6).max(300)).min(1).max(4),
  why: z.object({
    psychological: z.string().trim().min(20).max(700),
    social: z.string().trim().min(20).max(700),
    historical: z.string().trim().min(20).max(700),
    symbolic: z.string().trim().min(20).max(700),
  }),
  hinge: z.string().trim().min(30).max(900),
  lesson: z.object({
    title: z.string().trim().min(4).max(100),
    body: z.string().trim().min(30).max(700),
    pattern: z.string().trim().min(4).max(100),
  }),
});

export type AnatomyReport = z.infer<typeof anatomySchema>;
export type AnatomyRung = z.infer<typeof rungSchema>;
export type AnatomyStatus = z.infer<typeof statusSchema>;

const SYSTEM = `You are The Anatomy at Threadwise: a teacher of thinking, not a debunker and not a pundit.

The reader gives you a belief, rumour, headline, image description or conspiracy claim. Your job is to show HOW the belief is built and WHERE the evidence stops. You are not producing two rival theories. You are mapping an inference chain.

THE LADDER
Every analysis uses six rungs, in this order:
1. observation — what is actually present or reported.
2. identification — what the thing is said to be.
3. interpretation — what that thing is said to mean.
4. intention — that someone chose or intended it.
5. coordination — that multiple details were deliberately assembled.
6. conclusion — the full claim being defended.

Grade each rung:
- established: independently verified or directly observable.
- supported: reasonable but not fully established.
- contested: credible evidence points both ways.
- unsupported: no adequate evidence, or the evidence does not reach this rung.
- unfalsifiable: cannot be tested even in principle.

Do not skip rungs. The most important teaching is the first rung where the chain stops being supported.

RULES
- Separate fact, inference, interpretation, intention and value.
- Do not call believers stupid or diagnose them. Explain why the belief is cognitively and socially attractive.
- Do not use "why it appeals" to imply it is false.
- Do not manufacture balance. A weak rung is weak.
- Never invent sources, records, quotations or measurements.
- If the evidence is thin, say so. Use "not established" plainly.
- Keep the prose exact, calm and readable. No hype, no moral superiority.
- The lesson must be reusable beyond this one belief.`;

export async function openAnatomy(text: string): Promise<AnatomyReport> {
  const { object } = await generateObject({
    model: getModel("deepseek"),
    system: SYSTEM,
    schema: anatomySchema,
    prompt: `THE BELIEF OR CLAIM BROUGHT BY THE READER:
${text.slice(0, 4000)}

Build the anatomy. Use exactly the six rungs in order. For each rung, state the claim being made, grade it, give the evidence that exists, and name the specific evidence gap. Then give what survives, what does not, what remains unknown, the four reasons it appeals, the hinge that would change a mind, and one reusable thinking lesson.`,
    temperature: 0.3,
    maxOutputTokens: 6000,
    maxRetries: 2,
  });
  return object;
}
