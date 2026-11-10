import { serverEnv } from "./env.server";
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

const sectionSchema = z.object({
  title: z.string().trim().max(80).default(""),
  body: z.string().trim().max(2200).default(""),
});

export const analystSchema = z.object({
  mode: z
    .enum(["report", "document", "institution", "signal", "discourse", "legal", "comparison"])
    .default("report"),
  layers: z.array(z.string().trim().max(40)).max(6).default([]),
  sections: z.array(sectionSchema).max(14).default([]),
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
    .max(12)
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
    .max(6)
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
    .max(12)
    .default([]),
  falsifier: z.string().trim().max(800).default(""),
  questions: z.array(z.string().trim().max(200)).max(5).default([]),
  confidence: z.enum(["documented", "inferred", "speculative"]).default("inferred"),
});

export type AnalystReport = z.infer<typeof analystSchema> & {
  sources: { title: string; url: string }[];
  basis?: string;
  subject?: string;
};

/** What kind of artefact this is decides which questions the read asks. */
const MODES = {
  report: {
    label: "a report",
    sections: "the event · the disagreement · the spin · the reality · the blind spot · what to watch",
  },
  document: {
    label: "a document quoted second-hand",
    sections: "provenance · what it actually says · who wrote it and for whom · what it leaves out · what its word is worth",
  },
  institution: {
    label: "an institution acting",
    sections: "what it did · who pays it · who decides · its track record · what its word is worth here",
  },
  signal: {
    label: "a signal",
    sections: "what it says · who it is aimed at · what it reveals unintentionally · whether it holds up",
  },
  legal: {
    label: "a ruling",
    sections:
      "what was decided · what it actually binds · the precedent chain it joins · whether it can be enforced · who it costs and who it protects",
  },
  comparison: {
    label: "two accounts",
    sections:
      "what each account says · where they actually diverge · why they diverge · which is stronger and why · who benefits from each version",
  },
  discourse: {
    label: "a remark about people",
    sections:
      "the claim · who is speaking and from where · the tradition it draws on · what it explains and what it explains away · the strongest counter-argument · how you would test it · what the framing does politically",
  },
} as const;

/** How much room each kind of read genuinely needs. */
const DEPTH: Record<keyof typeof MODES, { short: [number, number]; long: [number, number] }> = {
  legal: { short: [900, 1200], long: [1400, 1900] },
  institution: { short: [850, 1150], long: [1300, 1800] },
  document: { short: [800, 1100], long: [1200, 1700] },
  report: { short: [700, 950], long: [1100, 1500] },
  comparison: { short: [650, 900], long: [950, 1300] },
  signal: { short: [450, 650], long: [650, 900] },
  discourse: { short: [550, 750], long: [750, 1050] },
};

const LAYERS: Record<string, string> = {
  institution: `INSTITUTION LAYER — the named body is itself evidence. Cover, as its own section:
- WHO PAYS: its budget and the largest contributors, with the actual figures and the year they refer to, drawn ONLY from the retrieved material. If you cannot find a figure, write "no current figure retrieved" — never estimate.
- WHO DECIDES: how its decisions are made, who appoints its head, whether members can block access.
- TRACK RECORD: two or three comparable past findings, dated, and how they aged.
- WHAT ITS WORD IS WORTH HERE: whether this body can even pronounce on the question the story needs it to pronounce on.`,
  state: `STATE LAYER — the state actor behaves according to a pattern. Cover: what this state usually does in this position (dated examples), how this instance fits or breaks the pattern, and what it gains either way.`,
  theory: `THEORY LAYER — this is a claim about human behaviour, so bring the intellectual traditions that actually address it. Cover:
- name the traditions the sentence is drawing on, if any: colonial psychology and its critics, development discourse, mimetic rivalry, status competition, nationalism as emulation.
- for each, say in one sentence what it would say here, and whether the sentence is using it consciously or just echoing it.
- distinguish what is established from what is the analyst's inference. Write "echoes" and "reads like", never "this is [thinker]'s theory".
- name thinkers only where you are certain of the attribution and the period. No invented quotations, no invented page numbers. If unsure, describe the tradition without the name.
- the psychology must be treated as a hypothesis about a group, not a diagnosis: say what evidence would distinguish feeling inferior from responding to incentives.

OWNERSHIP LAYER — follow the chain of ownership and what it is for: which entity holds the asset, what sits above it, why the structure exists (sanctions, tax, opacity), and what the chain means for accountability.`,
};

export async function classify(move: string): Promise<{ mode: keyof typeof MODES; layers: string[]; subject: string }> {
  try {
    const { text } = await generateText({
      model: getModel("deepseek"),
      prompt: `Classify what the reader pasted. Reply with JSON only:
{"mode":"report|document|institution|signal|discourse|legal|comparison","layers":["institution"|"state"|"ownership"],"subject":"2-6 words naming the wider situation"}

- document: the evidence is a PAPER described second-hand — "a report seen by", "according to a draft", "a filing shows", "an internal memo". The question is what the document is worth.
- institution: a BODY is the actor — a court rules, a regulator blocks, an agency raises concerns, a central bank moves. The question is what the body can actually do.
- signal: a short post or quote by a PERSON, aimed at an audience. The question is what it reveals.
- legal: a COURT, TRIBUNAL or REGULATOR has ruled — a judgment, an injunction, a fine, a stay. The question is what it binds and whether it can be enforced.
- comparison: TWO OR MORE ACCOUNTS of the same event are supplied. The question is why they differ, not what happened.
- discourse: an OPINION or general observation about people, culture or behaviour — "maybe it is an inferiority complex", "these people always…". No event, no named authority. The question is what the claim does and whether it is true of anyone.
- report: none of the above — journalism narrating an event.

When two fit, choose by what the reader needs to distrust: a paper's provenance (document), a body's authority (institution), a person's motive (signal), or an account's framing (report).
- layers: add "institution" if a named body's neutrality or funding matters here; "state" if a government is acting; "ownership" if a corporate chain matters.

INPUT: ${move.slice(0, 1500)}`,
      temperature: 0,
      maxOutputTokens: 120,
      maxRetries: 0,
    });
    const parsed = z
      .object({
        mode: z.enum(["report", "document", "institution", "signal", "discourse", "legal", "comparison"]).catch("report"),
        layers: z.array(z.string()).catch([]),
        subject: z.string().trim().catch(""),
      })
      .safeParse(extractJson<unknown>(text));
    if (!parsed.success) return { mode: "report", layers: [], subject: "" };
    return {
      mode: parsed.data.mode,
      layers: (() => {
      const chosen = [...parsed.data.layers];
      if (parsed.data.mode === "discourse" && !chosen.includes("theory")) chosen.unshift("theory");
      if (parsed.data.mode === "institution" && !chosen.includes("institution")) chosen.unshift("institution");
      return chosen.filter((layer) => layer in LAYERS).slice(0, 2);
    })(),
      subject: parsed.data.subject.slice(0, 60),
    };
  } catch {
    return { mode: "report", layers: [], subject: "" };
  }
}

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

export function analystPrompt(
  input: string,
  context: string,
  mode: keyof typeof MODES = "report",
  layers: string[] = [],
) {
  const shape = MODES[mode] ?? MODES.report;
  const depth = DEPTH[mode] ?? DEPTH.report;
  const words = input.length < 400 ? depth.short : depth.long;
  const layerRules = layers.map((layer) => LAYERS[layer]).filter(Boolean).join("\n\n");
  return `THE MOVE (as supplied by the reader):
"""
${input.slice(0, 4000)}
"""

TODAY IS ${new Date().toISOString().slice(0, 10)}. Recent reporting below is newer than anything you remember from training; where they conflict, the reporting wins, and where it names a current officeholder you must use that name.

SITUATION reporting describes the wider events the move sits inside; it is not optional colour. If it contradicts what the move implies — a war the move never mentions, a crisis, an election — say so in the read, because the reader needs the world before the detail.

RETRIEVED MATERIAL (real sources; cite them where you rely on them):
${context || "(nothing retrieved — say so in the confidence field and stay strictly within what the move itself states)"}

THIS IS READ AS: ${shape.label}.
Its sections are: ${shape.sections}.
Put those sections in "sections" as { "title", "body" } pairs, in that order, and set "mode" to "${mode}" and "layers" to ${JSON.stringify(layers)}.

${layerRules}

FIGURES RULE:
- Every number must come from the retrieved material and carry its year and source inline: "€344 million in 2014 (assessed to member states)".
- Use the MOST RECENT figure available, even if it is years old. Stale and dated beats absent: "the most recent figure the record carries is X, from YYYY — no newer figure was retrieved".
- Never estimate, never invent a figure, never recall one from training.
- If no figure exists anywhere in the material, do not stop there: write that section analytically instead — what the funding structure is, how it is decided, and what that structure implies for the finding. A refusal is a last resort and may appear in ONE section only; the rest must reason from what is known, saying plainly what is not.

Fields:
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
  "mode": "report" | "document" | "institution" | "signal" | "discourse" | "legal" | "comparison",
  "layers": [string],
  "sections": [{ "title": string, "body": string }],
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

/** The full article, not the summary: funding and governance live in the body. */
async function wikiBody(term: string): Promise<string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(term)}`,
      { headers: { "User-Agent": "ThreadwiseAnalyst/1.0 (+https://threadwise.app)" }, signal: AbortSignal.timeout(9000) },
    );
    if (!response.ok) return "";
    const data = (await response.json()) as { query?: { pages?: Record<string, { extract?: string }> } };
    const pages = data.query?.pages ?? {};
    const first = Object.values(pages)[0];
    return first?.extract?.slice(0, 40_000) ?? "";
  } catch {
    return "";
  }
}

const MONEY = /(budget|contribution|contributor|donor|funding|funded|million|billion|€|\$|percent|share)/i;

/** Sentences that actually carry figures about money. */
function moneySentences(text: string, limit = 5): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((line) => /\d/.test(line) && MONEY.test(line))
    .slice(0, limit);
}

/** Names and institutions worth looking up: capitalised runs, minus the obvious noise. */
const GENERIC_WORDS = new Set([
  "court","high","supreme","finance","act","bill","law","government","minister","president",
  "parliament","state","council","bank","party","election","police","judge","ruling","report",
  "agency","committee","department","union","national","federal","international","breaking",
  "news","update","statement","official","spokesman","spokesperson","analysis","opinion",
]);

/** The words that make this move searchable: names, places, and years. */
export function distinctiveTerms(input: string): string[] {
  const named = (input.match(/\b[A-Z][a-zA-Z]{4,}\b/g) ?? [])
    .map((word) => word.toLowerCase())
    .filter((word) => !GENERIC_WORDS.has(word));
  const phrases = (input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}(?:\s+\d{4})?)\b/g) ?? []).map((phrase) =>
    phrase.toLowerCase(),
  );
  const years = (input.match(/\b(19|20)\d{2}\b/g) ?? []).map(String);
  return [...new Set([...named, ...phrases, ...years])].slice(0, 6);
}

/** A hit is on topic only if its headline names something the move names. */
export function mentionsTerm(title: string, terms: string[]): boolean {
  if (!terms.length) return true;
  const haystack = title.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export function candidateEntities(input: string): string[] {
  const stop = new Set(["The", "A", "An", "Breaking", "New", "This", "That", "It", "He", "She", "They", "We", "I"]);
  const runs = (input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? []).filter(
    (run) => run.split(" ").length <= 6,
  );
  const singles = (input.match(/\b[A-Z][a-z]{4,}\b/g) ?? []).filter((word) => !stop.has(word));

  // "Stephen Miller" makes "Stephen" and "Miller" redundant lookups.
  // A five-word name consumes the words a shorter one would need, so treat every
  // word of every run as covered before ranking.
  const covered = new Set(runs.flatMap((run) => run.split(" ")));
  const keepSingles = singles.filter((word) => !covered.has(word));

  // Longest names first: "International Atomic Energy Agency" beats "International".
  const trimmed = runs.map((run) => run.replace(/^(The|A|An)\s+/, ""));
  return [...new Set([...trimmed, ...keepSingles])]
    .sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length)
    .slice(0, 5);
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
  const terms = distinctiveTerms(input);

  // Search the distinctive words, newest first, then keep only what is on topic:
  // "finance" alone once matched American campaign-finance coverage to a Kenyan ruling.
  const queries = [
    terms.slice(0, 2).join(" "),
    [entities[0], terms[0]].filter(Boolean).join(" "),
  ].filter((query) => query.trim().length > 2);

  const [rawHits, articles] = await Promise.all([
    Promise.all(queries.map((query) => news(query))).then((batches) => batches.flat()),
    Promise.all(entities.slice(0, 3).map((entity) => wiki(entity))),
  ]);
  const hits = rawHits.filter((hit) => mentionsTerm(hit.title, terms));
  const background = articles.filter((hit): hit is WikiHit => hit !== null);

  const reporting = hits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");

  const lead = entities[0] ? await wikiBody(entities[0]) : "";
  const money = lead ? moneySentences(lead, 6) : [];

  const context = [
    money.length ? `FIGURES AND GOVERNANCE (from the reference entry on ${entities[0]}):\n${money.join(" ").slice(0, 1400)}` : "",
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

/** How many hits fall inside the window. Undated hits never count as recent. */
function recentCount(hits: { date: string }[], days: number): number {
  const horizon = Date.now() - days * 24 * 60 * 60 * 1000;
  return hits.filter((hit) => {
    const at = hit.date ? Date.parse(hit.date.replace(" ", "T") + "Z") : Number.NaN;
    return !Number.isNaN(at) && at > horizon;
  }).length;
}

/** Fresh reporting wins decisively; a pile of old reports is not a substitute. */
function freshness(hits: { date: string }[]): number {
  return recentCount(hits, 14) * 10 + recentCount(hits, 90);
}

export async function analyseMove(input: string): Promise<AnalystReport> {
  // Classify and retrieve at the same time: they do not depend on each other.
  const [decision, base, candidates] = await Promise.all([
    classify(input),
    retrieveContext(input),
    nameSituation(input),
  ]);
  const { context, sources } = base;

  // Two candidate readings of the situation are searched; fresher reporting wins.
  const searched = await Promise.all(candidates.map(async (candidate) => ({ candidate, hits: await news(candidate) })));
  const best = searched
    .map((entry) => ({ ...entry, score: freshness(entry.hits) }))
    .sort((a, b) => b.score - a.score)[0];
  const situation = best?.score ? best.candidate : "";

  // Freshness alone let "campaign finance" attach American coverage to a Kenyan
  // ruling. A hit must also name something the move names.
  const anchors = distinctiveTerms(input);
  const onTopic = (title: string) => mentionsTerm(title, anchors);
  const situationHits = best?.score ? best.hits.filter((hit) => onTopic(hit.title)) : [];

  // Layer evidence: money and mandate are searched, never remembered.
  const institutionName = candidateEntities(input)[0] ?? "";
  const layerQueries =
    decision.layers.includes("institution")
      ? [
          "annual report programme and budget",
          "largest contributors funding share",
          "board of governors composition",
        ]
      : decision.layers.includes("state")
        ? ["foreign policy strategy record"]
        : decision.layers.includes("ownership")
          ? ["ownership subsidiary parent company"]
          : decision.layers.includes("theory")
            ? ["development discourse", "postcolonial theory inferiority"]
            : [];
  const layerHits = institutionName
    ? (await Promise.all(layerQueries.map((query) => news(`${institutionName} ${query}`)))).flat()
    : [];
  void layerHits.length;
  const layerList = layerHits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");

  // Figures live inside documents, never in headlines: read the two newest.
  const excerpts: string[] = [];
  // Encyclopedia bodies carry the funding tables that news headlines omit.
  if ((decision.layers.includes("institution") || decision.layers.includes("ownership")) && institutionName) {
    const body = await wikiBody(institutionName);
    const money = moneySentences(body, 5);
    if (process.env["ANALYST_DEBUG"]) console.log("[analyst] ref", institutionName, body.length, money.length);
    if (money.length) excerpts.push(`FROM THE REFERENCE ENTRY ON ${institutionName}: ${money.join(" ").slice(0, 1200)}`);
  }

  if (decision.layers.includes("institution") || decision.layers.includes("ownership")) {
    const { fetchArticleText } = await import("@/lib/threadwise/news-agent");
    const picks = layerHits.slice(0, 2);
    const texts = await Promise.all(
      picks.map(async (hit) => {
        try {
          return { hit, text: await fetchArticleText(hit.url) };
        } catch {
          return null;
        }
      }),
    );
    for (const entry of texts) {
      if (!entry?.text) continue;
      const numbers = entry.text
        .split(/(?<=[.!?])\s+/)
        .filter((line) => /\d/.test(line) && /(budget|contribution|donor|fund|million|billion|%|share|euro|dollar)/i.test(line))
        .slice(0, 4)
        .join(" ");
      if (numbers) excerpts.push(`FROM ${entry.hit.outlet} (${entry.hit.date}): ${numbers.slice(0, 900)}`);
    }
  }

  const layerContext = [layerList, ...excerpts].filter(Boolean).join("\n\n");

  const situationContext = situationHits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");
  const situationSources = situationHits.slice(0, 3).map((hit) => ({
    title: `Situation · ${hit.outlet} · ${hit.date}`,
    url: hit.url,
  }));
  const layerSources = layerHits.slice(0, 3).map((hit) => ({
    title: `Layer · ${hit.outlet} · ${hit.date}`,
    url: hit.url,
  }));

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: analystPrompt(
      input,
      [
        situationContext ? `SITUATION — ${situation}, as reported:\n${situationContext}` : "",
        layerContext ? `ON THE ACTORS — money, mandate and ownership, as reported:\n${layerContext}` : "",
        context,
      ]
        .filter(Boolean)
        .join("\n\n"),
      decision.mode,
      decision.layers,
    ),
    temperature: 0.3,
    maxOutputTokens: 7000,
    maxRetries: 1,
  });

  const parsed = analystSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    console.error("[analyst] unusable output:", text.slice(0, 600));
    throw new Error(`The analyst returned an unusable read: ${parsed.error.issues[0]?.message ?? "unknown shape"}`);
  }

  // The confidence badge is derived from what was actually retrieved, not from
  // the model's own opinion of its work.
  const freshSituation = recentCount(situationHits, 28);
  const confidence: AnalystReport["confidence"] =
    decision.mode === "discourse"
      ? "inferred"
      : freshSituation >= 2
        ? "documented"
        : situationHits.length >= 2 || sources.length > 2
          ? "inferred"
          : "speculative";
  const basis =
    decision.mode === "discourse"
      ? "a statement about people, not an event — judged on argument, not reporting"
      : confidence === "documented"
      ? `${freshSituation} dated reports from the last four weeks`
      : confidence === "inferred"
        ? situationHits.length >= 2
          ? freshSituation >= 1
            ? `the situation is reported, but only ${freshSituation} of them in the last four weeks`
            : "the situation is reported, but nothing from the last four weeks"
          : "reporting on the move, but no picture of the situation"
        : "the move itself — no independent reporting found";

  return {
    ...parsed.data,
    subject: decision.subject || situation,
    mode: parsed.data.mode ?? decision.mode,
    layers: parsed.data.layers?.length ? parsed.data.layers : decision.layers,
    confidence,
    basis,
    sources: [...sources, ...situationSources, ...layerSources],
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
  const url = serverEnv("SUPABASE_URL");
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

    const { error } = await supabase.from("analyst_reads").insert({
      token,
      input,
      report,
      user_id: userId,
      subject: (report as AnalystReport).subject ?? null,
    });
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

export async function loadRead(token: string): Promise<{ input: string; report: AnalystReport; at: string | null } | null> {
  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key || !/^[a-z0-9]{6,20}$/.test(token)) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("analyst_reads")
    .select("input, report, created_at")
    .eq("token", token)
    .maybeSingle();
  return data
    ? { input: data.input as string, report: data.report as AnalystReport, at: (data.created_at as string) ?? null }
    : null;
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
  const url = serverEnv("SUPABASE_URL");
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
  const url = serverEnv("SUPABASE_URL");
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


/**
 * Publishing is an owner action. A read with an owner can only be published by
 * that reader; an unowned read may be claimed by the signed-in reader who
 * publishes it. No session, no publishing.
 */
export async function publishRead(
  token: string,
  publish: boolean,
  jwt: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return { ok: false, error: "Publishing is not configured on the server." };

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: userData } = await supabase.auth.getUser(jwt);
  const userId = userData?.user?.id;
  if (!userId) return { ok: false, error: "Sign in to publish a read." };

  const { data: row } = await supabase
    .from("analyst_reads")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();

  if (!row) return { ok: false, error: "That read does not exist." };
  if (row.user_id && row.user_id !== userId) {
    return { ok: false, error: "This read belongs to someone else." };
  }

  const { error } = await supabase
    .from("analyst_reads")
    .update({ is_public: publish, published_by: userId, ...(row.user_id ? {} : { user_id: userId }) })
    .eq("token", token);

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function publicReads(limit = 12): Promise<{ token: string; input: string; at: string; falsifier: string }[]> {
  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return [];
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("analyst_reads")
    .select("token, input, report, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const report = row.report as AnalystReport;
    return {
      token: row.token as string,
      input: (row.input as string).slice(0, 160),
      at: row.created_at as string,
      falsifier: (report?.falsifier ?? "").slice(0, 200),
    };
  });
}


export const redTeamSchema = z.object({
  attack: z.string().trim().max(4000).default(""),
  strongest: z.string().trim().max(1200).default(""),
  concession: z.string().trim().max(1200).default(""),
  settle: z.string().trim().max(800).default(""),
});

export type RedTeam = z.infer<typeof redTeamSchema>;

/**
 * The reader states a position; the analyst attacks it using the read's own
 * evidence — and must say where the reader is right, or it is not a fair fight.
 */
export async function redTeam(
  report: AnalystReport,
  position: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<RedTeam> {
  const transcript = history
    .slice(-6)
    .map((turn) => `${turn.role === "user" ? "READER" : "ANALYST"}: ${turn.content}`)
    .join("\n\n");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: `THE READ UNDER DISCUSSION:
${JSON.stringify(report).slice(0, 7000)}

${transcript ? `THE ARGUMENT SO FAR:\n${transcript}\n\n` : ""}
THE READER'S POSITION: ${position.slice(0, 1200)}

Your job is to stress-test that position, hard but fairly. Return JSON only:
{
  "attack": string,      // 3-5 paragraphs. Attack the weakest joints of the position, using dated facts and mechanisms. Not tone, not opinion — structure. Say what would have to be true for them to be right, and why it probably is not.
  "strongest": string,   // the single strongest point in their favour, stated at full strength, in one paragraph
  "concession": string,  // where the reader is right and your read was weak — be specific, this is not politeness
  "settle": string       // the observation or date that would end the argument
}`,
    temperature: 0.35,
    maxOutputTokens: 2200,
    maxRetries: 1,
  });

  const parsed = redTeamSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) throw new Error("The red team could not be assembled.");
  return parsed.data;
}


export type FindingProposal = { question_id: string; stance: "for" | "against"; note: string };

/** Which of the reader's open questions this read actually bears on, and how. */
export async function proposeFindings(
  report: AnalystReport,
  questions: { id: string; question: string }[],
): Promise<FindingProposal[]> {
  if (!questions.length) return [];

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: `THE READ:
${JSON.stringify(report).slice(0, 6000)}

THE READER'S OPEN QUESTIONS:
${questions.map((question) => `- ${question.id}: ${question.question}`).join("\n")}

For each question this read genuinely bears on, return one entry. Be strict: most reads bear on none.
JSON only: {"findings":[{"question_id":string,"stance":"for"|"against","note":string}]}

- stance: "for" if the read is evidence toward a yes, "against" if toward a no.
- note: ONE sentence, under 30 words, carrying the date and the specific fact. "The IAEA objection (11 Nov 2026) delays the licence, not the ownership." No hedging, no restating the question.
- If nothing bears on a question, omit it entirely. Never invent relevance.`,
    temperature: 0.2,
    maxOutputTokens: 700,
    maxRetries: 0,
  });

  const parsed = z
    .object({
      findings: z
        .array(
          z.object({
            question_id: z.string(),
            stance: z.enum(["for", "against"]).catch("for"),
            note: z.string().trim().max(300),
          }),
        )
        .catch([]),
    })
    .safeParse(extractJson<unknown>(text));

  if (!parsed.success) return [];
  const known = new Set(questions.map((question) => question.id));
  return parsed.data.findings.filter((finding) => known.has(finding.question_id)).slice(0, 3);
}


/** Every case, newest activity first. */
export async function listCases(limit = 40): Promise<{ subject: string; reads: number; latest: string }[]> {
  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return [];
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("analyst_reads")
    .select("subject, created_at")
    .eq("is_public", true)
    .not("subject", "is", null)
    .order("created_at", { ascending: false })
    .limit(400);

  const cases = new Map<string, { subject: string; reads: number; latest: string }>();
  for (const row of data ?? []) {
    const subject = (row.subject as string | null)?.trim();
    if (!subject) continue;
    const existing = cases.get(subject.toLowerCase());
    if (existing) existing.reads += 1;
    else cases.set(subject.toLowerCase(), { subject, reads: 1, latest: row.created_at as string });
  }
  return [...cases.values()].sort((a, b) => b.reads - a.reads).slice(0, limit);
}

/** The reads that make up one case. */
export async function caseReads(subject: string, limit = 20): Promise<
  { token: string; input: string; at: string; mode: string | null; falsifier: string }[]
> {
  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return [];
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("analyst_reads")
    .select("token, input, report, created_at")
    .eq("is_public", true)
    .eq("subject", subject)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const report = row.report as AnalystReport;
    return {
      token: row.token as string,
      input: (row.input as string).slice(0, 180),
      at: row.created_at as string,
      mode: report?.mode ?? null,
      falsifier: (report?.falsifier ?? "").slice(0, 220),
    };
  });
}
