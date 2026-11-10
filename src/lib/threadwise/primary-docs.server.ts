/**
 * Primary documents — server only.
 *
 * A headline can say a body is funded; only its budget report says by how much.
 * This module follows a named body to its official site (Wikidata P856), reads
 * the budget or annual-report page, and then reads the PDFs that page links to.
 * For legal reads it reads the judgment itself, from CourtListener where the
 * case is American, or from a filing linked by the coverage where it is not.
 *
 * Everything here is best-effort: a read must still work when a site blocks us.
 */
import { moneySentences } from "./figures";

export type PrimaryEvidence = {
  excerpts: string[];
  sources: { title: string; url: string }[];
};

export const EMPTY_PRIMARY: PrimaryEvidence = { excerpts: [], sources: [] };

type Document = { title: string; url: string; text: string };

const USER_AGENT = "ThreadwiseAnalyst/1.0 (+https://threadwise.app)";

/** The pages a funded body usually keeps its budget and annual report on. */
const BUDGET_PATHS = [
  "/about/overview/budget",
  "/about/funding",
  "/about/annual-report",
  "/annual-report",
  "/en/about/annual-report",
  "/about/budget",
  "/budget",
  "/financial-statements",
];

async function getJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/** The official site, via Wikidata, so we do not guess a domain. */
export async function officialWebsite(entity: string): Promise<string | null> {
  const search = (await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      entity,
    )}&language=en&format=json&limit=1`,
  )) as { search?: { id?: string }[] } | null;
  const id = search?.search?.[0]?.id;
  if (!id) return null;

  const data = (await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
      id,
    )}&props=claims&format=json`,
  )) as {
    entities?: Record<
      string,
      { claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]> }
    >;
  } | null;

  const website = data?.entities?.[id]?.claims?.["P856"]?.[0]?.mainsnak?.datavalue?.value;
  return typeof website === "string" && /^https?:\/\//i.test(website) ? website : null;
}

/** Reads a page or PDF through the reader that already handles both. */
async function readThroughJina(url: string, selector?: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-Return-Format": "markdown",
  };
  if (selector) headers["X-Target-Selector"] = selector;

  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Reader responded ${response.status} for ${url}`);

  const text = (await response.text()).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 400) throw new Error(`Reader returned too little text for ${url}`);
  return text.slice(0, 80_000);
}

/**
 * Reads a page or PDF. Selecting `main` drops the navigation that otherwise
 * fills the reader's first 14,000 characters and hides the budget links.
 */
async function readDocument(url: string): Promise<Document | null> {
  const isPdf = /\.pdf($|\?)/i.test(url);
  let text = "";
  try {
    text = await readThroughJina(url, isPdf ? undefined : "main");
  } catch {
    try {
      text = await readThroughJina(url);
    } catch {
      return null;
    }
  }
  const title = text.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? "";
  return { title, url, text };
}

const LOCALISED_PDF = /(_ar|_ch|_fr|_rus|_sp|_es)_?\.pdf$/i;

/** PDFs linked by a budget page, English editions first. */
export function documentLinks(text: string, baseUrl: string): { title: string; url: string }[] {
  const seen = new Set<string>();
  const links: { title: string; url: string }[] = [];
  const base = baseUrl.replace(/[?#].*$/, "");

  for (const match of text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const title = match[1]!.replace(/!\[[^\]]*\]/g, "").trim();
    const url = match[2]!.replace(/[?#].*$/, "");
    if (!/\.pdf$/i.test(url) || LOCALISED_PDF.test(url)) continue;
    if (url === base || seen.has(url)) continue;
    seen.add(url);
    links.push({ title, url });
  }

  return links;
}

/** The figures on a page, or the page's own budget PDF when it only links out. */
async function evidenceFromPage(
  page: Document,
  label: string,
): Promise<PrimaryEvidence> {
  const excerpts: string[] = [];
  const sources: { title: string; url: string }[] = [];

  const onPage = moneySentences(page.text, 4);
  if (onPage.length) {
    const title = page.title || label;
    excerpts.push(`FROM ${title} (${page.url}): ${onPage.join(" ").slice(0, 1200)}`);
    sources.push({ title: `Primary · ${title}`, url: page.url });
  }

  const documents = documentLinks(page.text, page.url).slice(0, 2);
  const read = await Promise.all(documents.map((document) => readDocument(document.url)));
  for (const document of read) {
    if (!document) continue;
    const figures = moneySentences(document.text, 4);
    if (!figures.length) continue;
    const title = document.title || label;
    excerpts.push(`FROM ${title} (${document.url}): ${figures.join(" ").slice(0, 1200)}`);
    sources.push({ title: `Primary · ${title}`, url: document.url });
  }

  return { excerpts, sources };
}

/**
 * Budget and funding figures from a body's own documents. Empty when the site
 * cannot be found or read — never filled in from memory.
 */
export async function fundingDocuments(entity: string): Promise<PrimaryEvidence> {
  if (!entity.trim()) return EMPTY_PRIMARY;
  const site = await officialWebsite(entity);
  if (!site) return EMPTY_PRIMARY;

  let base: URL;
  try {
    base = new URL(site);
  } catch {
    return EMPTY_PRIMARY;
  }

  for (const batch of [BUDGET_PATHS.slice(0, 4), BUDGET_PATHS.slice(4)]) {
    const pages = await Promise.all(
      batch.map(async (path) => {
        const url = new URL(path, base).toString();
        return readDocument(url);
      }),
    );
    const usable = pages.filter((page): page is Document => page !== null);
    const page = usable
      .map((candidate) => ({
        candidate,
        score:
          moneySentences(candidate.text, 6).length * 10 +
          documentLinks(candidate.text, candidate.url).length * 3 +
          (/budget|funding|annual report|financial/i.test(`${candidate.title} ${candidate.text.slice(0, 400)}`)
            ? 5
            : 0),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (page?.score) return evidenceFromPage(page.candidate, `${entity} budget`);
  }

  return EMPTY_PRIMARY;
}

/** US legal reads only: CourtListener has the opinions, other jurisdictions do not. */
export function looksUSLegal(move: string): boolean {
  if (/\bU\.S\.|United States|federal court|federal judge|supreme court of the united states|circuit court|court of appeals|district court/i.test(move)) {
    return true;
  }
  // Bare "US" must be case-sensitive: "us" is a pronoun, not a jurisdiction.
  return /\bUS\b/.test(move) || /\bAmerican\b/i.test(move);
}

/** The passages of an opinion that decide something, rather than the recitals. */
export function holdingSentences(text: string, limit = 4): string[] {
  const body = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => !/^(Title|URL Source|Published Time|Markdown Content|Warning|Number of Pages):/i.test(line))
    .join(" ")
    .replace(/\s+/g, " ");

  return body
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 60 &&
        line.length < 500 &&
        /\b(held|holds|holding|ordered|orders|enjoined|affirm|revers|vacat|judgment|ruling|injunction|section \d)\b/i.test(
          line,
        ),
    )
    .slice(0, limit);
}

/** The opinion itself, matched to the case the move names. */
export async function courtDocuments(
  query: string,
  anchors: string[],
): Promise<PrimaryEvidence> {
  if (!query.trim()) return EMPTY_PRIMARY;
  const search = await readDocument(
    `https://www.courtlistener.com/?q=${encodeURIComponent(query)}&type=o`,
  );
  if (!search) return EMPTY_PRIMARY;

  const opinions = [...search.text.matchAll(
    /### \[([^\]]+)\]\((https:\/\/www\.courtlistener\.com\/opinion\/[^)]+)\)/g,
  )]
    .map((match) => ({ title: match[1]!.trim(), url: match[2]!.replace(/[?#].*$/, "") }))
    .filter(
      (opinion) =>
        !anchors.length ||
        anchors.some((anchor) => opinion.title.toLowerCase().includes(anchor.toLowerCase())),
    )
    .slice(0, 1);

  const opinion = opinions[0];
  if (!opinion) return EMPTY_PRIMARY;

  const document = await readDocument(opinion.url);
  if (!document) return EMPTY_PRIMARY;

  const holdings = holdingSentences(document.text, 4);
  if (!holdings.length) return EMPTY_PRIMARY;

  const title = document.title || opinion.title;
  return {
    excerpts: [`FROM THE OPINION IN ${title} (${opinion.url}): ${holdings.join(" ").slice(0, 1400)}`],
    sources: [{ title: `Judgment · ${title}`, url: opinion.url }],
  };
}

/** The first PDF the coverage links that looks like the judgment itself. */
export function filingLink(
  text: string,
  baseUrl: string,
): { title: string; url: string } | null {
  return (
    documentLinks(text, baseUrl).find((link) =>
      /judg|ruling|decision|filing|court|caselaw|sites\/default\/files/i.test(link.url),
    ) ?? null
  );
}

/**
 * A filing the coverage itself links to. This is how a non-US judgment is
 * reached without pretending CourtListener covers every jurisdiction.
 */
export async function linkedFilingDocuments(
  hits: { title: string; url: string }[],
): Promise<PrimaryEvidence> {
  for (const hit of hits.slice(0, 1)) {
    const article = await readDocument(hit.url);
    if (!article) continue;

    const filing = filingLink(article.text, hit.url);
    if (!filing) continue;

    const document = await readDocument(filing.url);
    if (!document) continue;

    const holdings = holdingSentences(document.text, 4);
    if (!holdings.length) continue;

    const title = document.title || hit.title;
    return {
      excerpts: [`FROM THE FILING IN ${title} (${filing.url}): ${holdings.join(" ").slice(0, 1400)}`],
      sources: [{ title: `Filing · ${title}`, url: filing.url }],
    };
  }

  return EMPTY_PRIMARY;
}
