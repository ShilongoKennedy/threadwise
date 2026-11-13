import { generateText } from "ai";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";
import type { Seminar } from "@/lib/threadwise/seminar";
import type { SeminarLesson } from "@/lib/threadwise/seminar-lesson";

const SYSTEM = `You are the Seminar's tutor at Threadwise, answering a follow-up question after the reader has finished a deeper lesson.

You have the original quote, the completed seminar, the deeper lesson and the recent conversation. Answer the reader's actual question. Teach, do not perform.

RULES
- Stay inside this seminar and lesson. If the question needs outside facts that are not in the material, say exactly what is missing rather than inventing it.
- Never invent citations, quotations, datasets or URLs. Suggest source types instead.
- Explain terms on first use. Prefer concrete distinctions and one good example over a list of abstractions.
- If the reader is confused, diagnose the confusion and rebuild the distinction more simply. Do not just repeat the lesson in different words.
- Keep the answer under roughly 280 words unless the reader explicitly asks for more depth.
- No moral verdict. Keep empirical and normative claims separate.
- Be willing to say "the material does not settle this".`;

export async function askSeminarTutor(
  text: string,
  context: string,
  seminar: Seminar,
  lesson: SeminarLesson,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const recent = history
    .slice(-6)
    .map((turn) => `${turn.role === "user" ? "READER" : "TUTOR"}: ${turn.content.slice(0, 1200)}`)
    .join("\n\n");

  const { text: answer } = await generateText({
    model: getModel("deepseek"),
    system: SYSTEM,
    prompt: `THE READER'S ORIGINAL QUOTE OR QUESTION:
${text.slice(0, 3000)}

${context.trim() ? `CONTEXT:\n${context.slice(0, 1000)}\n\n` : ""}THE COMPLETED SEMINAR:
${JSON.stringify(seminar)}

THE DEEPER LESSON:
${JSON.stringify(lesson)}

${recent ? `RECENT CONVERSATION:\n${recent}\n\n` : ""}READER'S FOLLOW-UP:
${question.slice(0, 600)}

Answer the follow-up directly, using this material.`,
    temperature: 0.4,
    maxOutputTokens: 1600,
    maxRetries: 1,
  });

  return answer.trim();
}
