import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/seminar — two steelmanned theories, one crux. Public, capped. */
export const Route = createFileRoute("/api/seminar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        const gate = rateLimit(clientKey(request, "seminar"), 6, 60 * 60 * 1000);
        if (!gate.ok) {
          return json(
            { error: `That is a lot of seminars in an hour. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` },
            429,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the quote or question." }, 400);
        }

        const text = typeof (body as { text?: unknown })?.text === "string" ? (body as { text: string }).text.trim() : "";
        const context = typeof (body as { context?: unknown })?.context === "string" ? (body as { context: string }).context.trim() : "";
        if (text.length < 20) return json({ error: "Give the seminar a quote or question worth arguing about." }, 400);
        if (text.length > 3000) return json({ error: "Keep the quote under 3,000 characters." }, 413);
        if (context.length > 1000) return json({ error: "Keep the context under 1,000 characters." }, 413);

        try {
          const { openSeminar } = await import("@/lib/threadwise/seminar");
          const seminar = await openSeminar(text, context);
          return json({ ok: true, seminar }, 200);
        } catch (error) {
          console.error("[seminar] failed:", error);
          return json({ error: "The seminar could not be convened just now. Try again." }, 502);
        }
      },
    },
  },
});
