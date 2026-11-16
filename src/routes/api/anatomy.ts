import { createFileRoute } from "@tanstack/react-router";
import { clientKey, rateLimit } from "@/lib/threadwise/rate-limit";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/anatomy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const gate = rateLimit(clientKey(request, "anatomy"), 6, 60 * 60 * 1000);
        if (!gate.ok) {
          return json({ error: `That is a lot of anatomies in an hour. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` }, 429);
        }
        let body: { text?: string };
        try {
          body = (await request.json()) as { text?: string };
        } catch {
          return json({ error: "Send a claim to examine." }, 400);
        }
        const text = (body.text ?? "").trim();
        if (text.length < 20) return json({ error: "Give the belief enough detail to examine." }, 400);
        if (text.length > 4000) return json({ error: "Keep the claim under 4,000 characters." }, 400);
        try {
          const { openAnatomy } = await import("@/lib/threadwise/anatomy");
          const report = await openAnatomy(text);
          return json({ ok: true, report }, 200);
        } catch (error) {
          console.error("[anatomy] failed:", error);
          return json({ error: "The anatomy could not be drawn just now. Try again." }, 502);
        }
      },
    },
  },
});
