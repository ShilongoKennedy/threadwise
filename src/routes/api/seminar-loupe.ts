import { createFileRoute } from "@tanstack/react-router";
import { seminarSchema } from "@/lib/threadwise/seminar";
import { seminarLessonSchema } from "@/lib/threadwise/seminar-lesson";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/seminar-loupe — one closely grounded explanation of a selected passage. */
export const Route = createFileRoute("/api/seminar-loupe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        const gate = rateLimit(clientKey(request, "seminar-loupe"), 40, 60 * 60 * 1000);
        if (!gate.ok) {
          return json(
            { error: `The lens needs a moment. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` },
            429,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the seminar, passage and selection." }, 400);
        }

        const raw = body as {
          text?: unknown;
          context?: unknown;
          seminar?: unknown;
          lesson?: unknown;
          selected?: unknown;
          paragraph?: unknown;
          section?: unknown;
        };
        const text = typeof raw.text === "string" ? raw.text.trim() : "";
        const context = typeof raw.context === "string" ? raw.context.trim() : "";
        const selected = typeof raw.selected === "string" ? raw.selected.trim().replace(/\s+/g, " ") : "";
        const paragraph = typeof raw.paragraph === "string" ? raw.paragraph.trim() : "";
        const section = typeof raw.section === "string" ? raw.section.trim() : "";

        if (text.length < 20) return json({ error: "The original seminar text is missing." }, 400);
        if (text.length > 3000) return json({ error: "Keep the quote under 3,000 characters." }, 413);
        if (context.length > 1000) return json({ error: "Keep the context under 1,000 characters." }, 413);
        if (selected.length < 3) return json({ error: "Select a fuller passage." }, 400);
        if (selected.length > 700) return json({ error: "Select a shorter passage." }, 413);
        if (paragraph.length < 20) return json({ error: "The surrounding passage is missing." }, 400);
        if (paragraph.length > 3000) return json({ error: "The surrounding passage is too long." }, 413);

        const seminar = seminarSchema.safeParse(raw.seminar);
        if (!seminar.success) return json({ error: "The seminar is not valid." }, 400);

        const lesson = raw.lesson ? seminarLessonSchema.safeParse(raw.lesson) : null;
        if (lesson && !lesson.success) return json({ error: "The lesson is not valid." }, 400);

        try {
          const { openSeminarLoupe } = await import("@/lib/threadwise/seminar-loupe");
          const loupe = await openSeminarLoupe({
            text,
            context,
            seminar: seminar.data,
            lesson: lesson?.data ?? null,
            selected,
            paragraph,
            section: section || "Seminar passage",
          });
          return json({ ok: true, loupe }, 200);
        } catch (error) {
          console.error("[seminar-loupe] failed:", error);
          return json({ error: "The lens could not focus just now. Try again." }, 502);
        }
      },
    },
  },
});
