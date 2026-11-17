import { createFileRoute } from "@tanstack/react-router";
import { clientKey, rateLimit } from "@/lib/threadwise/rate-limit";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/paper-recommendations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const gate = rateLimit(clientKey(request, "paper-recommendations"), 20, 60 * 60 * 1000);
        if (!gate.ok) return json({ error: "That is a lot of reading notes. Try again later." }, 429);
        let body: { text?: string };
        try {
          body = (await request.json()) as { text?: string };
        } catch {
          return json({ error: "Send the reading surface." }, 400);
        }
        const text = (body.text ?? "").replace(/\s+/g, " ").trim();
        if (text.length < 250) return json({ error: "There is not enough text to recommend from." }, 400);
        try {
          const { openPaperRecommendations } = await import("@/lib/threadwise/paper-recommendations");
          const quotes = await openPaperRecommendations(text);
          const clean = quotes
            .map((quote) => quote.trim())
            .filter((quote) => {
              const words = quote.split(/\s+/).length;
              return words >= 3 && words <= 10 && quote.length <= 90 && !/[.!?]$/.test(quote);
            })
            .slice(0, 5);
          return json({ ok: true, quotes: clean }, 200);
        } catch (error) {
          console.error("[paper-recommendations] failed:", error);
          return json({ error: "Recommendations could not be chosen." }, 502);
        }
      },
    },
  },
});
