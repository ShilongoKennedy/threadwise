import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";
import type { Seminar } from "@/lib/threadwise/seminar";

const keyTermSchema = z.object({
  term: z.string().trim().min(2).max(90),
  plain: z.string().trim().min(20).max(420),
  why_it_matters: z.string().trim().min(20).max(420),
});

const backgroundSchema = z.object({
  heading: z.string().trim().min(3).max(100),
  body: z.string().trim().min(60).max(1100),
});

const mechanismSchema = z.object({
  theory: z.enum(["A", "B"]),
  heading: z.string().trim().min(3).max(110),
  body: z.string().trim().min(60).max(1000),
  strength: z.string().trim().min(30).max(420),
  weakness: z.string().trim().min(30).max(420),
});

const misconceptionSchema = z.object({
  mistake: z.string().trim().min(20).max(300),
  correction: z.string().trim().min(30).max(500),
});

const checkSchema = z.object({
  question: z.string().trim().min(10).max(260),
  answer: z.string().trim().min(20).max(600),
});

const nextSourceSchema = z.object({
  kind: z.string().trim().min(3).max(120),
  why: z.string().trim().min(20).max(360),
});

export const seminarLessonSchema = z.object({
  title: z.string().trim().min(5).max(140),
  summary: z.string().trim().min(80).max(700),
  key_terms: z.array(keyTermSchema).min(3).max(5),
  background: z.array(backgroundSchema).min(2).max(3),
  mechanisms: z.array(mechanismSchema).length(2),
  crux: z.object({
    heading: z.string().trim().min(3).max(110),
    explanation: z.string().trim().min(60).max(900),
    test: z.string().trim().min(40).max(520),
  }),
  misconceptions: z.array(misconceptionSchema).min(2).max(4),
  worked_example: z.object({
    heading: z.string().trim().min(3).max(120),
    scenario: z.string().trim().min(40).max(800),
    walkthrough: z.string().trim().min(80).max(1300),
    lesson: z.string().trim().min(30).max(500),
  }),
  check: z.array(checkSchema).min(2).max(4),
  next_sources: z.array(nextSourceSchema).min(2).max(4),
});

export type SeminarLesson = z.infer<typeof seminarLessonSchema>;

const SYSTEM = `You are the Seminar's tutor at Threadwise. The reader has finished a two-theory seminar and wants a deeper lesson so they can actually understand the subject, not just admire the argument.

Teach, do not perform. The lesson must build understanding in this order:
1. Define the few terms without which the debate is noise.
2. Give the minimum background needed to see why the question exists.
3. Walk through both mechanisms in plain language, then say what each explains better and where each is weakest.
4. Teach the crux as a test the reader could run on new evidence.
5. Name the mistakes a smart newcomer would make.
6. Work one concrete example end to end.
7. Give a short self-check with answers.
8. Suggest source types to look for next.

RULES
- Stay inside the seminar's question. Do not drift into a different lecture.
- Do not invent facts, quotations, datasets, periods or source titles. If something is uncertain or contested, say so.
- Suggest source kinds (for example "IAEA Board reports", "budget documents", "sanctions data"), never fabricated citations or URLs.
- Do not announce a moral verdict. Keep empirical and normative claims separate.
- Explain jargon on first use. Prefer short sentences and concrete distinctions.
- The reader should be able to explain the disagreement to someone else after this lesson.
- Write in the same restrained, serious voice as the seminar. No hype, no bullet-point listicle.`;

export async function openSeminarLesson(
  text: string,
  context: string,
  seminar: Seminar,
): Promise<SeminarLesson> {
  const { object } = await generateObject({
    model: getModel("deepseek"),
    system: SYSTEM,
    schema: seminarLessonSchema,
    prompt: `THE READER'S ORIGINAL QUOTE OR QUESTION:
${text.slice(0, 3000)}

${context.trim() ? `CONTEXT PROVIDED BY THE READER:\n${context.slice(0, 1000)}\n\n` : ""}
THE COMPLETED SEMINAR:
${JSON.stringify(seminar)}

Write the deeper lesson. It should teach the terms, background, mechanisms, crux, common errors, one worked example, a short self-check and source types to look for. Do not simply restate the seminar.`,
    temperature: 0.35,
    maxOutputTokens: 4200,
    maxRetries: 1,
  });

  const mechanisms = [...object.mechanisms].sort((a, b) => a.theory.localeCompare(b.theory)) as SeminarLesson["mechanisms"];
  return { ...object, mechanisms };
}
