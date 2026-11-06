/**
 * The Analyst — server only.
 *
 * Takes one move (a post, a quote, a headline, a paragraph), retrieves real
 * material about the people and institutions in it, and returns a structured
 * political read. Never import this from a component: it reads server env.
 */
import { generateText } from "ai";
import { z } from "zod";
import { extractJson, getModel } from "./ai/ai-providers.server";

export const analystSchema = z.object({
  move: z.string().trim().min(40).max(1400),
  why_now: z.string().trim().min(60).max(1200),
  stakes: z
    .array(z.object({ actor: z.string().trim().max(60), gains: z.string().trim().max(320), loses: z.string().trim().max(320) }))
    .min(2)
    .max(5),
  precedent: z
    .array(
      z.object({
        name: z.string().trim().max(90),
        when: z.string().trim().max(40),
        parallel: z.string().trim().max(360),
        breaks: z.string().trim().max(320),
      }),
    )
    .min(1)
    .max(3),
  second_order: z.string().trim().min(60).max(1400),
  counter_reading: z.string().trim().min(60).max(1000),
  watch: z.array(z.object({ signal: z.string().trim().max(240), when: z.string().trim().max(60) })).min(2).max(4),
  falsifier: z.string().trim().min(30).max(400),
  confidence: z.enum(["documented", "inferred", "speculative"]),
});

export type AnalystReport = z.infer<typeof analystSchema> & { sources: { title: string; url: string }[] };

const METHOD = `You are The Analyst at Threadwise: a political and geopolitical analyst briefing a smart reader who is new to the subject.

HOW YOU THINK
- Actors are strategic, not stupid. Assume the move has a purpose even when it looks chaotic.
- Ask what institutional POWER changed, not what was said.
- Separate formal authority from informal influence.
- Ignore stated motives. Work from incentives and constraints: legal, fiscal, coalition, electoral calendar, personal.
- Ask who is NOT in the room.
- Distinguish time horizons: this week, this term, this decade.

HOW YOU WRITE
- Plain sentences. A reader with no background must follow every line.
- Every claim carries a name, a date, an institution or a mechanism. "Consolidates loyalist control" is banned; say who is replaced, by whom, with what effect.
- No bullet-point generalities. No "complex web", "landscape", "underscores", "remains to be seen", "significant", "tapestry", "delve".
- Never invent a quote, a date or an event. If you are unsure whether a precedent exists, leave it out.
- Write about power the way a good newspaper explainer does: concrete, calm, specific.`;

export function analystPrompt(input: string, context: string) {
  return `THE MOVE (as supplied by the reader):
"""
${input.slice(0, 4000)}
"""

RETRIEVED MATERIAL (real sources; cite them where you rely on them):
${context || "(nothing retrieved — say so in the confidence field and stay strictly within what the move itself states)"}

Write the read. Fields:
- move: what was actually announced or argued, by whom, with what authority, in 2-4 plain sentences. No adjectives.
- why_now: the political logic of this timing. What problem does it solve for the actor this week? 3-5 sentences.
- stakes: 2-5 actors. For each: what they gain and what they lose, concretely.
- precedent: 1-3 real historical analogues. Name them, date them, state the parallel and exactly where it breaks. If you cannot date one, omit it.
- second_order: what this changes downstream — institutions, appointments, policy lanes, elections. 3-5 sentences.
- counter_reading: the strongest case that this is routine rather than a rupture. Argue it properly.
- watch: 2-4 dated or conditioned signals that will show which reading is right.
- falsifier: the one fact that would prove this whole read wrong.
- confidence: "documented" if the facts are confirmed in the retrieved material, "inferred" if they rest on the move itself, "speculative" if they depend on unnamed sources.

Return ONLY JSON matching that shape.`;
}

type WikiHit = { title: string; extract: string; url: string };

/** Real, dated background with no API key: Wikipedia's REST summary endpoint. */
async function wiki(term: string): Promise<WikiHit | null> {
  const slug = encodeURIComponent(term.trim().replace(/\s+/g, "_"));
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
      headers: { "User-Agent": "ThreadwiseAnalyst/1.0 (+https://threadwise.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    if (!data.extract) return null;
    return {
      title: data.title ?? term,
      extract: data.extract,
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`,
    };
  } catch {
    return null;
  }
}

/** Names and institutions worth looking up: capitalised runs, minus the obvious noise. */
export function candidateEntities(input: string): string[] {
  const stop = new Set(["The", "A", "An", "Breaking", "New", "This", "That", "It", "He", "She", "They", "We", "I"]);
  const runs = input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? [];
  const singles = (input.match(/\b[A-Z][a-z]{3,}\b/g) ?? []).filter((word) => !stop.has(word));
  const ranked = [...new Set([...runs, ...singles])].slice(0, 6);
  return ranked;
}

export async function retrieveContext(input: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
  const entities = candidateEntities(input);
  const hits = (await Promise.all(entities.map((entity) => wiki(entity)))).filter(
    (hit): hit is WikiHit => hit !== null,
  );

  const sources = hits.map((hit) => ({ title: hit.title, url: hit.url }));
  const context = hits
    .slice(0, 4)
    .map((hit) => `[${hit.title}] ${hit.extract} (${hit.url})`)
    .join("\n\n");

  return { context, sources };
}

export async function analyseMove(input: string): Promise<AnalystReport> {
  const { context, sources } = await retrieveContext(input);

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: analystPrompt(input, context),
    temperature: 0.3,
    maxRetries: 1,
  });

  const parsed = analystSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    throw new Error(`The analyst returned an unusable read: ${parsed.error.issues[0]?.message ?? "unknown shape"}`);
  }

  return { ...parsed.data, sources };
}
