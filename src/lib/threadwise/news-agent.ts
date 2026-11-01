/**
 * Autonomous News Agent — server only.
 *
 * Single-target deep dive: take the first usable story from the feeds, clean it
 * through Jina's reader, and let DeepSeek dissect it as an intelligence dossier.
 * Never import this from a component: it reads server env and calls paid APIs.
 */
import { XMLParser } from "fast-xml-parser";
import { generateText } from "ai";
import { z } from "zod";
import { extractJson, getModel } from "./ai/ai-providers.server";

export type FeedSource = { name: string; url: string };

/** Free, no-key world-news feeds. Order is priority: the first usable story wins. */
export const NEWS_FEEDS: FeedSource[] = [
  { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  {
    name: "Guardian World",
    url: "https://www.theguardian.com/world/rss",
  },
];

export type Story = { title: string; url: string; source: string };
export type StoryText = Story & { text: string };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
});

const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

/** RSS gives strings, Atom gives { "#text": … } — normalise both. */
function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["#text"] === "string") return record["#text"].trim();
  }
  return "";
}

/** `<link>` is a string in RSS and `{ "@_href": … }` in Atom. */
function linkOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const found = linkOf(candidate);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const href = record["@_href"] ?? record["@_url"];
    if (typeof href === "string" && href.trim()) return href.trim();
    return textOf(record["#text"]);
  }
  return "";
}

const normaliseUrl = (url: string) => url.replace(/[?#].*$/, "").replace(/\/$/, "");

/**
 * Reads every feed in parallel, then interleaves them one story at a time so a
 * dead feed degrades to the next publisher rather than an empty run. The default
 * limit of 1 makes this a single-target pick.
 */
export async function fetchTopStories(limit = 1): Promise<Story[]> {
  const perFeed = await Promise.all(
    NEWS_FEEDS.map(async (feed): Promise<Story[]> => {
      try {
        const response = await fetch(feed.url, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
            "User-Agent": "ThreadwiseNewsAgent/1.0 (+https://threadwise.app)",
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xml = await response.text();
        const document = parser.parse(xml) as Record<string, unknown>;
        const rss = document["rss"] as Record<string, unknown> | undefined;
        const channel = (rss?.["channel"] ?? document["feed"] ?? document) as Record<
          string,
          unknown
        >;
        const items = toArray(channel["item"] ?? channel["entry"]) as Record<string, unknown>[];

        return items
          .map((item) => ({
            title: textOf(item["title"]) || "Untitled",
            url: linkOf(item["link"]),
            source: feed.name,
          }))
          .filter((story) => /^https?:\/\//i.test(story.url))
          .slice(0, 4);
      } catch (error) {
        console.warn(`[news-agent] ${feed.name} unavailable:`, error);
        return [];
      }
    }),
  );

  const picked: Story[] = [];
  const seen = new Set<string>();
  for (let rank = 0; rank < 4 && picked.length < limit; rank += 1) {
    for (const stories of perFeed) {
      const story = stories[rank];
      if (!story) continue;
      const key = normaliseUrl(story.url);
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(story);
      if (picked.length === limit) break;
    }
  }
  return picked;
}

/** Cleans an article through Jina AI Reader, which returns readable Markdown. */
export async function fetchArticleText(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "text/plain", "X-Return-Format": "markdown" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Reader responded ${response.status} for ${url}`);

  const text = (await response.text()).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 400) throw new Error(`Reader returned too little text for ${url}`);
  return text.slice(0, 14_000);
}

export const THREAT_LEVELS = ["LOW", "MODERATE", "ELEVATED", "CRITICAL"] as const;
export type ThreatLevel = (typeof THREAT_LEVELS)[number];

/** Models drift to plain English ("High", "Severe"); map them onto the scale. */
const THREAT_ALIASES: Record<string, ThreatLevel> = {
  MINIMAL: "LOW",
  GUARDED: "MODERATE",
  MEDIUM: "MODERATE",
  HIGH: "ELEVATED",
  SEVERE: "CRITICAL",
  EXTREME: "CRITICAL",
};

const threatLevel = z.preprocess((value) => {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  if ((THREAT_LEVELS as readonly string[]).includes(raw)) return raw;
  return THREAT_ALIASES[raw] ?? "MODERATE";
}, z.enum(THREAT_LEVELS));

/** Bullets are lenient on count, strict on shape: a chatty model must not fail the run. */
const bullets = z.array(z.string().trim().min(4)).min(1).max(6);

const briefSchema = z.object({
  headline: z.string().trim().min(3).max(90),
  bluf: z.string().trim().min(300).max(3000),
  framing: bullets,
  omission: bullets,
  historical_echo: z.string().trim().min(20).max(320),
  threat_level: threatLevel,
  source_url: z.string().trim().default(""),
});

export type NewsBriefDraft = {
  headline: string;
  bluf: string;
  framing: string[];
  omission: string[];
  historical_echo: string;
  threat_level: ThreatLevel;
  source_url: string;
};

const SYSTEM = `You are a ruthless intelligence officer writing a target dossier. You are not a journalist, not a summariser, not a commentator. You do not explain, you do not editorialise, and you do not use adjectives for effect.

Voice: cold, flat, declarative. Present tense, active voice. Short words. No hedging, no both-sides throat-clearing, no "it remains to be seen".

Hard limits — break these and the dossier is rejected:
- headline: MAXIMUM 6 WORDS. Count them before you answer. A judgement, not an event description, and never a reworded version of the published headline.
- bluf: THE EXECUTIVE ASSESSMENT. 3 to 4 paragraphs, 200–300 words total, separated by a single blank line. Structure it exactly:
  ¶1 THE EVENT — what actually happened, stripped of every adjective and emotional term. Actors, action, consequence.
  ¶2 THE SPIN — the narrative the source is pushing, how it frames blame and legitimacy, what it wants you to feel.
  ¶3 THE REALITY — the hidden geopolitical or financial truth: who gains, who pays, what the stakes actually are beneath the story.
  ¶4 (optional) — what to watch next, and the condition that would falsify this reading.
- framing: EXACTLY 3 bullets, each MAXIMUM 18 words. Name the technique mechanically: loaded adjectives, passive voice hiding agency, unnamed sources, false dilemma, selective quotation. Describe the technique, never the author's soul.
- omission: EXACTLY 3 bullets, each MAXIMUM 18 words. The dog that didn't bark: missing numbers, absent parties, questions the piece never answers.
- historical_echo: MAXIMUM 2 SENTENCES. One concrete precedent, and where the comparison breaks.
- threat_level: exactly one of "LOW", "MODERATE", "ELEVATED", "CRITICAL".

Rules:
- Only the supplied article may be cited. Never import outside facts.
- bluf is the only field that may contain paragraph breaks (blank lines). No markdown asterisks, no numbering, no trailing periods on bullets unless the bullet is a full sentence.
- If the evidence is thin, say so in one clause and move on.

Return ONLY this JSON shape:
{
  "headline": "six words maximum",
  "bluf": "¶1 The event.\\n\\n¶2 The spin.\\n\\n¶3 The reality.",
  "framing": ["bullet", "bullet", "bullet"],
  "omission": ["bullet", "bullet", "bullet"],
  "historical_echo": "two sentences maximum",
  "threat_level": "LOW | MODERATE | ELEVATED | CRITICAL",
  "source_url": "the exact URL supplied"
}`;

/** Turns one article into a validated, terse dossier via DeepSeek. */
export async function generateBrief(stories: StoryText[]): Promise<NewsBriefDraft> {
  const story = stories[0];
  if (!story) throw new Error("No article was supplied to the brief generator.");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: SYSTEM,
    prompt: `PUBLISHER: ${story.source}\nHEADLINE AS PUBLISHED: ${story.title}\nURL: ${story.url}\n\nARTICLE (cleaned markdown):\n${story.text}\n\nWrite the dossier. Obey every hard limit.`,
    temperature: 0.2,
    maxRetries: 1,
  });

  const parsed = briefSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    throw new Error(
      `The model returned an unusable dossier: ${parsed.error.issues[0]?.message ?? "unknown shape"}`,
    );
  }

  return {
    ...parsed.data,
    framing: parsed.data.framing.slice(0, 3),
    omission: parsed.data.omission.slice(0, 3),
    // The source must be the article we actually read, whatever the model echoed back.
    source_url: story.url,
  };
}

const verdictSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["confirmed", "contradicted", "inconclusive"]),
      note: z.string().trim().min(4).max(240),
    }),
  ),
});

export type ClaimVerdict = z.infer<typeof verdictSchema>["verdicts"][number];

const WATCH_SYSTEM = `You verify dated claims against a single day's reporting. You are not a search engine: if today's article does not address a claim, say "inconclusive". Never infer from general knowledge.

Rules:
- "confirmed" only when the article states the event happened as described.
- "contradicted" only when the article states it did not happen, or happened differently in a way that falsifies the claim.
- "inconclusive" for everything else, including silence.
- note: one clause, max 20 words, quoting the article's own wording where possible.

Return ONLY JSON: { "verdicts": [{ "id": "...", "status": "confirmed" | "contradicted" | "inconclusive", "note": "..." }] }`;

/** Checks a batch of dated claims against today's article in one model call. */
export async function checkClaims(
  story: StoryText,
  claims: { id: string; claim: string }[],
): Promise<ClaimVerdict[]> {
  if (!claims.length) return [];

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: WATCH_SYSTEM,
    prompt: `TODAY'S ARTICLE — ${story.source}: ${story.title}\nURL: ${story.url}\n\n${story.text.slice(0, 10_000)}\n\nCLAIMS DUE:\n${claims
      .map((item) => `- ${item.id}: ${item.claim}`)
      .join("\n")}`,
    temperature: 0,
    maxRetries: 1,
  });

  const parsed = verdictSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) throw new Error("Claim verification returned an unusable shape.");
  const known = new Set(claims.map((item) => item.id));
  return parsed.data.verdicts.filter((verdict) => known.has(verdict.id));
}
