import { createFileRoute } from "@tanstack/react-router";
import { seminarSchema } from "@/lib/threadwise/seminar";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/seminar-lesson — a deeper tutor lesson built from a completed seminar. */
export const Route = createFileRoute("/api/seminar-lesson")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        const gate = rateLimit(clientKey(request, "seminar-lesson"), 4, 60 * 60 * 1000);
        if (!gate.ok) {
          return json(
            { error: `That is a lot of lessons in an hour. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` },
            429,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the seminar and its original text." }, 400);
        }

        const raw = body as { text?: unknown; context?: unknown; seminar?: unknown };
        const text = typeof raw.text === "string" ? raw.text.trim() : "";
        const context = typeof raw.context === "string" ? raw.context.trim() : "";
        if (text.length < 20) return json({ error: "The original seminar text is missing." }, 400);
        if (text.length > 3000) return json({ error: "Keep the quote under 3,000 characters." }, 413);
        if (context.length > 1000) return json({ error: "Keep the context under 1,000 characters." }, 413);

        const parsed = seminarSchema.safeParse(raw.seminar);
        if (!parsed.success) return json({ error: "The seminar is not valid." }, 400);

        try {
          const { openSeminarLesson } = await import("@/lib/threadwise/seminar-lesson");
          const lesson = await openSeminarLesson(text, context, parsed.data);
          return json({ ok: true, lesson }, 200);
        } catch (error) {
          console.error("[seminar-lesson] failed:", error);
          return json({ error: "The deeper lesson could not be built just now. Try again." }, 502);
        }
      },
    },
  },
});
