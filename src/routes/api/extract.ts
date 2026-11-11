import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function safeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("That does not look like a link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links can be read.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal" ||
    host === "[::1]" ||
    host.startsWith("[fc") ||
    host.startsWith("[fd") ||
    host.startsWith("[fe80")
  ) {
    throw new Error("That address cannot be read.");
  }

  const parts = host.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      throw new Error("That address cannot be read.");
    }
  }

  return url;
}

/** POST /api/extract — turn a pasted link into readable text. */
export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "extract-link"), 30, 60 * 60 * 1000).ok) {
          return json({ error: "Too many links for now. Try again later." }, 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with a `url` field." }, 400);
        }
        const raw = (body as { url?: unknown })?.url;
        if (typeof raw !== "string" || !raw.trim()) {
          return json({ error: "Paste the link you want read." }, 400);
        }

        let url: URL;
        try {
          url = safeUrl(raw.trim());
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "That link cannot be read." }, 400);
        }

        let text = "";
        let source = "";
        let title = url.hostname.replace(/^www\./, "");
        const { cleanArticleText } = await import("@/lib/threadwise/extract-text");

        // Firecrawl understands main content and returns the full body; the
        // reader is the free fallback when Firecrawl is unavailable or blocked.
        try {
          const { readWeb } = await import("@/lib/threadwise/ai/url.server");
          const page = await readWeb(url.toString(), AbortSignal.timeout(20_000));
          const clean = cleanArticleText(page.text);
          if (clean.length >= 80) {
            text = clean;
            title = page.title || title;
            source = "Firecrawl";
          }
        } catch {
          // Fall through to the reader.
        }

        if (!text) {
          try {
            const { fetchArticleText } = await import("@/lib/threadwise/news-agent");
            const clean = cleanArticleText(await fetchArticleText(url.toString()));
            if (clean.length >= 80) {
              text = clean;
              source = "Reader";
            }
          } catch (error) {
            console.error("[extract] link failed:", error);
          }
        }

        if (!text) {
          return json(
            { error: "That page could not be read. Paste the text or a screenshot instead." },
            502,
          );
        }

        if (text.trim().length < 80) {
          return json(
            { error: "That page had too little readable text. Paste the text or a screenshot instead." },
            422,
          );
        }

        return json(
          {
            ok: true,
            text: text.slice(0, 12_000),
            url: url.toString(),
            title,
            source,
          },
          200,
        );
      },
    },
  },
});
