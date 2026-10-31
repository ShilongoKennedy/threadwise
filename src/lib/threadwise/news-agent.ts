/**
 * Autonomous News Agent — server only.
 *
 * Pulls three world-news feeds, reads the top story from each through Jina's
 * reader, and asks DeepSeek for a single forensic brief. Never import this from
 * a component: it reads server environment variables and calls paid APIs.
 */
import { XMLParser } from "fast-xml-parser";
import { generateText } from "ai";
import { z } from "zod";
import { extractJson, getModel } from "./ai/ai-providers.server";

export type FeedSource = { name: string; url: string };

/** Free, no-key world-news feeds. Order matters: it drives source diversity. */
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
 * Reads every feed in parallel and interleaves them one story at a time, so the
 * three picks always span three publishers where the feeds cooperate. Individual
 * feed failures degrade to "fewer stories" rather than a failed run.
 */
export async function fetchTopStories(limit = 3): Promise<Story[]> {
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
  return text.slice(0, 12_000);
}

const briefSchema = z.object({
  headline: z.string().trim().min(8).max(160),
  summary: z.string().trim().min(40),
  sources: z.array(z.string()).default([]),
  analysis: z.array(z.string().trim().min(20)).min(2),
  tags: z.array(z.string().trim().min(2)).max(20).default([]),
});

export type NewsBriefDraft = {
  headline: string;
  summary: string;
  sources: string[];
  analysis: string[];
  tags: string[];
};

const SYSTEM = `You are a forensic intelligence analyst writing a daily geopolitical brief. You are not a news summariser and you are not an advocate.

Method:
1. Read every source. Establish what is asserted, by whom, and on what evidence.
2. Compare sources. Where do they agree, and where does the same event get incompatible explanations?
3. Name what none of them say: the missing actor, the uncosted assumption, the question the framing avoids.
4. Separate observation from inference. Never invent a fact, figure, name or quote.

Rules:
- Only the supplied articles may be cited. Do not add outside sources.
- No hedging filler ("it remains to be seen", "only time will tell").
- Attribute contested claims to the source making them.
- The headline is stark and analytical, not sensational.

Return ONLY a JSON object:
{
  "headline": "a stark, analytical title",
  "summary": "one paragraph: the actual state of play and why it matters",
  "sources": ["the exact URLs supplied"],
  "analysis": [
    "paragraph 1 — cross-source synthesis",
    "paragraph 2 — contradictions between sources",
    "paragraph 3 — omissions and what is not being asked"
  ],
  "tags": ["geopolitics", "…"]
}`;

/** Turns the day's article texts into one validated brief via DeepSeek. */
export async function generateBrief(stories: StoryText[]): Promise<NewsBriefDraft> {
  if (!stories.length) throw new Error("No articles were supplied to the brief generator.");

  const corpus = stories
    .map(
      (story, index) =>
        `### SOURCE ${index + 1} — ${story.source}\nTITLE: ${story.title}\nURL: ${story.url}\n\n${story.text}`,
    )
    .join("\n\n---\n\n");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: SYSTEM,
    prompt: `Today's source pack contains ${stories.length} articles.\n\n${corpus}\n\nWrite the brief now.`,
    temperature: 0.3,
    maxRetries: 1,
  });

  const parsed = briefSchema.safeParse(extractJson<unknown>(text));
  if (!parsed.success) {
    throw new Error(`The model returned an unusable brief: ${parsed.error.issues[0]?.message ?? "unknown shape"}`);
  }

  const allowed = new Set(stories.map((story) => story.url));
  const cited = parsed.data.sources.filter((url) => allowed.has(url));

  return {
    headline: parsed.data.headline,
    summary: parsed.data.summary,
    // Trust the model's citations when they are real; otherwise fall back to what we actually read.
    sources: cited.length ? [...new Set(cited)] : [...allowed],
    analysis: parsed.data.analysis,
    tags: [...new Set(parsed.data.tags.map((tag) => tag.toLowerCase()))].slice(0, 6),
  };
}
