import { createFileRoute } from "@tanstack/react-router";
import { clientKey, rateLimit } from "@/lib/threadwise/rate-limit";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/paper-note")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const gate = rateLimit(clientKey(request, "paper-note"), 20, 60 * 60 * 1000);
        if (!gate.ok) {
          return json({ error: "That is a lot of notes in one hour. Try again later." }, 429);
        }
        let body: { text?: string; context?: string };
        try {
          body = (await request.json()) as { text?: string; context?: string };
        } catch {
          return json({ error: "Send a passage to annotate." }, 400);
        }
        const text = (body.text ?? "").trim();
        const context = (body.context ?? "").trim();
        if (text.length < 2) return json({ error: "Select a little more text." }, 400);
        if (text.length > 800) return json({ error: "Keep the highlighted passage under 800 characters." }, 400);
        try {
          const { openPaperNote } = await import("@/lib/threadwise/paper-note");
          const note = await openPaperNote(text, context);
          return json({ ok: true, note }, 200);
        } catch (error) {
          console.error("[paper-note] failed:", error);
          return json({ error: "The note could not be written just now. Try again." }, 502);
        }
      },
    },
  },
});
