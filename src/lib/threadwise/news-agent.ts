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
/**
 * The same event, across outlets. Leads are unrelated, so we fetch a pool from
 * each feed and cluster by shared entities before the model sees anything.
 */
export async function fetchEventCluster(): Promise<Story[]> {
  const pool = await fetchTopStories(NEWS_FEEDS.length * 8);
  const bySource = new Map<string, Story[]>();
  for (const story of pool) {
    const list = bySource.get(story.source) ?? [];
    if (list.length < 8) list.push(story);
    bySource.set(story.source, list);
  }

  const feeds = [...bySource.values()];
  if (!feeds.length) return [];
  if (feeds.length === 1) return [feeds[0]![0]!];

  const words = (title: string) =>
    new Set(
      (title.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []).filter(
        (word) => !STOPWORDS.has(word),
      ),
    );
  const overlap = (a: Set<string>, b: Set<string>) => {
    let shared = 0;
    for (const word of a) if (b.has(word)) shared += 1;
    return shared;
  };

  let best: { stories: Story[]; score: number } = { stories: [], score: 0 };
  for (let i = 0; i < feeds.length; i += 1) {
    for (let j = i + 1; j < feeds.length; j += 1) {
      for (const left of feeds[i]!) {
        const leftWords = words(left.title);
        for (const right of feeds[j]!) {
          const score = overlap(leftWords, words(right.title));
          if (score > best.score) {
            best = { stories: [left, right], score };
            // a third outlet covering the same event joins the cluster
            for (let k = 0; k < feeds.length; k += 1) {
              if (k === i || k === j) continue;
              const third = feeds[k]!.find(
                (candidate) => overlap(leftWords, words(candidate.title)) >= 2,
              );
              if (third) best.stories.push(third);
            }
          }
        }
      }
    }
  }

  // Two shared significant words is the floor for "same event".
  if (best.score >= 2) return best.stories;
  return [pool[0]!];
}

const STOPWORDS = new Set([
  "that","this","with","from","after","before","says","said","will","would","could","about",
  "over","into","amid","more","than","then","they","their","them","have","has","been","were",
  "what","when","where","which","while","your","ours","here","there","just","like","also",
]);

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
  bluf: z.string().trim().min(1200).max(7000),
  framing: bullets,
  omission: bullets,
  historical_echo: z.string().trim().min(20).max(320),
  threat_level: threatLevel,
  source_url: z.string().trim().default(""),
  sources: z
    .array(
      z.object({
        outlet: z.string().trim().max(40),
        headline: z.string().trim().max(120),
        emphasis: z.string().trim().min(20).max(320),
        omission: z.string().trim().min(12).max(240),
      }),
    )
    .max(3)
    .default([]),
  gap: z.string().trim().max(500).default(""),
  place: z.string().trim().max(60).default(""),
  lat: z.number().min(-90).max(90).default(0),
  lon: z.number().min(-180).max(180).default(0),
  /** Future dates the article itself commits to — planted in the calendar. */
  dated_claims: z
    .array(
      z.object({
        claim: z.string().trim().min(6).max(120),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .max(3)
    .default([]),
});

export type NewsBriefDraft = {
  headline: string;
  bluf: string;
  framing: string[];
  omission: string[];
  historical_echo: string;
  threat_level: ThreatLevel;
  source_url: string;
  sources: { outlet: string; headline: string; emphasis: string; omission: string }[];
  gap: string;
  place: string;
  lat: number;
  lon: number;
  dated_claims: { claim: string; date: string }[];
};

const SYSTEM = `You are a ruthless intelligence officer writing a target dossier. You are not a journalist, not a summariser, not a commentator. You do not explain, you do not editorialise, and you do not use adjectives for effect.

Voice: cold, flat, declarative. Present tense, active voice. Short words. No hedging, no both-sides throat-clearing, no "it remains to be seen".

Hard limits — break these and the dossier is rejected:
- headline: MAXIMUM 6 WORDS. Count them before you answer. A judgement, not an event description, and never a reworded version of the published headline.
- bluf: THE EXECUTIVE ASSESSMENT. SIX paragraphs, 700–1000 words total, separated by single blank lines. No headings, no numbering, no markdown. Structure it exactly:
  ¶1 THE EVENT — what actually happened, stripped of every adjective and emotional term. Actors, action, consequence. 90–130 words.
  ¶2 THE DISAGREEMENT — what the outlets actually disagree about: not tone but fact, sequence, attribution. Name which account is stronger and why. 120–170 words.
  ¶3 THE SPIN — how each outlet frames blame and legitimacy, and what each wants you to feel. Quote their own words where it helps. 120–170 words.
  ¶4 THE REALITY — the geopolitical or financial truth beneath the story: who gains, who pays, what the stakes are. Name the incentive each actor is responding to. 120–170 words.
  ¶5 THE BLIND SPOT — what all of these accounts avoid, and why that avoidance is convenient for someone. This is the most important paragraph. 100–150 words.
  ¶6 WHAT TO WATCH — two or three specific developments, each with a date or condition, and the one fact that would falsify this whole reading. 100–150 words.
- sources: one entry per outlet supplied, in the order given. emphasis = what that outlet put in its lede that the others did not (one sentence, quote it). omission = what its account leaves out that another one states (one clause).
- gap: ONE sentence — the question none of the outlets answers.
- framing: EXACTLY 3 bullets, each MAXIMUM 18 words. Name the technique mechanically: loaded adjectives, passive voice hiding agency, unnamed sources, false dilemma, selective quotation. Describe the mechanism, never the feeling.
- omission: EXACTLY 3 bullets, each MAXIMUM 18 words. The dog that didn't bark: missing numbers, absent parties, questions the piece never answers.
- historical_echo: MAXIMUM 2 SENTENCES. One concrete precedent, and where the comparison breaks.
- threat_level: exactly one of "LOW", "MODERATE", "ELEVATED", "CRITICAL".
- place: the single primary location the story happens in, as a city or country name (max 3 words).
- lat, lon: that place's decimal coordinates, to two decimals. If the article names no place, return empty place and 0, 0.
- dated_claims: 0 to 3 FUTURE dates the article itself commits to — a signing, a deadline, a vote, a ruling, a scheduled release. Shape: { "claim": "what is supposed to happen", "date": "YYYY-MM-DD" }. Only dates stated or unambiguously implied by the article; never invent one. Empty array if the piece commits to nothing. Resolve relative phrasing ("next Friday") against the article date given above.

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
    prompt: stories
    .slice(0, 3)
    .map(
      (item, index) =>
        `--- OUTLET ${index + 1} of ${Math.min(stories.length, 3)} ---\nPUBLISHER: ${item.source}\nHEADLINE AS PUBLISHED: ${item.title}\nURL: ${item.url}\n\nARTICLE (cleaned markdown):\n${item.text.slice(0, 9_000)}`,
    )
    .join("\n\n"),
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
