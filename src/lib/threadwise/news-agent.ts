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

const briefSchema = z.object({
  headline: z.string().trim().min(8).max(160),
  bluf: z.string().trim().min(40),
  framing: z.string().trim().min(40),
  omission: z.string().trim().min(30),
  historical_echo: z.string().trim().min(30),
  source_url: z.string().trim().default(""),
});

export type NewsBriefDraft = {
  headline: string;
  bluf: string;
  framing: string;
  omission: string;
  historical_echo: string;
  source_url: string;
};

const SYSTEM = `You are a ruthless intelligence analyst. You are given ONE news article. You are not a summariser, a commentator, or a moralist. You produce a single-target dossier that a decision-maker reads in ninety seconds.

Framework, in this order:

1. BLUF — Bottom Line Up Front. What actually happened, stripped of emotion and media spin. Actors, action, consequence. If the article asserts something it cannot support, say so in one clause.

2. FRAMING — How the author is steering the reader. Be specific and mechanical: loaded adjectives, passive voice hiding agency, unnamed sources, rhetorical questions, false dilemmas, appeals to fear or authority, selective quotation, what is foregrounded versus buried. Quote at most six words at a time. Never accuse the author of motives you cannot evidence from the text; describe the technique instead.

3. OMISSION — The dog that didn't bark. Which context, numbers, counter-claims, affected parties or obvious follow-up questions are absent? What would a hostile editor ask first that this piece never answers?

4. HISTORICAL ECHO — The precedent this story invokes, repeats, or conveniently forgets. Name a concrete historical analogue and say precisely how it maps on, and where it breaks down.

Rules:
- Only the supplied article may be cited. Never import outside facts you cannot verify from it.
- No hedging filler. No "it remains to be seen", no "only time will tell", no both-sides throat-clearing.
- No markdown, no bullet lists inside the fields; each field is one tight paragraph.
- If the evidence for a claim is thin, say so plainly and move on.
- Write in the present tense, active voice.

Return ONLY a JSON object with exactly these keys:
{
  "headline": "a stark, analytical title — not the article's headline",
  "bluf": "one paragraph: what actually happened and why it matters",
  "framing": "one paragraph: the specific linguistic and rhetorical techniques at work",
  "omission": "one paragraph: the missing context and the questions nobody asked",
  "historical_echo": "one paragraph: the precedent invoked or ignored",
  "source_url": "the exact URL of the supplied article"
}`;

/** Turns one article into a validated dossier via DeepSeek. */
export async function generateBrief(stories: StoryText[]): Promise<NewsBriefDraft> {
  const story = stories[0];
  if (!story) throw new Error("No article was supplied to the brief generator.");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: SYSTEM,
    prompt: `PUBLISHER: ${story.source}\nHEADLINE AS PUBLISHED: ${story.title}\nURL: ${story.url}\n\nARTICLE (cleaned markdown):\n${story.text}\n\nProduce the dossier now.`,
    temperature: 0.2,
    maxRetries: 1,
  });

  const parsed = briefSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    throw new Error(
      `The model returned an unusable dossier: ${parsed.error.issues[0]?.message ?? "unknown shape"}`,
    );
  }

  // The source must be the article we actually read, whatever the model echoed back.
  return { ...parsed.data, source_url: story.url };
}
