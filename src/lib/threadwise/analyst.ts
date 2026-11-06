/**
 * The Analyst — server only.
 *
 * Takes one move (a post, a quote, a headline, a paragraph), retrieves real
 * material about the people and institutions in it, and returns a structured
 * political read. Never import this from a component: it reads server env.
 */
import { XMLParser } from "fast-xml-parser";
import { generateText } from "ai";
import { z } from "zod";
import { extractJson, getModel } from "./ai/ai-providers.server";

export const analystSchema = z.object({
  move: z.string().trim().max(4000).default(""),
  why_now: z.string().trim().max(4000).default(""),
  stakes: z
    .array(
      z.object({
        actor: z.string().trim().max(200).default(""),
        gains: z.string().trim().max(900).default(""),
        loses: z.string().trim().max(900).default(""),
      }),
    )
    .max(6)
    .default([]),
  precedent: z
    .array(
      z.object({
        name: z.string().trim().max(200).default(""),
        when: z.string().trim().max(120).default(""),
        parallel: z.string().trim().max(1200).default(""),
        breaks: z.string().trim().max(1200).default(""),
      }),
    )
    .max(3)
    .default([]),
  second_order: z.string().trim().max(4000).default(""),
  counter_reading: z.string().trim().max(3000).default(""),
  watch: z
    .array(
      z.object({
        signal: z.string().trim().max(400).default(""),
        when: z.string().trim().max(120).default(""),
      }),
    )
    .max(5)
    .default([]),
  falsifier: z.string().trim().max(800).default(""),
  confidence: z.enum(["documented", "inferred", "speculative"]).default("inferred"),
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
- Write about power the way a good newspaper explainer does: concrete, calm, specific.
- Never refer to "the reader", "the prompt", "the supplied text" or "the retrieved material". Address the subject directly: "Trump named Miller…", not "The reader states that…". If the material does not confirm something, say what is unknown in plain words.`;

export function analystPrompt(input: string, context: string) {
  return `THE MOVE (as supplied by the reader):
"""
${input.slice(0, 4000)}
"""

TODAY IS ${new Date().toISOString().slice(0, 10)}. Recent reporting below is newer than anything you remember from training; where they conflict, the reporting wins, and where it names a current officeholder you must use that name.

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

Return ONLY a JSON object with EXACTLY these keys, all present:
{
  "move": string,
  "why_now": string,
  "stakes": [{ "actor": string, "gains": string, "loses": string }],
  "precedent": [{ "name": string, "when": string, "parallel": string, "breaks": string }],
  "second_order": string,
  "counter_reading": string,
  "watch": [{ "signal": string, "when": string }],
  "falsifier": string,
  "confidence": "documented" | "inferred" | "speculative"
}
No markdown, no commentary, no code fences.`;
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
  const runs = (input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? []).filter(
    (run) => run.split(" ").length <= 4,
  );
  const singles = (input.match(/\b[A-Z][a-z]{4,}\b/g) ?? []).filter((word) => !stop.has(word));

  // "Stephen Miller" makes "Stephen" and "Miller" redundant lookups.
  const covered = new Set(runs.flatMap((run) => run.split(" ")));
  const keepSingles = singles.filter((word) => !covered.has(word));

  return [...new Set([...runs, ...keepSingles])].slice(0, 5);
}

type NewsHit = { title: string; date: string; outlet: string; url: string };

const newsParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const toArray = <T>(value: T | T[] | null | undefined): T[] =>
  value === null || value === undefined ? [] : Array.isArray(value) ? value : [value];
const textOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
};

/** Real reporting from the last hours, via Google News search — free, no key. */
async function news(query: string): Promise<NewsHit[]> {
  if (!query.trim()) return [];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ThreadwiseAnalyst/1.0 (+https://threadwise.app)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    const document = newsParser.parse(await response.text()) as Record<string, unknown>;
    const channel = ((document["rss"] as Record<string, unknown>)?.["channel"] ?? {}) as Record<string, unknown>;
    return toArray(channel["item"] as Record<string, unknown>[])
      .slice(0, 8)
      .map((item) => {
        const published = textOf(item["pubDate"]);
        const when = published ? new Date(published) : null;
        return {
          title: textOf(item["title"]),
          date: when && !Number.isNaN(when.valueOf()) ? when.toISOString().slice(0, 16).replace("T", " ") : "",
          outlet: textOf(item["source"]) || "News",
          url: textOf(item["link"]),
        };
      })
      .filter((hit) => hit.title && hit.url);
  } catch {
    return [];
  }
}

export async function retrieveContext(input: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
  const entities = candidateEntities(input);
  const query = [entities[0], entities[1], "news"].filter(Boolean).join(" ");

  const [hits, articles] = await Promise.all([news(query), Promise.all(entities.slice(0, 3).map((entity) => wiki(entity)))]);
  const background = articles.filter((hit): hit is WikiHit => hit !== null);

  const reporting = hits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");

  const context = [
    reporting ? `LATEST REPORTING (newest first, dates are UTC):\n${reporting}` : "",
    background.length
      ? `BACKGROUND (encyclopedia; may lag behind today's news):\n${background
          .slice(0, 3)
          .map((hit) => `[${hit.title}] ${hit.extract}`)
          .join("\n\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const sources = [
    ...hits.slice(0, 4).map((hit) => ({ title: `${hit.outlet} · ${hit.title.slice(0, 90)}`, url: hit.url })),
    ...background.map((hit) => ({ title: `Wikipedia · ${hit.title}`, url: hit.url })),
  ];

  return { context, sources };
}

export async function analyseMove(input: string): Promise<AnalystReport> {
  const { context, sources } = await retrieveContext(input);

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: analystPrompt(input, context),
    temperature: 0.3,
    maxOutputTokens: 3200,
    maxRetries: 1,
  });

  const parsed = analystSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    console.error("[analyst] unusable output:", text.slice(0, 600));
    throw new Error(`The analyst returned an unusable read: ${parsed.error.issues[0]?.message ?? "unknown shape"}`);
  }

  return { ...parsed.data, sources };
}
