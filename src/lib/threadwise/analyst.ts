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
import { moneySentences } from "./figures";
import {
  courtDocuments,
  EMPTY_PRIMARY,
  fundingDocuments,
  linkedFilingDocuments,
  looksUSLegal,
  type PrimaryEvidence,
} from "./primary-docs.server";

const sectionSchema = z.object({
  title: z.string().trim().max(80).default(""),
  body: z.string().trim().max(2200).default(""),
});

export const INQUIRY_MODES = ["understand", "decide", "argue", "predict", "monitor", "teach"] as const;
export type InquiryMode = (typeof INQUIRY_MODES)[number];
export type Inquiry = { mode: InquiryMode; changeMind?: string };

const INQUIRY_BRIEF: Record<InquiryMode, string> = {
  understand: "understand the mechanism well enough to predict the next move",
  decide: "make a decision, so the trade-offs and decision-relevant facts must be explicit",
  argue: "build or attack an argument, so both the strongest case and the point that would settle it matter",
  predict: "make a prediction, so base rates, indicators and a dated falsifier matter",
  monitor: "monitor a situation, so the signals that would show change matter",
  teach: "learn the subject from first principles, so terms, common misreadings and transferable moves matter",
};

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
  claims: z
    .array(
      z.object({
        text: z.string().trim().max(400).default(""),
        kind: z.enum(["fact", "inference", "value", "prediction"]).default("fact"),
        confidence: z.enum(["high", "medium", "low"]).default("medium"),
        source: z.string().trim().max(300).default(""),
        falsifier: z.string().trim().max(300).default(""),
      }),
    )
    .max(8)
    .default([]),
  questions: z.array(z.string().trim().max(200)).max(5).default([]),
  confidence: z.enum(["documented", "inferred", "speculative"]).default("inferred"),
});

const patchItemSchema = z.object({
  section: z.string().trim().max(120).default(""),
  find: z.string().trim().min(3).max(400),
  replace: z.string().trim().max(400).default(""),
  reason: z.string().trim().max(300).default(""),
});

export const reviewSchema = z.object({
  verdict: z.enum(["grounded", "mixed", "unsupported"]).default("mixed"),
  supported: z.number().int().min(0).max(50).default(0),
  issues: z
    .array(
      z.object({
        section: z.string().trim().max(120).default(""),
        claim: z.string().trim().max(400).default(""),
        problem: z.string().trim().max(400).default(""),
      }),
    )
    .max(4)
    .default([]),
  patches: z.array(patchItemSchema).max(6).default([]),
  missing: z.array(z.string().trim().max(300)).max(3).default([]),
});

export type ReadReview = z.infer<typeof reviewSchema> & { by?: string };

export const patchSchema = z.object({
  patches: z.array(patchItemSchema).max(8).default([]),
});

export type ReadRevision = { patched: number; notes: string[] };

export type AnalystReport = z.infer<typeof analystSchema> & {
  sources: { title: string; url: string }[];
  basis?: string;
  subject?: string;
  writer?: string;
  intent?: Inquiry;
  review?: ReadReview;
  revision?: ReadRevision;
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

export function selectLayers(
  mode: keyof typeof MODES,
  requested: string[],
  move: string,
): string[] {
  // The institution layer asks who pays a body. It is only meaningful when the
  // move names a body that is actually funded; a court or a person is not.
  const funded = fundedBody(move);
  const chosen = [...requested];
  if (mode === "discourse" && !chosen.includes("theory")) chosen.unshift("theory");
  if (mode === "institution" && funded && !chosen.includes("institution")) chosen.unshift("institution");
  return chosen
    .filter((layer) => layer in LAYERS)
    .filter((layer) => layer !== "institution" || Boolean(funded))
    .slice(0, 2);
}

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
      layers: selectLayers(parsed.data.mode, parsed.data.layers, move),
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
  inquiry?: Inquiry,
) {
  const shape = MODES[mode] ?? MODES.report;
  const depth = DEPTH[mode] ?? DEPTH.report;
  const words = input.length < 400 ? depth.short : depth.long;
  const layerRules = layers.map((layer) => LAYERS[layer]).filter(Boolean).join("\n\n");
  const inquiryBlock = inquiry
    ? `THE INQUIRY THIS READ SERVES:
- The reader is trying to ${INQUIRY_BRIEF[inquiry.mode]}.
${inquiry.changeMind?.trim() ? `- What would change their mind: ${inquiry.changeMind.trim().slice(0, 300)}\n` : ""}- Use this to decide what to emphasise and what the questions should ask. It is the purpose of the read, not a section to fill.
`
    : "";
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

${inquiryBlock}
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
- claims: 4-8 load-bearing claims the read depends on. For each: text (one sentence), kind (fact|inference|value|prediction), confidence (high|medium|low), source (the outlet or document title from the material, or "move" if it restates the move, or "analysis" if it is your inference), falsifier (for predictions, the observation that would settle it; otherwise empty). These are the claims the reader should check.
- questions: three sharp questions this specific read invites, in the reader's voice, each under 16 words. Not generic ("what happens next") — they must depend on a claim you just made and, where an inquiry is stated, serve that inquiry.
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
  "claims": [{ "text": string, "kind": "fact" | "inference" | "value" | "prediction", "confidence": "high" | "medium" | "low", "source": string, "falsifier": string }],
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

/** Names and institutions worth looking up: capitalised runs, minus the obvious noise. */
const GENERIC_WORDS = new Set([
  "court","high","supreme","finance","act","bill","law","government","minister","president",
  "parliament","state","council","bank","party","election","police","judge","ruling","report",
  "agency","committee","department","union","national","federal","international","breaking",
  "news","update","statement","official","spokesman","spokesperson","analysis","opinion",
]);

/** Common words that make a search broad rather than specific. */
const TERM_STOP = new Set([
  "about","after","against","amid","among","and","another","are","because","been","before",
  "being","between","both","but","called","came","can","could","during","each","even","every",
  "from","had","has","have","having","here","into","its","just","like","made","make","many",
  "more","most","much","must","near","need","never","now","off","once","only","other","our",
  "out","over","own","said","same","says","seen","should","since","some","such","than","that",
  "the","their","them","then","there","these","they","this","those","through","told","too",
  "under","until","upon","very","was","were","what","when","where","which","while","who","why",
  "will","with","would","year","years","concerns","according","raised","added","reports",
  "report","programme","program","people","government","official","officials","country",
  "state","week","day","time","case","cases","ruled","says","told","seen","blocks","decision",
]);

/** The words that make this move searchable: names, phrases, content words, and years. */
export function distinctiveTerms(input: string): string[] {
  const phraseRuns = (input.match(/\b[A-Z][\p{L}]+(?:\s+[A-Z][\p{L}]+){1,5}\b/gu) ?? [])
    .map((run) => run.replace(/^(The|A|An)\s+/i, "").toLowerCase())
    .filter((run) => run.split(" ").length >= 2);

  const phrases: string[] = [];
  for (const run of phraseRuns) {
    phrases.push(run);
    const words = run.split(" ");
    // "International Atomic Energy Agency" also has to match "atomic energy".
    if (words.length > 2) phrases.push(words.slice(1, 3).join(" "));
  }

  const covered = new Set(phrases.flatMap((phrase) => phrase.split(" ")));

  const acronyms = (input.match(/\b[A-Z]{2,6}\b/g) ?? []).map((word) => word.toLowerCase());

  const named = (input.match(/\b[A-Z][\p{L}]{2,}\b/gu) ?? [])
    .map((word) => word.toLowerCase())
    .filter(
      (word) =>
        !GENERIC_WORDS.has(word) && !TERM_STOP.has(word) && !covered.has(word),
    );

  const lower = (input.match(/\b[a-z][a-z'-]{3,}\b/g) ?? [])
    .map((word) => word.toLowerCase())
    .filter(
      (word) =>
        !GENERIC_WORDS.has(word) && !TERM_STOP.has(word) && !covered.has(word),
    );

  const years = (input.match(/\b(19|20)\d{2}\b/g) ?? []).map(String);

  return [...new Set([...phrases, ...acronyms, ...named, ...lower, ...years])].slice(0, 8);
}

const PLACES = new Set([
  "kenya","nairobi","mombasa","kisumu","namibia","windhoek","omaheke","swakopmund","nigeria",
  "lagos","abuja","kano","south","africa","johannesburg","cape","town","pretoria","durban",
  "ghana","accra","uganda","kampala","tanzania","dar","salaam","dodoma","britain","london",
  "westminster","india","delhi","mumbai","brazil","sao","paulo","united","kingdom","states",
]);

const YEAR = /^(19|20)\d{2}$/;

/**
 * Context words identify a time or a place, not the specific thing the move is
 * about. A headline that only says "2025" or "Kenya" is related coverage, not
 * evidence for the move.
 */
function isWeakTerm(term: string): boolean {
  return PLACES.has(term) || YEAR.test(term);
}

/**
 * How strongly a headline is actually about the move:
 * 2 = it names the specific thing (an act, a person, an institution),
 * 1 = it only names a place or a year, 0 = neither.
 */
export function matchStrength(title: string, terms: string[]): number {
  if (!terms.length) return 2;
  const haystack = title.toLowerCase();
  const matched = terms.filter((term) => haystack.includes(term));
  if (!matched.length) return 0;
  return matched.some((term) => !isWeakTerm(term)) ? 2 : 1;
}

/** A hit is on topic only if its headline names something the move names. */
export function mentionsTerm(title: string, terms: string[]): boolean {
  return matchStrength(title, terms) > 0;
}

/** How many of the move's terms the headline actually names. */
export function matchCount(title: string, terms: string[]): number {
  const haystack = title.toLowerCase();
  return terms.filter((term) => haystack.includes(term)).length;
}

/** Prefer the original publisher over an aggregator or a Google redirect. */
export function urlQuality(url: string): number {
  if (/news\.google\.com/i.test(url)) return 0;
  if (/(^|\.)(msn|yahoo|aol|flipboard)\./i.test(url)) return 1;
  return 2;
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

/**
 * Bodies whose question is "who pays it and who decides". A court, tribunal or
 * parliament is an institution too, but "largest donors" is not the question
 * it answers — asking it returns whatever the search engine ranks, not evidence.
 */
const FUNDING_BODY =
  /\b(agency|authority|commission|bank|fund|institute|institution|organisation|organization|office|secretariat|board|ministry|ministries|department|bureau|association|federation|coalition|alliance|broadcaster|university|foundation|trust|centre|center|laboratory|lab|programme|program|network|service)\b/i;
const NON_FUNDING_BODY =
  /\b(court|tribunal|judge|judiciary|parliament|senate|congress|assembly|police|army|military)\b/i;

/**
 * The one named body in the move that actually receives funding, if any.
 * Empty when the move names only people, places, courts or governments — in
 * that case the institution layer must not attach at all.
 */
export function fundedBody(input: string): string {
  return (
    candidateEntities(input).find(
      (name) => FUNDING_BODY.test(name) && !NON_FUNDING_BODY.test(name),
    ) ?? ""
  );
}

type NewsHit = { title: string; date: string; outlet: string; url: string; snippet?: string };

/**
 * Google News editions by country, with the outlets that cover each place
 * properly and the language its readers actually use. A story about Kenya
 * should be answered by Kenyan papers, not by whatever a US edition ranks
 * highest; a story about France should come back in French, not in English.
 */
const EDITIONS: { match: RegExp; gl: string; hl: string; ceid: string; outlets: string[] }[] = [
  { match: /\bkenya|nairobi|mombasa|kisumu\b/i, gl: "KE", hl: "en-KE", ceid: "KE:en",
    outlets: ["nation.africa", "the-star.co.ke", "businessdailyafrica.com", "standardmedia.co.ke"] },
  { match: /\bnamibia|windhoek|omaheke|swakopmund\b/i, gl: "NA", hl: "en-NA", ceid: "NA:en",
    outlets: ["thenamibian.com.na", "neweralive.na", "namibian.com.na"] },
  { match: /\bnigeri|lagos|abuja|kano\b/i, gl: "NG", hl: "en-NG", ceid: "NG:en",
    outlets: ["punchng.com", "premiumtimesng.com", "businessday.ng", "thenationonlineng.net"] },
  { match: /\bsouth afric|johannesburg|cape town|pretoria|durban\b/i, gl: "ZA", hl: "en-ZA", ceid: "ZA:en",
    outlets: ["dailymaverick.co.za", "mg.co.za", "businesslive.co.za", "timeslive.co.za"] },
  { match: /\bghana|accra\b/i, gl: "GH", hl: "en-GH", ceid: "GH:en", outlets: ["myjoyonline.com", "graphic.com.gh"] },
  { match: /\buganda|kampala\b/i, gl: "UG", hl: "en-UG", ceid: "UG:en", outlets: ["monitor.co.ug", "observer.ug"] },
  { match: /\btanzani|dar es salaam|dodoma\b/i, gl: "TZ", hl: "en-TZ", ceid: "TZ:en", outlets: ["thecitizen.co.tz", "ippmedia.com"] },
  { match: /\bethiopi|addis ababa\b/i, gl: "ET", hl: "en-ET", ceid: "ET:en", outlets: ["addisstandard.com", "ethiopianmonitor.com"] },
  { match: /\bsomali|mogadishu\b/i, gl: "SO", hl: "en-SO", ceid: "SO:en", outlets: ["hiiraan.com", "garoweonline.com"] },
  { match: /\bsouth sudan|juba\b/i, gl: "SS", hl: "en-SS", ceid: "SS:en", outlets: ["radiotamazuj.org", "eyeradio.org"] },
  { match: /\bsudan|khartoum\b/i, gl: "SD", hl: "en-SD", ceid: "SD:en", outlets: ["sudantribune.com", "alrakoba.net"] },
  { match: /\bdrc\b|democratic republic of (the )?congo|kinshasa\b/i, gl: "CD", hl: "fr-CD", ceid: "CD:fr",
    outlets: ["actualite.cd", "radiookapi.net"] },
  { match: /\bsenegal|dakar\b/i, gl: "SN", hl: "fr-SN", ceid: "SN:fr", outlets: ["seneweb.com", "lequotidien.sn"] },
  { match: /\bivory coast|côte d'ivoire|abidjan\b/i, gl: "CI", hl: "fr-CI", ceid: "CI:fr", outlets: ["fratmat.info", "abidjan.net"] },
  { match: /\bmorocc|rabat|casablanca\b/i, gl: "MA", hl: "fr-MA", ceid: "MA:fr", outlets: ["lematin.ma", "telquel.ma", "medias24.com"] },
  { match: /\balgeri|algiers\b/i, gl: "DZ", hl: "fr-DZ", ceid: "DZ:fr", outlets: ["elwatan.com", "tsa-algerie.com"] },
  { match: /\btunisi|tunis\b/i, gl: "TN", hl: "fr-TN", ceid: "TN:fr", outlets: ["lapresse.tn", "businessnews.com.tn"] },
  { match: /\begypt|cairo\b/i, gl: "EG", hl: "ar", ceid: "EG:ar", outlets: ["ahram.org.eg", "masrawy.com", "egyptindependent.com"] },
  { match: /\bisrael|jerusalem|tel aviv\b/i, gl: "IL", hl: "en-IL", ceid: "IL:en", outlets: ["timesofisrael.com", "jpost.com", "haaretz.co.il"] },
  { match: /\bsaudi|riyadh\b/i, gl: "SA", hl: "ar", ceid: "SA:ar", outlets: ["aleqt.com", "sabq.org", "arabnews.com"] },
  { match: /\bemirat|\buae\b|dubai|abu dhabi\b/i, gl: "AE", hl: "ar", ceid: "AE:ar", outlets: ["albayan.ae", "gulfnews.com", "thenationalnews.com"] },
  { match: /\bturkey|turkish|ankara|istanbul\b/i, gl: "TR", hl: "tr", ceid: "TR:tr", outlets: ["hurriyet.com.tr", "sabah.com.tr", "bianet.org"] },
  { match: /\brussia|russian|moscow\b/i, gl: "RU", hl: "ru", ceid: "RU:ru", outlets: ["kommersant.ru", "rbc.ru", "meduza.io"] },
  { match: /\bukrain|kyiv|kiev\b/i, gl: "UA", hl: "uk", ceid: "UA:uk", outlets: ["pravda.com.ua", "unian.ua", "kyivindependent.com"] },
  { match: /\bpoland|polish|warsaw\b/i, gl: "PL", hl: "pl", ceid: "PL:pl", outlets: ["wyborcza.pl", "rp.pl"] },
  { match: /\bczech|prague\b/i, gl: "CZ", hl: "cs", ceid: "CZ:cs", outlets: ["idnes.cz", "respekt.cz"] },
  { match: /\bgerman|berlin\b/i, gl: "DE", hl: "de", ceid: "DE:de", outlets: ["spiegel.de", "zeit.de", "faz.net"] },
  { match: /\baustria|vienna\b/i, gl: "AT", hl: "de", ceid: "AT:de", outlets: ["derstandard.at", "diepresse.com"] },
  { match: /\bswitzerland|swiss|zurich|geneva\b/i, gl: "CH", hl: "de", ceid: "CH:de", outlets: ["nzz.ch", "tagesanzeiger.ch"] },
  { match: /\bfrance|french|paris\b/i, gl: "FR", hl: "fr", ceid: "FR:fr", outlets: ["lemonde.fr", "lefigaro.fr", "liberation.fr"] },
  { match: /\bnetherlands|dutch|amsterdam|the hague\b/i, gl: "NL", hl: "nl", ceid: "NL:nl", outlets: ["nrc.nl", "volkskrant.nl", "nos.nl"] },
  { match: /\bsweden|swedish|stockholm\b/i, gl: "SE", hl: "sv", ceid: "SE:sv", outlets: ["dn.se", "svd.se"] },
  { match: /\bnorway|norwegian|oslo\b/i, gl: "NO", hl: "no", ceid: "NO:no", outlets: ["aftenposten.no", "nrk.no"] },
  { match: /\bdenmark|danish|copenhagen\b/i, gl: "DK", hl: "da", ceid: "DK:da", outlets: ["politiken.dk", "dr.dk"] },
  { match: /\bfinland|finnish|helsinki\b/i, gl: "FI", hl: "fi", ceid: "FI:fi", outlets: ["hs.fi", "yle.fi"] },
  { match: /\bitaly|italian|rome|milan\b/i, gl: "IT", hl: "it", ceid: "IT:it", outlets: ["corriere.it", "repubblica.it", "ilsole24ore.com"] },
  { match: /\bspain|spanish|madrid|barcelona\b/i, gl: "ES", hl: "es", ceid: "ES:es", outlets: ["elpais.com", "elmundo.es", "eldiario.es"] },
  { match: /\bportugal|portuguese|lisbon\b/i, gl: "PT", hl: "pt-PT", ceid: "PT:pt-PT", outlets: ["publico.pt", "expresso.pt"] },
  { match: /\bmexic|mexico city\b/i, gl: "MX", hl: "es-419", ceid: "MX:es-419", outlets: ["eluniversal.com.mx", "jornada.com.mx", "reforma.com"] },
  { match: /\bargentin|buenos aires\b/i, gl: "AR", hl: "es-419", ceid: "AR:es-419", outlets: ["clarin.com", "lanacion.com.ar", "pagina12.com.ar"] },
  { match: /\bcolombi|bogot[aá]\b/i, gl: "CO", hl: "es-419", ceid: "CO:es-419", outlets: ["eltiempo.com", "semana.com"] },
  { match: /\bchile|santiago\b/i, gl: "CL", hl: "es-419", ceid: "CL:es-419", outlets: ["latercera.com", "emol.com", "ciperchile.cl"] },
  { match: /\bbrazil|brasil|brasília|sao paulo\b/i, gl: "BR", hl: "pt-BR", ceid: "BR:pt-419", outlets: ["folha.uol.com.br", "oglobo.globo.com"] },
  { match: /\bunited states|\bu\.s\.|washington\b|\bamerican\b/i, gl: "US", hl: "en-US", ceid: "US:en",
    outlets: ["nytimes.com", "washingtonpost.com", "wsj.com", "politico.com"] },
  { match: /\bcanada|canadian|ottawa|toronto\b/i, gl: "CA", hl: "en-CA", ceid: "CA:en",
    outlets: ["cbc.ca", "theglobeandmail.com", "nationalpost.com"] },
  { match: /\bunited kingdom|britain|london|westminster|northern ireland\b/i, gl: "GB", hl: "en-GB", ceid: "GB:en",
    outlets: ["bbc.co.uk", "theguardian.com", "ft.com", "thetimes.co.uk"] },
  { match: /\breland|irish|dublin\b/i, gl: "IE", hl: "en-IE", ceid: "IE:en", outlets: ["irishtimes.com", "rte.ie", "independent.ie"] },
  { match: /\bindia\b|\bindian\b|delhi|mumbai\b/i, gl: "IN", hl: "en-IN", ceid: "IN:en", outlets: ["thehindu.com", "indianexpress.com", "timesofindia.indiatimes.com"] },
  { match: /\bpakistan|karachi|lahore|islamabad\b/i, gl: "PK", hl: "en-PK", ceid: "PK:en", outlets: ["dawn.com", "tribune.com.pk", "geo.tv"] },
  { match: /\bbangladesh|dhaka\b/i, gl: "BD", hl: "en-BD", ceid: "BD:en", outlets: ["thedailystar.net", "bdnews24.com"] },
  { match: /\bsri lanka|colombo\b/i, gl: "LK", hl: "en-LK", ceid: "LK:en", outlets: ["dailymirror.lk", "island.lk"] },
  { match: /\bnepal|kathmandu\b/i, gl: "NP", hl: "en-NP", ceid: "NP:en", outlets: ["kathmandupost.com", "myrepublica.nagariknetwork.com"] },
  { match: /\bindonesia|jakarta\b/i, gl: "ID", hl: "id", ceid: "ID:id", outlets: ["kompas.com", "tempo.co", "detik.com"] },
  { match: /\bphilippin|filipino|manila\b/i, gl: "PH", hl: "en-PH", ceid: "PH:en", outlets: ["inquirer.net", "rappler.com", "philstar.com"] },
  { match: /\bmalaysia|kuala lumpur\b/i, gl: "MY", hl: "en-MY", ceid: "MY:en", outlets: ["thestar.com.my", "malaysiakini.com"] },
  { match: /\bsingapore\b/i, gl: "SG", hl: "en-SG", ceid: "SG:en", outlets: ["straitstimes.com", "channelnewsasia.com"] },
  { match: /\bthai|bangkok\b/i, gl: "TH", hl: "en-TH", ceid: "TH:en", outlets: ["bangkokpost.com", "thaienquirer.com"] },
  { match: /\bvietnam|hanoi|ho chi minh\b/i, gl: "VN", hl: "en-VN", ceid: "VN:en", outlets: ["e.vnexpress.net", "tuoitrenews.vn"] },
  { match: /\bchina\b|\bchinese\b|beijing|shanghai\b/i, gl: "CN", hl: "zh", ceid: "CN:zh", outlets: ["news.cn", "thepaper.cn", "caixin.com"] },
  { match: /\bhong kong\b/i, gl: "HK", hl: "zh-HK", ceid: "HK:zh-HK", outlets: ["scmp.com", "hk01.com"] },
  { match: /\btaiwan|taipei\b/i, gl: "TW", hl: "zh-TW", ceid: "TW:zh-TW", outlets: ["udn.com", "cna.com.tw"] },
  { match: /\bjapan|japanese|tokyo\b/i, gl: "JP", hl: "en-JP", ceid: "JP:en", outlets: ["japantimes.co.jp", "asahi.com", "yomiuri.co.jp"] },
  { match: /\bsouth korea|korean|seoul\b/i, gl: "KR", hl: "en-KR", ceid: "KR:en", outlets: ["koreatimes.co.kr", "hani.co.kr", "yna.co.kr"] },
  { match: /\baustralia|australian|sydney|canberra\b/i, gl: "AU", hl: "en-AU", ceid: "AU:en", outlets: ["abc.net.au", "smh.com.au", "theaustralian.com.au"] },
  { match: /\bnew zealand|wellington|auckland\b/i, gl: "NZ", hl: "en-NZ", ceid: "NZ:en", outlets: ["rnz.co.nz", "nzherald.co.nz"] },
];

export function editionFor(input: string) {
  return EDITIONS.find((edition) => edition.match.test(input));
}

const LANGUAGES: Record<string, string> = {
  en: "English", fr: "French", de: "German", es: "Spanish", pt: "Portuguese",
  it: "Italian", nl: "Dutch", sv: "Swedish", no: "Norwegian", da: "Danish",
  fi: "Finnish", pl: "Polish", cs: "Czech", tr: "Turkish", ru: "Russian",
  uk: "Ukrainian", ar: "Arabic", he: "Hebrew", zh: "Chinese", ja: "Japanese",
  ko: "Korean", id: "Indonesian", th: "Thai", vi: "Vietnamese",
};

/** Words that carry no topic in a local query, across the editions we cover. */
const LOCAL_NOISE = new Set([
  "les","des","une","que","qui","dans","pour","avec","sur","par","pas","est","sont","aux","ses","son","sa",
  "los","las","una","por","para","con","del","das","dos","uma","não","nao","com","que","em",
  "der","die","das","und","mit","für","fur","von","den","dem","ein","eine","nicht","auf",
  "gli","delle","della","che","con","per","non","sono",
  "ما","في","من","على","أن","ان","هذا","هذه","التي","الذي","عن","إلى","الى","مع","كان","كانت",
  "the","and","for","with","from","this","that","have","has","was","were","its","their",
]);

/** The language of a Google News `hl`, e.g. "pt-BR" → "Portuguese". */
export function editionLanguage(hl: string): string {
  return LANGUAGES[hl.split("-")[0]!.toLowerCase()] ?? "";
}

/**
 * The move in the edition's own language. An English query on the French
 * edition matches "French Tech" and "French Darts", not the French budget.
 */
async function localQuery(input: string, edition: { hl: string }): Promise<string> {
  const language = editionLanguage(edition.hl);
  if (!language || language === "English") return "";

  try {
    const { text } = await generateText({
      model: getModel("deepseek"),
      prompt: `Translate this news sentence into ${language} for a news search. Keep names, numbers and acronyms exactly as written. Return only the translation, one line, at most 25 words.\n\n${input.slice(0, 700)}`,
      temperature: 0,
      maxOutputTokens: 100,
      maxRetries: 0,
    });
    return text
      .replace(/\s+/g, " ")
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .trim()
      .slice(0, 200);
  } catch {
    return "";
  }
}

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
async function news(query: string, edition?: { gl: string; hl: string; ceid: string }): Promise<NewsHit[]> {
  if (!query.trim()) return [];
  const gl = edition?.gl ?? "US";
  const hl = edition?.hl ?? "en-US";
  const ceid = edition?.ceid ?? "US:en";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
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

/** Bing News wraps the publisher URL in an apiclick redirect; pull it out. */
export function publisherUrl(link: string): string {
  try {
    const parsed = new URL(link);
    const target = parsed.searchParams.get("url");
    if (target && /^https?:\/\//i.test(target)) return target;
  } catch {
    // fall through to the raw link
  }
  return /^https?:\/\//i.test(link) ? link : "";
}

/** Bing News, because it carries the publisher URL rather than a redirect. */
async function bingNews(
  query: string,
  edition?: { gl: string; hl: string; ceid: string },
): Promise<NewsHit[]> {
  if (!query.trim()) return [];
  const market = edition?.hl ?? "en-US";
  const language = market.split("-")[0] ?? "en";
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setmkt=${encodeURIComponent(market)}&setlang=${encodeURIComponent(language)}`;
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
          outlet: textOf(item["News:Source"]) || "News",
          url: publisherUrl(textOf(item["link"])),
          snippet: textOf(item["description"])
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 320),
        };
      })
      .filter((hit) => hit.title && /^https?:\/\//i.test(hit.url));
  } catch {
    return [];
  }
}

/** Strip the reader's navigation, accessibility chrome and image markup. */
export function cleanArticle(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.findIndex((line) => line.startsWith("# "));
  const body = heading >= 0 ? lines.slice(heading) : lines;
  return body
    .filter(
      (line) =>
        (line.startsWith("# ") || line.length > 50) &&
        !line.startsWith("![") &&
        !/^\[[^\]]*\]\([^)]*\)$/.test(line) &&
        !/^(Press|Close|Accessibility|Popup|Follow us|Please note|Skip to|Title|URL Source|Published Time|Warning|Markdown Content):/i.test(
          line,
        ),
    )
    .join("\n")
    .slice(0, 4000);
}

/** Read the article itself: Firecrawl first, Jina when Firecrawl cannot. */
async function readArticle(
  hit: { title: string; url: string },
): Promise<{ title: string; url: string; text: string } | null> {
  if (process.env["FIRECRAWL_API_KEY"]) {
    try {
      const { readWeb } = await import("./ai/url.server");
      const page = await readWeb(hit.url, AbortSignal.timeout(20_000));
      if (page.text.trim().length > 400) {
        return { title: page.title || hit.title, url: page.url, text: page.text.slice(0, 80_000) };
      }
    } catch {
      // fall back to Jina
    }
  }
  try {
    const { fetchArticleText } = await import("./news-agent");
    const text = await fetchArticleText(hit.url);
    if (text.trim().length > 400) return { title: hit.title, url: hit.url, text };
  } catch {
    // unreadable
  }
  return null;
}

export async function retrieveContext(input: string): Promise<{
  context: string;
  sources: { title: string; url: string }[];
  hits: NewsHit[];
}> {
  const entities = candidateEntities(input);
  const terms = distinctiveTerms(input);
  const edition = editionFor(input);

  // A non-English edition is searched in its own language; the translated
  // sentence also gives us the words to match local headlines against.
  const local = edition ? await localQuery(input, edition) : "";
  const matchTerms = local
    ? [
        ...new Set(
          local
            .toLowerCase()
            .split(/[^\p{L}\p{N}]+/u)
            .filter((word) => word.length >= 3 && !LOCAL_NOISE.has(word)),
        ),
      ].slice(0, 6)
    : terms;

  // Search the distinctive words, newest first, then keep only what is on topic:
  // "finance" alone once matched American campaign-finance coverage to a Kenyan ruling.
  const queries = local
    ? [local]
    : [
        terms.slice(0, 2).join(" "),
        [entities[0], terms[0]].filter(Boolean).join(" "),
      ].filter((query) => query.trim().length > 2);

  const localSearches = edition
    ? edition.outlets.slice(0, 2).map((outlet) => news(`${local || terms.slice(0, 2).join(" ")} site:${outlet}`, edition))
    : [];

  // Bing is searched with the move itself, not two loose words: "iaea iran"
  // returns nuclear-industry noise, while the sentence finds the story.
  const bingQueries = local
    ? [local]
    : [input.slice(0, 180), terms.slice(0, 4).join(" ")].filter(
        (query) => query.trim().length > 2,
      );

  const [googleHits, bingHits, articles] = await Promise.all([
    Promise.all([
      ...queries.map((query) => news(query, edition)),
      ...localSearches,
    ]).then((batches) => batches.flat()),
    Promise.all(bingQueries.map((query) => bingNews(query, edition))).then((batches) => batches.flat()),
    Promise.all(entities.slice(0, 3).map((entity) => wiki(entity))),
  ]);

  // Keep Google's ranking and order, but when Bing has the same headline with a
  // publisher URL, prefer Bing: a Google redirect cannot be read as an article.
  const byTitle = new Map<string, NewsHit>();
  for (const hit of [...googleHits, ...bingHits]) {
    const key = hit.title.toLowerCase().replace(/\s+/g, " ").trim();
    const existing = byTitle.get(key);
    if (!existing || urlQuality(hit.url) > urlQuality(existing.url)) byTitle.set(key, hit);
  }
  const rawHits = [...byTitle.values()];
  const rank = (list: NewsHit[]) =>
    [...list].sort(
      (a, b) =>
        matchCount(b.title, matchTerms) - matchCount(a.title, matchTerms) ||
        b.date.localeCompare(a.date),
    );
  const strong = (() => {
    const specific = rank(
      rawHits.filter(
        (hit) =>
          matchStrength(hit.title, matchTerms) === 2 &&
          matchCount(hit.title, matchTerms) >= (matchTerms.length >= 2 ? 2 : 1),
      ),
    );
    // If nothing names two of the move's terms, accept one specific match
    // rather than returning no reporting at all.
    return specific.length
      ? specific
      : rank(rawHits.filter((hit) => matchStrength(hit.title, matchTerms) === 2));
  })();
  const related = rank(rawHits.filter((hit) => matchStrength(hit.title, matchTerms) === 1));
  // Only specifics count as evidence; place-only coverage is related, not proof.
  // A local-language query is already the filter: its words rarely survive a
  // headline word-for-word, so keep the edition's own results rather than none.
  const hits = strong.length
    ? strong
    : related.length
      ? related.slice(0, 3)
      : local
        ? rank(rawHits).slice(0, 3)
        : [];
  const background = articles.filter((hit): hit is WikiHit => hit !== null);

  // Headlines tell the analyst what happened; only the article says how. Bing
  // gives us the publisher URL, so the best two can actually be read.
  const readable = hits
    .filter((hit) => !/news\.google\.com/i.test(hit.url))
    .sort(
      (a, b) =>
        matchCount(b.title, matchTerms) - matchCount(a.title, matchTerms) ||
        urlQuality(b.url) - urlQuality(a.url),
    )
    .slice(0, 2);
  const articleReads = await bounded(
    Promise.all(readable.slice(0, 1).map((hit) => readArticle(hit))),
    [],
    12_000,
  );
  const articleContext = readable
    .map((hit, index) => {
      const read = articleReads[index];
      if (read) return `FROM ${read.title} (${read.url}):\n${cleanArticle(read.text)}`;
      // The reader can fail behind a paywall; Bing's own snippet is still evidence.
      if (hit.snippet) return `FROM ${hit.outlet} (${hit.title}): ${hit.snippet}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

  const reporting = hits
    .slice(0, 6)
    .map(
      (hit) =>
        `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})${
          hit.snippet ? `\n  ${hit.snippet}` : ""
        }`,
    )
    .join("\n");

  const lead = entities[0] ? await wikiBody(entities[0]) : "";
  const money = lead ? moneySentences(lead, 6) : [];

  const context = [
    money.length ? `FIGURES AND GOVERNANCE (from the reference entry on ${entities[0]}):\n${money.join(" ").slice(0, 1400)}` : "",
    reporting ? `LATEST REPORTING (newest first, dates are UTC):\n${reporting}` : "",
    articleContext
      ? `REPORTING TEXT (read from the article, not just the headline):\n${articleContext}`
      : "",
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
      title: `${strong.length ? "" : "Related · "}${hit.outlet} · ${hit.date ? `${hit.date} · ` : ""}${hit.title.slice(0, 80)}`,
      url: hit.url,
    })),
    ...background.slice(0, 2).map((hit) => ({ title: `Background · ${hit.title}`, url: hit.url })),
  ];

  return { context, sources, hits };
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

/** Primary documents enhance a read; they must never be the reason it hangs. */
function bounded<T>(promise: Promise<T>, fallback: T, ms = 25_000): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** A review can lower confidence, never raise it. */
export function reviewedConfidence(
  confidence: AnalystReport["confidence"],
  verdict?: ReadReview["verdict"],
): AnalystReport["confidence"] {
  if (verdict === "unsupported") return "speculative";
  if (verdict === "mixed" && confidence === "documented") return "inferred";
  return confidence;
}

type AnalystDraft = z.infer<typeof analystSchema>;
type StringSlot = { label: string; get: () => string; set: (value: string) => void };

const normaliseLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/^sections?:\s*/, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function slotScore(label: string, target: string): number {
  if (!target.trim()) return 1;
  const left = normaliseLabel(label);
  const right = normaliseLabel(target);
  if (!left || !right) return 0;
  if (left === right) return 3;
  if (left.includes(right) || right.includes(left)) return 2;
  const words = right.split(" ").filter((word) => word.length > 3);
  return words.some((word) => left.includes(word)) ? 1 : 0;
}

/** Apply the editor's corrections to the smallest possible text slot. */
export function applyReadPatches(
  draft: AnalystDraft,
  patches: z.infer<typeof patchSchema>["patches"],
): { draft: AnalystDraft; revision: ReadRevision } {
  const next = structuredClone(draft);
  const slots: StringSlot[] = [];
  const add = (label: string, get: () => string, set: (value: string) => void) =>
    slots.push({ label, get, set });

  add("move", () => next.move, (value) => { next.move = value; });
  add("why now", () => next.why_now, (value) => { next.why_now = value; });
  add("what it changes downstream", () => next.second_order, (value) => { next.second_order = value; });
  add("the counter-reading", () => next.counter_reading, (value) => { next.counter_reading = value; });
  add("what would prove this wrong", () => next.falsifier, (value) => { next.falsifier = value; });
  next.questions.forEach((_, index) => {
    add(`question ${index + 1}`, () => next.questions[index]!, (value) => { next.questions[index] = value; });
  });
  next.sections.forEach((section) => {
    add(`sections: ${section.title}`, () => section.body, (value) => { section.body = value; });
  });
  next.stakes.forEach((stake) => {
    add(`stakes: ${stake.actor}`, () => stake.actor, (value) => { stake.actor = value; });
    add(`stakes: ${stake.actor} gains`, () => stake.gains, (value) => { stake.gains = value; });
    add(`stakes: ${stake.actor} loses`, () => stake.loses, (value) => { stake.loses = value; });
  });
  next.precedent.forEach((item) => {
    add(`precedent: ${item.name}`, () => item.name, (value) => { item.name = value; });
    add(`precedent: ${item.name} when`, () => item.when, (value) => { item.when = value; });
    add(`precedent: ${item.name} parallel`, () => item.parallel, (value) => { item.parallel = value; });
    add(`precedent: ${item.name} breaks`, () => item.breaks, (value) => { item.breaks = value; });
  });
  next.watch.forEach((item) => {
    add(`watch: ${item.signal}`, () => item.signal, (value) => { item.signal = value; });
    add(`watch: ${item.signal} when`, () => item.when, (value) => { item.when = value; });
  });
  next.claims.forEach((claim, index) => {
    add(`claim ${index + 1}`, () => claim.text, (value) => { claim.text = value; });
    add(`claim ${index + 1} source`, () => claim.source, (value) => { claim.source = value; });
    add(`claim ${index + 1} falsifier`, () => claim.falsifier, (value) => { claim.falsifier = value; });
  });

  const revision: ReadRevision = { patched: 0, notes: [] };
  for (const patch of patches) {
    if (!patch.find || patch.find === patch.replace) continue;
    const ranked = slots
      .map((slot) => ({ slot, score: slotScore(slot.label, patch.section) }))
      .sort((a, b) => b.score - a.score);

    let applied = false;
    for (const { slot, score } of ranked) {
      if (patch.section.trim() && score === 0) continue;
      const text = slot.get();
      const at = text.indexOf(patch.find);
      if (at === -1) continue;
      slot.set(text.slice(0, at) + patch.replace + text.slice(at + patch.find.length));
      revision.patched += 1;
      revision.notes.push(patch.reason || `Corrected in ${slot.label}`);
      applied = true;
      break;
    }

    if (!applied) {
      // The editor may have named a section loosely; fall back to the exact text.
      for (const slot of slots) {
        const text = slot.get();
        const at = text.indexOf(patch.find);
        if (at === -1) continue;
        slot.set(text.slice(0, at) + patch.replace + text.slice(at + patch.find.length));
        revision.patched += 1;
        revision.notes.push(patch.reason || `Corrected in ${slot.label}`);
        break;
      }
    }
  }

  revision.notes = revision.notes.slice(0, 8);
  return { draft: next, revision };
}

type ModelChoice = { model: ReturnType<typeof getModel>; label: string };

/** The strongest working writer first; the cheap chat model is the safety net. */
function writerCandidates(): ModelChoice[] {
  const candidates: ModelChoice[] = [];
  if (process.env["DEEPSEEK_API_KEY"]) {
    candidates.push({ model: getModel("deepseek"), label: "DeepSeek" });
  }
  if (process.env["OPENAI_API_KEY"]) {
    candidates.push({ model: getModel("openai", "gpt-6.1-sol"), label: "GPT-6.1 Sol" });
  }
  if (process.env["ANTHROPIC_API_KEY"]) {
    candidates.push({ model: getModel("anthropic"), label: "Claude" });
  }
  return candidates;
}

/** A different family edits the read, so it is not marking its own homework. */
function reviewerCandidates(fast = false): ModelChoice[] {
  const candidates: ModelChoice[] = [];
  if (fast) {
    if (process.env["OPENAI_API_KEY"]) {
      candidates.push({ model: getModel("openai", "gpt-4o"), label: "GPT-4o" });
    }
    if (process.env["DEEPSEEK_API_KEY"]) {
      candidates.push({ model: getModel("deepseek"), label: "DeepSeek" });
    }
    return candidates;
  }

  if (process.env["OPENAI_API_KEY"]) {
    candidates.push({ model: getModel("openai", "gpt-6.1-sol"), label: "GPT-6.1 Sol" });
    candidates.push({ model: getModel("openai", "gpt-6-astra"), label: "GPT-6 Astra" });
    candidates.push({ model: getModel("openai", "gpt-4o"), label: "GPT-4o" });
  }
  if (process.env["DEEPSEEK_API_KEY"]) {
    candidates.push({ model: getModel("deepseek", "deepseek-reasoner"), label: "DeepSeek Reasoner" });
  }
  if (process.env["ANTHROPIC_API_KEY"]) {
    candidates.push({ model: getModel("anthropic"), label: "Claude" });
  }
  if (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_GENERATIVE_AI_API_KEY"]) {
    candidates.push({ model: getModel("gemini", "gemini-pro-latest"), label: "Gemini Pro" });
  }
  return candidates;
}

/**
 * The desk editor: check the draft's factual claims against the material it was
 * written from. It may lower confidence and name what is unsupported; it never
 * rewrites the read or supplies new facts.
 */
async function reviewRead(
  draft: z.infer<typeof analystSchema>,
  evidence: string,
  move: string,
  fast = false,
): Promise<ReadReview | null> {
  const material = evidence.trim().slice(0, 18_000);
  if (!material) return null;

  const claims = JSON.stringify({
    move: draft.move,
    why_now: draft.why_now,
    stakes: draft.stakes,
    precedent: draft.precedent,
    second_order: draft.second_order,
    counter_reading: draft.counter_reading,
    sections: draft.sections,
    watch: draft.watch,
    claims: draft.claims,
    falsifier: draft.falsifier,
  }).slice(0, 16_000);

  const prompt = `You are a fact-checking editor at Threadwise. A colleague wrote the read below from the retrieved material. Your job is narrow: find specific, checkable factual claims that the material CONTRADICTS, or that the read presents as coming from the material but the material does not contain. Do not review the analysis, judgments, predictions, motives or general historical context. Do not require the material to contain everything; it is a partial record.

THE MOVE:
"""
${move.slice(0, 2000)}
"""

THE READ:
${claims}

RETRIEVED MATERIAL:
${material}

Return ONLY this JSON:
{"verdict":"grounded"|"mixed"|"unsupported","supported":number,"issues":[{"section":string,"claim":string,"problem":string}],"patches":[{"section":string,"find":string,"replace":string,"reason":string}],"missing":[string]}

Rules:
- At most 4 issues. Only flag a claim if (a) the material explicitly contradicts it, or (b) it is a specific number, date, vote, ruling, named appointment or direct quote presented as fact, it is central to the read, and the material is silent on that exact point.
- Do NOT flag general historical background, analysis, predictions, motives, patterns, or institutional common knowledge. Do NOT flag a claim merely because the material does not mention it in passing.
- "problem" must state what the material says that contradicts the claim, or "the material is silent on [specific fact]". Never write "confirms" or "supports" in problem.
- "grounded" = no material contradictions. "mixed" = 1-2 issues, read still broadly supported. "unsupported" = 3+ issues or the central claim is contradicted.
- "supported" = the number of factual claims the material supports.
- "patches": for each issue, one surgical fix. find must be an exact substring copied verbatim from the read, max 25 words. replace must correct the claim to what the material says, or remove the unsupported detail and say the material does not establish it. Never add a new fact. If no safe fix exists, omit the patch but keep the issue.
- "missing" = up to 3 specific facts needed to settle the central claim, not general context.
- If the read says a fact is unknown or unretrieved, do not flag it. A sentence such as "the material is silent on X" or "X is not in the retrieved material" is the read correctly marking a gap, not an unsupported claim. Never flag the read's own statements about what the material lacks.
- The move is the input under analysis, not a retrieved source. Do not flag a claim that merely restates the move; flag only specific facts the read adds beyond the move and presents as retrieved.`;

  for (const candidate of reviewerCandidates(fast)) {
    try {
      const { text } = await generateText({
        model: candidate.model,
        prompt,
        temperature: 0,
        maxOutputTokens: 2800,
        maxRetries: 0,
      });
      const parsed = reviewSchema.safeParse(extractJson<unknown>(text));
      if (parsed.success) return { ...parsed.data, by: candidate.label };
    } catch (error) {
      console.warn(`[analyst] reviewer ${candidate.label} failed:`, error);
    }
  }
  return null;
}

/**
 * The writer's correction pass. It receives only the flags and returns surgical
 * find/replace patches, so it cannot rewrite the whole read or add new material.
 */
async function reviseRead(
  draft: AnalystDraft,
  review: ReadReview,
  evidence: string,
  move: string,
): Promise<{ draft: AnalystDraft; revision: ReadRevision } | null> {
  if (!review.issues.length) return null;
  const candidate = writerCandidates()[0];
  if (!candidate) return null;

  const material = evidence.trim().slice(0, 18_000);
  if (!material) return null;

  const claims = JSON.stringify({
    move: draft.move,
    why_now: draft.why_now,
    stakes: draft.stakes,
    precedent: draft.precedent,
    second_order: draft.second_order,
    counter_reading: draft.counter_reading,
    sections: draft.sections,
    watch: draft.watch,
    claims: draft.claims,
    falsifier: draft.falsifier,
  }).slice(0, 16_000);

  const prompt = `You are the writer. An editor flagged specific factual claims in your read as unsupported by the retrieved material. Patch only those claims. Do not rewrite the read and do not add new facts.

THE MOVE:
"""
${move.slice(0, 2000)}
"""

THE READ:
${claims}

THE FLAGGED CLAIMS:
${JSON.stringify(review.issues).slice(0, 5000)}

THE RETRIEVED MATERIAL:
${material}

Return ONLY this JSON:
{"patches":[{"section":string,"find":string,"replace":string,"reason":string}]}

Rules:
- find must be an exact substring copied verbatim from the read, max 25 words.
- replace must correct the claim to what the material says, or remove the unsupported detail and say the material does not establish it. Never add a new fact.
- Only patch a flagged claim. Do not rewrite unrelated text.
- At most one patch per flagged claim. If a claim is already correctly qualified, omit it.
- section is the field or section title that contains find.
- reason is one short clause naming what changed.`;

  try {
    const { text } = await generateText({
      model: candidate.model,
      prompt,
      temperature: 0,
      maxOutputTokens: 1600,
      maxRetries: 0,
    });
    const parsed = patchSchema.safeParse(extractJson<unknown>(text));
    if (!parsed.success || !parsed.data.patches.length) return null;
    const result = applyReadPatches(draft, parsed.data.patches);
    return result.revision.patched ? result : null;
  } catch (error) {
    console.warn("[analyst] revision failed:", error);
    return null;
  }
}

export async function analyseMove(input: string, intent?: Inquiry): Promise<AnalystReport> {
  const startedAt = Date.now();
  // Classify and retrieve at the same time: they do not depend on each other.
  const [decision, base, candidates] = await Promise.all([
    classify(input),
    retrieveContext(input),
    nameSituation(input),
  ]);
  const { context, sources, hits } = base;

  const anchors = distinctiveTerms(input);
  const entityName = candidateEntities(input)[0] ?? "";
  const funded = fundedBody(input);
  const institution = decision.layers.includes("institution") ? funded : "";

  // Start the primary-document reads now: they overlap the news work below.
  const fundingPromise = institution
    ? fundingDocuments(institution)
    : Promise.resolve(EMPTY_PRIMARY);
  const courtPromise: Promise<PrimaryEvidence> =
    decision.mode === "legal"
      ? looksUSLegal(input)
        ? courtDocuments(
            [entityName, ...anchors.slice(0, 2)].filter(Boolean).join(" "),
            candidateEntities(input),
          )
        : linkedFilingDocuments(hits)
      : Promise.resolve(EMPTY_PRIMARY);

  // Two candidate readings of the situation are searched; fresher reporting wins.
  const searched = await Promise.all(candidates.map(async (candidate) => ({ candidate, hits: await news(candidate) })));
  const best = searched
    .map((entry) => ({ ...entry, score: freshness(entry.hits) }))
    .sort((a, b) => b.score - a.score)[0];
  const situation = best?.score ? best.candidate : "";

  // Freshness alone let "campaign finance" attach American coverage to a Kenyan
  // ruling. A hit must also name something the move names.
  const situationHits = best?.score
    ? best.hits.filter((hit) => matchStrength(hit.title, anchors) === 2)
    : [];

  // Layer evidence: money and mandate are searched, never remembered.
  // The institution layer may only search a body that actually receives
  // funding; otherwise "largest donors" is asked of a court or a person and
  // returns whatever the search engine ranks, not evidence.
  const layerQueries = institution
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
  const layerSubject = institution || entityName;
  const layerHits = layerSubject
    ? (await Promise.all(layerQueries.map((query) => news(`${layerSubject} ${query}`)))).flat()
    : [];
  void layerHits.length;
  const layerList = layerHits
    .slice(0, 6)
    .map((hit) => `[${hit.date}] ${hit.outlet}: ${hit.title} (${hit.url})`)
    .join("\n");

  // Figures live inside documents, never in headlines: read the two newest.
  const excerpts: string[] = [];
  // Encyclopedia bodies carry the funding tables that news headlines omit.
  const referenceName = institution || (decision.layers.includes("ownership") ? entityName : "");
  if (referenceName) {
    const body = await wikiBody(referenceName);
    const money = moneySentences(body, 5);
    if (process.env["ANALYST_DEBUG"]) console.log("[analyst] ref", referenceName, body.length, money.length);
    if (money.length) excerpts.push(`FROM THE REFERENCE ENTRY ON ${referenceName}: ${money.join(" ").slice(0, 1200)}`);
  }

  if ((decision.layers.includes("institution") || decision.layers.includes("ownership")) && layerHits.length) {
    const picks = layerHits.slice(0, 2);
    const texts = await Promise.all(
      picks.map(async (hit) => {
        const read = await readArticle(hit);
        return read ? { hit, text: read.text } : null;
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

  const [funding, court] = await Promise.all([
    bounded(fundingPromise, EMPTY_PRIMARY),
    bounded(courtPromise, EMPTY_PRIMARY),
  ]);
  const primary = {
    excerpts: [...funding.excerpts, ...court.excerpts],
    sources: [...funding.sources, ...court.sources],
  };
  const primaryContext = primary.excerpts.join("\n\n");

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

  const evidenceContext = [
    situationContext ? `SITUATION — ${situation}, as reported:\n${situationContext}` : "",
    primaryContext ? `PRIMARY DOCUMENTS — the body's own budget, or the court's own judgment:\n${primaryContext}` : "",
    layerContext ? `ON THE ACTORS — money, mandate and ownership, as reported:\n${layerContext}` : "",
    context,
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = analystPrompt(input, evidenceContext, decision.mode, decision.layers, intent);

  let parsedData: z.infer<typeof analystSchema> | null = null;
  let writer = "";
  for (const candidate of writerCandidates()) {
    try {
      const { text } = await generateText({
        model: candidate.model,
        system: METHOD,
        prompt,
        temperature: 0.3,
        maxOutputTokens: 7000,
        maxRetries: 0,
      });
      const attempt = analystSchema.safeParse(extractJson<unknown>(text));
      if (attempt.success) {
        parsedData = attempt.data;
        writer = candidate.label;
        break;
      }
      console.error(`[analyst] unusable output from ${candidate.label}:`, text.slice(0, 400));
    } catch (error) {
      console.error(`[analyst] writer ${candidate.label} failed:`, error);
    }
  }
  if (!parsedData) throw new Error("The analyst could not produce a usable read.");

  // A different model edits the draft against the material it was written from.
  // If the read has already been slow, use the fast editor to stay inside the
  // serverless window.
  const review = await reviewRead(
    parsedData,
    evidenceContext,
    input,
    Date.now() - startedAt > 40_000,
  );

  // The editor returns the fixes with the review, so most corrections cost no
  // extra model call. If it named issues but returned no safe patch, the writer
  // gets a narrow second pass when there is still time.
  let finalDraft = parsedData;
  let revision: ReadRevision | undefined;
  if (review?.patches.length) {
    const corrected = applyReadPatches(finalDraft, review.patches);
    if (corrected.revision.patched) {
      finalDraft = corrected.draft;
      revision = corrected.revision;
    }
  }
  if (!revision && review?.issues.length && Date.now() - startedAt < 45_000) {
    const revised = await reviseRead(finalDraft, review, evidenceContext, input);
    if (revised) {
      finalDraft = revised.draft;
      revision = revised.revision;
    }
  }

  // The confidence badge is derived from what was actually retrieved, then the
  // editor may lower it. A review can never raise it.
  const freshSituation = recentCount(situationHits, 28);
  const baseConfidence: AnalystReport["confidence"] =
    decision.mode === "discourse"
      ? "inferred"
      : freshSituation >= 2
        ? "documented"
        : situationHits.length >= 2 || sources.length > 2
          ? "inferred"
          : "speculative";
  const confidence = reviewedConfidence(baseConfidence, review?.verdict);
  const baseBasis =
    decision.mode === "discourse"
      ? "a statement about people, not an event — judged on argument, not reporting"
      : baseConfidence === "documented"
      ? `${freshSituation} dated reports from the last four weeks`
      : baseConfidence === "inferred"
        ? situationHits.length >= 2
          ? freshSituation >= 1
            ? `the situation is reported, but only ${freshSituation} of them in the last four weeks`
            : "the situation is reported, but nothing from the last four weeks"
          : "reporting on the move, but no picture of the situation"
        : "the move itself — no independent reporting found";
  const basis =
    review && confidence !== baseConfidence
      ? revision
        ? "the desk review corrected this read"
        : "the desk review lowered this read"
      : baseBasis;

  return {
    ...finalDraft,
    subject: decision.subject || situation,
    mode: finalDraft.mode ?? decision.mode,
    layers: finalDraft.layers?.length ? finalDraft.layers : decision.layers,
    confidence,
    basis,
    writer,
    ...(intent ? { intent } : {}),
    ...(review ? { review } : {}),
    ...(revision ? { revision } : {}),
    sources: [...sources, ...situationSources, ...layerSources, ...primary.sources],
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
      falsifier: report?.falsifier ?? "",
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


export type FindingProposal = {
  question_id: string;
  stance: "for" | "against";
  claim: string;
  note: string;
};

export type QuestionGap = {
  counter_question: string;
  settling_evidence: string;
  hidden_assumption: string;
};

/**
 * The gap finder: when the evidence is one-sided or absent, name the question
 * that would challenge it, the evidence that would settle it, and the assumption
 * the current evidence rests on.
 */
export async function questionGap(
  question: string,
  findings: { stance: string; note: string }[],
): Promise<QuestionGap | null> {
  if (!question.trim()) return null;

  const evidence = findings
    .slice(0, 20)
    .map((finding) => `- ${finding.stance}: ${finding.note}`)
    .join("\n");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: `THE STANDING QUESTION:
${question.slice(0, 500)}

THE EVIDENCE FILED SO FAR:
${evidence || "(none)"}

The reader wants to think better, not to be reassured. The evidence above is ${
      findings.length === 0 ? "empty" : "the only material on the record"
    }.

Return JSON only:
{"counter_question":string,"settling_evidence":string,"hidden_assumption":string}

Rules:
- counter_question: the strongest question that challenges the current lean, under 30 words. It must name an actor, mechanism, comparison or time horizon. No generic "what if the opposite?".
- settling_evidence: the specific document, number, vote, ruling, dataset or dated observation that would settle it, under 40 words. Name where to look.
- hidden_assumption: the assumption the current evidence depends on, under 30 words.
- If there is no evidence, counter_question asks what would count as first evidence; settling_evidence names the first document or record to get.
- Do not restate the question. Do not offer both sides in general terms.`,
    temperature: 0.3,
    maxOutputTokens: 500,
    maxRetries: 0,
  });

  const parsed = z
    .object({
      counter_question: z.string().trim().max(300).default(""),
      settling_evidence: z.string().trim().max(400).default(""),
      hidden_assumption: z.string().trim().max(300).default(""),
    })
    .safeParse(extractJson<unknown>(text));

  return parsed.success ? parsed.data : null;
}

/** Which of the reader's open questions this read actually bears on, and how. */
export async function proposeFindings(
  report: AnalystReport,
  questions: { id: string; question: string }[],
): Promise<FindingProposal[]> {
  if (!questions.length) return [];

  const claimList = (report.claims ?? [])
    .map(
      (claim, index) =>
        `${index + 1}. [${claim.kind}/${claim.confidence}] ${claim.text} (source: ${
          claim.source || "none"
        })`,
    )
    .join("\n");

  const { text } = await generateText({
    model: getModel("deepseek"),
    system: METHOD,
    prompt: `THE READ:
${JSON.stringify(report).slice(0, 6000)}

THE READ'S CLAIMS:
${claimList || "(no structured claims)"}

THE READER'S OPEN QUESTIONS:
${questions.map((question) => `- ${question.id}: ${question.question}`).join("\n")}

For each question this read genuinely bears on, return one entry. Be strict: most reads bear on none.
JSON only: {"findings":[{"question_id":string,"stance":"for"|"against","claim":string,"note":string}]}

- stance: "for" if the claim is evidence toward a yes, "against" if toward a no.
- claim: copy one claim from the list above verbatim, max 25 words. If no listed claim bears on the question, omit the question.
- note: ONE sentence, under 30 words, saying what that claim does to the question. Carry the date or figure. No hedging, no restating the question.
- If nothing bears on a question, omit it entirely. Never invent relevance.`,
    temperature: 0.2,
    maxOutputTokens: 800,
    maxRetries: 0,
  });

  const parsed = z
    .object({
      findings: z
        .array(
          z.object({
            question_id: z.string(),
            stance: z.enum(["for", "against"]).catch("for"),
            claim: z.string().trim().max(300).catch(""),
            note: z.string().trim().max(300),
          }),
        )
        .catch([]),
    })
    .safeParse(extractJson<unknown>(text));

  if (!parsed.success) return [];
  const known = new Set(questions.map((question) => question.id));
  return parsed.data.findings
    .filter((finding) => known.has(finding.question_id))
    .slice(0, 3);
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
      falsifier: report?.falsifier ?? "",
    };
  });
}
