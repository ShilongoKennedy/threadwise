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
  questions: z.array(z.string().trim().max(160)).max(3).default([]),
  confidence: z.enum(["documented", "inferred", "speculative"]).default("inferred"),
});

export type AnalystReport = z.infer<typeof analystSchema> & {
  sources: { title: string; url: string }[];
  basis?: string;
};

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
- Absence of reporting is not absence of events. Never write "there is no X" when you mean "I found no reporting on X". If the move implies a wider situation you cannot see, say exactly that.
- Write about power the way a good newspaper explainer does: concrete, calm, specific.
- Never refer to "the reader", "the prompt", "the supplied text" or "the retrieved material". Address the subject directly: "Trump named Miller…", not "The reader states that…". If the material does not confirm something, say what is unknown in plain words.`;

export function analystPrompt(input: string, context: string) {
  return `THE MOVE (as supplied by the reader):
"""
${input.slice(0, 4000)}
"""

TODAY IS ${new Date().toISOString().slice(0, 10)}. Recent reporting below is newer than anything you remember from training; where they conflict, the reporting wins, and where it names a current officeholder you must use that name.

SITUATION reporting describes the wider events the move sits inside; it is not optional colour. If it contradicts what the move implies — a war the move never mentions, a crisis, an election — say so in the read, because the reader needs the world before the detail.

RETRIEVED MATERIAL (real sources; cite them where you rely on them):
${context || "(nothing retrieved — say so in the confidence field and stay strictly within what the move itself states)"}

Write the read. Fields:
- move: what was actually announced or argued, by whom, with what authority, in 2-4 plain sentences. No adjectives.
- why_now: the logic of this timing. Do NOT restate what the "move" field already established; start from the purpose the decision serves. What problem does it solve for the actor this week? 3-5 sentences.
- stakes: 2-5 actors. For each: what they gain and what they lose, concretely.
- precedent: 1-3 real historical analogues. Name them, date them, state the parallel and exactly where it breaks. If you cannot date one, omit it.
- second_order: what this changes downstream — institutions, appointments, policy lanes, elections. 3-5 sentences.
- counter_reading: the strongest case that this is routine rather than a rupture. Argue it properly.
- watch: 2-4 dated or conditioned signals that will show which reading is right.
- falsifier: the one fact that would prove this whole read wrong.
- questions: three sharp questions this specific read invites, in the reader's voice, each under 16 words. Not generic ("what happens next") — they must depend on a claim you just made.
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
  "questions": [string],
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

  const SOCIAL = /facebook|twitter|x\.com|instagram|reddit|tiktok|youtube|threads|linkedin/i;
  const usable = hits.filter((hit) => !SOCIAL.test(hit.url) && !SOCIAL.test(hit.outlet));
  const seenOutlets = new Set<string>();
  const cited = usable
    .filter((hit) => {
      const key = hit.outlet.toLowerCase();
      if (seenOutlets.has(key)) return false;
      seenOutlets.add(key);
      return true;
    })
    .slice(0, 4);

  const sources = [
    ...cited.map((hit) => ({
      title: `${hit.outlet} · ${hit.date ? `${hit.date} · ` : ""}${hit.title.slice(0, 80)}`,
      url: hit.url,
    })),
    ...background.slice(0, 2).map((hit) => ({ title: `Background · ${hit.title}`, url: hit.url })),
  ];

  return { context, sources };
}

/**
 * The move is rarely the whole story: a reward offer in November 2026 sits
 * inside a war. Name that wider situation with one cheap call and search it,
 * so the read is written against the world rather than against one post.
 */
async function nameSituation(move: string): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: getModel("deepseek"),
      prompt: `Name the wider situation this belongs to. Give TWO candidates on separate lines, each 2-6 words, nothing else.

MOVE: ${move.slice(0, 1200)}

Examples: "US-Iran war 2026" · "UK budget crisis" · "Tesla Cybertruck discontinuation" · "Kenya election dispute"`,
      temperature: 0,
      maxOutputTokens: 40,
      maxRetries: 0,
    });
    return text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").replace(/["'.]/g, "").trim().slice(0, 60))
      .filter((line) => line.length > 3)
      .slice(0, 2);
  } catch {
    return [];
  }
}

/** Fresher reporting wins: recent hits count double. */
function freshness(hits: { date: string }[]): number {
  const horizon = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return hits.reduce((score, hit) => {
    const at = hit.date ? Date.parse(hit.date.replace(" ", "T") + "Z") : Number.NaN;
    return score + (Number.isNaN(at) ? 1 : at > horizon ? 2 : 1);
  }, 0);
}

export async function analyseMove(input: string): Promise<AnalystReport> {
  const { context, sources } = await retrieveContext(input);

  // Second pass: the events underneath the move. Two candidate readings of the
  // situation are searched, and whichever returns fresher reporting is used.
  const candidates = await nameSituation(input);
  const searched = await Promise.all(candidates.map(async (candidate) => ({ candidate, hits: await news(candidate) })));
  const best = searched
    .map((entry) => ({ ...entry, score: freshness(entry.hits) }))
    .sort((a, b) => b.score - a.score)[0];
  const situation = best?.score ? best.candidate : "";
  const situationHits = best?.score ? best.hits : [];
  const situationContext = situationHits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");
  const situationSources = situationHits.slice(0, 3).map((hit) => ({
    title: `Situation · ${hit.outlet} · ${hit.date}`,
    url: hit.url,
  }));

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: analystPrompt(
      input,
      [situationContext ? `SITUATION — ${situation}, as reported:\n${situationContext}` : "", context]
        .filter(Boolean)
        .join("\n\n"),
    ),
    temperature: 0.3,
    maxOutputTokens: 3200,
    maxRetries: 1,
  });

  const parsed = analystSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    console.error("[analyst] unusable output:", text.slice(0, 600));
    throw new Error(`The analyst returned an unusable read: ${parsed.error.issues[0]?.message ?? "unknown shape"}`);
  }

  // The confidence badge is derived from what was actually retrieved, not from
  // the model's own opinion of its work.
  const dated = situationHits.length + (sources.length - situationSources.length > 2 ? sources.length - situationSources.length : 0);
  const confidence: AnalystReport["confidence"] =
    situationHits.length >= 2 || dated >= 3 ? "documented" : sources.length > 2 ? "inferred" : "speculative";
  const basis =
    confidence === "documented"
      ? `${situationHits.length} dated reports on the situation`
      : confidence === "inferred"
        ? "reporting on the move, but no dated picture of the situation"
        : "the move itself — no independent reporting found";

  return {
    ...parsed.data,
    confidence,
    basis,
    sources: [...sources, ...situationSources],
  };
}


/** A model that can look at an image. Picks whichever provider has a key. */
function visionModel() {
  if (process.env["OPENAI_API_KEY"]) return getModel("openai", "gpt-4o-mini");
  if (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_GENERATIVE_AI_API_KEY"]) {
    return getModel("gemini", "gemini-3.8-flash");
  }
  if (process.env["ANTHROPIC_API_KEY"]) return getModel("anthropic", "claude-3-5-sonnet-20240620");
  throw new Error("No vision model is configured. Add GEMINI_API_KEY or OPENAI_API_KEY on the server.");
}

export type Transcription = { text: string; context: string };

/**
 * Reads a screenshot before it is analysed. The reader confirms the words, so a
 * misread name can never become the basis of a whole assessment.
 */
export async function transcribeMove(image: string): Promise<Transcription> {
  const { text } = await generateText({
    model: visionModel(),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Transcribe this screenshot exactly as written. Return ONLY JSON: {"text": string, "context": string}.
- text: the post, headline or paragraph, verbatim, keeping punctuation and quotation marks. If there is a caption and a body, join them with a new line. Do not summarise, correct or embellish.
- context: one sentence on what the image shows besides the words (platform, outlet, who is pictured, timestamps, view counts). Empty string if there is nothing.`,
          },
          { type: "image", image },
        ],
      },
    ],
    temperature: 0,
    maxOutputTokens: 900,
    maxRetries: 1,
  });

  const parsed = z
    .object({ text: z.string().trim().min(1), context: z.string().trim().default("") })
    .safeParse(extractJson<unknown>(text));
  if (!parsed.success) throw new Error("The screenshot could not be read. Try a clearer crop.");
  return parsed.data;
}


const QUESTION_NOISE = new Set([
  "what","when","where","which","who","whom","whose","why","how","does","did","was","were","is","are",
  "the","that","this","with","from","have","has","had","been","about","into","over","after","before",
  "reason","really","actually","mean","means","there","their","they","would","could","should","started",
]);

export async function askAnalyst(
  report: AnalystReport,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const transcript = history
    .slice(-6)
    .map((turn) => `${turn.role === "user" ? "READER" : "ANALYST"}: ${turn.content}`)
    .join("\n\n");

  // A follow-up is a new question about the world: look it up before answering.
  const entities = candidateEntities(question);
  const keywords = question
    .toLowerCase()
    .match(/[a-z][a-z'-]{3,}/g)
    ?.filter((word) => !QUESTION_NOISE.has(word))
    .slice(0, 4) ?? [];
  const queries = [entities.slice(0, 3).join(" "), keywords.join(" ")].filter((query) => query.trim().length > 2);
  const hits = (await Promise.all(queries.map((query) => news(query)))).flat();
  const fresh = hits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: `YOUR READ, already given to the reader:
${JSON.stringify(report).slice(0, 7000)}

${fresh ? `REPORTING RETRIEVED FOR THIS QUESTION (newer than your training; trust it over memory):\n${fresh}\n` : "NO REPORTING WAS RETRIEVED FOR THIS QUESTION.\n"}
${transcript ? `\nCONVERSATION SO FAR:\n${transcript}\n` : ""}
TODAY IS ${new Date().toISOString().slice(0, 10)}.

THE READER ASKS: ${question.slice(0, 800)}

Answer as the same analyst. Rules:
- 2 to 4 short paragraphs. No headings, no bullet lists, no repetition of your earlier sections.
- If the question shows you were wrong, say so in the first sentence and correct it.
- NEVER claim something did not happen because you have no reporting on it. Say "I have no reporting on X" and state what would settle it. Treat the absence of evidence as ignorance, not proof.
- If the retrieved reporting contradicts your earlier answer, the reporting wins.
- Name actors, dates and mechanisms. No filler.`,
    temperature: 0.3,
    maxOutputTokens: 900,
    maxRetries: 1,
  });

  return text.trim();
}

/** Saves a read and returns its token. Best-effort: a read still works unsaved. */
export async function saveRead(input: string, report: AnalystReport, jwt?: string): Promise<string | null> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const token = Array.from({ length: 10 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
    ).join("");
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    let userId: string | null = null;
    if (jwt) {
      const { data } = await supabase.auth.getUser(jwt);
      userId = data?.user?.id ?? null;
    }

    const { error } = await supabase.from("analyst_reads").insert({ token, input, report, user_id: userId });
    if (error) {
      console.warn("[analyst] could not save read:", error.message);
      return null;
    }
    return token;
  } catch (error) {
    console.warn("[analyst] could not save read:", error);
    return null;
  }
}

export async function loadRead(token: string): Promise<{ input: string; report: AnalystReport } | null> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key || !/^[a-z0-9]{6,20}$/.test(token)) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("analyst_reads").select("input, report").eq("token", token).maybeSingle();
  return data ? { input: data.input as string, report: data.report as AnalystReport } : null;
}


/** "Within 30 days" → a real date. Unparseable conditions get a 90-day horizon. */
export function dueDate(when: string): string {
  const iso = when.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const days = when.match(/(\d{1,3})\s*(day|week|month)/i);
  const base = new Date();
  let offset = 90;
  if (days) {
    const n = Number(days[1]);
    const unit = days[2]!.toLowerCase();
    offset = unit === "day" ? n : unit === "week" ? n * 7 : n * 30;
  }
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString().slice(0, 10);
}

/** Creates one dated watch per signal, for the signed-in reader. */
export async function watchSignals(
  token: string,
  jwt: string,
): Promise<{ created: number }> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) throw new Error("Watches are not configured on the server.");

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const userId = userData?.user?.id;
  if (userError || !userId) throw new Error("Sign in to keep these signals.");

  const read = await loadRead(token);
  if (!read) throw new Error("That read could not be found.");

  const rows = read.report.watch.map((item) => ({
    user_id: userId,
    claim: item.signal.slice(0, 480),
    due_date: dueDate(item.when),
    source_url: read.report.sources[0]?.url ?? null,
  }));
  if (!rows.length) return { created: 0 };

  const { error } = await admin.from("claim_watches").insert(rows);
  if (error) throw new Error(error.message);
  return { created: rows.length };
}


/** The reader's own recent reads, newest first. */
export async function recentReads(jwt: string, limit = 8): Promise<{ token: string; input: string; at: string }[]> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return [];

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: user } = await supabase.auth.getUser(jwt);
  const userId = user?.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from("analyst_reads")
    .select("token, input, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    token: row.token as string,
    input: (row.input as string).slice(0, 140),
    at: row.created_at as string,
  }));
}
