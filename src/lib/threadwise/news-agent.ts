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
